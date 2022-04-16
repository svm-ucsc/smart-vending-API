'use strict'
const { setMachineStatusFromDB } = require('./util')

const schema = {
  description: 'DynamoDB admin functions. Change status of a machine',
  tags: ['routes'],
  summary: 'DynamoDB admin functions',
  body: {
    type: 'object',
    required: ['machine_id', 'status'],
    properties: {
      machine_id: {type: 'string'},
      status: {type: 'string'}
    }
  },
  response: {
    200: {
      description: 'Updating the machine status success.',
      type: 'object',
      properties: {
        machine_status: { type: 'string' }
      }
    },
    400: {
      description: 'Updating the machine status failed, Failure reason returned as string.',
      type: 'object',
      additionalProperties: false
    }
  }
}

module.exports = async function (fastify, opts) {
  fastify.post('/', {schema}, async function (request, reply) {
    const machineId = request.body['machine_id']
    const newStatus = request.body['status']

    const statusCheckParams = {
      TableName: 'inventory',
      Key: {
        machine_id: machineId
      },
      AttributesToGet: ['status']
    }

    let statusCheckResponse = await this.dynamo.get(statusCheckParams)

    if (!statusCheckResponse.Item) {
      return reply.code(400).send({
        reason: 'Invalid Machine ID'
      })
    } else if (!statusCheckResponse.Item.status) {
      return reply.code(400).send({
        reason: 'Machine Status field does not exist'
      })
    }

    // SET MACHINE STATUS IN DB
    await setMachineStatusFromDB(machineId, newStatus, this.dynamo)
    statusCheckResponse = await this.dynamo.get(statusCheckParams)
    if (statusCheckResponse.Item.status === newStatus) {
      console.log('Machine status matches expected', statusCheckResponse.Item.status)
      return reply.code(200).send(statusCheckResponse.status)
    } else {
      return reply.code(400).send({
        reason: 'Status returned does not match expected',
        statusSent: newStatus,
        statusReturned: statusCheckResponse.Item.status
      })
    }
  })
}
