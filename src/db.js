const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION });
const DDB = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
const TABLE_NAME = process.env.TABLE_NAME || 'LocalTableName';

const connections = {
    add: (connectionId) => {
        if(typeof connectionId !== 'string') {
            throw new Error(`connectionId (${connectionId}) must be a string`);
        }
        
        if(connectionId.length === 0) {
            throw new Error(`connectionId (${connectionId}) is too short`);
        }

        let params = {
            TableName: TABLE_NAME,
            Item: {
                RecordType: 'CONNECTION',
                ConnectionId: connectionId
            }
        };
        
        DDB.put(params).promise();
    },

    getAll: () => {
        let params = {
            ExpressionAttributeValues: {
                ':recordType': 'CONNECTION',
            },
            KeyConditionExpression: 'RecordType = :recordType',
            TableName: TABLE_NAME
        };

        return DDB.query(params).promise();
    },

    del: (connectionId) => {
        if(typeof connectionId !== 'string') {
            throw new Error(`connectionId (${connectionId}) must be a string`);
        }
        
        if(connectionId.length === 0) {
            throw new Error(`connectionId (${connectionId}) is too short`);
        }

        let params = {
            TableName: TABLE_NAME,
            Item: {
                RecordType: 'CONNECTION',
                ConnectionId: connectionId
            }
        };

        DDB.delete(params).promise();
    }
};

const machines = {
    addToken: (token) => {
        if(typeof token !== 'string') {
            throw new Error(`token (${token}) must be a string`);
        }
        
        if(token.length === 0) {
            throw new Error(`token (${token}) is too short`);
        }

        let params = {
            TableName: TABLE_NAME,
            Item: {
                RecordType: 'MACHINES',
                MachineId: null,
                UserId: null,
                Token: token
            }
        };
        
        DDB.put(params).promise();
    },
    getAll: () => {
        let params = {
            ExpressionAttributeValues: {
                ':recordType': 'MACHINES',
            },
            KeyConditionExpression: 'RecordType = :recordType',
            TableName: TABLE_NAME
        };

        return DDB.query(params).promise();
    },
    getAllByUser: (userId) => {
        let params = {
            ExpressionAttributeValues: {
                ':recordType': 'MACHINES',
                ':userId': userId
            },
            KeyConditionExpression: 'RecordType = :recordType',
            FilterExpression: 'UserId = :userId',
            TableName: TABLE_NAME
        };

        return DDB.query(params).promise();
    }
};

module.exports = {
    connections,
    machines
};