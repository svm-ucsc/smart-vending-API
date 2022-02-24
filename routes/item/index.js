'use strict'

const schema = {
  querystring: {
    type: 'object',
    properties: {
      'id': { type: 'string' },
    },
    required: ['id']
  }
}

module.exports = async function (fastify, opts) {
  fastify.get('/', { schema }, async function (request, reply) {

    const params = {
      TableName : 'items',
      Key: {
        item_id: request.query.id
      }
    }

    const response = await this.dynamo.get(params)

    reply.code(200).send(response.Item)
  })
}
