// // Route to get recipes by using the tags (add this to app.js later)

// app.get("/recipes", async (req, res) => {
//   try {
//     const tag = req.query.tag;
//     const query = tag ? { tags: tag } : {}; // Find recipes that match the tag
//     const recipes = await database.db(mongodb_database).collection("recipes").find(query).toArray();

//     res.json(recipes);
//   } catch (error) {
//     console.error("Error fetching recipes:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

async function fetchTags() {
  const response = await fetch("/tags");
  const data = await response.json();

  // Populate Category checkboxes
  const categoryContainer = document.getElementById("categoryContainer");
  data.availableTags.categories.forEach(tag => {
    const checkbox = createCheckbox("category", tag);
    categoryContainer.appendChild(checkbox);
  });

  // Populate Cuisine dropdown
  const cuisineDropdown = document.getElementById("cuisine");
  data.availableTags.cuisines.forEach(tag => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    cuisineDropdown.appendChild(option);
  });

  // Populate Meal Time checkboxes
  const mealTimeContainer = document.getElementById("mealTimeContainer");
  data.availableTags.meal_times.forEach(tag => {
    const checkbox = createCheckbox("meal_time", tag);
    mealTimeContainer.appendChild(checkbox);
  });
}

// Function to create a checkbox dynamically
function createCheckbox(name, value) {
  const label = document.createElement("label");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.name = name;
  checkbox.value = value;

  const span = document.createElement("span");
  span.className = "checkmark";

  label.appendChild(checkbox);
  label.appendChild(span);
  label.appendChild(document.createTextNode(value));

  return label;
}

fetchTags();

// Collects the user-selected category, cuisine, and meal_time values
document.getElementById("recipeForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const formData = new FormData(this);

  // Send form data to backend
  fetch("/posting", {
    method: "POST",
    body: formData
  })
    .then(response => response.json())
    .then(data => {
      console.log("Recipe submitted:", data);
      // Optionally handle success
    })
    .catch(error => {
      console.error("Error:", error);
    });
});
