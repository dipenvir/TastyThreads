document.addEventListener("DOMContentLoaded", async () => {
    // Extract the recipe ID from the URL query parameters
    const params = new URLSearchParams(window.location.search);
    const recipeId = params.get("id");

    if (!recipeId) {
        displayError("No recipe ID provided");
        return;
    }

    await fetchAndDisplayRecipe(recipeId);
});

// Fetch and display the recipe details
async function fetchAndDisplayRecipe(recipeId) {
    try {
        const response = await fetch(`/recipe/${recipeId}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const recipe = await response.json();
        populateRecipeDetails(recipe);
    } catch (error) {
        console.error("Error fetching recipe:", error);
        displayError("Failed to load recipe details");
    }
}

// Populate the recipe details on the page
function populateRecipeDetails(recipe) {
    // Set the page title
    document.title = recipe.title || "Recipe Details";

    // Populate the recipe header
    document.querySelector(".recipe-header h1").textContent = recipe.title;

    // Populate the metadata
    const metaSection = document.querySelector(".recipe-meta");
    metaSection.innerHTML = `
        <span><strong>Cooking Time:</strong> ${recipe.cooking_time || 'N/A'}</span>
        <span><strong>Category:</strong> ${formatArray(recipe.tags.category)}</span>
        <span><strong>Cuisine:</strong> ${recipe.tags.cuisine || 'N/A'}</span>
        <span><strong>Meal Time:</strong> ${formatArray(recipe.tags.meal_time)}</span>
    `;

    // Set the image
    const imageElement = document.querySelector(".recipe-image img");
    let imageSrc = "/img/bowl.jpg"; // Default image
    if (recipe.image && !recipe.image.NULL) {
        // Handle base64 image if available
        if (recipe.image.B) {
            imageSrc = `data:image/jpeg;base64,${recipe.image.B}`;
        }
    }
    imageElement.src = imageSrc;
    imageElement.alt = recipe.title;

    // Populate ingredients
    const ingredientsList = document.querySelector(".ingredients ul");
    ingredientsList.innerHTML = '';

    if (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
        recipe.ingredients.forEach(ingredient => {
            const li = document.createElement("li");
            li.textContent = ingredient;
            ingredientsList.appendChild(li);
        });
    } else {
        ingredientsList.innerHTML = '<li>No ingredients listed</li>';
    }

    // Populate instructions
    const stepsSection = document.querySelector(".steps ol");
    stepsSection.innerHTML = '';

    if (recipe.instructions) {
        // Split instructions by periods, newlines, or numbered lists
        const steps = recipe.instructions
            .split(/(?:\r?\n|\.\s+|\d+\.\s+)/)
            .filter(step => step.trim().length > 0);

        if (steps.length > 0) {
            steps.forEach(step => {
                const li = document.createElement("li");
                li.textContent = step.trim();
                stepsSection.appendChild(li);
            });
        } else {
            // If we couldn't split it properly, just display as a single item
            const li = document.createElement("li");
            li.textContent = recipe.instructions;
            stepsSection.appendChild(li);
        }
    } else {
        stepsSection.innerHTML = '<li>No instructions provided</li>';
    }
}

// Helper function to format arrays from DynamoDB
function formatArray(arr) {
    if (Array.isArray(arr)) {
        return arr.join(", ");
    }
    return arr || "N/A";
}

// Display error message
function displayError(message) {
    const container = document.querySelector(".recipe-container");
    container.innerHTML = `
        <div class="error-message">
            <h2>Error</h2>
            <p>${message}</p>
            <a href="/recipes.html">Return to Recipes</a>
        </div>
    `;
}