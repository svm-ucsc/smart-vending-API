'use strict'

const { test } = require('tap')
const Fastify = require('fastify')
const customMqtt = require('../../plugins/fastify-mclient')

test('support works standalone', async (t) => {
  const fastify = Fastify()

  fastify.register(require('fastify-env'), {
    dotenv: false,
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

  fastify.register(require('fastify-mqtt'), {
    host: 'http://ec2-3-87-77-241.compute-1.amazonaws.com:1884',
    username: 'lenatest',
    password: 'password'
  })

  fastify.register(customMqtt, {
    host: 'http://ec2-3-87-77-241.compute-1.amazonaws.com:1884',
    username: 'lenatest',
    password: 'password'
  })
  await fastify.ready()
  t.ok(fastify.customMqttClient)

  fastify.customMqttClient.endClient(true)
})
