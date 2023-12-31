// dynamoDbServicemcq.js

import AWS from "aws-sdk";
import { awsConfig } from "./awsConfig"; // Update the path accordingly

AWS.config.update(awsConfig);

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = "dyn_data"; // Replace with your DynamoDB table name

export const getItemByPartitionKey = async (partitionKey) => {
  // Validate partitionKey before proceeding
  if (typeof partitionKey !== "number") {
    throw new Error("Partition key must be a number");
  }

  const params = {
    TableName: tableName,
    Key: {
      id: partitionKey,
    },
  };

  try {
    console.log("Fetching item from DynamoDB. Params:", params);

    const result = await dynamoDB.get(params).promise();

    console.log("DynamoDB Get Result:", result); // Log the result for debugging

    if (!result.Item) {
      throw new Error("Item not found for the provided partition key");
    }

    // Map DynamoDB attributes to your desired structure
    const {
      id,
      correctAnswer,
      option1,
      option2,
      option3,
      option4,
      question,
      objectURL,
    } = result.Item;

    return {
      id: id, // Assuming id is a number
      correctAnswer: correctAnswer,
      option1: option1,
      option2: option2,
      option3: option3,
      option4: option4,
      question: question,
      objectURL: objectURL ? objectURL : null,
    };
  } catch (error) {
    console.error("Error fetching item from DynamoDB:", error.message);
    throw error;
  }
};
