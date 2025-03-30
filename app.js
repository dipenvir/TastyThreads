// IMPORTS
const express = require("express");
const cookie = require("cookie-parser");
const cors = require("cors");
const app = express();
const path = require("path");
const multer = require("multer");
const AWS = require("aws-sdk");
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const jwt = require('jsonwebtoken');
// const userPool = require('./cognitoConfigBackend'); // Import userPool from the cognito module
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
const clientId = process.env.COGNITO_CLIENT_ID;

// // AWS SDK imports
// const { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand, QueryCommand } = require("@aws-sdk/client-dynamodb");
// const { unmarshall } = require("@aws-sdk/util-dynamodb");

// Set up Cookie
app.use(cors({
  origin: "*", // Wildcard, can update to EC2 IP address for better security 
  credentials: true, // Allows cookies to be sent

  allowedHeaders: ["Content-Type", "Authorization"], // Allow auth headers

}));

app.use(cookie())


// // LOGIN (COGNITO AUTHENTICATION WITH TOKEN)
// app.post("/loggingin", async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const params = {
//       AuthFlow: "USER_PASSWORD_AUTH",
//       ClientId: clientId,
//       AuthParameters: {
//         USERNAME: email,
//         PASSWORD: password,
//       },
//     };
//     const authResult = await cognito.initiateAuth(params).promise();
//     // Send the token to the front end
//     res.json({
//       message: "Login successful",
//       token: authResult.AuthenticationResult.IdToken
//     });
//   } catch (error) {
//     console.error("Error logging in:", error);
//     res.status(401).json({ error: "Invalid credentials" });
//   }
// });

// Middleware

const authenticate = async (req, res, next) => {

  const token = req.cookies.authToken; // Read token from cookie

  if (!token) {
    return res.status(403).send("Access denied. No token found.");
  }

  try {
    // For Cognito tokens, you need to verify using the JWKS (JSON Web Key Set)
    // from your Cognito User Pool

    // This is a simplified approach - using the cognito object you already have
    const params = { AccessToken: token };
    // Verify the access token is valid
    const userData = await cognito.getUser(params).promise();

    // If we get here, token is valid - extract user info
    const email = userData.UserAttributes.find(attr => attr.Name === 'email')?.Value;
    const username = userData.UserAttributes.find(attr => attr.Name === 'name')?.Value;

    console.log("UserAttributes:", userData.UserAttributes);


    // Add user info to request
    // req.user = {
    //   email: email,
    //   username: username
    // };

    req.user = { email, username };

    next();
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(401).send("Invalid token");
  }
};

// Route for authentication (for front-end authentication since we are using HTTP-only cookies)
app.get("/check-auth", authenticate, async (req, res) => {
  res.json({ authenticated: true, user: req.user }) // might as well send user information
})

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

// LOGGING OUT
app.get("/logout", (req, res) => {
  res.clearCookie("authToken"); // authToken is the name of our cookie
  res.json({ message: "Logged out successfully" });
});


// TODO RAFACTOR LOGIN PAGE
app.get("/login", async (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"))
})

// Login with cookie
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
    const token = authResult.AuthenticationResult.AccessToken; // ✅ Use Access Token

    // Set the token in an HTTP-only cookie (secure prevents JS access)
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: true, // Set to true if using HTTPS
      sameSite: "Lax", // 
      maxAge: 14400000, // 4 hours
    });

    res.json({ redirect: "/home" });
  } catch (error) {
    console.error("Error logging in:", error.message, error.stack);
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Register user (not using this)
// app.post("/registerUser", async (req, res) => {
//   const { username, email, password } = req.body;
//   try {
//     const params = {
//       ClientId: clientId,
//       Username: email,
//       Password: password,
//       UserAttributes: [
//         { Name: "email", Value: email },
//         { Name: "custom:username", Value: username }
//       ],
//     };
//     await cognito.signUp(params).promise();
//     res.json({ message: "User registered successfully! Please confirm your email." });
//   } catch (error) {
//     console.error("Error registering user:", error);
//     res.status(500).json({ error: error.message });
//   }
// });


// TODO REFACTOR CREATING A NEW POST PAGE

app.get("/tags", async (req, res) => {
  try {
    const params = {
      TableName: recipesTable,
      ProjectionExpression: "tags"
    };

    const result = await dynamoDB.scan(params).promise();

    // console.log("Raw Data from DynamoDB:", JSON.stringify(result.Items, null, 2));

    const categories = new Set();
    const cuisines = new Set();
    const meal_times = new Set();

    result.Items.forEach(item => {
      const tagData = item.tags; // Directly access the tags object

      // Extract categories (Array of strings)
      if (Array.isArray(tagData.category)) {
        tagData.category.forEach(cat => {
          categories.add(cat);
        });
      }

      // Extract cuisine (String)
      if (typeof tagData.cuisine === 'string') {
        cuisines.add(tagData.cuisine);
      }

      // Extract meal_time (Array of String)
      if (Array.isArray(tagData.meal_time)) {
        tagData.meal_time.forEach(mt => {
          meal_times.add(mt);
        })
      }
    });

    console.log("Processed Tags:", {
      categories: Array.from(categories),
      cuisines: Array.from(cuisines),
      meal_times: Array.from(meal_times)
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
app.get('/newPost', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'newpost.html')); // Adjust path if needed
});

app.post('/posting', authenticate, upload.single('image'), async (req, res) => {
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

    // User req.user.email
    const userEmail = req.user.email || (req.user ? req.user.id : 'anonymous');

    // Generate unique recipe ID
    const recipeId = uuidv4();
    const createdAt = new Date().toISOString();

    // Handle image if present
    let image = null;
    if (req.file) {
      // Convert image buffer to base64 string for storage
      const imageData = req.file.buffer.toString('base64');

      image = {
        name: req.file.originalname,
        mimetype: req.file.mimetype,
        data: imageData // todo ONCE POSTING PAGE LOADS
      };
    }

    // Normalize tag inputs
    const normalizedCategories = Array.isArray(category)
      ? category
      : category ? [category] : [];

    const normalizedMealTimes = Array.isArray(meal_time)
      ? meal_time
      : meal_time ? [meal_time] : [];

    // Parse ingredients properly
    const parsedIngredients = Array.isArray(ingredients)
      ? ingredients
      : typeof ingredients === 'string'
        ? ingredients.split(',').map(ing => ing.trim())
        : [];

    const recipeItem = {
      user: userEmail, // This is now the email from the frontend
      recipeID: recipeId,
      cooking_time: cooking_time ? parseInt(cooking_time) : null,
      createdAt: createdAt,
      image: image,
      ingredients: parsedIngredients,
      instructions: instructions || "",
      tags: {
        category: normalizedCategories,
        cuisine: cuisine || "Unknown",
        meal_time: normalizedMealTimes.length > 0
          ? normalizedMealTimes
          : ["Any"]
      },
      title: title || "Untitled Recipe"
    };

    console.log("Saving recipe with user:", userEmail);

    await dynamoDB.put({
      TableName: recipesTable,
      Item: recipeItem
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

// RECIPES PAGE Filter and fetch recipes from DynamoDB
app.get("/recipes", async (req, res) => {
  try {
    const { category, cuisine, meal_time } = req.query;

    let params = {
      TableName: recipesTable
    };

    // Add filtering if query parameters exist
    if (category || cuisine || meal_time) {
      let filterExpressions = [];
      let expressionAttributeNames = {
        "#tags": "tags"
      };
      let expressionAttributeValues = {};

      if (category) {
        filterExpressions.push("contains(#tags.#category, :category)");
        expressionAttributeNames["#category"] = "category";
        expressionAttributeValues[":category"] = category;
      }

      if (cuisine) {
        filterExpressions.push("#tags.#cuisine = :cuisine");
        expressionAttributeNames["#cuisine"] = "cuisine";
        expressionAttributeValues[":cuisine"] = cuisine;
      }

      if (meal_time) {
        filterExpressions.push("contains(#tags.#meal_time, :meal_time)");
        expressionAttributeNames["#meal_time"] = "meal_time";
        expressionAttributeValues[":meal_time"] = meal_time;
      }

      if (filterExpressions.length > 0) {
        params.FilterExpression = filterExpressions.join(" AND ");
        params.ExpressionAttributeNames = expressionAttributeNames;
        params.ExpressionAttributeValues = expressionAttributeValues;
      }
    }

    const data = await dynamoDB.scan(params).promise();

    // Transform DynamoDB items to a more usable format for the frontend
    const recipes = data.Items.map(item => {
      return {
        recipeID: item.recipeID,
        title: item.title,
        instructions: item.instructions,
        image: item.image,
        ingredients: item.ingredients || [],
        tags: item.tags || { category: [], cuisine: "", meal_time: [] },
        cooking_time: item.cooking_time,
        createdAt: item.createdAt
      };
    });

    res.json(recipes);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// app.get("/recipe/:id", authenticate, async (req, res) => {
//   console.log(`Attempting to fetch recipe with ID: ${req.params.id}`);
//   console.log("email :", req.user.email)

//   // if (!req.user || !req.user.sub) {
//   //   return res.status(400).json({ error: "User authentication required" });
//   // }

//   // const userId = req.user.sub; // Use Cognito sub as the user ID

//   // console.log("Type of user:", typeof req.user.email);
//   // console.log("Type of recipeID:", typeof req.params.id);


//   try {
//     const params = {
//       TableName: recipesTable,
//       Key: {
//         "user": { S: req.user.email },
//         "recipeID": { S: req.params.id }
//       }
//     };

//     console.log("DynamoDB request params:", JSON.stringify(params));

//     const data = await dynamoDB.get(params).promise();
//     console.log("DynamoDB response:", JSON.stringify(data));

//     if (!data.Item) {
//       return res.status(404).json({ error: "Recipe not found" });
//     }

//     const item = data.Item;
//     const recipe = {
//       id: item.recipeID.S,
//       title: item.title.S,
//       instructions: item.instructions.S,
//       image: item.image.M,  // Keep the complex structure for image
//       ingredients: item.ingredients.L.map(ing => ing.S),
//       tags: {
//         category: item.tags.M.category.L.map(cat => cat.S),
//         cuisine: item.tags.M.cuisine.S,
//         meal_time: item.tags.M.meal_time.L.map(time => time.S)
//       },
//       cooking_time: item.cooking_time.N,
//       createdAt: item.createdAt.S
//     };

//     // Check if the request is expecting JSON or an HTML page
//     if (req.headers.accept && req.headers.accept.includes("application/json")) {
//       return res.json(recipe);
//     } else {
//       return res.render("recipe", { recipe }); // Render HTML page
//     }
//   } catch (error) {
//     console.error("Error fetching recipe:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

app.get("/recipe/:id", authenticate, async (req, res) => {
  console.log(`Attempting to fetch recipe with ID: ${req.params.id}`);
  console.log("email :", req.user.email);

  try {
    const params = {
      TableName: "TastyThreadsDB",
      Key: { // Dont use low level type markers (use document client!)
        user: req.user.email,
        recipeID: req.params.id
      }
    };

    console.log("DynamoDB request params:", JSON.stringify(params));

    const result = await dynamoDB.get(params).promise();

    if (!result.Item) {
      return res.status(403).json({ error: "Recipe not found" });
    }

    res.json(result.Item);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(500).json({ error: "Failed to fetch recipe" });
  }
});

app.get("/profile", authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, "profile.html"));
});

// Backend route handler for /api/profile-recipes
app.get("/api/profile-recipes", authenticate, async (req, res) => {
  try {
    const userEmail = req.user.email;

    if (!userEmail) {
      return res.status(401).json({ error: "Unauthorized: No user logged in" });
    }

    // Query parameters for DynamoDB
    // Using ExpressionAttributeNames to handle the reserved keyword `user` (dont use attribtue name 'user' in dynamodb for the future)
    const params = {
      TableName: recipesTable,
      FilterExpression: "#userField = :userEmail",
      ExpressionAttributeNames: {
        "#userField": "user"
      },
      ExpressionAttributeValues: {
        ":userEmail": userEmail
      }
    };


    // Query DynamoDB
    const result = await dynamoDB.scan(params).promise();

    // Transform the result to a simplified format for the frontend
    const userRecipes = result.Items.map(item => ({
      recipeID: item.recipeID,
      title: item.title,
      cooking_time: item.cooking_time,
      image: item.image,
      tags: item.tags,
      createdAt: item.createdAt
    }));

    res.json(userRecipes);
  } catch (error) {
    console.error("Error fetching user recipes:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
