'use strict'

const { test } = require('tap')
const { build } = require('../helper')

test('item is loaded', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/item',
    query: {'id': 'd016'}
  })
  t.equal(res.payload,
    '{"cost":99,"item_id":"d016","name":"Doritos 6oz","nutritional_info":{"calories":"200","protein":"6"}}')
})
