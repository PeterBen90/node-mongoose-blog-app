'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const {Post} = require('../models');
const {runServer, app, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function seedPostData() {
  console.info('seeding post data');
  const seedData = [];

  for (let i=1; i<=10; i++) {
    seedData.push(generatePostData());
  }

  return Post.insertMany(seedData);
}

function generatePostData() {
  return {
    title: faker.lorem.words(),
    author: {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
    },
    content: faker.lorem.paragraph(),
  };
}

function tearDownDb () {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

describe('Posts API resource', function() {

  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedPostData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

   describe('GET endpoint', function() {

    it('should return all existing posts', function() {

      let res;
      return chai.request(app)
        .get('/posts')
        .then(function(_res) {
          // so subsequent .then blocks can access response object
          res = _res;
          expect(res).to.have.status(200);
          // otherwise our db seeding didn't work
          expect(res.body.posts).to.have.length.of.at.least(1);
          return Post.count();
        })
        .then(function(count) {
          expect(res.body.posts).to.have.length(count);
        });
    });

    it('should return posts with right fields', function() {

      let resPost;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body.posts).to.be.a('array');
          expect(res.body.posts).to.have.length.of.at.least(1);

          res.body.posts.forEach(function(post) {
            expect(post).to.be.a('object');
            expect(post).to.include.keys(
              'id', 'title', 'content', 'author');
          });
          resPost = res.body.posts[0];
          return Post.findById(resPost.id);
        })
        .then(function(post) {

          expect(resPost.id).to.equal(post.id);
          expect(resPost.title).to.equal(post.title);
          expect(resPost.content).to.equal(post.content);
          expect(resPost.author).to.contain(post.author.firstName);
        });
    });
  });

  describe('POST endpoint', function() {

    it('should add a new post', function() {

      const newPost = generatePostData();

      return chai.request(app)
        .post('/posts')
        .send(newPost)
        .then(function(res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys(
            'id', 'title', 'content', 'author');
          expect(res.body.title).to.equal(newPost.title);
          // cause Mongo should have created id on insertion
          expect(res.body.id).to.not.be.null;
          expect(res.body.content).to.equal(newPost.content);

          return Post.findById(res.body.id);
        })
        .then(function(post) {
          expect(post.title).to.equal(newPost.title);
          expect(post.content).to.equal(newPost.content);
          expect(post.author.firstName).to.equal(newPost.author.firstName);
          expect(post.author.lastName).to.equal(newPost.author.lastName);
        });
    });
  });

  describe('PUT endpoint', function() {

    it('should update fields you send over', function() {
      const updateData = {
        title: 'New Title',
        content: 'This is new content.'
      };

      return Post
        .findOne()
        .then(function(post) {
          updateData.id = post.id;

          // make request then inspect it to make sure it reflects
          // data we sent
          return chai.request(app)
            .put(`/posts/${post.id}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(204);

          return Post.findById(updateData.id);
        })
        .then(function(post) {
          expect(post.title).to.equal(updateData.title);
          expect(post.content).to.equal(updateData.content);
        });
    });
  });

  describe('DELETE endpoint', function() {

    it('delete a post by id', function() {

      let post;

      return Post
        .findOne()
        .then(function(_post) {
          post = _post;
          return chai.request(app).delete(`/posts/${post.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return Post.findById(post.id);
        })
        .then(function(_post) {
          expect(_post).to.be.null;
        });
    });
  });

});


