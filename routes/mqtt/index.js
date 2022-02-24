'use strict'

const {dynamoHW, dynamoUI} = require('./api_calls')

module.exports = async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    let itemID = 'bussin bussin'

    const params = {
      TableName: 'items',
      Key: {
        item_id: itemID
      }
    }

    const hwData = await dynamoHW(this.dynamo, params)
    console.log(hwData)
    const uiData = await dynamoUI(this.dynamo, params)

    reply.code(200).send(uiData)
  })
}
