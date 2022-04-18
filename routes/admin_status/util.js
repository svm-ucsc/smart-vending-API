'use strict'

module.exports = {
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
