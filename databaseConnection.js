// /**
//  * This module establishes a connection to a MongoDB Atlas database using credentials
//  * stored in environment variables. It exports the database client for use in other files.
//  *
//  * Environment Variables:
//  * - MONGODB_HOST: The MongoDB host URL
//  * - MONGODB_USER: The MongoDB username
//  * - MONGODB_PASSWORD: The MongoDB password
//  *
//  * Dependencies:
//  * - dotenv: Loads environment variables from a .env file
//  * - mongodb: Provides MongoDB client functionality
//  *
//  * Exports:
//  * - database: A MongoDB client instance configured to connect to the Atlas cluster
//  */

// require('dotenv').config();

// const mongodb_host = process.env.MONGODB_HOST;
// const mongodb_user = process.env.MONGODB_USER;
// const mongodb_password = process.env.MONGODB_PASSWORD;

// const MongoClient = require("mongodb").MongoClient;
// const atlasURI = `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/retryWrites=true`;
// var client = new MongoClient(atlasURI);

// async function connectDB() {
//     try {
//         await client.connect();
//         console.log('✅ MongoDB Connected Successfully!');
//         return client.db("TastyThreadsDB")
//     } catch (err) {
//         console.error('❌ MongoDB Connection Error:', err);
//         throw err;
//     }
// }

// module.exports = { connectDB, client }