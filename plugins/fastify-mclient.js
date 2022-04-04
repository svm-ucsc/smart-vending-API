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
  const host = options.host
  delete options.host

  const username = options.username
  delete options.username

  const password = options.password
  delete options.password

  let mqttClient = mqtt.connect(host, { username: username, password: password })

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
