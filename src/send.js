const db = require('./db');

async function send(api, connectionId, data) {
  try {
    let dataStr = JSON.stringify(data);
    console.log({ ConnectionId: connectionId, Data: dataStr });
    await api.postToConnection({ ConnectionId: connectionId, Data: dataStr }).promise();
  } catch (e) {
    if (e.statusCode === 410) {
      console.log(`Found stale connection, deleting ${connectionId}`);
      await db.connections.del(connectionId);
    } else {
      throw e;
    }
  }
}

module.exports = send;