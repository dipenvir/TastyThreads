// cognito.js

require('dotenv').config();
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

// Fetch credentials from environment variables
const userPoolId = process.env.COGNITO_USER_POOL_ID;
const clientId = process.env.COGNITO_CLIENT_ID;

// Initialize the Cognito User Pool
const poolData = {
    UserPoolId: userPoolId,
    ClientId: clientId
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

module.exports = userPool;
