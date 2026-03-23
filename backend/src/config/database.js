// src/config/database.js
const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flixvideo';

let db = null;

const getDB = () => {
  if (!db) {
    if (!global.mongoClient) {
      throw new Error('MongoDB not connected. Call connectMongoDB first.');
    }
    db = global.mongoClient.db();
  }
  return db;
};

// Collection helpers — use these in models instead of global.mongoClient directly
const getCollection = (name) => getDB().collection(name);

module.exports = { getDB, getCollection };