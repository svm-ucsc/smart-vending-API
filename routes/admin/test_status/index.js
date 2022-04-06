'use strict'
const { setMachineStatusFromDB } = require('../util')
const { v4 } = require('uuid')

const schema = {
    description: 'DynamoDB admin functions. Change status of a machine',
    tags: ['routes'],
    summary: 'DynamoDB admin functions',
    body: {
        type: 'object',
        required: ['machine_id'],
        properties: {
            machine_id: {type: 'string'}
        }
    },
    response: {
        200: {
            description: 'Updating the machine status success.',
            type: 'object',
            properties: {
                order_id: { type: 'string' }
            }
        }
    },
    400: {
        description: 'Updating the machine status failed, Failure reason returned as string.',
        type: 'object',
        additionalProperties: true
    }
}

module.exports = async function (fastify, opts) {
    fastify.post('/', {schema}, async function (request, reply)) {
        const machineId = request.body['machine_id']
    }

    const inventoryCheckParams = {
        TableName: 'iventory',
        Key: {

        },
        AttributesToGet: ['', '']
    }

    // SET MACHINE STATUS IN DB
    await setMachineStatusFromDB(machineId, , this.dynamo)
    return reply.code(200).send();
}
