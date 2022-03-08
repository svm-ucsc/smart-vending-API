'use strict'

const fp = require('fastify-plugin')
const mqtt = require('mqtt')

class CustomMqttClient {
  constructor (client) {
    this.mqttClient = client
  }

  async submitOrder (orderID, machineID, orderList) {
    const topic = machineID + '/vend'
    const order = JSON.stringify({'orderID': orderID, 'orderList': orderList})
    this.mqttClient.publish(topic, order)
  }

  endClient (force) {
    this.mqttClient.end(force)
  }
}

function fastifyCustomMQTTClient (fastify, options, next) {

  async function onMessage(topic, message) {
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

    } else if(subtopic == 'vendconfirm') {
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
      console.log(updateOrderParams)
      await fastify.dynamo.update(updateOrderParams)
    }
  
  }

  const host = options.host
  delete options.host

  const username = options.username
  delete options.username

  const password = options.password
  delete options.password

  let mqttClient = mqtt.connect(host, { username: username, password: password })

  mqttClient.subscribe('lenalaptopclient/status')
  mqttClient.subscribe('lenalaptopclient/vendconfirm')
  mqttClient.on('message', onMessage)

  let customClient = new CustomMqttClient(mqttClient)

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
  name: 'fastify-custom-mqtt-client'
})

module.exports.autoload = false
