'use strict'

const path = require('path')
const AutoLoad = require('fastify-autoload')

module.exports = async function (fastify, opts) {
  fastify.register(require('fastify-env'), {
    dotenv: true,
    schema: {
      type: 'object',
      required: [ 'MQTT_HOST', 'MQTT_USERNAME', 'MQTT_PASSWORD' ],
      properties: {
        MQTT_HOST: {
          type: 'string'
        },
        MQTT_USERNAME: {
          type: 'string'
        },
        MQTT_PASSWORD: {
          type: 'string'
        }
      }
    }
  })

  fastify.register(require('fastify-mqtt'), {
    host: 'http://ec2-3-87-77-241.compute-1.amazonaws.com:1884',
    username: 'lenatest',
    password: 'password'
  })

  fastify.register(require('./plugins/fastify-mclient.js'))

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: Object.assign({}, opts)
  })

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: Object.assign({}, opts)
  })
}
