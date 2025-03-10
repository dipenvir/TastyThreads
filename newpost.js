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
  try {
    const response = await fetch("/tags");
    const data = await response.json();

    // Dynamically create checkboxes for each tag
    const tagsContainer = document.getElementById("tagsContainer");
    data.availableTags.forEach(tag => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "tags";
      checkbox.value = tag;
      tagsContainer.appendChild(checkbox);

      const label = document.createElement("label");
      label.textContent = tag;
      tagsContainer.appendChild(label);

      tagsContainer.appendChild(document.createElement("br"));
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
  }
}

fetchTags(); // Load tags when the page loads
