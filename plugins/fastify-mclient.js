'use strict'

const fp = require('fastify-plugin')
const mqtt = require('mqtt')
// const fastJSONStringify = require('fast-json-stringify')

class CustomMqttClient {
  constructor (client) {
    this.mqttClient = client
  }

  async submitOrder (orderID, machineID, orderList) {
    const order = {'machineID': machineID, 'orderID': orderID, 'orderList': orderList}
    console.log('ORDER ' + order)
    const orderJSON = JSON.stringify(order)
    // const orderJSON = JSON.parse(JSON.stringify(order))
    this.mqttClient.publish(machineID, orderJSON)
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

  console.log('THIS IS THE MQTT CLIENT' + mqttClient)

  let customClient = new CustomMqttClient(mqttClient)

  customClient.submitOrder('orderID', 'machineID', 'orderList')

  customClient.mqttClient.on('error', (err) => {
    console.log(err)
    customClient.endClient(true)
  })

  fastify.addHook('onClose', () => customClient.endClient(true))

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
