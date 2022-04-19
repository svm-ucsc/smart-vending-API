'use strict'

const schema = {
    description: 'Return a list of nearby vending machines and their locations',
    tags: ['routes'],
    summary: 'Get location of nearby machines',
    body: {
        type: 'object',
        required: ['latitude, longitude'],
        properties: {
            latitude: {type: 'number'},
            longitude: {type: 'number'}
        }
    },
    response: {
        200: {
            description: 'Returned the list of machines & locations sucessfully, number of machines in range are returned',
            type: 'object',
            properties: {
                in_range: { type: 'integer' }
            }
        },
        400: {
            description: 'Failed to find machines, failure returned as string',
            type: 'object',
            additionalProperties: true
        }
    }
}

module.exports = async function (fastify, opts) {
    fastify.post('/', { schema }, async function (request, reply) {
        const lat = request.body['latitude']
        const long = request.body['longitude']
    })
}
