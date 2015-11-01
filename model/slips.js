var mongoose = require('mongoose')

var slipSchema  = new mongoose.Schema({
	packedBy: { type: mongoose.Schema.ObjectId, ref: "User" },
	order: { type: mongoose.Schema.ObjectId, ref: "Order" },
	trackingNumber: Number,
	notes: String
})

mongoose.model("Slip", slipSchema);