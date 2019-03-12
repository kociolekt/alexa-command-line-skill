const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION });

const uuid = require('uuid/v4');

const DDB = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
const CONNECTIONS_TABLE_NAME = process.env.CONNECTIONS_TABLE_NAME || 'LocalTableName';
const MACHINES_TABLE_NAME = process.env.MACHINES_TABLE_NAME || 'LocalTableName';

const connections = {
    add: (connectionId) => {
        if(typeof connectionId !== 'string') {
            throw new Error(`connectionId (${connectionId}) must be a string`);
        }

        if(connectionId.length === 0) {
            throw new Error(`connectionId (${connectionId}) is too short`);
        }

        let params = {
            TableName: CONNECTIONS_TABLE_NAME,
            Item: {
                ConnectionId: connectionId
            }
        };

        DDB.put(params).promise();
    },

    getAll: () => {
        let params = {
            TableName: CONNECTIONS_TABLE_NAME
        };

        return DDB.scan(params).promise();
    },

    update: (connectionId, machineName, machineId, aliases) => {
        var params = {
            TableName: CONNECTIONS_TABLE_NAME,
            Key: { ConnectionId: connectionId },
            ExpressionAttributeNames: {
                '#machineName': 'MachineName',
                '#machineId': 'MachineId',
            },
            ExpressionAttributeValues: {
              ':machineName': machineName,
              ':machineId': machineId
            },
            UpdateExpression: 'set #machineName = :machineName, #machineId = :machineId'
          };

        return DDB.update(params).promise();
    },

    del: (connectionId) => {
        if(typeof connectionId !== 'string') {
            throw new Error(`connectionId (${connectionId}) must be a string`);
        }

        if(connectionId.length === 0) {
            throw new Error(`connectionId (${connectionId}) is too short`);
        }

        let params = {
            TableName: CONNECTIONS_TABLE_NAME,
            Key: { ConnectionId: connectionId }
        };

        DDB.delete(params).promise();
    }
};

const machines = {
    createMachineToken: (userId, token) => {
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

        let recordId = uuid();

        let params = {
            TableName: MACHINES_TABLE_NAME,
            Item: {
                RecordId: recordId,
                MachineName: 'empty',
                MachineId: 'empty',
                UserId: userId,
                PairToken: token
            }
        };

        DDB.put(params).promise();
    },
    updateMachineNameAndId: (recordId, machineName, machineId, token) => {
        var params = {
            TableName: MACHINES_TABLE_NAME,
            Key: { RecordId: recordId },
            ExpressionAttributeNames: {
                '#machineName': 'MachineName',
                '#machineId': 'MachineId',
                '#pairToken': 'PairToken'
            },
            ExpressionAttributeValues: {
              ':machineName': machineName,
              ':machineId': machineId,
              ':pairToken': token,
              ':emptyValue': 'empty',
            },
            ConditionExpression: '#pairToken = :pairToken and #machineName = :emptyValue and #machineId = :emptyValue',
            UpdateExpression: 'set #machineName = :machineName, #machineId = :machineId'
          };

        return DDB.update(params).promise();
    },
    updateMachineAliases: (recordId, connectionId, aliases) => {
        var params = {
            TableName: MACHINES_TABLE_NAME,
            Key: { RecordId: recordId },
            ExpressionAttributeNames: {
                '#connectionId': 'ConnectionId',
                '#aliases': 'Aliases'
            },
            ExpressionAttributeValues: {
              ':connectionId': connectionId,
              ':aliases': aliases,
            },
            UpdateExpression: 'set #connectionId = :connectionId, #aliases = :aliases'
          };

        return DDB.update(params).promise();
    },
    getAll: () => {
        let params = {
            TableName: MACHINES_TABLE_NAME
        };

        return DDB.scan(params).promise();
    },
    getAllByUser: (userId) => {
        let params = {
            TableName: MACHINES_TABLE_NAME,
            IndexName: 'User',
            KeyConditionExpression: 'UserId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
        };

        return DDB.query(params).promise();
    },
    getAllByUserPaired: (userId) => {
        let params = {
            TableName: MACHINES_TABLE_NAME,
            IndexName: 'User',
            KeyConditionExpression: 'UserId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId,
                ':machineId': 'empty'
            },
            FilterExpression: 'MachineId <> :machineId',
        };

        return DDB.query(params).promise();
    },
    getAllByMachineId: (machineId) => {
        let params = {
            TableName: MACHINES_TABLE_NAME,
            IndexName: 'Machine',
            KeyConditionExpression: 'MachineId = :machineId',
            ExpressionAttributeValues: {
                ':machineId': machineId
            },
        };

        return DDB.query(params).promise();
    },
    getAllByUserNotPaired: (userId) => {
        let params = {
            TableName: MACHINES_TABLE_NAME,
            IndexName: 'User',
            KeyConditionExpression: 'UserId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId,
                ':machineId': 'empty'
            },
            FilterExpression: 'MachineId = :machineId',
        };

        return DDB.query(params).promise();
    },
    getAllByTokenNotPaired: (token) => {
        let params = {
            TableName: MACHINES_TABLE_NAME,
            IndexName: 'Machine',
            KeyConditionExpression: 'MachineId = :machineId',
            ExpressionAttributeValues: {
                ':machineId': 'empty',
                ':pairToken': token
            },
            FilterExpression: 'PairToken = :pairToken'
        };

        return DDB.query(params).promise();
    }
};

module.exports = {
    connections,
    machines
};