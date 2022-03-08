'use strict'

const path = require('path')
const AutoLoad = require('fastify-autoload')

module.exports = async function (fastify, opts) {

  fastify.register(require('fastify-env'), {
    dotenv: true,
    schema: {
      type: 'object',
      required: [ 'MQTT_HOST', 'MQTT_USERNAME','MQTT_PASSWORD' ],
      properties: {
        MQTT_HOST: {
          type: 'string'
        },
        MQTT_USERNAME: {
          type: 'string'
        },
        MQTT_PASSWORD: {
          type: 'string'
        },
      }
    }
  })

  fastify.register(require('fastify-cors'), { 
    origin: true,
    methods: 'GET,POST'
  })

  fastify.register(require('./plugins/fastify-mqtt'), parent => ({
    host: parent.config.MQTT_HOST,
    username: parent.config.MQTT_USERNAME,
    password: parent.config.MQTT_PASSWORD
  }))

  fastify.register(require('./plugins/fastify-mclient.js'))

  fastify.register(require('fastify-swagger'), {
    routePrefix: '/documentation',
    swagger: {
      info: {
        title: 'API documentation',
        version: '0.1.0'
      },
      port: '3000',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'routes', description: 'All endpoints' }
      ]
    },
    uiConfig: {
      deepLinking: false
    },
    uiHooks: {
      onRequest: function (request, reply, next) { next() },
      preHandler: function (request, reply, next) { next() }
    },
    exposeRoute: true
  })

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
