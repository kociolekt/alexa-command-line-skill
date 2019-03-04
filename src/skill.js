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
const YES_MESSAGE = 'Nothing to confirm.';
const PAIR_MESSAGE = 'Pair your machine with following token: ';

const handlers = {};

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

handlers.AddMachineHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'AddMachine';
  },
  async handle(handlerInput) {
    let userId = handlerInput.requestEnvelope.session.user.userId;
    let notPaired = (await db.machines.getAllByUserNotPaired(userId)).Items;
    let token = null;

    console.log(notPaired);

    if(notPaired.length) {
      token = notPaired[0].Token;
    } else {
      token = Math.round(Math.random() * 99999);
      await db.machines.addWithToken(userId, token);
    }

    return handlerInput.responseBuilder
      .speak(PAIR_MESSAGE + token)
      .reprompt()
      .getResponse();
  },
};

handlers.SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

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

handlers.ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(handlerInput);
    console.log(error);

    return handlerInput.responseBuilder
      .speak('Sorry, an error occurred.')
      .reprompt('Sorry, an error occurred.')
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
    .addErrorHandlers(handlers.ErrorHandler)
    .lambda())(...arguments);
};
