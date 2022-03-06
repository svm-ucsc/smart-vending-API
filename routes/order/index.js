'use strict'
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
      AttributesToGet: ['stock']
    }

    const response = await this.dynamo.get(inventoryCheckParams)
    const stock = response.Item.stock

    // console.log(orderedItems)
    // console.log(stock)

    let missingItems = {}

    for (const item in orderedItems) {
      if(item in stock) {
        if(orderedItems[item] > stock[item]) {
          missingItems[item] = {
            'requested': orderedItems[item],
            'available': stock[item]
          } 
        }
      } else {
        missingItems[item] = {
          'reqested': orderedItems[item],
          'availible': 0
        }
      }
    }
    // console.log(missingItems)

    if(Object.keys(missingItems).length == 0) {

      const orderId = v4()
      this.customMqttClient.submitOrder(orderId, machineId, orderedItems)

      const orderIdCreateParams = {
        TableName: 'orders',
        Item: {
          order_id: orderId,
          machine_id: machineId,
          ordered_item: orderedItems,
          status: 'pending'
        },
      }

      const updateStockParams = {
        TableName: 'inventory',
        Key: {
          machine_id: machineId
        },
        // TODO: wtf are these and how do i use them
        AttributeUpdates: {},
        Expected: {},
        ExpressionAttributeValues: {}
      }
      
      await this.dynamo.put(orderIdCreateParams)

      return reply.code(200).header('Access-Control-Allow-Origin', '*')
      .header('Access-Control-Allow-Methods', 'GET').send(orderId)
    } else {
      // console.log(missingItems)
      return reply.code(400).header('Access-Control-Allow-Origin', '*')
      .header('Access-Control-Allow-Methods', 'GET').send(missingItems)
    }
    
  })
}
