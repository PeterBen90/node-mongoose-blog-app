'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');


mongoose.Promise = global.Promise;


const { PORT, DATABASE_URL } = require('./config');
const { Post } = require('./models');

const app = express();
app.use(bodyParser.json());

// GET requests to /posts => return 10 posts
app.get('/posts', (req, res) => {
  Post
    .find()
    .limit(10)
    .then(posts => {
      res.json({
        posts: posts.map(
          (post) => post.serialize())
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    });
});

// can also request by ID
app.get('/posts/:id', (req, res) => {
  Post
    .findById(req.params.id)
    .then(post => res.json(post.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    });
});

let server;

// this function connects to our database, then starts the server
function runServer(databaseUrl = DATABASE_URL, port = PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, {useMongoClient: true}, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer().catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };



