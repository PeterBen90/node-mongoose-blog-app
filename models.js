'use strict';

const mongoose = require('mongoose');

// this is our schema to represent a restaurant
const postSchema = mongoose.Schema({
  title: {type: String, required: true},
  author: {
    firstName: String,
    lastName: String,
    required: true
  },
  content: {type: String, required: true}
});

postSchema.virtual('authorString').get(function() {
  return `${this.author.firstName} ${this.author.lastName}`.trim()});

postSchema.methods.serialize = function() {

  return {
    id: this._id,
    title: this.title,
    content: this.content,
    author: this.authorString
  };
}

const Post = mongoose.model('Post', postSchema);

module.exports = {Post};
