const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION });
const DDB = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

const connection = {
    add: (connectionId) => {
        return new Promise((resolve, reject) => {

            if(typeof connectionId !== 'string') {
                reject(`connectionId (${connectionId}) must be a string`);
                return;
            }
            
            if(connectionId.length === 0) {
                reject(`connectionId (${connectionId}) is too short`);
                return;
            }

            let params = {
                TableName: process.env.TABLE_NAME,
                Item: {
                  recordType: { S: 'CONNECTION' },
                  recordId: { S: connectionId }
                }
              };
            
              DDB.putItem(params, (err) => {
                if(err) {
                    reject(`Failed to save conection ${connectionId}: ${JSON.stringify(err)}`);
                    return;
                }
                resolve();
              });
        });
    },

    getAll: () => {
        let params = {
            TableName: process.env.TABLE_NAME,
            ExpressionAttributeValues: {
              ':t': { S: 'CONNECTION' }
            },
            FilterExpression: 'recordType = :t',
            ProjectionExpression: 'recordId'
        }
        return DDB.scan(params).promise();
    },

    del: (connectionId) => {
        return new Promise((resolve, reject) => {

            if(typeof connectionId !== 'string') {
                reject(`connectionId (${connectionId}) must be a string`);
                return;
            }
            
            if(connectionId.length === 0) {
                reject(`connectionId (${connectionId}) is too short`);
                return;
            }

            let params = {
                TableName: process.env.TABLE_NAME,
                Item: {
                  recordType: { S: 'CONNECTION' },
                  recordId: { S: connectionId }
                }
              };

              DDB.deleteItem(params, (err) => {
                if(err) {
                    reject(`Failed to delete connection ${connectionId}: ${JSON.stringify(err)}`);
                    return;
                }
                resolve();
              });
        });
    }
};

module.exports = {
    connection
};