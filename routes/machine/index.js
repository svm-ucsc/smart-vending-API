'use strict'

const schema = {
  querystring: {
    type: 'object',
    properties: {
      mids: { type: ['string', 'array'] },
      fields: { type: ['string', 'array'] }
    }
  }
}

module.exports = async function (fastify, opts) {
  fastify.get('/', { schema }, async function (request, reply) {
    const fieldsArr = request.query.fields && request.query.fields.split(',')

    if (request.query.mids) { // Filter by IDs
      const mids = request.query.mids.split(',').map(id => ({'machine_id': id}))

      const params = {
        RequestItems: {
          'inventory': {
            Keys: mids,
            ...(fieldsArr && {AttributesToGet: fieldsArr})
          }
        }
      }

      const response = await this.dynamo.batchGet(params)
      reply.code(200).send(response.Responses.inventory)
    } else { // Get ALL items
      const params = {
        TableName: 'inventory',
        ...(fieldsArr && {AttributesToGet: fieldsArr})
      }

      const response = await this.dynamo.scan(params)
      reply.code(200).send(response.Items)
    }
  })
}
