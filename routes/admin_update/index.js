'use strict'
const { setItemStockFromDB } = require('./util')

const schema = {
  description: 'DynamoDB admin functions. Change stock of item in a machine',
  tags: ['routes'],
  summary: 'DynamoDB admin functions',
  body: {
    type: 'object',
    required: ['machine_id', 'item_id', 'item_stock'],
    properties: {
      machine_id: { type: 'string' },
      item_id: { type: 'string' },
      stock_change: { type: 'number' }
    }
  },
  response: {
    200: {
      description: 'Updating the item stock of a machine, succeeded.',
      type: 'object'
    },
    400: {
      description: 'Updating the item of a machine, failed.',
      type: 'object',
      additionalProperties: false
    }
  }
}

module.exports = async function (fastify, opts) {
  fastify.post('/', { schema }, async function (request, reply) {
    const machineId = request.body.machine_id
    const itemId = request.body.item_id
    const stockChange = request.body.stock_change

    const stockCheckParams = {
      TableName: 'inventory',
      Key: {
        machine_id: machineId
      },
      AttributesToGet: ['stock']
    }

    let stockCheckResponse = await this.dynamo.get(stockCheckParams)
    let currentStock = stockCheckResponse.Item.stock[itemId]

    if (!stockCheckResponse.Item) {
      return reply.code(400).send({
        reason: 'Invalid machine ID'
      })
    } else if (currentStock == null) {
      return reply.code(400).send({
        reason: 'Stock field does not exist'
      })
    }

    // CALCULATE THE NEW ITEM STOCK
    let itemStock = currentStock + stockChange
    if (itemStock < 0) {
      itemStock = 0
    }

    // SET ITEM STOCK IN DB
    await setItemStockFromDB(machineId, itemId, itemStock, this.dynamo)
    stockCheckResponse = await this.dynamo.get(stockCheckParams)
    if (stockCheckResponse.Item.stock[itemId] === itemStock) {
      return reply.code(200).send(stockCheckResponse.Item.stock[itemId])
    } else {
      return reply.code(400).send({
        reason: 'Stock does not match expected value'
      })
    }
  })
}
