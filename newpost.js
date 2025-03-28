// Frontend JavaScript (newpost.js)
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('recipeForm');
  const imagePreview = document.getElementById('imagePreview');
  const imageInput = document.getElementById('image');

  // Fetch and populate tags
  async function fetchAndPopulateTags() {
    try {
      const response = await fetch('/tags');
      const data = await response.json();

      // Populate Category checkboxes
      const categoryContainer = document.getElementById('categoryContainer');
      categoryContainer.innerHTML = ''; // Clear existing checkboxes

      // Ensure the data is structured correctly
      const categories = data.tags?.category;  // Access the category list safely

      if (Array.isArray(categories)) {
        categories.forEach(tag => {
          const checkbox = createCheckbox('category', tag);
          categoryContainer.appendChild(checkbox);
        });
      } else {
        console.error("Expected 'tags.category' to be a List (Array in JS), but got:", categories);
      }


      // Populate Cuisine dropdown
      const cuisineDropdown = document.getElementById('cuisine');
      cuisineDropdown.innerHTML = ''; // Clear existing
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'Select Cuisine';
      cuisineDropdown.appendChild(defaultOption);

      data.availableTags.cuisines.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        cuisineDropdown.appendChild(option);
      });

      // Populate Meal Time checkboxes
      const mealTimeContainer = document.getElementById('mealTimeContainer');
      mealTimeContainer.innerHTML = ''; // Clear existing
      data.availableTags.meal_times.forEach(tag => {
        const checkbox = createCheckbox('meal_time', tag);
        mealTimeContainer.appendChild(checkbox);
      });
    } catch (error) {
      console.error('Error fetching tags:', error);
      showErrorMessage('Failed to load tags. Please try again.');
    }
  }

  // Create checkbox helper function
  function createCheckbox(name, value) {
    const label = document.createElement('label');
    label.className = 'checkbox-container';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = name;
    checkbox.value = value;

    const span = document.createElement('span');
    span.className = 'checkmark';

    label.appendChild(checkbox);
    label.appendChild(span);
    label.appendChild(document.createTextNode(value));

    return label;
  }

  // Image preview functionality
  imageInput.addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        imagePreview.innerHTML = `
          <img src="${e.target.result}" alt="Image Preview" class="preview-image">
          <button type="button" class="remove-image">Remove</button>
        `;

        // Remove image functionality
        document.querySelector('.remove-image').addEventListener('click', () => {
          imagePreview.innerHTML = '';
          imageInput.value = ''; // Clear the file input
        });
      };
      reader.readAsDataURL(file);
    }
  });

  // Form submission handler
  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    // Validate form
    if (!validateForm()) return;

    // Prepare form data
    const formData = new FormData(this);

    // Collect multi-select fields
    const categories = Array.from(
      document.querySelectorAll('input[name="category"]:checked')
    ).map(el => el.value);

    const mealTimes = Array.from(
      document.querySelectorAll('input[name="meal_time"]:checked')
    ).map(el => el.value);

    // Modify formData to handle multi-select
    formData.delete('category');
    categories.forEach(cat => formData.append('category', cat));

    formData.delete('meal_time');
    mealTimes.forEach(mt => formData.append('meal_time', mt));

    try {
      const response = await fetch('/posting', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        showSuccessMessage('Recipe posted successfully!');
        form.reset();
        imagePreview.innerHTML = '';
      } else {
        throw new Error(result.error || 'Failed to post recipe');
      }
    } catch (error) {
      console.error('Submission error:', error);
      showErrorMessage(error.message);
    }
  });

  // Form validation
  function validateForm() {
    const title = document.getElementById('title').value.trim();
    const ingredients = document.getElementById('ingredients').value.trim();
    const instructions = document.getElementById('instructions').value.trim();
    const cuisine = document.getElementById('cuisine').value;

    let isValid = true;
    const errorMessages = [];

    if (!title) {
      errorMessages.push('Recipe title is required');
      isValid = false;
    }

    if (!ingredients) {
      errorMessages.push('Ingredients are required');
      isValid = false;
    }

    if (!instructions) {
      errorMessages.push('Cooking instructions are required');
      isValid = false;
    }

    if (!cuisine) {
      errorMessages.push('Please select a cuisine');
      isValid = false;
    }

    if (!isValid) {
      showErrorMessage(errorMessages.join('<br>'));
    }

    return isValid;
  }

  // Utility message functions
  function showSuccessMessage(message) {
    const messageContainer = document.getElementById('messageContainer');
    messageContainer.innerHTML = `
      <div class="alert alert-success">${message}</div>
    `;
    setTimeout(() => {
      messageContainer.innerHTML = '';
    }, 5000);
  }

  function showErrorMessage(message) {
    const messageContainer = document.getElementById('messageContainer');
    messageContainer.innerHTML = `
      <div class="alert alert-danger">${message}</div>
    `;
    setTimeout(() => {
      messageContainer.innerHTML = '';
    }, 5000);
  }

  // Initial page load
  fetchAndPopulateTags();
});
