'use strict'
const { getLocationAndStock, getNearest } = require('./util')

const schema = {
  description: 'Return a list of nearby vending machines and their locations. Range is in meters.',
  tags: ['routes'],
  summary: 'Get location of nearby machines',
  body: {
    type: 'object',
    required: ['item_id', 'latitude', 'longitude'],
    properties: {
      item_id: { type: 'string' },
      latitude: { type: 'number' },
      longitude: { type: 'number' },
      range: { type: 'number' }
    }
  },
  response: {
    200: {
      description: 'Returned the list of machines & locations sucessfully, number of machines in range are returned',
      type: 'array',
      location: {
        type: 'object',
        properties: {
          latitude: { type: 'string' },
          longitude: { type: 'string' }
        }
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
    const itemId = request.body.item_id
    const lat = request.body.latitude
    const long = request.body.longitude
    const range = request.body.range
    const queryLocation = { latitude: lat, longitude: long }
    let scanResponse = null

    const nearMachines = []

    scanResponse = await getLocationAndStock(this.dynamo)

    if (!scanResponse.Items) {
      return reply.code(400).send({
        reason: 'No items with stock attribute or location attribute were found'
      })
    }

    for (const index in scanResponse.Items) {
      if (itemId == "empty") {
        getNearest(nearMachines, scanResponse.Items[index].location, queryLocation, range)
      } else if (scanResponse.Items[index].stock[itemId]) {
        getNearest(nearMachines, scanResponse.Items[index].location, queryLocation, range)
      }
    }

    return reply.code(200).send(nearMachines)
  })
}
