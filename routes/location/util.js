'use strict'

module.exports = {
  async getMachines (itemId, dynamo) {
    const stockCheckParams = {
      TableName: 'inventory',
      AttributesToGet: ['stock', 'location']
    }
    const stockCheckResponse = await dynamo.scan(stockCheckParams)
    return stockCheckResponse
  },
  getNearest (nearMachines, machineLocation, queryLocation, range) {
    const queryLat = queryLocation.latitude
    const queryLong = queryLocation.longitude
    const machineLat = machineLocation.latitude
    const machineLong = machineLocation.longitude

    // const distanceRange = 16093 // 10 mi in m

    // CREDIT GOES TO THIS SITE:
    // https://www.movable-type.co.uk/scripts/latlong.html

    const R = 6371e3 // metres
    const φ1 = queryLat * Math.PI / 180 // φ, λ in radians
    const φ2 = machineLat * Math.PI / 180
    const Δφ = (machineLat - queryLat) * Math.PI / 180
    const Δλ = (machineLong - queryLong) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    const d = R * c // in metres

    if (d <= range) {
      nearMachines.push(machineLocation)
    } else {
      return nearMachines
    }
  }
}
