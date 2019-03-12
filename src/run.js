const db = require('./db');

async function run(api, connectionId, command) {
  try {
    let dataStr = JSON.stringify({
      action: 'command',
      data: command
    });
    console.log({ ConnectionId: connectionId, Data: dataStr });
    await api.postToConnection({ ConnectionId: connectionId, Data: dataStr }).promise();
  } catch (e) {
    if (e.statusCode === 410) {
      console.log(`Found stale connection, deleting ${connectionId}`);
      try {
        await db.connections.del(connectionId);
      } catch(e) {
        let message = 'Deletion of stale connection errored.';
        console.log(message);
        console.log(e);
        throw new Error(message);
      }
      throw new Error('Connection was stale. Please check if machine is working.');
    } else {
      console.log(e);
      throw new Error('Unknown connection status code: ' + e.statusCode);
    }
  }
}

module.exports = run;