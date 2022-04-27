'use strict'
const { capturePayment, vendOrderTimeout } = require('../util')

module.exports = async function (fastify, opts) {
  fastify.post('/', async function (request, reply) {
    const orderId = request.body.order_id

    // 1. verify order status is PAYMENT_PENDING
    // 2. get paypal order id from DB (dont assume the one given to us is the right one)

    const orderCheckParams = {
      TableName: 'orders',
      Key: {
        order_id: orderId
      },
      AttributesToGet: ['paypal_order_id', 'status', 'machine_id', 'ordered_item']
    }
    const orderCheckResponse = await this.dynamo.get(orderCheckParams)

    if (!orderCheckResponse.Item) {
      return reply.code(400).send({
        reason: 'order_id could not be found'
      })
    }

    if (orderCheckResponse.Item.status !== 'PAYMENT_TIMEDOUT') {
      return reply.code(400).send({
        reason: 'payment has timed out'
      })
    }

    if (orderCheckResponse.Item.status !== 'PAYMENT_PENDING') {
      return reply.code(400).send({
        reason: 'not able to process payment for order'
      })
    }

    const paypalOrderId = orderCheckResponse.Item.paypal_order_id

    // 3. capture payment

    capturePayment(paypalOrderId)

    // 4. set order status as VEND_PENDING

    const updateOrderParams = {
      TableName: 'orders',
      Key: {
        order_id: orderId
      },
      UpdateExpression: 'set #st = :to',
      ExpressionAttributeNames: {
        '#st': 'status'
      },
      ExpressionAttributeValues: {
        ':to': 'VEND_PENDING'
      }
    }
    await this.dynamo.update(updateOrderParams)

    // 5. SEND ORDER TO BROKER
    this.customMqttClient.submitOrder(orderId, orderCheckResponse.Item.machine_id, orderCheckResponse.Item.orderList)

    // 6. CREATE VEND_ORDER TIMEOUT TASK
    const timeoutMS = 5000 // 5 seconds
    setTimeout(vendOrderTimeout, timeoutMS, this.dynamo, orderId)

    // 7. RETURN ORDER ID
    return reply.code(200).send()
  })
}
