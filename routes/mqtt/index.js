'use strict'

var mqttHandler = require('./mqtt_handler');
var api_caller = require('./api_calls');
const { DynamoDBClient, QueryCommand } = require("@aws-sdk/client-dynamodb");

module.exports = async function (fastify, opts) {
    var mqttClient = new mqttHandler();
    mqttClient.connect();

    fastify.get('/', async function (request, reply) {

        let item_id = "bussin bussin";
        var test_caller = new api_caller(item_id);
        
        // const hw_data = test_caller.dynamo_hw();
        const ui_data = test_caller.dynamo_ui();

        return ui_data;
        // return hw_data;
    })
}