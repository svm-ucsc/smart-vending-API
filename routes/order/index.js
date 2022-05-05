'use strict'
const { createPaypalOrder, removeStockFromDB, createNewOrder, paymentTimout, getItemInfo, createOrderList } = require('./util')
const { v4 } = require('uuid')

const schema = {
  description: 'Submit an order request. Request may be rejected if invalid.',
  tags: ['routes'],
  summary: 'Places an order',
  body: {
    type: 'object',
    required: ['machine_id', 'items'],
    properties: {
      machine_id: { type: 'string' },
      items: {
        type: 'object',
        minProperties: 1,
        patternProperties: {
          '.+': { type: 'integer' }
        }
      }
    }
  },
  response: {
    200: {
      description: 'Order was placed successfully. The order_id is returned in an object.',
      type: 'object',
      properties: {
        order_id: { type: 'string' },
        paypal_order_id: { type: 'string' }
      }
    },
    400: {
      description: 'Order placing failed for some reason. The failure reason is returned as a string.',
      type: 'object',
      additionalProperties: true
    }
  }

}

module.exports = async function (fastify, opts) {
  fastify.post('/', { schema }, async function (request, reply) {
    const machineId = request.body.machine_id
    const orderedItems = request.body.items

    const inventoryCheckParams = {
      TableName: 'inventory',
      Key: {
        machine_id: machineId
      },
      AttributesToGet: ['status', 'stock', 'item_location']
    }

    const inventoryCheckResponse = await this.dynamo.get(inventoryCheckParams)

    // machine_id exists?
    if (!inventoryCheckResponse.Item) {
      return reply.code(400).send({
        reason: 'machine_id could not be found'
      })
    }

    // machine_id READY?
    if (inventoryCheckResponse.Item.status !== 'READY') {
      return reply.code(400).send({
        reason: 'Machine is not able to take orders right now'
      })
    }

    const missingItems = {}

    const stock = inventoryCheckResponse.Item.stock
    const itemLocation = inventoryCheckResponse.Item.item_location
    let orderList = {}

    for (const item in orderedItems) {
      if (item in stock) {
        if (orderedItems[item] > stock[item]) {
          missingItems[item] = {
            requested: orderedItems[item],
            available: stock[item]
          }
        } else if (orderedItems[item] < stock[item]) {
          stock[item] = stock[item] - orderedItems[item]
        } else {
          delete stock[item]
        }
      } else {
        missingItems[item] = {
          requested: orderedItems[item],
          available: 0
        }
      }
    }

    // machine_id has requested stock?
    if (Object.keys(missingItems).length !== 0) {
      return reply.code(400).send({
        reason: 'One or more items ordered are not in stock',
        stock_discrepancy: missingItems
      })
    }

    // Create a machine order dictionary
    let totalCost = 0
    for (const item in orderedItems) {
      const itemInfoCall = await getItemInfo(item, this.dynamo)
      orderList = createOrderList(orderList, item, orderedItems[item], itemInfoCall, itemLocation[item])
      if (!orderList) {
        return reply.code(400).send({
          reason: 'Info for requested item does not exist in db or is invalid',
          missing_item: item
        })
      }
      totalCost += itemInfoCall.itemCost * orderedItems[item]
    }

    // Validation complete

    // 1. generate paypal order
    const paypalOrderRes = await createPaypalOrder(totalCost)

    // 2. REMOVE STOCK FROM MACHINE IN DB
    await removeStockFromDB(machineId, stock, this.dynamo)

    // 3. CREATE NEW ORDER
    const orderId = v4()
    await createNewOrder(orderId, paypalOrderRes.id, machineId, orderList, this.dynamo)

    // 4. CREATE PAYMENT TIMEOUT TASK
    const timeoutMS = 180000 // three minutes
    setTimeout(paymentTimout, timeoutMS, this.dynamo, orderId)

    // 5. RETURN ORDER ID + approval link
    return reply.code(200).send({
      order_id: orderId,
      paypal_order_id: paypalOrderRes.id
    })
  })
}
