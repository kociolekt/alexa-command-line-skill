// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const db = require('./db');

exports.handler = async (event, context, callback) => {
  console.log('onConnect');
  console.log(event.requestContext.connectionId);
  try {
    let result = await db.connection.add(event.requestContext.connectionId);
    console.log(result);
    callback(null, {
      statusCode: 200,
      body: result
    });
  } catch(e) {
    console.log(e);
    callback(null, {
      statusCode: 500,
      body: e
    });
  }
};