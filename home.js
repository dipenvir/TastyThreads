async function populateUserStats() {
    try {
        const response = await fetch("/check-auth", {
            method: "GET",
            credentials: "include"
        });

        if (response.ok) {
            const data = await response.json();

            const username = data.user?.username;

            const username_holder = document.getElementById("userName");

            if (username_holder) {
                username_holder.innerHTML = username || "Unknown User";
            }
        }
    } catch (error) {
        console.error("Error getting req.user info: ", error)
    }
}

populateUserStats();

// Redirects to the recipes page according to the tag clicked
document.addEventListener("DOMContentLoaded", () => {
    const categoryCards = document.querySelectorAll(".category-card");

    categoryCards.forEach(card => {
        card.addEventListener("click", () => {
            let filterParam = "";

            if (card.hasAttribute("data-meal-time")) {
                filterParam = `meal_time=${encodeURIComponent(card.getAttribute("data-meal-time"))}`;
            } else if (card.hasAttribute("data-category")) {
                filterParam = `category=${encodeURIComponent(card.getAttribute("data-category"))}`;
            } else if (card.hasAttribute("data-cuisine")) {
                filterParam = `cuisine=${encodeURIComponent(card.getAttribute("data-cuisine"))}`;
            }

            if (filterParam) {
                window.location.href = `/recipes.html?${filterParam}`;
            }
        });
    });
});

