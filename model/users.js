var mongoose = require('mongoose')

var userSchema  = new mongoose.Schema({
	username: String,
	role: String,
	email: String,
	password: String,
	image: String,
	registered: Date
})

mongoose.model("User", userSchema);