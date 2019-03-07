const action = require('./action');
const send = require('./send');
const db = require('./db');

exports.handler = action(async (api, connectionId, data) => {
  let token = (data.token + '');

  try {
    if(token.length != 5) {
      throw new Error(`Bad token (${token})`);
    }

    let machines = (await db.machines.getAllByTokenNotPaired(token)).Items;

    if(machines.length > 1) {
      throw new Error(`Too many machines for token (${token})`);
    }

    if(machines.length === 0) {
      throw new Error(`No redords found for provided token (${token})`);
    }

    let recordId = machines[0].RecordId;

    console.log(recordId);

    await db.machines.updateMachineNameAndId(recordId, data.name, data.uuid, token);
    await send(api, connectionId, { action: 'pair', data: 'Machine paired successfully!' });
  } catch (e) {
    try {
      await send(api, connectionId, { action: 'pair', data: `Mchaine pairing ended with error (${e.message})` });
    } catch(e) {
      console.log(e);
      return { statusCode: 500, body: e.stack };
    }
    console.log(e);
    return { statusCode: 500, body: e.stack };
  }

  return { statusCode: 200, body: 'Data sent.' };
});
