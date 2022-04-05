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

        }
    },
    400: {
        description: 'Updating the machine status failed, Failure reason returned as string.',
        type: 'object',
        additionalProperties: true
    }
}
