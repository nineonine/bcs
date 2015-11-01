var mongoose = require('mongoose')

var invoiceSchema  = new mongoose.Schema({
	generatedBy: { type:mongoose.Schema.ObjectId, ref: "User" },
	order: { type: mongoose.Schema.ObjectId, ref: "Order"},
	trackingNumber: Number,
	comments: String
})

mongoose.model("Invoice", invoiceSchema);