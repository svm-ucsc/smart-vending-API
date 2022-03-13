'use strict'

const schema = {
  description: 'Gets order information by order ID.',
  tags: ['routes'],
  summary: 'Gets order information by order ID',
  querystring: {
    type: 'object',
    required: ['oid'],
    properties: {
      oid: {
        type: 'string',
        description: 'Order ID. Cannot be blank.'
      },
      fields: {
        type: ['string', 'array'],
        description: 'Desired return fields. Leave blank to get all fields.'
      }
    }
  },
  response: {
    200: {
      description: 'Order information was returned successfully.',
      type: 'object',
      properties: {
        order_id: { type: 'string' },
        machine_id: { type: 'string' },
        time: { type: 'integer' },
        ordered_item: { type: 'object' },
        status: { type: 'string' }
      }
    },
    400: {
      description: 'Order information could not be retrieved.',
      type: 'object',
      additionalProperties: true
    }
  }

}

module.exports = async function (fastify, opts) {
  fastify.get('/', { schema }, async function (request, reply) {
    const fieldsArr = request.query.fields && request.query.fields.split(',')

    const getOrderParams = {
      TableName: 'orders',
      Key: {
        order_id: request.query.oid
      },
      ...(fieldsArr && {AttributesToGet: fieldsArr})
    }

    const getOrderResponse = await this.dynamo.get(getOrderParams)

    if (!getOrderResponse.Item) {
      return reply.code(400).send({
        reason: 'order_id could not be found'
      })
    }

    return reply.code(200).send(getOrderResponse.Item)
  })
}
