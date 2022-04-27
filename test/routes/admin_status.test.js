'use strict'

const { test } = require('tap')
const { build } = require('../helper')

// TODO: Update this test
// - [ ] Reset the stock before testing
// - [ ] Fix timeout bug
test('Set LWT', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/admin_status',
    body: {
      machine_id: 'testclient',
      status: 'LWT'
    }
  })
  console.log(res.body)
  t.equal(res.statusCode, 200)
})

test('invalid machine_id', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/admin_status',
    body: {
      machine_id: 'INVALID_MACHINE_ID',
      status: 'READY'
    }
  })
  t.equal(res.statusCode, 400)
})

test('Set READY status', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/admin_status',
    body: {
      machine_id: 'testclient',
      status: 'READY'
    }
  })
  t.equal(res.statusCode, 200)
})
