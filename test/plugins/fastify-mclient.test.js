'use strict'

const { test } = require('tap')
const Fastify = require('fastify')
const customMqtt = require('../../plugins/fastify-mclient')

test('support works standalone', async (t) => {
  const fastify = Fastify()
  fastify.register(customMqtt, {
    host: 'http://ec2-3-87-77-241.compute-1.amazonaws.com:1884',
    username: 'lenatest',
    password: 'password'
  })
  await fastify.ready()
  t.ok(fastify.customMqttClient)

  fastify.customMqttClient.endClient(true)
})
