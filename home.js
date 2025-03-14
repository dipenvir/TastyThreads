document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("/getUser");
        const data = await response.json();
        if (data.username != null) {
            document.getElementById("userName").textContent = data.username;
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
});

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

