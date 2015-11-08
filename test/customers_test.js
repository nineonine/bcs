var should = require('chai').should()
expect = require('chai').expect
supertest = require('supertest')
api = supertest('http://localhost:3000')
fs = require('fs')

describe('Customer' , function() {

	before(function(done) {
		api.post('/customers')
		.field('Content-Type', 'multipart/form-data')
		.field('name', 'dummy_customer')
		.field('type', 'test_customer@email.com')
		.field('email', '100')
		.field('discount', '100')
		.field('contactNumber', "123")
		.field('additionalInfo', "about dummy customer")
		.field('status', 'in')
		.field('billAddress', 'bill address 1')
		.field('billcity', 'bill city')
		.field('billstate', 'bill state')
		.field('billzip', 'bill zip')
		.field('shipAddress', 'ship address')
		.field('shipcity', 'ship city')
		.field('shipstate', 'ship state')
		.field('shipzip', 'ship zip')
		.attach('image', __dirname + '/cat.jpeg')
		.set('Accept', 'application/json')
		.expect('Content-Type', /json/)
		.end(function(err, res) {
			if(err) console.log(err)
			customer1 = res.body
			done()
		})
	})

	it('should upload an image', function(done) {
		expect(customer1.image).to.not.equal(null)
		done()
	})

	it('should return a 200 response with all customers', function(done) {
		api.get('/customers')
		.set('Accept', 'application/json')
		.expect(200, done)
	})

	it('should retreive specific customer', function(done) {
		api.get('/customers/' + customer1._id)
		.set('Accept', 'application/json')
		.expect(200)
		.end( function(err, res) {
			expect(res.body.name).to.equal('dummy_customer')
			done()
		})
	})

	it('should be a Customer object with keys and values', function(done) {
		api.get('/customers/' + customer1._id)
		.set('Accept', 'application/json')
		.expect(200)
		.end(function(err, res) {
			expect(res.body).to.have.property("name")
			expect(res.body.name).to.not.equal(null)
			expect(res.body).to.have.property("type")
			expect(res.body.role).to.not.equal(null)
			expect(res.body).to.have.property("email")
			expect(res.body.email).to.not.equal(null)
			expect(res.body).to.have.property("discount")
			expect(res.body.discount).to.not.equal(null)
			expect(res.body).to.have.property("contactNumber")
			expect(res.body.contactNumber).to.not.equal(null)
			expect(res.body).to.have.property("additionalInfo")
			expect(res.body.additionalInfo).to.not.equal(null)
			expect(res.body).to.have.property("billing")
			expect(res.body.billing).to.not.equal(null)
			expect(res.body.billing).to.be.an('object')
			expect(res.body).to.have.property("shipping")
			expect(res.body.shipping).to.not.equal(null)
			expect(res.body.shipping).to.be.an('object')
			done()
		})
	})

	it('should be updated', function(done) {
		api.put('/customers/' + customer1._id + '/edit')
		.set('Accept', 'application/x-www-form-urlencoded')
		.send({
			name: "changed_dummy_customer",
			type: "changed_test_customer",
			email: "changed_test_customer@email.com",
			discount: 10,
			contactNumber: "321",
			additionalInfo: "something new about dummy customer"
		})
		.expect(200)
		.set('Accept', 'application/json')
		.end(function(err, res) {
			expect(res.body.name).to.equal('changed_dummy_customer')
			expect(res.body.type).to.equal('changed_test_customer')
			expect(res.body.email).to.equal('changed_test_customer@email.com')
			expect(res.body.discount).to.equal(10)
			expect(res.body.contactNumber).to.equal('321')
			expect(res.body.additionalInfo).to.equal('something new about dummy customer')
			done()
		})
	})
	

	it('should delete mocked customer', function(done) {
		api.del('/customers/' + customer1._id + '/edit')
		.expect(302, done)
	})


})