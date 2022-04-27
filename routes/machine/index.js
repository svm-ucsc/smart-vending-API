'use strict'

const schema = {
  description: 'Gets information on a vending machine, including its stock.',
  tags: ['routes'],
  summary: 'Gets machine information',
  querystring: {
    type: 'object',
    properties: {
      mids: {
        type: ['string', 'array'],
        description: 'Machine IDs. Leave blank to get all machines.'
      },
      fields: {
        type: ['string', 'array'],
        description: 'Desired return fields. Leave blank to get all fields.'
      }
    }
  },
  response: {
    200: {
      description: 'Succsesfully got the machine data requested. The properties returned depends on the inputed "fields" paramater. The response is always an array, even if there is one or zero items returned.',
      type: 'array',
      items: {
        type: 'object',
        properties: {
          machine_id: { type: 'string' },
          active: { type: 'boolean' },
          location: { type: 'string' },
          stock: {
            type: 'object',
            patternProperties: {
              '.+': { type: 'number' }
            }
          }
        }
      }
    }
  }
}

module.exports = async function (fastify, opts) {
  fastify.get('/', { schema }, async function (request, reply) {
    const fieldsArr = request.query.fields && request.query.fields.split(',')

    if (request.query.mids) { // Filter by IDs
      const mids = request.query.mids.split(',').map(id => ({ machine_id: id }))

      const params = {
        RequestItems: {
          inventory: {
            Keys: mids,
            ...(fieldsArr && { AttributesToGet: fieldsArr })
          }
        }
      }

      const response = await this.dynamo.batchGet(params)
      reply.code(200).send(response.Responses.inventory)
    } else { // Get ALL items
      const params = {
        TableName: 'inventory',
        ...(fieldsArr && { AttributesToGet: fieldsArr })
      }

      const response = await this.dynamo.scan(params)
      reply.code(200).send(response.Items)
    }
  })
}
