/* eslint-disable  func-names */
/* eslint-disable  no-console */
require('dotenv').config();

const Alexa = require('ask-sdk');
const db = require('./db');

const WELCOME_MESSAGE = 'Welcome in alexa command line.';
const NO_MACHINES_MESSAGE = 'You have no machines assigned. Would you like to assign one now?';
const HELP_MESSAGE = 'In command line I can run defined command on connected machines. I can give you the list of avaiable commands or connected machines.';
const HELP_REPROMPT = 'Would you like me to repeat?';
const STOP_MESSAGE = 'Exited command line.';
const FALLBACK_MESSAGE = 'You can continue using command line for example ask me to list commands. What can I help you with?';
const FALLBACK_REPROMPT = 'What can I help you with?';
const YES_MESSAGE = 'Nothing to confirm.';
const PAIR_MESSAGE = 'Pair your machine with following token: ';
const PAIR_REPROMPT1 = 'Use ';
const PAIR_REPROMPT2 = ' as pairing token.';
const COMMANDS_MESSAGE1 = 'You have ';
const COMMANDS_MESSAGE2 = ' commands on ';
const COMMANDS_MESSAGE3 = ' connected machines avaiable: ';


const handlers = {};

/*
  MAIN REQUESTS
*/
handlers.LaunchHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {
    let machines = (await db.machines.getAllByUser(handlerInput.requestEnvelope.session.user.userId)).Items;

    if(machines.length > 0) {
      return handlerInput.responseBuilder
      .speak(WELCOME_MESSAGE)
      .reprompt('')
      .getResponse();
    } else {

      // Save confirm handler in case somebody said 'yes'
      let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
      sessionAttributes.confirmHandler = 'AddMachineHandler';
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

      return handlerInput.responseBuilder
      .speak(WELCOME_MESSAGE + ' ' + NO_MACHINES_MESSAGE)
      .reprompt()
      .getResponse();
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

handlers.CommandsListHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'List';
  },
  async handle(handlerInput) {
    let userId = handlerInput.requestEnvelope.session.user.userId;
    let pairedMachines = (await db.machines.getAllByUser(userId)).Items;
    let commandsNumber = 0;
    let machinesNumeber = pairedMachines.length

    console.log(pairedMachines);

    return handlerInput.responseBuilder
      .speak(COMMANDS_MESSAGE1 + commandsNumber + COMMANDS_MESSAGE2 + machinesNumeber + COMMANDS_MESSAGE3)
      .reprompt()
      .getResponse();
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
      token = notPaired[0].Token;
    } else {
      token = await generateUniqueToken();
      await db.machines.createMachineToken(userId, token);
    }

    let speakToken = token.split('').join(' ');

    return handlerInput.responseBuilder
      .speak(PAIR_MESSAGE + speakToken)
      .reprompt(PAIR_REPROMPT1 + speakToken + PAIR_REPROMPT2)
      .getResponse();
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
