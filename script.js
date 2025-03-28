
document.addEventListener('DOMContentLoaded', () => {
    if (typeof AmazonCognitoIdentity === 'undefined') {
        console.error('Amazon Cognito Identity SDK not loaded');
        return;
    }

    // DEBUG: Confirm access to the globally available userPool
    console.log(window.userPool);

    window.signUpUser = function () {
        const name = document.getElementById("name").value;
        const password = document.getElementById("password").value;
        const email = document.getElementById("email").value;

        // Validate inputs
        if (!name || !password || !email) {
            alert('Please fill in all fields');
            return;
        }

        // Prepare user attributes
        const attributeList = [
            new AmazonCognitoIdentity.CognitoUserAttribute({
                Name: 'email',
                Value: email
            }),
            new AmazonCognitoIdentity.CognitoUserAttribute({
                Name: 'name',
                Value: name
            })
        ];

        // Perform signup
        userPool.signUp(
            name, // Use email as username
            password,
            attributeList,
            null,
            (err, result) => {
                if (err) {
                    console.error('Signup Error:', err);

                    let errorMessage = 'Signup failed. ';
                    if (err.code === 'UsernameExistsException') {
                        errorMessage += 'This email is already registered.';
                    } else if (err.code === 'InvalidParameterException') {
                        errorMessage += 'Invalid parameter. Please check your input.';
                    } else {
                        errorMessage += err.message || 'Please try again.';
                    }

                    alert(errorMessage);
                    return;
                }

                console.log('Signup Successful:', result);
                alert('Signup successful! Please check your email for a confirmation code.');
            }
        );
    };

    // Login function
    window.loginUser = function () {
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        // Validate inputs
        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        // Create Cognito User object
        const userData = {
            Username: email, // Assuming email is the username
            Pool: userPool
        };

        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        // Perform login
        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: email,
            Password: password
        });

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function (result) {
                console.log('Login Successful:', result);
                alert('Login successful! Redirecting...');
                // Redirect or take appropriate action after successful login
                window.location.href = 'home.html'; // Example redirect
            },
            onFailure: function (err) {
                console.error('Login Error:', err);
                let errorMessage = 'Login failed. ';
                if (err.code === 'UserNotFoundException') {
                    errorMessage += 'User not found.';
                } else if (err.code === 'NotAuthorizedException') {
                    errorMessage += 'Incorrect username or password.';
                } else {
                    errorMessage += err.message || 'Please try again.';
                }

                alert(errorMessage);
            }
        });
    };

    // Logout function
    window.logoutUser = function () {
        const user = userPool.getCurrentUser();
        if (user) {
            user.signOut();
            alert("Logged out successfully!");
            window.location.href = "/"; // Redirect to home page
        } else {
            alert("No user is logged in.");
        }
    };

    // Use event delegation for dynamically loaded logout button
    document.body.addEventListener("click", (event) => {
        if (event.target && event.target.id === "logout") {
            logoutUser(); // Call the logout function when logout button is clicked
        }
    });
});