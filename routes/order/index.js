'use strict'
const { removeStockFromDB, createNewOrder, orderTimeout } = require('./util')
const { v4 } = require('uuid')

const schema = {
  description: 'Submit an order request. Request may be rejected if invalid.',
  tags: ['routes'],
  summary: 'Places an order',
  body: {
    type: 'object',
    required: ['machine_id', 'items'],
    properties: {
      machine_id: {type: 'string'},
      items: {
        type: 'object',
        minProperties: 1,
        patternProperties: {
          '.+': {type: 'integer'}
        }
      }
    }
  },
  response: {
    200: {
      description: 'Order was placed successfully. The order_id is returned in an object.',
      type: 'object',
      properties: {
        order_id: { type: 'string' }
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
    const machineId = request.body['machine_id']
    const orderedItems = request.body['items']

    const inventoryCheckParams = {
      TableName: 'inventory',
      Key: {
        machine_id: machineId
      },
      AttributesToGet: ['status', 'stock']
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

    let stock = inventoryCheckResponse.Item.stock
    let missingItems = {}

    for (const item in orderedItems) {
      if (item in stock) {
        if (orderedItems[item] > stock[item]) {
          missingItems[item] = {
            'requested': orderedItems[item],
            'available': stock[item]
          }
        } else if (orderedItems[item] < stock[item]) {
          stock[item] = stock[item] - orderedItems[item]
        } else {
          delete stock[item]
        }
      } else {
        missingItems[item] = {
          'requested': orderedItems[item],
          'available': 0
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

    // Validation complete

    // 1. REMOVE STOCK FROM MACHINE IN DB
    await removeStockFromDB(machineId, stock, this.dynamo)

    // 2. CREATE NEW ORDER
    const orderId = v4()
    await createNewOrder(orderId, machineId, orderedItems, this.dynamo)

    // 3. SEND ORDER TO BROKER
    this.customMqttClient.submitOrder(orderId, machineId, orderedItems)

    // 4. CREATE ORDER TIMEOUT TASK
    const timoutMS = 5000
    setTimeout(orderTimeout, timoutMS, this.dynamo, orderId)

    return reply.code(200).header('Access-Control-Allow-Origin', '*')
      .header('Access-Control-Allow-Methods', 'POST').send('Order submitted')
  })
}
