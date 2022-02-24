'use strict'

async function dynamoHW (dynamoClient, params) {
  const response = await dynamoClient.get(params)
  const itemsJSON = response.Item
  delete itemsJSON.nutrition
  return itemsJSON
}

async function dynamoUI (dynamoClient, params) {
  const response = await dynamoClient.get(params)
  const itemsJSON = response.Item
  delete itemsJSON.density
  delete itemsJSON.row
  delete itemsJSON.column
  delete itemsJSON.weight
  return itemsJSON
}

module.exports = {dynamoHW, dynamoUI}
