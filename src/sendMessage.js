// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require('aws-sdk');

// Add ApiGatewayManagementApi to the AWS namespace
require('aws-sdk/clients/apigatewaymanagementapi');

const db = require('./db');

exports.handler = async (event, context) => {
  let connectionData;

  console.log(111111111111111);

  try {
    connectionData = await db.connection.getAll();
    console.log(connectionData)
  } catch (e) {
    console.log(e)
    return { statusCode: 500, body: e.stack };
  }
  
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
  });
  
  console.log(event);

  const postData = JSON.parse(event.body).data;
  
  const postCalls = connectionData.Items.map(async ({ recordId }) => {
    let connectionId = recordId;
    console.log(connectionId);
    try {
      console.log({ ConnectionId: connectionId, Data: postData });
      await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: postData }).promise();
    } catch (e) {
      if (e.statusCode === 410) {
        console.log(`Found stale connection, deleting ${connectionId}`);
        await db.connection.del(connectionId);
      } else {
        throw e;
      }
    }
  });
  
  try {
    await Promise.all(postCalls);
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }

  return { statusCode: 200, body: 'Data sent.' };
};