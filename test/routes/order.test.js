'use strict'

const { test } = require('tap')
const { build } = require('../helper')

// TODO: Update this test
// - [ ] Reset the stock before testing
// - [ ] Fix timeout bug
test('valid order', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/order',
    body: {
      'machine_id': 'testclient',
      'items': { 'd016': 1, 't002': 1 }
    }
  })
  console.log(res.body)
  t.equal(res.statusCode, 200)
})

test('invalid machine_id', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/order',
    body: {
      'machine_id': 'INVALID_MACHINE_ID',
      'items': { 'd016': 1, 't002': 1 }
    }
  })
  t.equal(res.statusCode, 400)
})

test('invalid order', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/order',
    body: {
      'machine_id': 'testclient',
      'items': { 'ITEM_NOT_IN_STOCK': 1 }
    }
  })
  t.equal(res.statusCode, 400)
})

test('item does not exist order', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/order',
    body: {
      'machine_id': 'testclient',
      'items': { 'd016': 1, 't002': 1, 'THE NULL ITEM OF BUG CREATION': 1 }
    }
  })
  t.equal(res.statusCode, 400)
})
