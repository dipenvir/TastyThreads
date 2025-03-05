document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("register-form");
    const loginForm = document.getElementById("login-form");
    const profileBtn = document.getElementById("profile-btn");
    const message = document.getElementById("message");

    const API_URL = "http://localhost:3000"; // Adjust if running on AWS

    // Register user
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("username").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.text();
        message.textContent = data;
    });

    // Login user
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.token);
            message.textContent = "Login successful!";
        } else {
            message.textContent = "Login failed!";
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
