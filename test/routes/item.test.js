'use strict'

const { test } = require('tap')
const { build } = require('../helper')

test('all items get', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/item'
  })
  t.ok(JSON.parse(res.payload))
})
