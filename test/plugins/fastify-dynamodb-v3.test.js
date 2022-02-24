'use strict'

const { test } = require('tap')
const Fastify = require('fastify')
const DynamoDB = require('../../plugins/fastify-dynamodb-v3')

test('support works standalone', async (t) => {
  const fastify = Fastify()
  fastify.register(DynamoDB)

  await fastify.ready()
  t.ok(fastify.dynamo)
})
