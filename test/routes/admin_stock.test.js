'use strict'

const { test } = require('tap')
const { build } = require('../helper')

// TODO: Update this test
// - [ ] Reset the stock before testing
// - [ ] Fix timeout bug
test('Set stock 0', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/admin_stock',
    body: {
      'machine_id': 'testclient',
      'item_id': 'd016',
      'item_stock': 0
    }
  })
  console.log(res.body)
  t.equal(res.statusCode, 200)

  const stockCheck = await app.inject({
    method: 'GET',
    url: '/machine',
    query: {
      mids: 'testclient',
      fields: 'stock'
    }
  })
  t.equal(stockCheck.statusCode, 200)

  console.log('Machine route response body: ', JSON.parse(stockCheck.body))
  console.log('Stock should be 0: ', JSON.parse(stockCheck.body)[0].stock['d016'])

  t.equal(JSON.parse(stockCheck.body)[0].stock['d016'], 0)
})

test('invalid machine_id', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/admin_stock',
    body: {
      'machine_id': 'INVALID_MACHINE_ID',
      'item_id': 'd016',
      'item_stock': 6969
    }
  })
  t.equal(res.statusCode, 400)
})

test('Set stock to 69420', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/admin_stock',
    body: {
      'machine_id': 'testclient',
      'item_id': 'd016',
      'item_stock': 69420
    }
  })
  t.equal(res.statusCode, 200)

  const stockCheck = await app.inject({
    method: 'GET',
    url: '/machine',
    query: {
      mids: 'testclient',
      fields: 'stock'
    }
  })

  t.equal(stockCheck.statusCode, 200)
  console.log('Machine route response body: ', JSON.parse(stockCheck.body))
  console.log('Stock should be 69420: ', JSON.parse(stockCheck.body)[0].stock['d016'])
  t.equal(JSON.parse(stockCheck.body)[0].stock['d016'], 69420)
})
