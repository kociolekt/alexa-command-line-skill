# AWS Serverless notes
Some notes regarding configuration of aws services in serverless framework.

TODO:
Theory
- what it is (commandline tool w nodejs)
- what is supported (many providers examples)

- how it works under the hood (uses cloud orcestrators show example)

- what you can do with it (avaiable commands and what do they do, plugins)
- talk about how it's useful in our environment (no need for backend)

- how often its updated (situation with websockets)

Practice
- serverless ans sls as alias

## Preparations
Before you start you'll need aws account, awscli and serverless framework. After that you'll need to configure new profile (security reasons) and credentials

### Setup aws account
1. Go to https://portal.aws.amazon.com/gp/aws/developer/registration/index.html?nc2=h_ct&src=header_signup 
2. Follow steps and create account

### Install awscli
1. Install python from https://www.python.org/downloads/ - remember to add python to path
2. Install awscli
```
pip install awscli
```

### Install serverless
1. Install node https://nodejs.org/en/download/
2. Install serverless
```
npm install -g serverless
```

### Setup new profile
Based on https://serverless.com/framework/docs/providers/aws/guide/credentials/
1. Create new user in https://console.aws.amazon.com/iam/home?region=us-east-1#/users with proper privilages. If you don't know what privilages'll be needed then set AdministratorAccess like in https://www.youtube.com/watch?v=bFHmgqbAh4M.
2. Generate AWS Access Key ID and AWS Secret Access Key like in video.
3. Create new profile o your machine
```
$ aws configure --profile user2
AWS Access Key ID [None]: AKIAI44QH8DHBEXAMPLE
AWS Secret Access Key [None]: je7MtGbClwBF/2Zp9Utk/h3yCo8nvbEXAMPLEKEY
Default region name [None]: us-east-1
Default output format [None]: text
```

### Using profile
Later in serverless.yml use created profile like:
```
(...)
provider:
  profile: user2
(...)
```
This way it's possible to withdraw all access rights for one app in one click.

## First serverless.yml
Let's create first lambda function with serverless!

### Create serverless.yml
Full serverless.yml example is available here: https://serverless.com/framework/docs/providers/aws/guide/serverless.yml/ but you'll need only a fraction of this.
For first example we'll create Alexa skill!
1. Create package.json and install dependencies
```
npm init -f
npm install serverless-alexa-skills
```
