'use strict'

const { test } = require('tap')
const Fastify = require('fastify')
const customMqtt = require('../../plugins/fastify-mclient')

test('support works standalone', async (t) => {
  const fastify = Fastify()
  
  fastify.register(require('fastify-mqtt'), {
    host: 'http://ec2-3-87-77-241.compute-1.amazonaws.com:1884/',
    username: 'lenatest',
    password: 'password'
  })

  fastify.register(customMqtt)
  await fastify.ready()
  t.ok(fastify.customMqttClient)

  fastify.customMqttClient.endClient(true)
})
