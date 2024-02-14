// config/db.js

const mongoose = require('mongoose');
require('dotenv').config();

function connect() {
  const uri = process.env.MONGODB_URI;

  mongoose.connect(uri, {});

  const db = mongoose.connection;

  db.on('error', console.error.bind(console, 'MongoDB connection error:'));
  db.once('open', () => {
    console.log('Connected to the database');
  });

  return db;
}

module.exports = { connect };
