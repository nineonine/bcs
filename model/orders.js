var mongoose = require('mongoose')

var orderSchema  = new mongoose.Schema({
	orderNumber: String,
	total: Number,
	discount: Number,
	shipping: Number,
	status: String,
	customer: {type: mongoose.Schema.ObjectId, ref: "Customer"},
	sales: {type: mongoose.Schema.ObjectId, ref: "User"},
	statusHistory: {
		processing: Date,
		shipped: Date,
		completed: Date,
		cancelled: Date
	},
	cart: [{
      product: {type: mongoose.Schema.ObjectId, ref: "Product"},
      quantity: Number
	}]
})

mongoose.model("Order", orderSchema);