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
  }
}
