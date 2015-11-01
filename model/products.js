var mongoose = require('mongoose')

var productSchema  = new mongoose.Schema({
	name: String,
	sku: String,
	price: Number,
	qty: Number,
	description: String,
	image: String,
	status: String
})

mongoose.model("Product", productSchema);