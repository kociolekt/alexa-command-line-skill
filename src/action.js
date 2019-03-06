// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require('aws-sdk');

// Add ApiGatewayManagementApi to the AWS namespace
require('aws-sdk/clients/apigatewaymanagementapi');

function action(logic) {
    return async (event, context) => {
        console.log(JSON.stringify(event));

        const apigwManagementApi = new AWS.ApiGatewayManagementApi({
            apiVersion: '2018-11-29',
            endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
        });

        const data = JSON.parse(event.body).data;

        return await logic(apigwManagementApi, event.requestContext.connectionId, data);
    }
}

module.exports = action;
