// FETCHING USER'S POSTED RECIPES

async function populateUserStats() {
    try {
        const response = await fetch("/check-auth", {
            method: "GET",
            credentials: "include"
        });

        if (response.ok) {
            const data = await response.json();

            const username = data.user?.username;
            const email = data.user?.email;

            const username_holder = document.getElementById("username");
            const email_holder = document.getElementById("email");

            if (username_holder && email_holder) {
                username_holder.innerHTML = username || "Unknown User";
                email_holder.innerHTML = email || "No Email Provided";
            }
        }
    } catch (error) {
        console.error("Error getting req.user info: ", error)
    }
}

populateUserStats();

function formatTags(tags) {
    if (!tags || typeof tags !== 'object') return '';

    let tagList = [];

    // Process categories
    if (tags.category && Array.isArray(tags.category)) {
        tagList.push(...tags.category);
    }

    // Add cuisine
    if (tags.cuisine) {
        tagList.push(tags.cuisine);
    }

    // Process meal_time
    if (tags.meal_time && Array.isArray(tags.meal_time)) {
        tagList.push(...tags.meal_time);
    }

    return tagList.join(', ');
}

async function fetchRecipes() {
    try {
        const response = await fetch('/api/profile-recipes', {
            method: 'GET',
            credentials: 'include' // Include cookies for authentication
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const recipes = await response.json();
        const recipeGrid = document.getElementById("user-posts-grid");
        const recipeCount = document.getElementById("recipe-count");

        // Update recipe count
        recipeCount.textContent = recipes.length;

        // Clear existing content
        recipeGrid.innerHTML = '';

        // Check if we have any recipes
        if (recipes.length === 0) {
            recipeGrid.innerHTML = '<p>You haven\'t posted any recipes yet.</p>';
            return;
        }

        // Populate the recipes dynamically
        recipes.forEach(recipe => {

            const recipeCard = document.createElement("div");
            recipeCard.classList.add("recipe-card");

            // Extract image data properly
            let imageSrc = "img/lunch.png"; // Default image path

            if (recipe.image && recipe.image.data) {
                // Assuming recipe.image.data contains the base64 string from DynamoDB
                // Create a data URL using the base64 string
                imageSrc = `data:image/jpeg;base64,${recipe.image.data}`;
            } else if (recipe.image && recipe.image.name) {
                // Fallback to your existing logic if needed
                imageSrc = "img/lunch.png";
            }

            const cookingTime = recipe.cooking_time ? `${recipe.cooking_time} mins` : 'Unknown time';

            recipeCard.innerHTML = `
                <img src="${imageSrc}" alt="${recipe.title || 'Recipe'}">
                <h3>${recipe.title || 'Untitled Recipe'}</h3>
                <p>${formatTags(recipe.tags)}, ${cookingTime}</p>
                   <button class="continueReadingBtn" data-id="${recipe.recipeID}">Continue Reading</button>
            `;

            // Make the entire card clickable
            recipeCard.addEventListener("click", (event) => {
                // Don't trigger if they clicked the button (which has its own link)
                if (!event.target.closest('button')) {
                    window.location.href = `/recipe/${recipe.recipeID}`;
                }
            });

            recipeGrid.appendChild(recipeCard);
        });
    } catch (error) {
        console.error("Error loading recipes:", error);
        const recipeGrid = document.getElementById("user-posts-grid");
        recipeGrid.innerHTML = '<p>Error loading recipes. Please try again later.</p>';
    }
}

// Fetch recipes when the page loads
document.addEventListener("DOMContentLoaded", fetchRecipes);

// Listen for continue button clicks
document.addEventListener("click", function (event) {
    if (event.target.matches(".continueReadingBtn")) {
        const recipeId = event.target.getAttribute("data-id");
        window.location.href = `recipe.html?id=${recipeId}`;
    }
});