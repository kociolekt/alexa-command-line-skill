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
    addWithToken: (userId, token) => {
        if(typeof token !== 'string') {
            throw new Error(`token (${token}) must be a string`);
        }

        if(token.length === 0) {
            throw new Error(`token (${token}) is too short`);
        }

        if(typeof userId !== 'string') {
            throw new Error(`userId (${userId}) must be a string`);
        }

        if(userId.length === 0) {
            throw new Error(`userId (${userId}) is too short`);
        }

        let params = {
            TableName: TABLE_NAME,
            Item: {
                RecordType: 'MACHINES',
                MachineName: 'empty',
                MachineId: 'empty',
                UserId: userId,
                PairToken: token
            }
        };

        DDB.put(params).promise();
    },
    updateMachine: (machineName, machineId, token) => {
        var params = {
            TableName: TABLE_NAME,
            Key: { RecordType: 'MACHINES' },
            ExpressionAttributeNames: {
                '#machineName': 'MachineName',
                '#machineId': 'MachineId',
                '#pairToken': 'PairToken' 
                },
            ExpressionAttributeValues: {
              ':machineName': machineName,
              ':machineId': machineId,
              ':pairToken': token,
            },
            ConditionExpression: '#pairToken = :pairToken',
            UpdateExpression: 'set #machineName = :machineName, #machineId = :machineId'
          };

        return DDB.update(params).promise();
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
    },
    getAllByUserNotPaired: (userId) => {
        let params = {
            ExpressionAttributeValues: {
                ':recordType': 'MACHINES',
                ':userId': userId,
                ':machineId': 'empty'
            },
            KeyConditionExpression: 'RecordType = :recordType',
            FilterExpression: 'UserId = :userId and MachineId = :machineId',
            TableName: TABLE_NAME
        };

        return DDB.query(params).promise();
    },
    getAllByTokenNotPaired: (token) => {
        let params = {
            ExpressionAttributeValues: {
                ':recordType': 'MACHINES',
                ':machineId': 'empty',
                ':pairToken': token
            },
            KeyConditionExpression: 'RecordType = :recordType',
            FilterExpression: 'MachineId = :machineId and PairToken = :pairToken',
            TableName: TABLE_NAME
        };

        return DDB.query(params).promise();
    }
};

module.exports = {
    connections,
    machines
};