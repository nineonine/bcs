var should = require('chai').should()
expect = require('chai').expect
supertest = require('supertest')
api = supertest('http://localhost:3000')


describe('Customer' , function() {

	//creating mock user
	before(function(done) {
		api.post('/customers')
		.set('Accept', 'application/x-www-form-urlencoded')
		.send({
			name: "dummy_customer",
			type: "test_customer",
			email: "test_customer@email.com",
			discount: 100,
			contactNumber: "123",
			additionalInfo: "something about dummy customer",
			billingAddress: "some dummy billing address",
			shippingAddress: "some dummy shipping address"
		})
		.set('Accept', 'application/json')
		.expect('Content-Type', /json/)
		.end(function(err, res) {
			customer1 = res.body
			done()
		})
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
			expect(res.body).to.have.property("billingAddress")
			expect(res.body.billingAddress).to.not.equal(null)
			expect(res.body).to.have.property("shippingAddress")
			expect(res.body.shippingAddress).to.not.equal(null)
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
			additionalInfo: "something new about dummy customer",
			billingAddress: "some new dummy billing address",
			shippingAddress: "some new dummy shipping address"
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
			expect(res.body.billingAddress).to.equal('some new dummy billing address')
			expect(res.body.shippingAddress).to.equal('some new dummy shipping address')
			done()
		})
	})

	it('should delete mocked customer', function(done) {
		api.del('/customers/' + customer1._id + '/edit')
		.expect(302, done)
	})


})