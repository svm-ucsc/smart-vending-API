'use strict'

module.exports =  {
    async isMachine (lat, long, dynamo) {
        const checkLocationParams = {
            TableName: 'inventory',
            ExpressionAttributeNames: {
                '#mid': 'machine_id'
            },
            ExpressionAttributeValues: {
                ':lat': lat,
                ':long': long
            },
            FilterExpression: 'location.latitude = :lat, location.longitude = :long',
            ProjectionExpression: '#mid'
        }
        const response = await dynamo.scan(checkLocationParams)
        if (!response.Item) {
            return null
        } else {
            return response.Item.machine_id
        }
    }
}