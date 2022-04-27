'use strict'

const schema = {
  description: 'Gets item information.',
  tags: ['routes'],
  summary: 'Gets universal item information',
  querystring: {
    type: 'object',
    properties: {
      iids: {
        type: ['string', 'array'],
        description: 'Item IDs. Leave blank to get all items.'
      },
      fields: {
        type: ['string', 'array'],
        description: 'Desired return fields. Leave blank to get all fields.'
      }
    }
  },
  response: {
    200: {
      description: 'Succsesfully got the item data requested. The properties returned depends on the inputed "fields" paramater. The response is always an array, even if there is one or zero items returned.',
      type: 'array',
      items: {
        type: 'object',
        properties: {
          item_id: { type: 'string' },
          cost: { type: 'integer' },
          name: { type: 'string' },
          image_url: { type: 'string' },
          nutritional_info: {
            type: 'object',
            additionalProperties: true
          },
          nutrition_url: { type: 'string' }
        }
      }
    }
  }
}

module.exports = async function (fastify, opts) {
  fastify.get('/', { schema }, async function (request, reply) {
    const fieldsArr = request.query.fields && request.query.fields.split(',')

    if (request.query.iids) { // Filter by IDs
      const iids = request.query.iids.split(',').map(id => ({ item_id: id }))

      const params = {
        RequestItems: {
          items: {
            Keys: iids,
            ...(fieldsArr && { AttributesToGet: fieldsArr })
          }
        }
      }

      const response = await this.dynamo.batchGet(params)
      reply.code(200).send(response.Responses.items)
    } else { // Get ALL items
      const params = {
        TableName: 'items',
        ...(fieldsArr && { AttributesToGet: fieldsArr })
      }

      const response = await this.dynamo.scan(params)
      console.log(typeof (response.Items[6].nutritional_info))
      reply.code(200).send(response.Items)
    }
  })
}
