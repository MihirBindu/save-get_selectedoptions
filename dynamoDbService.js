// DynamoDBService.js

import AWS from "aws-sdk";
import { awsConfig } from "./awsConfig";

// Configure AWS SDK with provided AWS credentials
AWS.config.update(awsConfig);

// Create DynamoDB DocumentClient and specify the table name
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = "merge_forms";

/**
 * Retrieve user data from DynamoDB based on the provided username.
 * @param {string} username - The username to look up in DynamoDB.
 * @returns {Promise<Object>} A Promise that resolves to the user data.
 * @throws {Error} If the provided username is not a string or if the item is not found.
 */
export const getItemByUsername = async (username) => {
  try {
    if (typeof username !== "string") {
      throw new Error("Username must be a string");
    }

    const params = {
      TableName: tableName,
      Key: {
        username: username,
      },
    };

    const result = await dynamoDB.get(params).promise();

    if (!result.Item) {
      throw new Error("Item not found for the provided username");
    }

    console.log("getItemByUsername Result:", result);

    return result.Item;
  } catch (error) {
    console.error("Error fetching item from DynamoDB:", error.message);
    throw error;
  }
};

/**
 * Update the DynamoDB item to save a dummy value for the provided username.
 * @param {string} username - The username to update in DynamoDB.
 * @throws {Error} If the provided username is not a string or if the update fails.
 */
export const saveUsernameToDynamoDB = async (username) => {
  if (typeof username !== "string") {
    throw new Error("Username must be a string");
  }

  const params = {
    TableName: tableName,
    Key: {
      username: username,
    },
    UpdateExpression: "SET #dummyAttr = :dummyValue",
    ExpressionAttributeValues: {
      ":dummyValue": "dummyUsername",
    },
    ExpressionAttributeNames: {
      "#dummyAttr": "dummyAttribute",
    },
    ReturnValues: "UPDATED_NEW",
  };

  try {
    await dynamoDB.update(params).promise();
    console.log("Username updated successfully.");
  } catch (error) {
    console.error("Error updating username in DynamoDB:", error.message);
    throw error;
  }
};

/**
 * Update the DynamoDB item to save points and level information for the provided username.
 * @param {string} username - The username to update in DynamoDB.
 * @param {number} points - The points to save.
 * @param {number} level - The level to save.
 * @throws {Error} If the provided username is not a string or if the update fails.
 */
export const savePointsToDynamoDB = async (username, points, level) => {
  const levelAttributeName = `points_level${level}`;

  const updateExpression = `SET #pointsAttr = :points, questionId = :questionId`;
  const expressionAttributeValues = {
    ":points": points,
    ":questionId": 0, // Set the default value, modify as needed
  };
  const expressionAttributeNames = {
    "#pointsAttr": levelAttributeName,
  };

  const params = {
    TableName: tableName,
    Key: {
      username: username,
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    ReturnValues: "UPDATED_NEW",
  };

  try {
    const result = await dynamoDB.update(params).promise();
    console.log(
      `Points for level ${level} updated successfully. Result:`,
      result
    );
  } catch (error) {
    console.error(
      `Error updating points for level ${level} in DynamoDB:`,
      error.message
    );
    throw error;
  }
};

// /**
//  * Update the DynamoDB item to save the answer status for a specific question.
//  * @param {string} username - The username to update in DynamoDB.
//  * @param {string} questionId - The question ID for which to save the answer status.
//  * @param {boolean} isCorrect - The answer status (true if correct, false otherwise).
//  * @throws {Error} If the provided username or questionId is not a string, or if the update fails.
//  */
// export const saveAnswerStatusToDynamoDB = async (
//   username,
//   questionId,
//   isCorrect
// ) => {
//   if (typeof username !== "string" || typeof questionId !== "string") {
//     throw new Error("Username and questionId must be strings");
//   }

//   const updateExpression = `SET #qid = :isCorrect`;
//   const expressionAttributeNames = {
//     "#qid": questionId,
//   };
//   const expressionAttributeValues = {
//     ":isCorrect": isCorrect,
//   };

//   const params = {
//     TableName: tableName,
//     Key: {
//       username: username,
//     },
//     UpdateExpression: updateExpression,
//     ExpressionAttributeValues: expressionAttributeValues,
//     ExpressionAttributeNames: expressionAttributeNames,
//     ReturnValues: "UPDATED_NEW",
//   };

//   console.log("Save Answer Status Params:", params);

//   try {
//     await dynamoDB.update(params).promise();
//     console.log("Answer status updated successfully.");
//   } catch (error) {
//     console.error("Error updating answer status in DynamoDB:", error.message);
//     throw error;
//   }
// };

/**
 * Retrieve the user's progress for a specific level from DynamoDB.
 * @param {string} username - The username to fetch progress for.
 * @param {number} level - The level for which to fetch progress.
 * @returns {Promise<number>} A Promise that resolves to the last attempted question for the specified level.
 * @throws {Error} If there is an error fetching the user progress.
 */
export const getUserProgress = async (username, level) => {
  try {
    const userData = await getItemByUsername(username);
    const lastAttemptedQuestion =
      userData[`level${level}_lastAttemptedQuestion`] || 1;

    // Convert lastAttemptedQuestion to a number
    return parseInt(lastAttemptedQuestion, 10);
  } catch (error) {
    console.error(
      `Error fetching user progress for level ${level} from DynamoDB:`,
      error.message
    );
    throw error;
  }
};

/**
 * Update the DynamoDB item to save the last attempted question for a specific level.
 * @param {string} username - The username to update in DynamoDB.
 * @param {number} level - The level for which to save the last attempted question.
 * @param {number} questionId - The question ID to save as the last attempted question.
 * @throws {Error} If the provided username, level, or questionId is not in the expected format, or if the update fails.
 */
export const saveLastAttemptedQuestion = async (
  username,
  level,
  questionId
) => {
  if (
    typeof username !== "string" ||
    typeof level !== "number" ||
    typeof questionId !== "number"
  ) {
    throw new Error(
      "Username must be a string, level must be a number, and questionId must be a number"
    );
  }

  // Convert questionId to a number
  questionId = parseInt(questionId, 10);

  const params = {
    TableName: tableName,
    Key: {
      username: username,
    },
    UpdateExpression: `SET #lastAttemptedQuestionAttr = :questionId`,
    ExpressionAttributeValues: {
      ":questionId": questionId,
    },
    ExpressionAttributeNames: {
      "#lastAttemptedQuestionAttr": `level${level}_lastAttemptedQuestion`,
    },
    ReturnValues: "UPDATED_NEW",
  };

  try {
    await dynamoDB.update(params).promise();
    console.log(
      `Last attempted question for level ${level} updated successfully.`
    );
  } catch (error) {
    console.error(
      `Error updating last attempted question for level ${level} in DynamoDB:`,
      error.message
    );
    throw error;
  }
};

/**
 * Retrieve selected options data from DynamoDB based on the provided username and level.
 * @param {string} username - The username to look up in DynamoDB.
 * @param {number} level - The level for which to fetch selected options.
 * @returns {Promise<Array>} A Promise that resolves to the selected options array.
 * @throws {Error} If the provided username is not a string or if the item is not found.
 */
export const getSelectedOptions = async (username, level) => {
  try {
    const userData = await getItemByUsername(username);

    // Assuming you have a structure in DynamoDB to store selected options for different levels
    const selectedOptionsKey = `selectedOptions_Level${level}`;
    const selectedOptions = userData[selectedOptionsKey] || [];

    return selectedOptions;
  } catch (error) {
    console.error(
      "Error fetching selected options from DynamoDB:",
      error.message
    );
    throw error;
  }
};

/**
 * Update the DynamoDB item to save selected options for a specific level.
 * @param {string} username - The username to update in DynamoDB.
 * @param {number} level - The level for which to save selected options.
 * @param {Array} selectedOptions - The selected options array to save.
 * @throws {Error} If the provided username or level is not in the expected format, or if the update fails.
 */
export const saveSelectedOptionsToDynamoDB = async (
  username,
  level,
  selectedOptions
) => {
  if (typeof username !== "string" || typeof level !== "number") {
    throw new Error("Username must be a string, and level must be a number");
  }

  const selectedOptionsKey = `selectedOptions_Level${level}`;

  const params = {
    TableName: tableName,
    Key: {
      username: username,
    },
    UpdateExpression: `SET #selectedOptionsAttr = :selectedOptions`,
    ExpressionAttributeValues: {
      ":selectedOptions": selectedOptions,
    },
    ExpressionAttributeNames: {
      "#selectedOptionsAttr": selectedOptionsKey,
    },
    ReturnValues: "UPDATED_NEW",
  };

  try {
    await dynamoDB.update(params).promise();
    console.log(`Selected options for level ${level} updated successfully.`);
  } catch (error) {
    console.error(
      `Error updating selected options for level ${level} in DynamoDB:`,
      error.message
    );
    throw error;
  }
};
