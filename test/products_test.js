var should = require('chai').should()
expect = require('chai').expect
supertest = require('supertest')
api = supertest('http://localhost:3000')


describe('Product' , function() {

	//creating mock user
	before(function(done) {
		api.post('/products')
		.set('Accept', 'application/x-www-form-urlencoded')
		.send({
			name: "dummy_product",
			sku: "test_sku",
			price: 100,
			qty: 100,
			description: "123",
			image: "image/url.jpg",
			status: "inStock"
		})
		.set('Accept', 'application/json')
		.expect('Content-Type', /json/)
		.end(function(err, res) {
			product1 = res.body
			done()
		})
	})

	it('should return a 200 response with all products', function(done) {
		api.get('/products')
		.set('Accept', 'application/json')
		.expect(200, done)
	})

	it('should retreive specific product', function(done) {
		api.get('/products/' + product1._id)
		.set('Accept', 'application/json')
		.expect(200)
		.end( function(err, res) {
			expect(res.body.name).to.equal('dummy_product')
			done()
		})
	})

	it('should be a Product object with keys and values', function(done) {
		api.get('/products/' + product1._id)
		.set('Accept', 'application/json')
		.expect(200)
		.end(function(err, res) {
			expect(res.body).to.have.property("name")
			expect(res.body.name).to.not.equal(null)
			expect(res.body).to.have.property("sku")
			expect(res.body.sku).to.not.equal(null)
			expect(res.body).to.have.property("price")
			expect(res.body.price).to.not.equal(null)
			expect(res.body).to.have.property("qty")
			expect(res.body.qty).to.not.equal(null)
			expect(res.body).to.have.property("description")
			expect(res.body.description).to.not.equal(null)
			expect(res.body).to.have.property("image")
			expect(res.body.image).to.not.equal(null)
			expect(res.body).to.have.property("status")
			expect(res.body.status).to.not.equal(null)
			done()
		})
	})

	it('should be updated', function(done) {
		api.put('/products/' + product1._id + '/edit')
		.set('Accept', 'application/x-www-form-urlencoded')
		.send({
			name: "changed_dummy_product",
			sku: "changed_sku",
			price: 200,
			qty: 200,
			description: "321",
			image: "image/changed_url.jpg",
			status: "outOfStock"
		})
		.expect(200)
		.set('Accept', 'application/json')
		.end(function(err, res) {
			expect(res.body.name).to.equal('changed_dummy_product')
			expect(res.body.sku).to.equal('changed_sku')
			expect(res.body.price).to.equal(200)
			expect(res.body.qty).to.equal(200)
			expect(res.body.description).to.equal('321')
			expect(res.body.image).to.equal('image/changed_url.jpg')
			expect(res.body.status).to.equal('outOfStock')
			done()
		})
	})

	it('should delete mocked product', function(done) {
		api.del('/products/' + product1._id + '/edit')
		.expect(302, done)
	})


})