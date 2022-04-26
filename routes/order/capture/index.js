'use strict'
const { capturePayment, orderTimeout } = require('../util')


module.exports = async function (fastify, opts) {
  fastify.post('/', async function (request, reply) {
    
    const paypalOrderId = request.body['paypal_order_id']
    const orderId = request.body['order_id']

    // 1. capture payment

    capturePayment(paypalOrderId);

    // 2. SEND ORDER TO BROKER
    const getOrderParams = {
      TableName: 'orders',
      Key: {
        order_id: orderId
      },
      AttributesToGet: ['machine_id', 'ordered_item']
    }

    const getOrderResponse = await this.dynamo.get(getOrderParams)

    this.customMqttClient.submitOrder(orderId, getOrderResponse['machine_id'], getOrderResponse['orderList'])

    // 3. CREATE ORDER TIMEOUT TASK
    const timeoutMS = 5000 // 5 seconds
    setTimeout(orderTimeout, timeoutMS, this.dynamo, orderId)

    // 4. RETURN ORDER ID
    return reply.code(200).send(orderId)
    // return reply.code(200)
  })
}
