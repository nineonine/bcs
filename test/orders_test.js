var should = require('chai').should(),
	expect = require('chai').expect,
	mongoose = require('mongoose'),
	Product = require('../model/products').Product,
	async = require('async'),
	supertest = require('supertest'),
	api = supertest('http://localhost:3000');


var p1, p2, order1;

var prod1 = {
	name: "test_prod1",
	sku: "0130",
	price: 10,
	qty: 5,
	description: "descr !",
	image: "img1",
	status: "in"
}
var prod2 = {
	name: "test_prod2",
	sku: "0150",
	price: 20,
	qty: 10,
	description: "descr 2!",
	image: "img2",
	status: "in"
}

describe('Order' , function() {
	//creating mock order and products
	before(function(done) {
		
		async.waterfall([
			function(callback) {

				mongoose.connect('mongodb://localhost/bcs');
				callback(null)
			},
			function(cb) {
				Product.create(prod1, function(err, p) {
					if (err) {
						return cb(err)
            		  	//console.log("There was a problem adding Product 1 to the database.");
         			} else {
              			p1 = p;
              			cb(null, p1)
            		}
				})
			},
			function(p1, cb) {
				Product.create(prod2, function(err, p) {
					if (err) {
						return cb(err)
              			//console.log("There was a problem adding Product 2 to the database.");
         			} else {
              			p2 = p;
              			cb(null, p1, p2, cb)
            		}
				})	
			},
			function(p1, p2, cb) {
				api.post('/orders')
					.set('Accept', 'application/x-www-form-urlencoded')
					.send({
						orderNumber: 0,
						total: 100,
						shipping: 10,
						status: "processed",
						cart: [
						{product: p1._id, quantity: 3},
						{product: p2._id, quantity: 2}
						]
					})
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.end(function(err, res) {
						if(err) return cb(err)
						order1 = res.body	
						done()
				})		
			}
		])
	})

	it('should return a 200 response with all orders', function(done) {
		api.get('/orders')
		.set('Accept', 'application/json')
		.expect(200, done)
	})

	it('should retreive specific order', function(done) {
		api.get('/orders/' + order1._id)
		.set('Accept', 'application/json')
		.expect(200)
		.end( function(err, res) {
			expect(res.status).to.equal(200)
			done()
		})
	})

	it('should have products in cart', function(done) {
		api.get('/orders/' + order1._id)
		.set('Accept', 'application/json')
		.expect(200)
		.end( function(err, res) {
			expect(res.status).to.equal(200)
			expect(res.body.cart).to.not.equal(null)
			expect(res.body.cart.length).to.equal(2)
			done()
		})
	})

	it('should be a Order object with keys and values', function(done) {
		api.get('/orders/' + order1._id)
		.set('Accept', 'application/json')
		.expect(200)
		.end(function(err, res) {
			expect(res.body).to.have.property("orderNumber")
			expect(res.body.orderNumber).to.not.equal(null)
			expect(res.body).to.have.property("total")
			expect(res.body.total).to.not.equal(null)
			expect(res.body).to.have.property("shipping")
			expect(res.body.shipping).to.not.equal(null)
			expect(res.body).to.have.property("status")
			expect(res.body.status).to.not.equal(null)
			done()
		})
	})

	it('should be updated', function(done) {
		api.put('/orders/' + order1._id + '/edit')
		.set('Accept', 'application/x-www-form-urlencoded')
		.send({
			orderNumber: 1,
			total: 5,
			shipping: 1,
			status: "nostatus"
		})
		.expect(200)
		.set('Accept', 'application/json')
		.end(function(err, res) {
			expect(res.body.orderNumber).to.equal(1)
			expect(res.body.total).to.equal(5)
			expect(res.body.shipping).to.equal(1)
			expect(res.body.status).to.equal('nostatus')
			done()
		})
	})

	it('should delete mocked order', function(done) {
		api.del('/orders/' + order1._id + '/edit')
		.expect(302, done)
	})

	after(function(done) {
		Product.findOneAndRemove({_id: p1._id}, function(err, order) {
	        if (err) 
	            return console.error(err);
	    })    
        Product.findOneAndRemove({_id: p2._id}, function(err, order) {
	        if (err)
	            return console.error(err);
		})
		done()
    })
})