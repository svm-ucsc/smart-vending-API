'use strict'

module.exports = {
  async setItemStockFromDB (machineId, itemID, stock, dynamo) {
    const setItemStockParams = {
      TableName: 'inventory',
      Key: {
        machine_id: machineId
      },
      UpdateExpression: 'set stock.#iid = :s',
      ExpressionAttributeNames: {
        '#iid': itemID
      },
      ExpressionAttributeValues: {
        ':s': stock
      }
    }
    await dynamo.update(setItemStockParams)
  },

  async setMachineStatusFromDB (machineId, testStatus, dynamo) {
    const setMachineStatusParams = {
      TableName: 'inventory',
      Key: {
        machine_id: machineId
      },
      UpdateExpression: 'set #st = :s',
      ExpressionAttributeNames: {
        '#st': 'status'
      },
      ExpressionAttributeValues: {
        ':s': testStatus
      }
    }
    await dynamo.update(setMachineStatusParams)
  }
}
