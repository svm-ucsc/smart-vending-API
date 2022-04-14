'use strict'

module.exports = {
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

  async getItemInfo (itemId, dynamo) {
    const itemCheckParams = {
      TableName: 'items',
      Key: {
        item_id: itemId
      },
      AttributesToGet: ['volume', 'weight']
    }

    const itemCheckResponse = await dynamo.get(itemCheckParams)

    if (!itemCheckResponse.Item) {
      return null
    }

    const weight = itemCheckResponse.Item.weight
    const volume = itemCheckResponse.Item.volume

    return {itemWeight: weight, itemVolume: volume}
  },

  async createMachineOrder (machineOrder, itemID, itemQuantity, itemInfo, itemLocation) {
    machineOrder[itemID] = {quantity: itemQuantity, weight: itemInfo.itemWeight, volume: itemInfo.itemVolume, row: itemLocation[itemID].row, column: itemLocation[itemID].column}
    return machineOrder
  }

}
