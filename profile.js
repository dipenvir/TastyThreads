function formatTags(tag) {
    if (!tag || typeof tag !== 'object') return '';

    let tagList = [];

    // Iterate over each key in the tag object
    for (let key in tag) {
        if (tag[key]) {
            tagList.push(tag[key]); // Push the entire string, not character by character
        }
    }

    return tagList.join(', '); // Join tags correctly
}


async function fetchRecipes() {
    try {
        const response = await fetch('/api/profile-recipes');

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const recipes = await response.json();
        const recipeGrid = document.getElementById("user-posts-grid");
        const recipeCount = document.getElementById("recipe-count");

        // Update recipe count
        recipeCount.textContent = recipes.length;

        // Clear existing content
        recipeGrid.innerHTML = '';

        // Populate the recipes dynamically
        // Inside fetchRecipes:
        recipes.forEach(recipe => {
            const recipeCard = document.createElement("div");
            recipeCard.classList.add("recipe-card");

            // 🔍 Extract image data properly
            let imageSrc = "img"; // Default image
            if (recipe.image && recipe.image.data && recipe.image.mimetype) {
                imageSrc = `data:${recipe.image.mimetype};base64,${recipe.image.data}`;
            }

            recipeCard.innerHTML = `
        <img src="${imageSrc}" alt="${recipe.title}">
        <h3>${recipe.title}</h3>
        <p>${formatTags(recipe.tags)}, ${recipe.time || 'Unknown time'}</p>
        <a href="recipe.html">
                    <button>Continue Reading</button>
                    </a>
    `;

            recipeGrid.appendChild(recipeCard);
        });
    } catch (error) {
        console.error("Error loading recipes:", error);
    }
}

// Fetch recipes when the page loads
document.addEventListener("DOMContentLoaded", fetchRecipes);
