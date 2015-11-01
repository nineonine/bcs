var mongoose = require('mongoose')

var userSchema  = new mongoose.Schema({
	name: String,
	role: String,
	email: String,
	password: String
})

mongoose.model("User", userSchema);