var mongoose = require('mongoose')

var customerSchema  = new mongoose.Schema({
	name: String,
	type: String,
	image: String,
	email: String,
	registered: Date,
	discount: Number,
	contactNumber: String,
	additionalInfo: String,
	billing: {
		address: String,
		city: String,
		state: String,
		zip: String
	},
	shipping: {
		address: String,
		city: String,
		state: String,
		zip: String
	}
})

mongoose.model("Customer", customerSchema);