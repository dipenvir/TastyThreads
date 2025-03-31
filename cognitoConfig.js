// Cognito Pool Config for SPA
const poolData = {
    UserPoolId: 'us-west-2_gXmU8ouMK',  // Replace with your actual User Pool ID
    ClientId: '7mr4q7t7kvu49culq0vckq4clf',  // Replace with your actual Client ID
    redirect_urls: ["https://35.94.189.80/callback"]

};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

// Attach the userPool to the global window object
window.userPool = userPool;