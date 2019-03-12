const db = require('./db');

async function send(api, connectionId, data) {
  try {
    let dataStr = JSON.stringify(data);
    console.log({ ConnectionId: connectionId, Data: dataStr });
    await api.postToConnection({ ConnectionId: connectionId, Data: dataStr });
  } catch (e) {
    if (e.statusCode === 410) {
      console.log(`Found stale connection, deleting ${connectionId}`);
      try {
        await db.connections.del(connectionId);
      } catch(e) {
        console.log('Deletion of stale connection errored.')
        console.log(e)
      }
    } else {
      throw e;
    }
  }
}

module.exports = send;