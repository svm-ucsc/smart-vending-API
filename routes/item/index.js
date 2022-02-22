'use strict'

const { DynamoDBClient, QueryCommand } = require("@aws-sdk/client-dynamodb");

module.exports = async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {

    const client = new DynamoDBClient({ region: "us-east-1" });

    let id = "d016";
    const params = {
      "TableName" : "items",
      "KeyConditionExpression": "item_id = :id",
      "ExpressionAttributeValues": {
        ":id": {"S": id}
      },
    };

    const command = new QueryCommand(params);

    const response = await client.send(command);
    
    return response.Items;
  })
}
