const action = require('./action');
const send = require('./send');
const db = require('./db');

exports.handler = action(async (api, connectionId, data) => {
  let machineName = data.name;
  let machineId = data.uuid;
  let aliases = data.aliases;

  console.log(machineName, machineId);

  try {
    await db.connections.update(connectionId, machineName, machineId);

    let machines = (await db.machines.getAllByMachineId(machineId)).Items;

    if (machines.length > 1) {
      throw new Error('More than one machine with the same id!');
    }

    if (machines.length === 1) {
      let machine = machines[0];
      let recordId = machine.RecordId;
      await db.machines.updateMachineAliases(recordId, connectionId, aliases);
    }

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
