'use strict'
const { getMachines, getNearest } = require('./util')

const schema = {
    description: 'Return a list of nearby vending machines and their locations',
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
        const itemId = request.body['item_id']
        const lat = request.body['latitude']
        const long = request.body['longitude']
        const range = request.body['range']
        const queryLocation = {latitude: lat, longitude: long}
        console.log('QUERY LOCATION', queryLocation)
        console.log('ITEM ID', itemId)
        console.log('LATITUDE',queryLocation.latitude)
        console.log('LONGITUDE', queryLocation.longitude)

        const nearMachines = []

        const scanResponse = await getMachines(itemId, this.dynamo)
        // console.log('Scan Reponse Items', scanResponse.Items)
        for (const index in scanResponse.Items) {
            if (!scanResponse.Items[index].stock[itemId]) {
                console.log('item out of stock')
            } else {
                getNearest(nearMachines, scanResponse.Items[index].location, queryLocation, range);
            }
            console.log('Machine Location', scanResponse.Items[index].location)
            console.log(scanResponse.Items[index].stock[itemId])
        }
        console.log('Nearest', nearMachines)
        console.log(scanResponse.ScannedCount)
        return reply.code(200).send(scanResponse.ScannedCount)
    })
}
