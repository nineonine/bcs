var mongoose = require('mongoose')

var activitySchema  = new mongoose.Schema({
	date: Date,
	actionType: String, // placeOrder, updateOrder, shipOrder, completeOrder, cancelOrder, addNote
	userName: String,
	userImg: String,
	order: String,
	customerName: String,
	customerId: String
})

mongoose.model("Activity", activitySchema);

exports.register = function(action, user, order, customer) {

	var now = new Date()
	var actionType = action
	var userName = user.username
	var userImg = user.image
	var order = order ? order._id : null
	var customerName = customer ? customer.name : null
	var customerId = customer ? customer._id : null

	mongoose.model('Activity').create({
		date: now,
		actionType: actionType,
		userName: userName,
		userImg: userImg,
		order: order,
		customerName: customerName,
		customerId: customerId
	}, function(err, activity) {
		if (err) {
			console.log("error")
		} else {
			console.log(activity)
		}

	})	

}