'use strict'
const fetch = require('node-fetch')

async function generateAccessToken () {
  const base = 'https://api-m.sandbox.paypal.com'
  const auth = Buffer.from('AUa5_Jl61gBVAKStkIh3OroJlrRZUWqcfjmvjgKuUsCi7UsmZRZcPFT2uJKydC2n9Umqd_Xxyz3PB3WX:EAtnWOPArI7e9Xf5g69obwr-RqR4iRQx0xRtrZsp7vg3wNENsg1CkPeO3g2DLq6uBu-2ikydTJVKR7Eu').toString('base64')
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: 'post',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`
    }
  })
  const data = await response.json()
  return data.access_token
}

module.exports = {
  async createPaypalOrder (cost) {
    const base = 'https://api-m.sandbox.paypal.com'
    const accessToken = await generateAccessToken()
    const url = `${base}/v2/checkout/orders`
    const costUSD = cost / 100
    const response = await fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: `${costUSD}`
            }
          }
        ]
      })
    })

    const data = await response.json()
    return data
  },

  async capturePayment (orderId) {
    const accessToken = await generateAccessToken()
    const url = `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`
    const response = await fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      }
    })
    const data = await response.json()
    return data
  },

  async removeStockFromDB (machineId, stock, dynamo) {
    const updateStockParams = {
      TableName: 'inventory',
      Key: {
        machine_id: machineId
      },
      UpdateExpression: 'set stock = :s',
      ExpressionAttributeValues: {
        ':s': stock
      }
    }
    await dynamo.update(updateStockParams)
  },

  async createNewOrder (orderId, paypalOrderId, machineId, orderedItems, dynamo) {
    const orderIdCreateParams = {
      TableName: 'orders',
      Item: {
        order_id: orderId,
        paypal_order_id: paypalOrderId,
        machine_id: machineId,
        ordered_item: orderedItems,
        time: Date.now(),
        status: 'PAYMENT_PENDING'
      }
    }
    await dynamo.put(orderIdCreateParams)
  },

  async vendOrderTimeout (dynamo, orderId) {
    const orderCheckParams = {
      TableName: 'orders',
      Key: {
        order_id: orderId
      },
      AttributesToGet: ['machine_id', 'status']
    }
    const orderCheckResponse = await dynamo.get(orderCheckParams)

    if (orderCheckResponse.Item && orderCheckResponse.Item.status === 'VEND_PENDING') {
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
          ':to': 'TIMEDOUT'
        }
      }
      await dynamo.update(updateOrderParams)

      // HACK - never mark the test client as offline
      if (orderCheckResponse.Item.machine_id === 'testclient') return

      const updateMachineParams = {
        TableName: 'inventory',
        Key: {
          machine_id: orderCheckResponse.Item.machine_id
        },
        UpdateExpression: 'set #st = :er',
        ExpressionAttributeNames: {
          '#st': 'status'
        },
        ExpressionAttributeValues: {
          ':er': 'ERROR'
        }
      }
      await dynamo.update(updateMachineParams)
    }
  },

  async paymentTimout (dynamo, orderId) {
    const orderCheckParams = {
      TableName: 'orders',
      Key: {
        order_id: orderId
      },
      AttributesToGet: ['machine_id', 'status', 'ordered_item']
    }
    const orderCheckResponse = await dynamo.get(orderCheckParams)

    if (orderCheckResponse.Item && orderCheckResponse.Item.status === 'PAYMENT_PENDING') {
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
          ':to': 'PAYMENT_TIMEDOUT'
        }
      }
      await dynamo.update(updateOrderParams)
    }

    // add items back to machine stock

    const inventoryCheckParams = {
      TableName: 'inventory',
      Key: {
        machine_id: orderCheckResponse.Item.machine_id
      },
      AttributesToGet: ['stock']
    }

    const inventoryCheckResponse = await dynamo.get(inventoryCheckParams)

    const stock = inventoryCheckResponse.Item.stock
    const orderedItems = orderCheckParams.Item.ordered_item

    for (const item in orderedItems) {
      if (item in stock) {
        stock[item] = stock[item] + orderedItems[item]
      } else {
        stock[item] = orderedItems[item]
      }
    }

    const updateStockParams = {
      TableName: 'inventory',
      Key: {
        machine_id: orderCheckResponse.Item.machine_id
      },
      UpdateExpression: 'set stock = :s',
      ExpressionAttributeValues: {
        ':s': stock
      }
    }
    await dynamo.update(updateStockParams)
  },

  async getItemInfo (itemId, dynamo) {
    const itemCheckParams = {
      TableName: 'items',
      Key: {
        item_id: itemId
      },
      AttributesToGet: ['volume', 'weight', 'cost']
    }

    const itemCheckResponse = await dynamo.get(itemCheckParams)

    if (!itemCheckResponse.Item) {
      return null
    }

    const weight = itemCheckResponse.Item.weight
    const volume = itemCheckResponse.Item.volume
    const cost = itemCheckResponse.Item.cost

    const itemInfo = { itemWeight: weight, itemVolume: volume, itemCost: cost }
    return itemInfo
  },

  createOrderList (orderList, itemID, itemQuantity, itemInfo, itemLocation) {
    if (!itemInfo || !itemInfo.itemWeight || !itemInfo.itemVolume) {
      return null
    }
    orderList[itemID] = { quantity: itemQuantity, weight: itemInfo.itemWeight, volume: itemInfo.itemVolume, row: itemLocation.row, column: itemLocation.column }
    return orderList
  }

}
