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

const orderTimeout = async function (dynamo, orderId) {

  const orderCheckParams = {
    TableName: 'orders',
    Key: {
      order_id: orderId
    },
    AttributesToGet: ['machine_id','status']
  }
  const orderCheckResponse = await dynamo.get(orderCheckParams)

  if(orderCheckResponse.Item && orderCheckResponse.Item.status == 'PENDING') {
    
    const updateOrderParams = {
      TableName: 'orders',
      Key: {
        order_id: orderId
      },
      UpdateExpression: 'set #st = :to',
      ExpressionAttributeNames: {
        '#st': 'status'
      },
      ExpressionAttributeValues: {
        ':to': 'TIMEDOUT',
      },
    }
    await dynamo.update(updateOrderParams)

    const updateMachineParams = {
      TableName: 'inventory',
      Key: {
        machine_id: orderCheckResponse.Item.machine_id
      },
      UpdateExpression: 'set #st = :er',
      ExpressionAttributeNames: {
        '#st': 'status'
      },
      ExpressionAttributeValues: {
        ':er': 'ERROR',
      },
    }
    await dynamo.update(updateMachineParams)

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
      AttributesToGet: ['status','stock']
    }

    const inventoryCheckResponse = await this.dynamo.get(inventoryCheckParams)

    if(!inventoryCheckResponse.Item) {
      return reply.code(400).send({
        reason: 'machine_id could not be found'
      })
    }

    if(inventoryCheckResponse.Item.status !== 'READY') {
      return reply.code(400).send({
        reason: 'Machine is not able to take orders right now'
      })
    }

    let stock = inventoryCheckResponse.Item.stock

    let missingItems = {}

    for (const item in orderedItems) {
      if(item in stock) {
        if(orderedItems[item] > stock[item]) {
          missingItems[item] = {
            'requested': orderedItems[item],
            'available': stock[item]
          } 
        } else if (orderedItems[item] < stock[item]) {
          stock[item] = stock[item] - orderedItems[item]
        } else {
          delete stock[item];
        }
      } else {
        missingItems[item] = {
          'requested': orderedItems[item],
          'available': 0
        }
      }
    }

    if(Object.keys(missingItems).length != 0) {
      return reply.code(400).send({
        reason: 'One or more items ordered are not in stock',
        stock_discrepancy: missingItems
      })
    }
      
    // 1. REMOVE STOCK FROM MACHINE IN DB
    const updateStockParams = {
      TableName: 'inventory',
      Key: {
        machine_id: machineId
      },
      UpdateExpression: 'set stock = :s',
      ExpressionAttributeValues: {
        ':s': stock,
      },
    }
    await this.dynamo.update(updateStockParams)
    /////////////////////////////////

    // 2. CREATE NEW ORDER
    const orderId = v4()

    const orderIdCreateParams = {
      TableName: 'orders',
      Item: {
        order_id: orderId,
        machine_id: machineId,
        ordered_item: orderedItems,
        time: Date.now(),
        status: 'PENDING'
      },
    }
    
    await this.dynamo.put(orderIdCreateParams)
    ///////////////////

    // 3. SEND ORDER TO BROKER
    this.customMqttClient.submitOrder(orderId, machineId, orderedItems)
    ///////////////////////

    // 4. CREATE ORDER TIMEOUT TASK 

    // TODO: set up mqtt client to listen to stuff to mark
    // orders as complete. probably would be nice to be able
    // to sim this as well. need to set up a test MQTT machine
    // that is easy to test with. probably an EC2 box.

    // commented to avoid marking all machines offline
    const timoutMS = 5000
    setTimeout(orderTimeout, timoutMS, this.dynamo,orderId)
    ////////////////////////////

    // 5. RETURN ORDER ID
    return reply.code(200).send(orderId)
    //////////////////////
    
  })
}
