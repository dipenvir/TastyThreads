// IMPORTS
const express = require("express");
const app = express();
const path = require("path");
const multer = require("multer");
const AWS = require("aws-sdk");
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const jwt = require('jsonwebtoken');
const userPool = require('./cognitoConfigBackend'); // Import userPool from the cognito module
const { v4: uuidv4 } = require('uuid');
require("dotenv").config();

app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use(express.urlencoded({ extended: true }));

// AWS CONFIGURATION
AWS.config.update({ region: process.env.AWS_REGION });
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const cognito = new AWS.CognitoIdentityServiceProvider();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ENV VARIABLES
const recipesTable = process.env.DYNAMODB_RECIPES_TABLE;

// // AWS SDK imports
// const { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand, QueryCommand } = require("@aws-sdk/client-dynamodb");
// const { unmarshall } = require("@aws-sdk/util-dynamodb");


// TODO RAFACTOR LANDING PAGE
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
}
)

// TODO RAFACTOR HOME PAGE
app.get("/home", async (req, res) => {
  res.sendFile(path.join(__dirname, "home.html"))
})

// TODO RAFACTOR GET USERNAME API (Populates the user's username in home page)
// app.get("/getUser", async (req, res) => {
//   if (req.session.authenticated) {
//     res.json({
//       username: req.session.username,
//       email: req.session.email
//     });
//   } else {
//     res.json({
//       username: null,
//       email: null
//     });
//   }
// });

// TODO LOGOUT (Clears session token on frontend)
app.get("/logout", (req, res) => {
  res.json({ message: "Logout successful" });
});


// TODO RAFACTOR LOGIN PAGE
app.get("/login", async (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"))
})

// Register user
app.post("/registerUser", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const params = {
      ClientId: clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "custom:username", Value: username }
      ],
    };
    await cognito.signUp(params).promise();
    res.json({ message: "User registered successfully! Please confirm your email." });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: error.message });
  }
});


// LOGIN (COGNITO AUTHENTICATION)
app.post("/loggingin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const params = {
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    };
    const authResult = await cognito.initiateAuth(params).promise();
    res.json({ message: "Login successful", token: authResult.AuthenticationResult.IdToken });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// TODO REFACTOR CREATING A NEW POST PAGE
app.get("/tags", async (req, res) => {
  try {
    const params = {
      TableName: recipesTable,
      ProjectionExpression: "tags.category, tags.cuisine, tags.meal_time"
    };

    const result = await dynamoDB.scan(params).promise();

    const categories = new Set();
    const cuisines = new Set();
    const meal_times = new Set();

    result.Items.forEach(item => {
      // Handle categories (DynamoDB List format)
      if (item.tags?.category?.L) {
        item.tags.category.L.forEach(cat => categories.add(cat.S)); // Extract the string value
      }

      // Handle cuisine (DynamoDB stores as single value)
      if (item.tags?.cuisine?.S) {
        cuisines.add(item.tags.cuisine.S);
      }

      // Handle meal times (DynamoDB List format)
      if (item.tags?.meal_time?.L) {
        item.tags.meal_time.L.forEach(mt => meal_times.add(mt.S)); // Extract string value
      } else if (item.tags?.meal_time?.S) {
        meal_times.add(item.tags.meal_time.S);
      }
    });

    res.json({
      availableTags: {
        categories: Array.from(categories).sort(),
        cuisines: Array.from(cuisines).sort(),
        meal_times: Array.from(meal_times).sort()
      }
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Example of a route handler that uses Cognito
app.get('/newPost', (req, res) => {
  res.sendFile(path.join(__dirname, 'newpost.html')); // Adjust path if needed
});



app.post('/posting', upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      ingredients,
      instructions,
      category,
      cuisine,
      meal_time,
      cooking_time
    } = req.body;

    // Get user from session or token
    const user = req.user ? req.user.id : 'anonymous';

    // Generate unique recipe ID
    const recipeId = uuidv4();
    const createdAt = new Date().toISOString();

    // Handle image upload to S3 (optional)
    // let imageUrl = null;
    // if (req.file) {
    //   const params = {
    //     Bucket: BUCKET_NAME,
    //     Key: `recipes/${recipeId}/${req.file.originalname}`,
    //     Body: req.file.buffer,
    //     ContentType: req.file.mimetype
    //   };

    //   const s3Result = await s3.upload(params).promise();
    //   imageUrl = s3Result.Location;
    // }

    // Normalize tag inputs
    const normalizedCategories = Array.isArray(category)
      ? category
      : [category].filter(Boolean);

    const normalizedMealTimes = Array.isArray(meal_time)
      ? meal_time
      : [meal_time].filter(Boolean);

    // Prepare recipe item
    const newRecipe = {
      pk: `RECIPE#${recipeId}`,
      sk: `METADATA#${recipeId}`,
      recipeId,
      user,
      title,
      imageUrl,
      ingredients: ingredients.split(',').map(ing => ing.trim()),
      instructions,
      tags: {
        category: normalizedCategories,
        cuisine,
        meal_time: normalizedMealTimes
      },
      cooking_time,
      createdAt,

      // Optional indexing fields
      gsi1pk: `USER#${user}`,
      gsi1sk: `RECIPE#${createdAt}`,
      gsi2pk: `CUISINE#${cuisine}`,
      gsi3pk: `CATEGORY#${normalizedCategories[0]}`
    };

    // Write to DynamoDB
    await dynamoDB.put({
      TableName: recipesTable,
      Item: newRecipe
    }).promise();

    res.status(201).json({
      message: 'Recipe created successfully',
      recipeId
    });
  } catch (error) {
    console.error('Recipe creation error:', error);
    res.status(500).json({
      error: 'Failed to create recipe',
      details: error.message
    });
  }
});


// RECIPES PAGE
app.get("/recipes", async (req, res) => {
  try {
    const params = { TableName: recipesTable };
    const data = await dynamoDB.scan(params).promise();
    res.json({ recipes: data.Items });
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// I think I can just reuse the app.get("/getTags") api route 
app.get("/getFilters", async (req, res) => {
  try {
    const categories = await recipesCollection.distinct("tags.category");
    const cuisines = await recipesCollection.distinct("tags.cuisine");
    const meal_times = await recipesCollection.distinct("tags.meal_time");

    res.json({ categories, cuisines, meal_times });
  } catch (error) {
    console.error("Error fetching filters:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// FETCHES THE IMAGE BY RECIPE ID
app.get("/image/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await recipesCollection.findOne({ _id: new ObjectId(id) });

    if (!recipe || !recipe.image) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.set("Content-Type", recipe.image.mimetype);
    res.send(recipe.image.data);
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// PROFILE PAGE
app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "profile.html"));
});

app.get("/api/profile-recipes", async (req, res) => {
  try {
    console.log("Session data: ", req.session);
    const userEmail = req.session.email;

    if (!userEmail) {
      return res.status(401).json({ error: "Unauthorized: No user logged in" });
    }

    const userRecipes = await recipesCollection.find({ user: userEmail }).toArray();
    res.json(userRecipes);
  } catch (error) {
    console.error("Error fetching user recipes:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// RECIPE PAGE (individual recipes, not the whole recipe page)
app.get("/recipe/:id", async (req, res) => {
  try {
    const recipe = await recipesCollection.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.json(recipe);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Protect routes middleware
const authenticate = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(403).send("Access denied");

  try {
    const verified = jwt.verify(token, SECRET_KEY);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send("Invalid token");
  }
};

// Example of a protected route
// app.get("/profile", authenticate, (req, res) => {
//     res.send(`Welcome, user ${req.user.email}`);
// });


app.listen(3000, () => console.log("Server running on port 3000"));
