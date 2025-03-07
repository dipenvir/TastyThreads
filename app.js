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
let usersCollection;

async function startApp() {
    try {
        // Connect to the database
        await client.connect();
        console.log("✅ MongoDB Connected Successfully!");

        // Access the database and collection
        const database = client.db("TastyThreadsDB");
        usersCollection = database.collection("users");
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
    res.json({ isAuthenticated: isValidSession(req), user: req.session.user || null });
});

// LANDING PAGE
app.get("/", async (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"))
})

// HOME PAGE
app.get("/home", async (req, res) => {
    res.sendFile(path.join(__dirname, "home.html"))
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
        res.redirect("/home")
    } catch (err) {
        console.error("Error inserting user: ", err);
        res.status(500).send("Error registering user");
    }
});


// LOGIN PAGE
app.get("/login", async (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"))
});

// LOGIN AUTHENTICATION
app.post("/loggingin", async (req, res) => {
    var email = req.body.loginEmail;
    var password = req.body.loginPassword;

    //email format with 255 max char, and passowrd with 20 max char
    const schema = Joi.object({
        email: Joi.string().email().max(255).required(),
        password: Joi.string().max(20).required(),
    });

    const validationResult = schema.validate({ email, password });

    if (validationResult.error != null) {
        res.redirect("/login");
        return;
    }
    const result = await usersCollection
        .find({ email: email })
        .project({ email: 1, password: 1, _id: 1, username: 1 })
        .toArray();

    if (result.length != 1) {
        console.log("multiple email accounts using same email lol")
        res.redirect("/login");
        return;
    }

    if (await bcrypt.compare(password, result[0].password)) {
        req.session.authenticated = true;
        req.session.username = result[0].username;
        req.session.email = email;
        req.session.cookie.maxAge = expireTime;
        console.log("logged in successfully")
        res.redirect("/home");
        return;
    } else {
        console.log("logged in UNsuccessfully")
        res.redirect("/login");
        return;
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
