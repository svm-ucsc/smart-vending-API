'use strict'

const { test } = require('tap')
const { build } = require('../helper')

test('item is loaded', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/items'
  })
  t.ok(res.payload)
})
