/* eslint-disable  func-names */
/* eslint-disable  no-console */
require('dotenv').config();

const Alexa = require('ask-sdk');
const AWS = require('aws-sdk');
require('aws-sdk/clients/apigatewaymanagementapi');
const db = require('./db');
const run = require('./run');

const WELCOME_MESSAGE = 'Welcome in alexa command line.';
const NO_MACHINES_MESSAGE = 'You have no machines paired. Would you like to pair one now?';
const HELP_MESSAGE = 'In command line <break strength="weak"/> I can run defined commands on connected machines. I can give you the list of avaiable commands, <break strength="weak"/> connected machines, <break strength="weak"/> or provide you with pairing token. <break strength="strong"/> What can I do for you?';
const HELP_REPROMPT = 'Would you like me to repeat?';
const STOP_MESSAGE = 'Exited command line.';
const FALLBACK_MESSAGE = 'You can continue using command line. For example: <break strength="medium"/> ask me to list commands. What can I help you with?';
const FALLBACK_REPROMPT = 'What can I help you with?';
const YES_MESSAGE = 'Nothing to confirm.';
const PAIR_MESSAGE = 'Pair your machine with following token: ';
const PAIR_REPROMPT1 = 'Use ';
const PAIR_REPROMPT2 = ' as pairing token.';
const COMMANDS_MESSAGE1 = 'You have ';
const COMMANDS_MESSAGE2 = ' commands on ';
const COMMANDS_MESSAGE3 = ' connected machines avaiable: ';
const NO_COMMANDS_MESSAGE = 'You have no commands avaiable. Try adding an alias on your machine.';
const MACHINES_MESSAGE1 = 'You have ';
const MACHINES_MESSAGE2 = ' paired machines: ';
const NO_COMMAND_FOUND1 = 'Command ';
const NO_COMMAND_FOUND2 = ' have been not found on any of your machines. Would you like to hear list of your commands?';
const TOO_MANY_COMMAND_MACHINES1 = 'There are multiple machines with ';
const TOO_MANY_COMMAND_MACHINES2 = ' command:<break strength="medium"/>';
const NO_MACHINE_NAME = 'There is no machine with name ';
const RUNNING_COMMAND1 = 'Started ';
const RUNNING_COMMAND2 = ' on ';
const RUNNING_COMMAND_ERROR = 'There was an error while sending the command. ';

const handlers = {};

const apigwManagementApi = new AWS.ApiGatewayManagementApi({
  apiVersion: '2018-11-29',
  endpoint: 'wz0edt5qm7.execute-api.us-east-1.amazonaws.com' + '/' + 'dev' // TODO: jak na razie sztywniak bo muszę dowiedzieć sie jak to w skillu złożyć
});

/*
  HELPERS
*/

function getSlotValues(filledSlots) {
  const slotValues = {};

  console.log(`The filled slots: ${JSON.stringify(filledSlots)}`);
  Object.keys(filledSlots).forEach((item) => {
    const name = filledSlots[item].name;

    if (filledSlots[item] &&
      filledSlots[item].resolutions &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
      switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
        case 'ER_SUCCESS_MATCH':
          slotValues[name] = {
            synonym: filledSlots[item].value,
            resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
            isValidated: true,
          };
          break;
        case 'ER_SUCCESS_NO_MATCH':
          slotValues[name] = {
            synonym: filledSlots[item].value,
            resolved: filledSlots[item].value,
            isValidated: false,
          };
          break;
        default:
          break;
      }
    } else {
      slotValues[name] = {
        synonym: filledSlots[item].value,
        resolved: filledSlots[item].value,
        isValidated: false,
      };
    }
  }, this);

  return slotValues;
}

function confirmIntent(handlerInput, intentName) {
  // Save confirm handler in case somebody said 'yes'
  let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  sessionAttributes.confirmHandler = intentName;
  handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
}

function noCommands(handlerInput) {
  return handlerInput.responseBuilder
    .speak(NO_COMMANDS_MESSAGE)
    .reprompt()
    .getResponse();
}

function noMachines(handlerInput, prefix) {
  confirmIntent(handlerInput, 'AddMachineHandler');

  return handlerInput.responseBuilder
    .speak(prefix + ' ' + NO_MACHINES_MESSAGE)
    .reprompt()
    .getResponse();
}

/*
  MAIN REQUESTS
*/
handlers.LaunchHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {
    let machines = (await db.machines.getAllByUserPaired(handlerInput.requestEnvelope.session.user.userId)).Items;

    if(machines.length > 0) {
      return handlerInput.responseBuilder
      .speak(WELCOME_MESSAGE)
      .reprompt('')
      .getResponse();
    } else {
      return noMachines(handlerInput, WELCOME_MESSAGE);
    }
  },
};

handlers.SessionEndedHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  async handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(FALLBACK_MESSAGE)
      .reprompt(FALLBACK_REPROMPT)
      .getResponse();
  },
};

/*
  COMMANDS HANDLERS
*/

async function getMachinesForCommand() {

}

handlers.RunCommandInProgressHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'RunCommand';
  },
  async handle(handlerInput) {
    let userId = handlerInput.requestEnvelope.session.user.userId;
    let filledSlots = handlerInput.requestEnvelope.request.intent.slots;
    let slotValues = getSlotValues(filledSlots);
    let command = slotValues.command.resolved;
    let machine = slotValues.machine.resolved;

    // If command is not provided at start of the intent
    // Get command from dialog
    if(!command) {
      const currentIntent = handlerInput.requestEnvelope.request.intent;
      return handlerInput.responseBuilder
        .addDelegateDirective(currentIntent)
        .getResponse();
    }

    let pairedMachines = (await db.machines.getAllByUserPaired(userId)).Items;
    let machinesNumber = pairedMachines.length;

    console.log(`Invoked command: ${command}`);

    if(machinesNumber > 0) {
      let aliasesNumber = 0;
      let aliasesMap = {};

      for(let i = 0, mLen = machinesNumber; i < mLen; i++) {
        let currentMachine = pairedMachines[i];
        let currentMachineAliases = currentMachine.Aliases;
        if (currentMachineAliases) {
          let currentMachineAliasesNumber = currentMachineAliases.length;
          aliasesNumber += currentMachineAliasesNumber;

          for(let j = 0, aLen = currentMachineAliasesNumber; j < aLen; j++) {
            let currentAlias = currentMachineAliases[j];

            if(!aliasesMap[currentAlias]) {
              aliasesMap[currentAlias] = [];
            }

            aliasesMap[currentAlias].push(currentMachine);
          }
        }
      }

      // Break if no such command
      if(aliasesNumber === 0) {
        return noCommands(handlerInput);
      }

      let commandMachines = aliasesMap[command];

      // Break if no machines with this command
      if(!commandMachines || !commandMachines.length) {
        confirmIntent(handlerInput, 'CommandsListHandler');

        return handlerInput.responseBuilder
          .speak(NO_COMMAND_FOUND1 + command + NO_COMMAND_FOUND2)
          .reprompt()
          .getResponse();
      }

      let executionMachine = null;

      // If too many machines... 
      if(commandMachines.length > 1) {
        //return handlerInput.responseBuilder
        //  .speak(TOO_MANY_COMMAND_MACHINES1 + command + TOO_MANY_COMMAND_MACHINES2)
        //  .reprompt()
        //  .getResponse();

        // Ask dialog for machine name
        if(!machine) {
          const currentIntent = handlerInput.requestEnvelope.request.intent;
          return handlerInput.responseBuilder
            .speak(TOO_MANY_COMMAND_MACHINES1 + command + TOO_MANY_COMMAND_MACHINES2 + ' ' + commandMachines.map( machine => machine.MachineName).join(',<break strength="medium"/> '))
            .addDelegateDirective(currentIntent)
            .getResponse();
        }

        executionMachine = commandMachines.find( currentMachine => currentMachine.MachineName === machine);

        // End if no such machine
        if(!executionMachine) {
          return handlerInput.responseBuilder
            .speak(NO_MACHINE_NAME + ' ' + machine)
            .reprompt()
            .getResponse();
        }
      } else {
        executionMachine = commandMachines[0];
      }

      try {
        await run(apigwManagementApi, executionMachine.ConnectionId, command);
      } catch(e) {
        console.log(e);
        return handlerInput.responseBuilder
          .speak(RUNNING_COMMAND_ERROR + e.message)
          .reprompt()
          .getResponse();
      }

      return handlerInput.responseBuilder
        .speak(RUNNING_COMMAND1 + command + RUNNING_COMMAND2 + executionMachine.MachineName)
        .reprompt()
        .getResponse();
    } else {
      return noMachines(handlerInput);
    }
  },
};

handlers.CommandsListHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'CommandsList';
  },
  async handle(handlerInput) {
    let userId = handlerInput.requestEnvelope.session.user.userId;
    let pairedMachines = (await db.machines.getAllByUserPaired(userId)).Items;
    let machinesNumeber = pairedMachines.length;

    if(machinesNumeber > 0) {
      let aliases = [];
      let aliasesNumber = 0;
      let lastAlias = '';
      let aliasesStr = '';
      let aliasesCardStr = '';

      for(let i = 0, mLen = machinesNumeber; i < mLen; i++) {
        let currentMachineAliases = pairedMachines[i].Aliases;
        if (currentMachineAliases) {
          let currentMachineAliasesNumber = currentMachineAliases.length;
          aliasesNumber += currentMachineAliasesNumber;

          for(let j = 0, aLen = currentMachineAliasesNumber; j < aLen; j++) {
            aliases.push(currentMachineAliases[j]);
          }
        }
      }

      aliasesCardStr = aliases.join('\n');

      if(aliasesNumber > 1) {
        lastAlias = aliases.pop();
        aliasesStr = aliases.join(',<break strength="strong"/>  ') + ' <break strength="weak"/> and ' + lastAlias;
      } else {
        aliasesStr = aliases[0];
      }

      if(aliasesNumber === 0) {
        return noCommands(handlerInput);
      }

      return handlerInput.responseBuilder
        .speak(COMMANDS_MESSAGE1 + aliasesNumber + COMMANDS_MESSAGE2 + machinesNumeber + COMMANDS_MESSAGE3 + ' ' + aliasesStr)
        .withSimpleCard('Commands', aliasesCardStr)
        .reprompt()
        .getResponse();
    } else {
      return noMachines(handlerInput);
    }
  },
};

/*
  MACHINE HANDLERS
*/
async function generateUniqueToken(iteration = 1) {
  if(iteration > 10) {
    throw new Error('Too many token genration attempts. Tokens depleted?');
  }

  // Generate new token
  let token = (Math.round((Math.random() * 89999) + 10000) + '');
  let sameTokens = (await db.machines.getAllByTokenNotPaired(token)).Items;

  console.log(`Token: ${token} Iteration: ${iteration}`);

  if(sameTokens.length) {
    return await generateUniqueToken(iteration + 1);
  } else {
    return token;
  }
}

handlers.AddMachineHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AddMachine';
  },
  async handle(handlerInput) {
    let userId = handlerInput.requestEnvelope.session.user.userId;
    let notPaired = (await db.machines.getAllByUserNotPaired(userId)).Items;
    let token = null;

    console.log(notPaired);

    if(notPaired.length) {
      token = notPaired[0].PairToken;
    } else {
      token = await generateUniqueToken();
      await db.machines.createMachineToken(userId, token);
    }

    let speakToken = token.split('').join(' ');

    return handlerInput.responseBuilder
      .speak(PAIR_MESSAGE + speakToken)
      .reprompt(PAIR_REPROMPT1 + speakToken + PAIR_REPROMPT2)
      .withSimpleCard('Pairing', 'Token:' + token)
      .getResponse();
  },
};

handlers.MachinesListHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'MachinesList';
  },
  async handle(handlerInput) {
    let userId = handlerInput.requestEnvelope.session.user.userId;
    let pairedMachines = (await db.machines.getAllByUserPaired(userId)).Items;
    let machinesNumeber = pairedMachines.length;

    if(machinesNumeber > 0) {
      let machinesNames = pairedMachines.map(machine => machine.MachineName);
      let lastMachine = '';
      let machinesStr = '';
      let machinesCardStr = '';

      machinesCardStr = machinesNames.join('\n');

      if(machinesNumeber > 1) {
        lastMachine = machinesNames.pop();
        machinesStr = machinesNames.join(',<break strength="strong"/>  ') + ' <break strength="weak"/> and ' + lastMachine;
      } else {
        machinesStr = machinesNames[0];
      }

      return handlerInput.responseBuilder
        .speak(MACHINES_MESSAGE1 + machinesNumeber + MACHINES_MESSAGE2 + machinesStr)
        .withSimpleCard('Machines', machinesCardStr)
        .reprompt()
        .getResponse();
    } else {
      return noMachines(handlerInput);
    }
  },
};

/*
  DEFAULT INTENTS
*/
handlers.YesHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.YesIntent';
  },
  handle(handlerInput) {
    // "consume" confirmHandler
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    let confirmHandler = sessionAttributes.confirmHandler;

    sessionAttributes.confirmHandler = null;
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    if(confirmHandler) {
      return handlers[confirmHandler].handle(handlerInput);
    } else {
      return handlerInput.responseBuilder
        .speak(YES_MESSAGE)
        .reprompt()
        .getResponse();
    }
  },
};

handlers.HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(HELP_MESSAGE)
      .reprompt(HELP_REPROMPT)
      .getResponse();
  },
};

handlers.StopHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(STOP_MESSAGE)
      .getResponse();
  },
};

handlers.FallbackHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.FallbackIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(FALLBACK_MESSAGE)
      .reprompt(FALLBACK_REPROMPT)
      .getResponse();
  },
};

/*
  ERROR HANDLER
*/
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(handlerInput);
    console.log(error);

    return handlerInput.responseBuilder
      .speak('Sorry, an error occurred in command line.')
      .reprompt('An error occurred in command line.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = (...arguments) => {
  console.log(JSON.stringify(arguments[0])); // print incoming event
  //console.log(...Object.values(handlers)); // print all handlers

  (skillBuilder
    .addRequestHandlers(
      ...Object.values(handlers)
      //LaunchHandler,
      //YesHandler,
      //HelpHandler,
      //StopHandler,
      //SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda())(...arguments);
};
