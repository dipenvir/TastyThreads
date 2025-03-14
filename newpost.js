// Function to display a confirmation message
function showConfirmationMessage() {
  // Check if the message already exists
  let confirmationMessage = document.getElementById("confirmationMessage");

  // If it doesn't exist, create it
  if (!confirmationMessage) {
    confirmationMessage = document.createElement("div");
    confirmationMessage.id = "confirmationMessage";
    confirmationMessage.className = "confirmation-message";
    confirmationMessage.textContent = "Your recipe has been successfully posted!";

    // Insert the message above the form
    const form = document.getElementById("recipeForm");
    form.parentNode.insertBefore(confirmationMessage, form);
  }

  // Show the message
  confirmationMessage.style.display = "block";

  // Optionally, hide the message after a few seconds
  setTimeout(() => {
    confirmationMessage.style.display = "none";
  }, 5000); // Hide after 5 seconds
}

// Fetch tags and populate the form
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

// Fetch tags when the page loads
fetchTags();

// Handle form submission
document.getElementById("recipeForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const formData = new FormData(this);

  // Send form data to backend
  fetch("/posting", {
    method: "POST",
    body: formData
  })
    .then(response => {
      if (response.ok) {
        // If the server responds with a success status, show the confirmation message
        showConfirmationMessage();

        // Reset the form
        this.reset();
      } else {
        console.error("Form submission failed");
      }
    })
    .catch(error => {
      console.error("Error:", error);
    });
});