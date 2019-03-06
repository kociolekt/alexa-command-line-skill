const action = require('./action');
const send = require('./send');
const db = require('./db');

exports.handler = action(async (api, connectionId, data) => {
  let connections;

  try {
    connections = await db.connections.getAll();
    console.log(connections)
  } catch (e) {
    console.log(e)
    return { statusCode: 500, body: e.stack };
  }

  console.log(typeof data);

  let postCalls = connections.Items.map(async ({ ConnectionId }) => {
      await send(api, ConnectionId, { action: 'echo', data: data });
  });

  try {
    await Promise.all(postCalls);
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }

  return { statusCode: 200, body: 'Data sent.' };
});
