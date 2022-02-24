'use strict'

module.exports = async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    this.mqtt.publish('mqttp_topic', 'mqttp test')

    return reply.code(200).send('published message to mqttp_topic/')
  })
}
