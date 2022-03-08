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

  async submitOrder (orderID, machineID, orderList) {
    const topic = machineID + '/order/vend'
    const order = JSON.stringify({'orderID': orderID, 'orderList': orderList})
    this.mqttClient.publish(topic, order)
  }

  endClient (force) {
    this.mqttClient.end(force)
  }
}

function fastifyCustomMQTTClient (fastify, options, next) {

  async function onMessageCB(topic, message) {
    const topicArr = topic.split('/')
    const machineIDTopic = topicArr[0]
    const subtopic = topicArr[1]

    if(subtopic == 'status') {

      const updateMachineParams = {
        TableName: 'inventory',
        Key: {
          machine_id: machineIDTopic
        },
        UpdateExpression: 'set #st = :er',
        ExpressionAttributeNames: {
          '#st': 'status'
        },
        ExpressionAttributeValues: {
          ':er': JSON.parse(message)['status'],
        },
      }
      await fastify.dynamo.update(updateMachineParams)

    } else if(subtopic == 'order' && topicArr[2] == 'status') {
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
          ':to': 'SUCCESS',
        },
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
    fastify: ['mqtt', 'config'],
  },
})

module.exports.autoload = false
