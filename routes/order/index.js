'use strict'

const schema = {
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
  }
}

module.exports = async function (fastify, opts) {
  fastify.post('/', { schema }, async function (request, reply) {
    const machineId = request.body['machine_id']
    const items = request.body['items']

    const orderId = 'order-' + machineId + '-' + Date.now()

    this.customMqttClient.submitOrder(orderId, machineId, items)

    return reply.code(200).header('Access-Control-Allow-Origin', '*')
      .header('Access-Control-Allow-Methods', 'GET').send('Order submitted')
  })
}
