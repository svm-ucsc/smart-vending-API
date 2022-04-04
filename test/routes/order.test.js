'use strict'

const { test } = require('tap')
const { build } = require('../helper')

test('all items get', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/order',
    body: {
      'machine_id': 'testid',
      'items': {'d016': 2, 't002': 3}
    }
  })
  t.equal(res.statusCode, 200)
})
