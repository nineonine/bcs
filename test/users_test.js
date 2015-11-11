var should = require('chai').should()
expect = require('chai').expect
supertest = require('supertest')
api = supertest('http://localhost:3000')


describe('User' , function() {

	//creating mock user
	before(function(done) {
		api.post('/users')
		.field('Content-Type', 'multipart/form-data')
		.field('username', 'dummy_tester')
		.field('role', 'tester')
		.field('email', 'test@email.com')
		.field('password', 'letmein')
		.attach('image', __dirname + '/cat.jpeg')
		.set('Accept', 'application/json')
		.expect('Content-Type', /json/)
		.end(function(err, res) {
			if(err) console.log(err)
			user1 = res.body
			done()
		})
	})

	it('should return a 200 response with all users', function(done) {
		api.get('/users')
		.set('Accept', 'application/json')
		.expect(200, done)
	})

	it('should retreive specific user', function(done) {
		api.get('/users/' + user1._id)
		.set('Accept', 'application/json')
		.expect(200)
		.end( function(err, res) {
			expect(res.body.username).to.equal('dummy_tester')
			done()
		})
	})

	it('should be a User object with keys and values', function(done) {
		api.get('/users/' + user1._id)
		.set('Accept', 'application/json')
		.expect(200)
		.end(function(err, res) {
			expect(res.body).to.have.property("username")
			expect(res.body.username).to.not.equal(null)
			expect(res.body).to.have.property("role")
			expect(res.body.role).to.not.equal(null)
			expect(res.body).to.have.property("email")
			expect(res.body.email).to.not.equal(null)
			expect(res.body).to.have.property("password")
			expect(res.body.password).to.not.equal(null)
			done()
		})
	})

	it('should be updated', function(done) {
		api.put('/users/' + user1._id + '/edit')
		.set('Accept', 'application/x-www-form-urlencoded')
		.send({
			username: "renamed_dummy_tester",
			role: "changed_tester",
			email: "changed_test@email.com",
			password: "changed_letmein"
		})
		.expect(200)
		.set('Accept', 'application/json')
		.end(function(err, res) {
			expect(res.body.username).to.equal('renamed_dummy_tester')
			expect(res.body.role).to.equal('changed_tester')
			expect(res.body.email).to.equal('changed_test@email.com')
			expect(res.body.password).to.equal('changed_letmein')
			done()
		})
	})

	it('should delete mocked user', function(done) {
		api.del('/users/' + user1._id + '/edit')
		.expect(302, done)
	})


})