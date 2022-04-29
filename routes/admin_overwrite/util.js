'use strict'

module.exports = {
  async setItemStockFromDB (machineId, stock, dynamo) {
    const setItemStockParams = {
      TableName: 'inventory',
      Key: {
        machine_id: machineId
      },
      UpdateExpression: 'set stock = :s',
      ExpressionAttributeValues: {
        ':s': stock
      }
    }
    await dynamo.update(setItemStockParams)
  }
}
