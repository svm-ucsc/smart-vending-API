'use strict'

const { test } = require('tap')
const Fastify = require('fastify')
const customMqtt = require('../../plugins/fastify-mclient')

test('support works standalone', async (t) => {
  const fastify = Fastify()

  fastify.register(require('fastify-env'), {
    dotenv: true,
    schema: {
      type: 'object',
      required: [ 'MQTT_HOST', 'MQTT_USERNAME', 'MQTT_PASSWORD' ],
      properties: {
        MQTT_HOST: {
          type: 'string'
        },
        MQTT_USERNAME: {
          type: 'string'
        },
        MQTT_PASSWORD: {
          type: 'string'
        }
      }
    }
  })

  fastify.register(require('fastify-mqtt'), parent => ({
    host: parent.config.MQTT_HOST,
    username: parent.config.MQTT_USERNAME,
    password: parent.config.MQTT_PASSWORD
  }))

  fastify.register(customMqtt, {
    host: 'http://ec2-3-87-77-241.compute-1.amazonaws.com:1884',
    username: 'lenatest',
    password: 'password'
  })
  await fastify.ready()
  t.ok(fastify.customMqttClient)

  fastify.customMqttClient.endClient(true)
})
