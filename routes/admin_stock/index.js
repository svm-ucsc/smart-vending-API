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
      item_stock: { type: 'object' }
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
  fastify.post('/', schema, async function (request, reply) {
    const machineId = request.body['machine_id']
    const itemId = request.body['item_id']
    const itemStock = request.body['item_stock']

    const stockCheckParams = {
      TableName: 'inventory',
      Key: {
        machine_id: machineId
      },
      AttributesToGet: ['stock']
    }

    let stockCheckResponse = await this.dynamo.get(stockCheckParams)

    if (!stockCheckResponse.Item) {
      return reply.code(400).send({
        reason: 'Invalid machine ID'
      })
    } else if (stockCheckResponse.Item.stock[itemId] == null) {
      return reply.code(400).send({
        reason: 'Stock field does not exist'
      })
    }

    // SET ITEM STOCK IN DB
    await setItemStockFromDB(machineId, itemId, itemStock, this.dynamo)
    stockCheckResponse = await this.dynamo.get(stockCheckParams)
    if (stockCheckResponse.Item.stock[itemId] === itemStock) {
      console.log('Stock matches expected value:', stockCheckResponse.Item.stock[itemId])
      return reply.code(200).send(stockCheckResponse.Item.stock[itemId])
    } else {
      console.log('Stock does not match expected value')
      return reply.code(400).send({
        reason: 'Stock does not match expected value'
      })
    }
  })
}
