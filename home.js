document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("/getUser");
        const data = await response.json();

        if (data.username) {
            document.getElementById("userName").textContent = data.username;
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
});
