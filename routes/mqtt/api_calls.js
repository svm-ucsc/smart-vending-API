'use strict'

const { DynamoDBClient, QueryCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const { builtinModules } = require("module");
const { json } = require("stream/consumers");

class api_caller {
  constructor(id) {
    this.region = "us-east-1"
    this.params =  {
      "TableName" : "items",
      "KeyConditionExpression": "item_id = :id",
      "ExpressionAttributeValues": {
        ":id": {"S": id}
      },
    };
  }

  async dynamo_hw() {
    const hw_client = new DynamoDBClient({region: this.region});
    const hw_command = new QueryCommand(this.params);
    const hw_response = await hw_client.send(hw_command);
    
    // const items_json = hw_response.Items;
    const items_json_unmarshall = unmarshall(hw_response.Items[0]);

    // Will need to parse this json for only the relevant information
    var hw_dict = {};
    hw_dict["item_name"] = items_json_unmarshall.item_id;
    hw_dict["quantity"] = items_json_unmarshall.quantity;
    hw_dict["weight"] = items_json_unmarshall.weight;
    hw_dict["density"] = items_json_unmarshall.density;
    hw_dict["row"] = items_json_unmarshall.row;
    hw_dict["column"] = items_json_unmarshall.column;
    return hw_dict; 
  }

  async dynamo_ui() {
    const ui_client = new DynamoDBClient({region: this.region});
    const ui_command = new QueryCommand(this.params);
    const ui_response = await ui_client.send(ui_command);
    
    const items_json_unmarshall = unmarshall(ui_response.Items[0]);

    // Will need to parse this json for only the relevant information
    var ui_dict = {};
    ui_dict["item_name"] = items_json_unmarshall.item_id;
    ui_dict["quantity"] = items_json_unmarshall.quantity;
    ui_dict["nutrition"] = items_json_unmarshall.nutrition;
    return ui_dict; 
  }

}

module.exports = api_caller;