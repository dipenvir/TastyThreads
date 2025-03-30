async function loadSkeleton() {
  console.log("inside skeleton");

  try {
    const response = await fetch("/check-auth", {
      method: "GET",
      credentials: "include" // Ensure cookies (including httpOnly cookies) are sent
    });

    if (response.ok) {
      console.log("User is authenticated");
      loadNavbarAfterLogin();
    } else {
      console.log("User is not authenticated");
      loadNavbarBeforeLogin();
    }
  } catch (error) {
    console.error("Error checking authentication:", error);
    loadNavbarBeforeLogin();
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

////////////////////////////////////////////////////////////////////////
// BUTTON EVENTS BELOW //


// // Sends token in req object when clicking NEWPOST
// document.getElementById("newPostBtn").addEventListener("click", async () => {
//   console.log("inside newpost button function")
//   const token = localStorage.getItem("cognito_token"); // Retrieve token from storage

//   const response = await fetch("/newPost", {
//     method: "GET",
//     headers: {
//       "Authorization": `Bearer ${token}`, // Attach token in the request
//       "Content-Type": "application/json",
//     },
//   });

//   if (response.ok) {
//     const html = await response.text();
//     document.body.innerHTML = html; // Inject the response into the page
//   } else {
//     alert("Unauthorized: Please log in.");
//   }
// });
