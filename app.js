// IMPORTS
const express = require("express");
const app = express();
const $ = require("jquery");
const path = require("path");
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use(express.urlencoded({ extended: true }));
const { resourceUsage } = require("process");

// MongoDB imports
const MongoStore = require("connect-mongo");
const mongodb = require("mongodb");

// Sessions, password hashing, JOI validations imports
const session = require("express-session");
const bcrypt = require("bcryptjs");
const Joi = require("joi");

// Uploading images imports
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// env variables
require("dotenv").config();
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;

// Salt rounds for hashing
const saltRounds = 12;
const expireTime = 23 * 60 * 60 * 1000;

// CONNECTING TO MONGODB DATABASE
// var { database } = require("./databaseConnection"); <-- later can add to database connection module

const { MongoClient } = require("mongodb");
const uri = `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_database}?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

// Our databases as global variables (use these for better readability)
let usersCollection;
let recipesCollection;

async function startApp() {
  try {
    // Connect to the database
    await client.connect();
    console.log("✅ MongoDB Connected Successfully!");

    // Access the database and collection
    const database = client.db("TastyThreadsDB");
    usersCollection = database.collection("users");
    recipesCollection = database.collection("recipes");
    console.log("Database Ready:", database.databaseName);

    // Example: Find all users
    const users = await usersCollection.find({}).toArray();
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
  }
}

// CREATING MONGO STORE
var mongoStore = MongoStore.create({
  mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
  crypto: {
    secret: mongodb_session_secret
  }
})

startApp();

// Session Middleware
app.use(
  session({
    secret: node_session_secret,
    store: mongoStore,
    saveUninitialized: false,
    resave: true
  })
)

// Returns true if user is in a valid session, otherwise false
function isValidSession(req) {
  if (req.session.authenticated) {
    return true;
  }
  return false;
}

// Middleware for validating a session
function sessionValidation(req, res, next) {
  if (isValidSession(req)) {
    next();
  } else {
    res.redirect("/login");
  }
}

// Route to check authenticated status (logged in vs out)
app.get("/auth/status", (req, res) => {
  res.json({ isAuthenticated: isValidSession(req), user: req.session.username || null });
});

// LANDING PAGE
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
}
)

// HOME PAGE
app.get("/home", async (req, res) => {
  res.sendFile(path.join(__dirname, "home.html"))
})

// GET USERNAME API (Populates the user's username in home page)
app.get("/getUser", async (req, res) => {
  if (req.session.authenticated) {
    res.json({
      username: req.session.username,
      email: req.session.email
    });
  } else {
    res.json({
      username: null,
      email: null
    });
  }
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
})


// LOGIN PAGE
app.get("/login", async (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"))
})

// Register user
app.post("/registerUser", async (req, res) => {

  console.log("Inside registerUser:", req.body);

  // req variables
  var username = req.body.username;
  var email = req.body.email;
  var password = req.body.password;

  // Schema for JOI validation
  const schema = Joi.object({
    username: Joi.string().max(40).required(),
    email: Joi.string().email().max(255).required(),
    password: Joi.string().max(20).required()
  })
  // Validate input
  const validationResult = schema.validate({ username, email, password });
  if (validationResult.error) {
    return res.status(400).send(validationResult.error.details[0].message);
  }

  try {
    var hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new (validated) user to the database!
    await usersCollection.insertOne({
      username: username,
      email: email,
      password: hashedPassword
    });

    // Query for the user
    const result = await usersCollection
      .find({ email: email })
      .project({ email: 1, password: 1, username: 1 })
      .toArray();
    // Update the session and send user to home page
    req.session.authenticated = true;
    req.session.username = result[0].username;
    req.session.email = result[0].email;
    req.session.cookie.maxAge = expireTime;

    console.log("Successfully created user... redirecting to home page")

    // Response
    res.json({ redirect: "/home" });

  } catch (err) {
    console.error("Error inserting user: ", err);
    res.status(500).send("Error registering user");
  }
});


// LOGIN PAGE
app.get("/login", async (req, res) => {
  res.sendFile(path.join(__dirname, "login2.html"))
});

// LOGIN AUTHENTICATION
app.post("/loggingin", async (req, res) => {
  var email = req.body.email;
  var password = req.body.password;

  //email format with 255 max char, and passowrd with 20 max char
  const schema = Joi.object({
    email: Joi.string().email().max(255).required(),
    password: Joi.string().max(20).required(),
  });

  const validationResult = schema.validate({ email, password });

  if (validationResult.error != null) {
    return res.json({ message: "Invalid email or password." });
  }

  // Check if user exists
  const result = await usersCollection
    .find({ email: email })
    .project({ email: 1, password: 1, _id: 1, username: 1 })
    .toArray();

  if (result.length === 0) {
    return res.json({ message: "User does not exist." });
  }

  if (result.length > 1) {
    console.log("Multiple email accounts using the same email.");
    return res.json({ message: "Multiple accounts found. Contact support." });
  }

  if (await bcrypt.compare(password, result[0].password)) {
    req.session.authenticated = true;
    req.session.username = result[0].username;
    req.session.email = email;
    req.session.cookie.maxAge = expireTime;

    // Response
    console.log("logged in successfully")
    return res.json({ redirect: "/home" });

  }
  else {
    return res.json({ message: "Incorrect password." });
  }
});

// CREATING A NEW POST PAGE
app.get("/tags", async (req, res) => {
  try {
    // Fetch distinct tags for each category
    const categories = await recipesCollection.distinct("tags.category");
    const cuisines = await recipesCollection.distinct("tags.cuisine");
    const meal_times = await recipesCollection.distinct("tags.meal_time");

    // Send structured tag data
    res.json({
      availableTags: {
        categories,
        cuisines,
        meal_times
      }
    });
  }
  catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/newPost", sessionValidation, (req, res) => {
  try {
    // Send the HTML file
    res.sendFile(path.join(__dirname, 'newpost.html')); // Adjust path if needed
  }
  catch (error) {
    console.error("Error serving newPost page:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.post("/posting", upload.single("image"), async (req, res) => {
  try {
    const user = req.session.email;
    const { title, ingredients, instructions, category, cuisine, meal_time, cooking_time } = req.body;

    console.log("Tags should appear here:", { category, cuisine, meal_time });

    const newRecipe = {
      user,
      title,
      image: req.file
        ? {
          name: req.file.originalname,
          data: req.file.buffer, // Store raw binary image data
          mimetype: req.file.mimetype, // Store the image type (e.g., "image/png")
        }
        : null, // If no image is uploaded, store `null`
      ingredients: ingredients.split(","), // Convert CSV string into an array
      instructions,
      tags: {
        category: category || null,
        cuisine: cuisine || null,
        meal_time: meal_time || null,
      },
      cooking_time,
      createdAt: new Date(),
    };

    const result = await recipesCollection.insertOne(newRecipe);

    res.json({ message: "Recipe added successfully!", recipeId: result.insertedId });
  } catch (error) {
    console.error("Error adding recipe:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// RECIPES PAGE
app.get("/recipes", async (req, res) => {
  try {
    const { category, cuisine, meal_time } = req.query;

    let filter = [];

    if (category) filter.push({ "tags.category": category });
    if (cuisine) filter.push({ "tags.cuisine": cuisine });
    if (meal_time) filter.push({ "tags.meal_time": meal_time });

    // Apply filtering only if there are conditions
    const query = filter.length > 0 ? { $and: filter } : {};

    const recipes = await recipesCollection.find(query).toArray();
    res.json(recipes);
  }
  catch (error) {
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
