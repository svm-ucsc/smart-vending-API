'use strict'

const fp = require('fastify-plugin')
const { DynamoDB } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb')

function fastifyDynamoDB (fastify, options, next) {
  const region = options.region
  delete options.region

  const client = new DynamoDB({region: region})
  const ddbDocClient = DynamoDBDocument.from(client)

  if (!fastify.dynamo) {
    fastify.decorate('dynamo', ddbDocClient)
  }

  next()
}

module.exports = fp(fastifyDynamoDB, {
  fastify: '>=1.0.0',
  name: 'fastify-dynamodb-v3'
})

module.exports.autoConfig = {region: 'us-east-1'}
