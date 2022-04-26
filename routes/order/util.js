'use strict'

module.exports = {
  async createPaypalOrder (cost) {
    const accessToken = await generateAccessToken()
    const url = 'https://api-m.sandbox.paypal.com/v2/checkout/orders'
    const response = await fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: `${cost/100}`,
            },
          },
        ],
      }),
    });
    const data = await response.json()
    return data
  },

  async capturePayment(orderId) {
    const accessToken = await generateAccessToken();
    const url = `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`;
    const response = await fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await response.json();
    return data;
  },

  async generateAccessToken() {
    const auth = 'AUa5_Jl61gBVAKStkIh3OroJlrRZUWqcfjmvjgKuUsCi7UsmZRZcPFT2uJKydC2n9Umqd_Xxyz3PB3WX:PAYPAL_APP_SECRET'
    const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: "post",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    })
    const data = await response.json()
    return data.access_token
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

  async createNewOrder (orderId, machineId, orderedItems, dynamo) {
    const orderIdCreateParams = {
      TableName: 'orders',
      Item: {
        order_id: orderId,
        machine_id: machineId,
        ordered_item: orderedItems,
        time: Date.now(),
        status: 'PENDING'
      }
    }
    await dynamo.put(orderIdCreateParams)
  },

  async orderTimeout (dynamo, orderId) {
    const orderCheckParams = {
      TableName: 'orders',
      Key: {
        order_id: orderId
      },
      AttributesToGet: ['machine_id', 'status']
    }
    const orderCheckResponse = await dynamo.get(orderCheckParams)
    console.log(orderCheckResponse.Item)
    if (orderCheckResponse.Item && orderCheckResponse.Item.status === 'PENDING') {
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

    const itemInfo = { 'itemWeight': weight, 'itemVolume': volume, 'itemCost': cost }
    return itemInfo
  },

  createOrderList (orderList, itemID, itemQuantity, itemInfo, itemLocation) {
    if (!itemInfo || !itemInfo['itemWeight'] || !itemInfo['itemVolume']) {
      return null
    }
    orderList[itemID] = {quantity: itemQuantity, weight: itemInfo['itemWeight'], volume: itemInfo['itemVolume'], row: itemLocation.row, column: itemLocation.column}
    return orderList
  }

}
