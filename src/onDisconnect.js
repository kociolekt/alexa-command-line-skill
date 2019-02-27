// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const db = require('./db');

exports.handler = async (event, context, callback) => {
  try {
    let result = await db.connection.del(event.requestContext.connectionId);

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