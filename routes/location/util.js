'use strict'

module.exports =  {
    async getMachines (itemId, dynamo) {
        const stockCheckParams = {
            TableName: 'inventory',
            AttributesToGet: ['stock', 'location']
        }
        const stockCheckResponse = await dynamo.scan(stockCheckParams)

        console.log(stockCheckResponse)

        if (!stockCheckResponse.Items) {
            return reply.code(400).send({
                reason: 'No items with stock attribute were found'
            })
        }
        return stockCheckResponse.Items
    }
}