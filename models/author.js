const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const authorSchema = new Schema({
    name: String,
    age: Number
});

module.exports = mongoose.model('Author',authorSchema);  //Author also needs to be name of our collection
