'use strict'

const path = require('path')
const AutoLoad = require('fastify-autoload')

module.exports = async function (fastify, opts) {
  // Loads mqtt plugin
  fastify.register(require('./plugins/fastify-mclient.js'), {
    host: 'http://ec2-3-87-77-241.compute-1.amazonaws.com:1884',

    // mqtt credentials if these are needed to connect
    // TODO: move these to secrets
    username: 'lenatest',
    password: 'password'
  })

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
