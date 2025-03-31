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

    const apiUrl = `/recipes${queryParams.length ? `?${queryParams.join("&")}` : ""}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const recipes = await response.json();
        const recipeList = document.getElementById("recipe-list");

        if (recipes.length === 0) {
            recipeList.innerHTML = `<p>No recipes found.</p>`;
            return;
        }

        recipeList.innerHTML = recipes.map(recipe => {

            console.log("image id: ", recipe.imageID)
            let imageSrc = "/img/bowl.jpg"; // Default image
            if (recipe.image && !recipe.image.NULL) {
                // Handle base64 image if available
                if (recipe.image.B) {
                    imageSrc = `data:image/jpeg;base64,${recipe.image.B}`;
                }
            }

            // Format categories and meal times (which are arrays in DynamoDB)
            const categories = Array.isArray(recipe.tags.category)
                ? recipe.tags.category.join(", ")
                : recipe.tags.category || "N/A";

            const mealTimes = Array.isArray(recipe.tags.meal_time)
                ? recipe.tags.meal_time.join(", ")
                : recipe.tags.meal_time || "N/A";

            // Format ingredients (which is an array in DynamoDB)
            const ingredients = Array.isArray(recipe.ingredients)
                ? recipe.ingredients.join(", ")
                : recipe.ingredients || "N/A";

            return `            
                < div class="recipe-card" >
                    <img src="${imageSrc}" alt="${recipe.title}">
                        <div class="recipe-details">
                            <h4>${recipe.title}</h4>
                            <p><strong>Category: </strong> ${categories}</p>
                            <p><strong>Cuisine: </strong> ${recipe.tags.cuisine || "N/A"}</p>
                            <p>
                                <strong>Instructions: </strong>
                                <span class="short-instructions">${recipe.instructions.slice(0, 100)}...</span>
                                <span class="full-instructions" style="display: none;">${recipe.instructions}</span>
                                <button class="read-more-btn" onclick="toggleInstructions(this)">Read More</button>
                            </p>
                        </div>
                        <div class="recipe-info">
                            <p><strong>Meal Time: </strong> ${mealTimes}</p>
                            <p><strong>Ingredients: </strong> ${ingredients}</p>
                        </div>
                    </div>
            `;
        }).join("");
    } catch (error) {
        console.error("Error fetching recipes:", error);
        document.getElementById("recipe-list").innerHTML = "<p>Failed to load recipes.</p>";
    }
}

// Populate dropdown filters dynamically using existing /tags endpoint
async function populateFilters() {
    try {
        const response = await fetch("/tags");
        if (!response.ok) throw new Error(`HTTP error! Status: ${ response.status } `);

        const data = await response.json();
        const filters = data.availableTags; // Use the structure from your existing endpoint

        populateDropdown("category", filters.categories);
        populateDropdown("cuisine", filters.cuisines);
        populateDropdown("meal_time", filters.meal_times);

        // Pre-select filters based on URL parameters
        const params = new URLSearchParams(window.location.search);

        if (params.get("category")) {
            document.getElementById("category").value = params.get("category");
        }

        if (params.get("cuisine")) {
            document.getElementById("cuisine").value = params.get("cuisine");
        }

        if (params.get("meal_time")) {
            document.getElementById("meal_time").value = params.get("meal_time");
        }
    }
    catch (error) {
        console.error("Error fetching filters:", error);
    }
}

// Helper function to populate dropdowns
function populateDropdown(elementId, options) {
    const dropdown = document.getElementById(elementId);
    dropdown.innerHTML = `< option value = "" > All</option > `; // Default option

    options.forEach(option => {
        const newOption = document.createElement("option");
        newOption.value = option;
        newOption.textContent = option;
        dropdown.appendChild(newOption);
    });
}

// Update the filters and reload page with new query params
function updateFilters() {
    const category = document.getElementById("category").value;
    const cuisine = document.getElementById("cuisine").value;
    const mealTime = document.getElementById("meal_time").value;

    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (cuisine) params.append("cuisine", cuisine);
    if (mealTime) params.append("meal_time", mealTime);

    // Update the URL in browser without reloading
    window.history.pushState({}, "", `? ${ params.toString() } `);

    // Fetch filtered recipes without full page reload
    fetchRecipes();
}

// Listen for continue button clicks
document.addEventListener("click", function (event) {
    if (event.target.matches(".continueReadingBtn")) {
        const recipeId = event.target.getAttribute("data-id");
        window.location.href = `/ recipe.html ? id = ${ recipeId } `;
    }
});


function toggleInstructions(button) {
    const shortText = button.previousElementSibling.previousElementSibling;
    const fullText = button.previousElementSibling;
    
    if (shortText.style.display === "none") {
        shortText.style.display = "inline";
        fullText.style.display = "none";
        button.textContent = "Read More";
    } else {
        shortText.style.display = "none";
        fullText.style.display = "inline";
        button.textContent = "Show Less";
    }
}
