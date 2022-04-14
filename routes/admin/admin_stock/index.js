'use strict'
const { setItemStockFromDB } = require('../util')
const { v4 } = require('uuid')

const schema = {
    description: 'DynamoDB admin functions. Change stock of item in a machine',
    tags: ['routes'],
    summary: 'DynamoDB admin functions',
    body: {
        type: 'object',
        required: ['machine_id', 'item_stock'],
        properties: {
            machine_id: { type: 'string' },
            item_stock: { type: 'object' }
        }
    },
    response: {
        200: {
            description: 'Updating the item stock of a machine, succeeded.',
            type: 'object'
        },
        400: {
            description: 'Updating the item of a machine, failed.',
            type: 'object',
            additionalProperties: true
        }
    }
}

module.exports = async function (fastify, opts) {
    fastify.post('/', schema, async function (request, reply) {
        const machineId = request.body['machine_id']
        const itemStock = request.body['item_stock']

        const stockCheckParams = {
            TableName: 'inventory',
            Key: {
                machine_id: machineId
            },
            AttributesToGet: ['item_stock']
        }

        const stockCheckResponse = await dynamo.get(stockCheckParams)
        
        if (!stockCheckResponse.Item.status) {
            return reply.code(400).send({
                reason: 'Item stock field does not exist'
            })
        }

        // SET ITEM STOCK IN DB
        await setItemStockFromDB(machineId, itemStock, this.dynamo)
        stockCheckResponse = await dynamo.get(stockCheckParams)
        console.log(stockCheckResponse.status)
        return reply.code(200).send(stockCheckResponse.status);
    })
}