'use strict'

const { test } = require('tap')
const { build } = require('../helper')

test('get valid order', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/order/status',
    query: { oid: '32a2f22b-44c0-45b9-895a-ad451cdff2ce' }
  })
  t.equal(res.statusCode, 200)
  t.equal(JSON.parse(res.body).status, 'SUCCESS')
})

test('get invalid order', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/order/status',
    query: { oid: 'INVALID_ORDER_ID' }
  })
  t.equal(res.statusCode, 400)
})
