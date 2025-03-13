// // Recipes button
// document.getElementById("recipes-button").addEventListener("click", () => {
//     window.location.href = "/recipes.html";
// });

document.addEventListener("DOMContentLoaded", async () => {
    await fetchRecipes();  // Load recipes initially
    await populateFilters();  // Populate dropdowns
});

// Fetch and display recipes based on selected filters
async function fetchRecipes() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category") || "";
    const cuisine = params.get("cuisine") || "";
    const mealTime = params.get("meal_time") || "";

    let queryParams = [];
    if (category) queryParams.push(`category=${encodeURIComponent(category)}`);
    if (cuisine) queryParams.push(`cuisine=${encodeURIComponent(cuisine)}`);
    if (mealTime) queryParams.push(`meal_time=${encodeURIComponent(mealTime)}`);

    const apiUrl = `/recipes?${queryParams.join("&")}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const recipes = await response.json();
        console.log("Fetched Recipes:", recipes); // Debugging

        const recipeList = document.getElementById("recipe-list");
        if (recipes.length === 0) {
            recipeList.innerHTML = `<p>No recipes found.</p>`;
            return;
        }

        recipeList.innerHTML = recipes.map(recipe => {
            // 🔍 Extract image data
            let imageSrc = "/img/bowl.jpg"; // Default image

            if (recipe.image && recipe.image.data && recipe.image.mimetype) {
                console.log("inside fetchRecipes: image, data, and mimetype detected", recipe.image);

                // Directly use the Base64 string stored in `recipe.image.data` (our database already stores the image in Base64 encoded string)
                imageSrc = `data:${recipe.image.mimetype};base64,${recipe.image.data}`;
            }



            return `            
                <div class="recipe-card">
                    
                    <img src="${imageSrc}" alt="${recipe.title}"">
                    <div class="recipe-details">
                    <h4>${recipe.title}</h4>
                    <p><strong>Category: </strong> ${recipe.tags?.category || "N/A"}</p>
                    <p><strong>Cuisine: </strong> ${recipe.tags?.cuisine || "N/A"}</p>
                    <p class= "truncated-text"><strong>Instructions: </strong> ${recipe.instructions || "N/A"}</p>
                    <a href="recipe.html">
                    <button>Continue Reading</button>
                    <a/>
                     </div>
                    <div class="recipe-info">
                        <p><strong>Meal Time: &nbsp;</strong> ${recipe.tags?.meal_time || "N/A"}</p>
                    <p><strong>Ingredients: &nbsp;</strong> ${recipe.ingredients?.join(", ") || "N/A"}</p>
                    </div>
                </div>
            `;
        }).join("");
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

