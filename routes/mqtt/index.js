'use strict'
var mqttHandler = require('./mqtt_handler');

module.exports = async function (fastify, opts) {

    var mqttClient = new mqttHandler();
    mqttClient.connect();

    fastify.get('/', async function (request, reply) {

        // mqttClient.sendMessage(request.body.message);
        mqttClient.sendMessage("hiya");   
        reply.status(200).send("Message sent to mqtt");

        return "hello";

    })
}
