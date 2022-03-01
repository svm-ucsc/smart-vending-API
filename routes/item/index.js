'use strict'

module.exports = async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    const fieldsArr = request.query.fields && request.query.fields.split(',')

    if (request.query.iids) { // Filter by IDs
      const iids = request.query.iids.split(',').map(id => ({'item_id': id}))

      const params = {
        RequestItems: {
          'items': {
            Keys: iids,
            ...(fieldsArr && {AttributesToGet: fieldsArr})
          }
        }
      }

      const response = await this.dynamo.batchGet(params)
      reply.code(200).send(response.Responses.items)
    } else { // Get ALL items
      const params = {
        TableName: 'items',
        ...(fieldsArr && {AttributesToGet: fieldsArr})
      }

      const response = await this.dynamo.scan(params)
      reply.code(200).send(response.Items)
    }
  })
}