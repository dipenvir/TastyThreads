// signUpUser function to handle user registration
function signUpUser() {
    // Capture the values from the sign-up form
    const username = document.getElementById('name').value;  // Get the username
    const email = document.getElementById('email').value;    // Get the email
    const password = document.getElementById('password').value; // Get the password

    // Display or validate the values (e.g., you might want to check for empty fields)
    if (!username || !email || !password) {
        document.getElementById('message').innerText = 'Please fill in all fields!';
        return;
    }

    // Now, you can proceed with signing up the user in Cognito
    // For example, this could be part of an AWS Cognito signup process:

    const signUpDetails = {
        Username: username,  // username
        Email: email,        // email
        Password: password   // password
    };

    // Assuming you have an AWS Cognito method to sign up the user:
    const poolData = {
        UserPoolId: AWS_CONFIG.UserPoolId,  // From cognitoConfig.js
        ClientId: AWS_CONFIG.ClientId       // From cognitoConfig.js
    };

    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    const userData = {
        Username: username,
        Pool: userPool
    };

    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    const signUpParams = new AmazonCognitoIdentity.SignUp(
        username, 
        password, 
        [
            new AmazonCognitoIdentity.CognitoUserAttribute({
                Name: 'email',
                Value: email
            })
        ], 
        null
    );

    userPool.signUp(signUpParams.Username, signUpParams.Password, signUpParams.UserAttributes, signUpParams.ValidationData, function(err, result) {
        if (err) {
            console.error(err);
            document.getElementById('message').innerText = 'Error signing up user. Please try again.';
        } else {
            console.log('Sign up successful:', result);
            document.getElementById('message').innerText = 'Sign-up successful! Please confirm your email.';
            // Optionally, redirect or change UI to ask for email confirmation
        }
    });
}
