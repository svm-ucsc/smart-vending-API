'use strict'

const fp = require('fastify-plugin')

class CustomMqttClient {
  constructor (client) {
    this.mqttClient = client
  }

  subscribe (topic) {
    this.mqttClient.subscribe(topic)
  }

  onMessage (callback) {
    this.mqttClient.on('message', callback)
  }

  async submitOrder (orderID, machineID, machineOrder) {
    const topic = machineID + '/order/vend'
    const order = JSON.stringify({'orderID' : orderID, 'orderList' : machineOrder})  
    this.mqttClient.publish(topic, order)
  }

  endClient (force) {
    this.mqttClient.end(force)
  }
}

function fastifyCustomMQTTClient (fastify, options, next) {
  async function onMessageCB (topic, message) {
    const topicArr = topic.split('/')

    if (topicArr.length < 2) return

    if (topicArr[1] === 'status') {
      // machine status updates
      const updateMachineParams = {
        TableName: 'inventory',
        Key: {
          machine_id: topicArr[0]
        },
        UpdateExpression: 'set #st = :er',
        ExpressionAttributeNames: {
          '#st': 'status'
        },
        ExpressionAttributeValues: {
          ':er': JSON.parse(message)['status']
        }
      }

      await fastify.dynamo.update(updateMachineParams)
    } else if (topicArr[1] === 'order' && topicArr[2] === 'status') {
      // order status updates
      const updateOrderParams = {
        TableName: 'orders',
        Key: {
          order_id: JSON.parse(message)['order_id']
        },
        UpdateExpression: 'set #st = :to',
        ExpressionAttributeNames: {
          '#st': 'status'
        },
        ExpressionAttributeValues: {
          ':to': JSON.parse(message)['status']
        }
      }

      await fastify.dynamo.update(updateOrderParams)
    }
  }

  let customClient = new CustomMqttClient(fastify.mqtt)

  customClient.subscribe('+/status')
  customClient.subscribe('+/order/status')
  customClient.onMessage(onMessageCB)

  customClient.mqttClient.on('error', (err) => {
    console.log(err)
    customClient.endClient(true)
  })

  fastify.addHook('onClose', () => customClient.endClient(true))

  if (!fastify.customMqttClient) {
    fastify.decorate('customMqttClient', customClient)
  }

  next()
}

module.exports = fp(fastifyCustomMQTTClient, {
  fastify: '>=1.0.0',
  name: 'fastify-custom-mqtt-client',
  decorators: {
    fastify: ['mqtt']
  },
  dependencies: ['fastify-mqtt']
})

module.exports.autoload = false
