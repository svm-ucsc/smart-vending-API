'use strict'

const fp = require('fastify-plugin')
const mqtt = require('mqtt')

function fastifyMQTTClient (fastify, options, next) {

  const host = options.host
  delete options.host

  const username = options.username
  delete options.username

  const password = options.password
  delete options.password

  let mqttClient = mqtt.connect(host, { 
    username: username, 
    password: password 
  })

  mqttClient.on('error', (err) => {
    console.log(err)
    mqttClient.end(true)
  })

  fastify.addHook('onClose', () => mqttClient.end())

  if (!fastify.mqtt) {
    fastify.decorate('mqtt', mqttClient)
  }

  next()
}

module.exports = fp(fastifyMQTTClient, {
  fastify: '>=1.0.0',
  name: 'fastify-mqtt'
})

module.exports.autoload = false
