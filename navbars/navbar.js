// const Cookies = require("js-cookie");


// const Cookies = require("js-cookie");
// Modular button setup system
document.addEventListener("DOMContentLoaded", () => {
  try {
    console.log("DOM Content Loaded event fired");

    // Configure all buttons that need the enhanced setup
    const buttonConfigs = [
      {
        id: "newPostBtn",
        clickHandler: async () => {
          try {
            console.log("newPostBtn clicked");

            const token = localStorage.getItem("cognito_access_token");
            console.log("TOKEN", token)
            if (!token) {
              alert("Unauthorized: No token found.");
              return;
            }

            // Set the token as a cookie before making the request
            Cookies.set("authToken", token);

            const response = await fetch("/newPost", {
              method: "GET",
              credentials: "include",
            });

            if (response.ok) {
              window.location.href = "/newPost"; // Redirects to the path that serves newpost.html
            } else {
              alert("Unauthorized: Response not ok.");
            }

          } catch (error) {
            console.error("Error handling newPost button click:", error);
          }
        }
      },
      {
        id: "logout",
        clickHandler: async () => {
          try {
            console.log("logout button clicked");
            const response = await fetch("/logout", {
              method: "GET",
              credentials: "include",
            });

            if (response.ok) {
              console.log("User logged out successfully");
              window.location.href = "/";
            } else {
              console.log("Failed to log out");
              alert("Logout failed. Please try again.");
            }
          } catch (error) {
            console.error("Error handling logout button click:", error);
          }
        }
      },
      {
        id: "profileBtn",
        clickHandler: async () => {
          try {
            console.log("profileBtn clicked");
            const token = localStorage.getItem("cognito_access_token");

            if (!token) {
              alert("Unauthorized: No token found.");
              return;
            }

            const response = await fetch("/profile", {
              method: "GET",
              credentials: "include",
            });

            if (response.ok) {
              window.location.href = "/profile";
            } else {
              alert("Unauthorized: Response not ok.");
            }

          } catch (error) {
            console.error("Error handling newPost button click:", error);
          }
        }
      }
      /////////////////ADD MORE BUTTONS HERE AS NEEDED///////////
    ];

    // Set up all configured buttons
    buttonConfigs.forEach(config => setupButton(config));

  } catch (error) {
    console.error("Error in DOMContentLoaded handler:", error);
  }
});

function setupButton({ id, clickHandler }) {
  // Check if the button exists
  const button = document.getElementById(id);
  if (button) {
    console.log(`${id} found, adding event listener`);
    addClickListener(button, clickHandler);
  } else {
    console.log(`${id} not found, setting up observer`);
    // Set up a MutationObserver to watch for when the button gets added to the DOM
    setupButtonObserver(id, clickHandler);
  }
}

function addClickListener(button, clickHandler) {
  button.addEventListener("click", clickHandler);
}

function setupButtonObserver(buttonId, clickHandler) {
  // Create a MutationObserver to watch for the button to be added to the DOM
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        const button = document.getElementById(buttonId);
        if (button) {
          console.log(`${buttonId} found via observer, adding event listener`);
          addClickListener(button, clickHandler);
          observer.disconnect(); // Stop observing once we find the button
          break;
        }
      }
    }
  });

  // Start observing the document with the configured parameters
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}


// document.addEventListener("DOMContentLoaded", () => {
//   try {
//     console.log("DOM Content Loaded event fired");

//     // Check if the element exists
//     const newPostBtn = document.getElementById("newPostBtn");

//     if (newPostBtn) {
//       console.log("newPostBtn found, adding event listener");
//       addClickListener(newPostBtn);
//     } else {
//       console.log("newPostBtn not found, setting up observer");
//       // Set up a MutationObserver to watch for when the button gets added to the DOM
//       setupButtonObserver();
//     }
//   } catch (error) {
//     console.error("Error in DOMContentLoaded handler:", error);
//   }
// });

// function addClickListener(button) {
//   button.addEventListener("click", async () => {
//     try {
//       console.log("newPostBtn clicked");
//       const token = localStorage.getItem("cognito_access_token"); // Access token
//       if (!token) {
//         alert("Unauthorized: No token found.");
//         return;
//       }

//       // Send ID token to backend
//       const response = await fetch("/newPost", {
//         method: "GET",
//         credentials: "include", // Ensures cookies are sent
//       });

//       if (response.ok) {
//         window.location.href = "/newPost"; // Redirects to the path that serves newpost.html
//       } else {
//         alert("Unauthorized: Response not ok.");
//       }

//     } catch (error) {
//       console.error("Error handling button click:", error);
//     }
//   });
// }

// function setupButtonObserver() {
//   // Create a MutationObserver to watch for the button to be added to the DOM
//   const observer = new MutationObserver((mutations) => {
//     for (const mutation of mutations) {
//       if (mutation.type === 'childList' && mutation.addedNodes.length) {
//         const newPostBtn = document.getElementById("newPostBtn");
//         if (newPostBtn) {
//           console.log("newPostBtn found via observer, adding event listener");
//           addClickListener(newPostBtn);
//           observer.disconnect(); // Stop observing once we find the button
//           break;
//         }
//       }
//     }
//   });

//   // Start observing the document with the configured parameters
//   observer.observe(document.body, { childList: true, subtree: true });
// }


// // LOGOUT FUNCTION
// document.getElementById("logout").addEventListener("click", async () => {
//   try {
//     const response = await fetch("/logout", {
//       method: "GET",
//       credentials: "include", // Ensure cookies are sent with the request
//     });

//     if (response.ok) {
//       console.log("User logged out successfully");
//       // Optionally, redirect the user to the login page or update the UI
//       window.location.href = "/login"; // Example redirection
//     } else {
//       console.log("Failed to log out");
//     }
//   } catch (error) {
//     console.error("Error logging out:", error);
//   }
// });
