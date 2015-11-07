var mongoose = require('mongoose')

var customerSchema  = new mongoose.Schema({
	name: String,
	type: String,
	image: String,
	email: String,
	discount: Number,
	contactNumber: String,
	additionalInfo: String,
	billingAddress: String,
	shippingAddress: String
})

mongoose.model("Customer", customerSchema);