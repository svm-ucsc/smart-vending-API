'use strict'

const schema = {
  description: 'Submit an order request. Request may be rejected if invalid.',
  tags: ['routes'],
  summary: 'Places an order',
  body: {
    type: 'object',
    required: ['machine_id', 'items'],
    properties: {
      machine_id: {type: 'string'},
      items: {
        type: 'object',
        minProperties: 1,
        patternProperties: {
          '.+': {type: 'number'}
        }
      }
    }
  },
  response: {
    200: {
      description: 'Order was placed successfully. The order_id is returned in an object.',
      type: 'object',
      properties: {
        order_id: { type: 'string' }
      }
    },
    400: {
      description: 'Order placing failed for some reason. The failure reason is returned as a string.',
      properties: {
        reason: { type: 'string' }
      }
    }
  }

}

module.exports = async function (fastify, opts) {
  fastify.post('/', { schema }, async function (request, reply) {
    const machineId = request.body['machine_id']
    const items = request.body['items']

    const orderId = 'order-' + machineId + '-' + Date.now()

    this.customMqttClient.submitOrder(orderId, machineId, items)

    return reply.code(200).send('Order submitted')
  })
}
