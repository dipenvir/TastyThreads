document.addEventListener("DOMContentLoaded", async () => {
    await fetchRecipes();  // Load recipes initially
    await populateFilters();  // Populate dropdowns
});

// 🥗 Fetch and display recipes based on selected filters
async function fetchRecipes() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category") || "";
    const cuisine = params.get("cuisine") || "";
    const mealTime = params.get("meal_time") || "";

    let queryParams = [];
    if (category) queryParams.push(`category=${category}`);
    if (cuisine) queryParams.push(`cuisine=${cuisine}`);
    if (mealTime) queryParams.push(`meal_time=${mealTime}`);

    const apiUrl = `/recipes?${queryParams.join("&")}`;

    try {
        const response = await fetch(apiUrl);
        const recipes = await response.json();

        const recipeList = document.getElementById("recipe-list");
        if (recipes.length === 0) {
            recipeList.innerHTML = `<p>No recipes found.</p>`;
            return;
        }

        recipeList.innerHTML = recipes.map(recipe => `
            <div>
                <h2>${recipe.title}</h2>
                <img src="${recipe.image}" alt="${recipe.title}" style="width:200px;">
                <p><strong>Category:</strong> ${recipe.tags.category || "N/A"}</p>
                <p><strong>Cuisine:</strong> ${recipe.tags.cuisine || "N/A"}</p>
                <p><strong>Meal Time:</strong> ${recipe.tags.meal_time || "N/A"}</p>
                <p><strong>Ingredients:</strong> ${recipe.ingredients.join(", ")}</p>
                <p><strong>Instructions:</strong> ${recipe.instructions}</p>
            </div>
        `).join("");
    }
    catch (error) {
        console.error("Error fetching recipes:", error);
        document.getElementById("recipe-list").innerHTML = "<p>Failed to load recipes.</p>";
    }
}

// 🏷️ Populate dropdown filters dynamically
async function populateFilters() {
    try {
        const response = await fetch("/getFilters");  // Ensure consistent API endpoint
        const filters = await response.json();

        populateDropdown("category", filters.categories);
        populateDropdown("cuisine", filters.cuisines);
        populateDropdown("meal_time", filters.meal_times);
    }
    catch (error) {
        console.error("Error fetching filters:", error);
    }
}

// 📌 Helper function to populate dropdowns
function populateDropdown(elementId, options) {
    const dropdown = document.getElementById(elementId);
    dropdown.innerHTML = `<option value="">All</option>`; // Default option

    options.forEach(option => {
        const newOption = document.createElement("option");
        newOption.value = option;
        newOption.textContent = option;
        dropdown.appendChild(newOption);
    });
}

// 🔄 Update the filters and reload page with new query params
function updateFilters() {
    const category = document.getElementById("category").value;
    const cuisine = document.getElementById("cuisine").value;
    const mealTime = document.getElementById("meal_time").value;

    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (cuisine) params.append("cuisine", cuisine);
    if (mealTime) params.append("meal_time", mealTime);

    // Update the URL in browser without reloading
    window.history.pushState({}, "", `?${params.toString()}`);

    // Fetch filtered recipes without full page reload
    fetchRecipes();
}

