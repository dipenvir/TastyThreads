/**
 * Loads the navbar onto each page
 */


function loadSkeleton() {
  console.log("inside skeleton");
  console.log("this should show function: " + typeof $); // debugging Should print 'function' if jQuery is loaded


  return fetch("/auth/status")
    .then((res) => {
      console.log("inside skeleton's fetch", res); // Debugging line
      return res.json();
    })
    .then((data) => {
      console.log("Auth status data:", data); // Debugging line
      if (data.isAuthenticated) {
        $("#navbar").load("navbars/navbar.html");
      } else {
        $("#navbar").load("./navbars/nav-before-login.html");
      }
    })
    .catch((error) => console.error("Error checking auth status:", error));
}

loadSkeleton();
