/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');

WELCOME_MESSAGE = 'Welcome in alexa command line.';
NO_MACHINE_MESSAGE = 'You have no machines assigned. Would you like to assign one now?';


const LaunchHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechOutput = WELCOME_MESSAGE;

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt('')
      .getResponse();
  },
};

const GetNewFactHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (request.type === 'IntentRequest'
        && request.intent.name === 'GetNewFactIntent');
  },
  handle(handlerInput) {
    const factArr = data;
    const factIndex = Math.floor(Math.random() * factArr.length);
    const randomFact = factArr[factIndex];
    const speechOutput = randomFact;

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt('')
      .getResponse();
  },
};

const SaveItemHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (request.type === 'IntentRequest'
        && request.intent.name === 'SaveItemIntent');
  },
  handle(handlerInput) {
    const color = handlerInput.requestEnvelope.request.intent.slots.item.value;
    const AWS = require('aws-sdk');
    const ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});
    AWS.config.update({region: 'eu-west-1'});
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    if (sessionAttributes.color == undefined) {
      sessionAttributes.color =  [color];
    } else {
      sessionAttributes.color.push(color);
    }
    
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    const params = {
      TableName: 'Colors',
      Item: {
        'color': {S: color}
      }
    };

    ddb.putItem(params, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        console.log('Wrote '+ color +' to DynamoDB Colors table');
      }
    });
  
    return handlerInput.responseBuilder
      .speak('Wrote '+ color +' to DynamoDB Colors table')
      .reprompt('')
      .getResponse();
  },
};

const HelpHandler = {
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

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Your colors are '+ handlerInput.attributesManager.getSessionAttributes().color.toString() + STOP_MESSAGE)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, an error occurred.')
      .reprompt('Sorry, an error occurred.')
      .getResponse();
  },
};

const SKILL_NAME = 'Glados Quotes';
const GET_FACT_MESSAGE = '<audio src="https://s3-eu-west-1.amazonaws.com/glados-quotes/welcome.mp3"/>' ;
const HELP_MESSAGE = '<audio src="https://s3-eu-west-1.amazonaws.com/glados-quotes/help.mp3"/>';
const HELP_REPROMPT = '<audio src="https://s3-eu-west-1.amazonaws.com/glados-quotes/help.mp3"/>';
const STOP_MESSAGE = '<audio src="https://s3-eu-west-1.amazonaws.com/glados-quotes/goodby.mp3"/>';

const data = [
  '<audio src="https://s3-eu-west-1.amazonaws.com/glados-quotes/inslut1.mp3"/>',
  '<audio src="https://s3-eu-west-1.amazonaws.com/glados-quotes/insult2.mp3"/>',
  '<audio src="https://s3-eu-west-1.amazonaws.com/glados-quotes/insult3.mp3"/>',


];

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchHandler,
    GetNewFactHandler,
    SaveItemHandler,
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();