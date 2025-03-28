document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("register-form");
    const loginForm = document.getElementById("login-form");
    const profileBtn = document.getElementById("profile-btn");
    const message = document.getElementById("message");
    const toggleLogin = document.getElementById("toggle-login");
    const toggleRegister = document.getElementById("toggle-register");
    const createAccountHeading = document.getElementById("register-head")
    const loginHeading = document.getElementById("login-head")
    const toggleMessage = document.getElementById("toggle-message");

    const API_URL = "http://localhost:3000"; // Adjust if running on AWS

    // Function to show the register form and hide the login form
    const showRegisterForm = () => {
        registerForm.style.display = "block";
        loginForm.style.display = "none";
        createAccountHeading.style.display = "block"; // Show Create Account heading
        loginHeading.style.display = "none"; // Hide Login heading
        toggleMessage.innerHTML = 'Already have an account? <a href="#" id="toggle-login">Login</a>'; // Update toggle message
        reattachEventListeners(); // Reattach event listeners after updating the content
    };

    // Function to show the login form and hide the register form
    const showLoginForm = () => {
        loginForm.style.display = "block";
        registerForm.style.display = "none";
        createAccountHeading.style.display = "none"; // Hide Create Account heading
        loginHeading.style.display = "block"; // Show Login heading
        toggleMessage.innerHTML = 'Don\'t have an account? <a href="#" id="toggle-register">Create Account</a>'; // Update toggle message
        reattachEventListeners(); // Reattach event listeners after updating the content
    };

    // Function to reattach event listeners
    const reattachEventListeners = () => {
        const toggleLogin = document.getElementById("toggle-login");
        const toggleRegister = document.getElementById("toggle-register");

        if (toggleLogin) {
            toggleLogin.addEventListener("click", (e) => {
                e.preventDefault();
                showLoginForm();
            });
        }

        if (toggleRegister) {
            toggleRegister.addEventListener("click", (e) => {
                e.preventDefault();
                showRegisterForm();
            });
        }
    };

    // Initially show the register form and hide the login form
    showRegisterForm();

    // Register user
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("username").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        // Sends POST request containing user info as JSON data
        // NOTE: fetch doesn't automatically follow redirects (/registerUser in app.js redirects user to /home), so have to manually handle redirect in the frontend (below)
        const response = await fetch(`${API_URL}/registerUser`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password }),
        });

        // Parse the response as JSON
        const data = await response.json();

        // If there's a redirect, navigate the user
        if (data.redirect) {
            window.location.href = data.redirect;
        } else {
            // Display any error messages
            message.textContent = data.message;
        }
    });

    // Login user
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        const response = await fetch(`${API_URL}/loggingin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (data.redirect) {
            window.location.href = data.redirect;
        } else {
            alert(data.message);
        }
    });

    // Fetch profile
    profileBtn.addEventListener("click", async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            message.textContent = "Please log in first!";
            return;
        }

        const response = await fetch(`${API_URL}/profile`, {
            method: "GET",
            headers: { Authorization: token },
        });

        const data = await response.text();
        message.textContent = data;
    });
});

document.addEventListener("DOMContentLoaded", () => {
    resetPasswordRequirements();
    
    // Attach event listener to the password field
    document.getElementById("password").addEventListener("input", checkPasswordRequirements);
});

function resetPasswordRequirements() {
    const requirements = {
        length: "At least 8 characters",
        uppercase: "One uppercase letter",
        lowercase: "One lowercase letter",
        number: "One number",
        special: "One special character (@, #, $, etc.)"
    };

    for (const id in requirements) {
        updateRequirement(id, false, requirements[id]);
    }
}

function checkPasswordRequirements() {
    const password = document.getElementById("password").value;

    // Password conditions
    const conditions = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    for (const id in conditions) {
        updateRequirement(id, conditions[id], document.getElementById(id).textContent.slice(2));
    }
}

function updateRequirement(id, isValid, text) {
    const element = document.getElementById(id);
    element.innerHTML = isValid ? `✅ ${text}` : `❌ ${text}`;
    element.style.color = isValid ? "green" : "red";
}
