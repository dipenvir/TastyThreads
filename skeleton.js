/**
 * Loads the navbar onto each page based on Cognito authentication status
 */
function loadSkeleton() {
  console.log("inside skeleton");
  console.log("this should show function: " + typeof AmazonCognitoIdentity); // debugging, should print 'object' if Cognito is loaded

  // Get the current user from Cognito
  const cognitoUser = userPool.getCurrentUser();

  if (cognitoUser != null) {
    // If a user is logged in, fetch user info and load the appropriate navbar
    cognitoUser.getSession((err, session) => {
      if (err) {
        console.error("Error getting session:", err);
        loadNavbarBeforeLogin(); // In case of error, assume the user is not logged in
      } else {
        console.log("User is authenticated:", session.isValid());
        if (session.isValid()) {
          loadNavbarAfterLogin();
        } else {
          loadNavbarBeforeLogin();
        }
      }
    });
  } else {
    loadNavbarBeforeLogin(); // If no user is logged in, load navbar for non-authenticated users
  }
}

/**
 * Loads the navbar for authenticated users
 */
function loadNavbarAfterLogin() {
  console.log("User is authenticated, loading the navbar AFTER login.");
  $("#navbar").load("navbars/navbar.html");
}

/**
 * Loads the navbar for users who are not authenticated
 */
function loadNavbarBeforeLogin() {
  console.log("User is not authenticated, loading the navbar BEFORE login.");
  $("#navbar").load("./navbars/nav-before-login.html");
}

loadSkeleton();
