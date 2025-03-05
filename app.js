// app.js is the entry point of the node application
// Sets up database connection
// Defines routes (so far only /register, /login) 

const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());


// env variables
const SECRET_KEY = process.env.JWT_SECRET;
const DB_PASSwORD = process.env.DB_PASSWORD;
const DB_DATABASE = process.env.DB_DATABASE;
const DB_USER = process.env.DB_USER;
const DB_HOST = process.env.DB_HOST;

// Database connection
const db = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSwORD,
    database: DB_DATABASE,
});

db.connect(err => {
    if (err) throw err;
    console.log("Connected to MySQL");
});


// Register user
app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    db.query(sql, [username, email, hashedPassword], (err, result) => {
        if (err) return res.status(500).send(err);
        res.status(201).send("User registered");
    });
});

// Login user
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(401).send("User not found");

        const user = results[0];

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).send("Invalid credentials");

        // Generate JWT token
        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: "1h" });
        res.json({ token });
    });
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
