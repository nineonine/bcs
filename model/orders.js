var mongoose = require('mongoose')

var orderSchema  = new mongoose.Schema({
	orderNumber: Number,
	total: Number,
	shipping: Number,
	status: String,
	invoice: {type: mongoose.Schema.ObjectId, ref: "Invoice"},
	slip: {type: mongoose.Schema.ObjectId, ref: "Slip"},
	sales: {type: mongoose.Schema.ObjectId, ref: "User"},
	statusHistory: {
		ordered: Date,
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