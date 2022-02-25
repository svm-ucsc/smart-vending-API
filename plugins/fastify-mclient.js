'use strict'

const fp = require('fastify-plugin')
const mqtt = require('mqtt')
const fastJSONStringify = require('fast-json-stringify')

class customMqttClient {
    constructor(mqttClient) {
        this.mqttClient = mqttClient
    }

    async submitOrder(orderID, machineID, orderList) {
        const order = {"machineID":machineID, "orderID":orderID, "orderList":orderList}
        const orderJSON = JSON.parse(fastJSONStringify(order))
        this.mqttClient.publish(machineID, orderJSON)
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

  mqttClient.on('error', (err) => {
    console.error(err)
    mqttClient.end()
  })

  fastify.addHook('onClose', () => mqttClient.end())

  var customClient = new customMqttClient(mqttClient)

  if (!fastify.mqtt) {
    fastify.decorate('customMqttClient', customClient)
  }

  next()
}

module.exports = fp(fastifyCustomMQTTClient, {
  fastify: '>=1.0.0',
  name: 'fastify-custom-mqtt-client'
})

module.exports.autoload = false
