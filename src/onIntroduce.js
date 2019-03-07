const action = require('./action');
const send = require('./send');
const db = require('./db');

exports.handler = action(async (api, connectionId, data) => {
  let machineName = data.name;
  let machineId = data.uuid;

  console.log(machineName, machineId);

  try {
    await db.connections.update(connectionId, machineName, machineId);
    await send(api, connectionId, { action: 'introduce', data: 'Machine introduced' });
  } catch (e) {
    try {
      await send(api, connectionId, { action: 'introduce', data: `Machine introduction error (${e.message})` });
    } catch(e) {
      console.log(e);
      return { statusCode: 500, body: e.stack };
    }
    console.log(e);
    return { statusCode: 500, body: e.stack };
  }

  return { statusCode: 200, body: 'Data sent.' };
});
