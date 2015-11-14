var mongoose = require('mongoose')

var orderSchema  = new mongoose.Schema({
	orderNumber: String,
	total: Number,
	discount: Number,
	shipping: String,
	status: String,
	notes: String,
	customer: String,
	sales: {type: mongoose.Schema.ObjectId, ref: "User"},
	statusHistory: {
		processing: Date,
		shipped: Date,
		completed: Date,
		cancelled: Date
	},
	cart: [{
      name: String,
      quantity: Number
	}]
})

mongoose.model("Order", orderSchema);