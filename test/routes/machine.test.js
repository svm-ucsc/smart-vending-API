'use strict'

const { test } = require('tap')
const { build } = require('../helper')

test('All fields get', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/machine',
    query: {
      mids: 'testclient'
    }
  })
  t.equal(res.statusCode, 200)
  console.log('These are the fields for testclient', JSON.parse(res.body)[0])
})

test('Location fields get', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/machine',
    query: {
      mids: 'testclient',
      fields: 'location'
    }
  })
  t.equal(res.statusCode, 200)
  t.equal(JSON.parse(res.body)[0].location, '9q94qreyfb64')
  console.log('This is the location for testclient: ', JSON.parse(res.body)[0].location)
})
