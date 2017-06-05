// ================================================
// TO DO : Code quality needs to be improved, along with best practices.
// TO DO : Add response in POST API calls
// TO DO : Implement Logging
// ================================================

// server.js
// BASE SETUP
// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var request = require('request');
var bcrypt = require('bcrypt');
var salt = bcrypt.genSaltSync(10);

var fs = require("fs");
var Web3 = require('web3');
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545')); // define geth node provider

// Contract deployment
var source = fs.readFileSync("./LMS.json");
var contracts = JSON.parse(source).contracts;
var abi = JSON.parse(contracts["LMS.sol:LMS"].abi);
var code = '0x'+contracts['LMS.sol:LMS'].bin;
var gasEstimate = web3.eth.estimateGas({data: code});
var LMS = web3.eth.contract(abi); // Contract deployed

// sleep time expects milliseconds
function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

var contract = LMS.new("sanchit", "s@a.com", 
	{
	   from:web3.eth.coinbase,
	   data:code,
	   gas: gasEstimate
	 });

sleep(10000).then(() => {
	// contract instance created
	var lms =  LMS.at(contract.address);
	console.log("contract address => "+lms.address);

	// configure app to use bodyParser()
	// this will let us get the data from0x3a5510ad5325a8db3f8a09b2610b22343d5cccf6 a POST
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());

	var port = process.env.PORT || 8881;        // set our port

	// ROUTES FOR OUR API
	// =============================================================================
	var router = express.Router();              // get an instance of the express Router

	// middleware to use for all requests
	router.use(function(req, res, next) {
	    // do logging
	    console.log('----------------------');
	    console.log('Something is happening.');
	    next(); // make sure we go to the next routes and don't stop here
	});

	// test route to make sure everything is working (accessed at GET http://localhost:8881/api)
	router.get('/', function(req, res) {
		console.log("API call test");
	    res.json({ message: 'hooray! welcome to our api!' }); 
	});

	// GET API calls
	router.get('/numberofmembers', function(req, res) {
		console.log("Displaying total number of members");
		res.json({ message: lms.numMembers().valueOf() });
	});

	router.get('/members', function(req, res) {
		console.log("Displaying all members data");
		res.json({ message: lms.getAllMembers() });
	});

	router.get('/numberofbooks', function(req, res) {
		console.log("Displaying total number of books");
		res.json({ message: lms.numBooks().valueOf() });
	});

	router.get('/books', function(req, res) {
		console.log("Displaying all books data");
		res.json({ message: lms.getAllBooks()});   
	});

	// POST API calls
	router.route('/addmember')
		.post(async function(req, res) {
			console.log("adding a new member");
			var data = req.body;
			await lms.addMember(data.name, web3.eth.accounts[2], data.email, {
					from: web3.eth.accounts[0],
					gas: 6000000
				}, function(err, result) {
				if (!err) {
					console.log("result " + result);
				}
				else {
					console.log(err);
				}
			});
		});

	router.route('/addbook')
		.post(async function(req, res) {
				console.log("add a new book");
				var data = req.body;
				var result = await lms.addBook(data.title, data.author, data.publisher, data.imgUrl, data.description, data.genre, {
					from: web3.eth.accounts[0],
					gas: 6000000
				}, function(err, rcpt) {
					if (!err) {
						console.log("result "+rcpt);
					}
					else {
						console.log("error "+err);
					}
				}); 
				res.json({message: result});
		});

	// This API is not tested after the changes
	router.route('/create_account')
	    // create an account
	    .post(async function(req, res) {
	    	console.log("new member account is being created");
	    	console.log(req.body);
		    request({
		       url: 'http://localhost:8545',
		       method: 'POST',
		       json: req.body['data']
		   	}, function(error, response, body) {
		   		console.log(error);
			       if (error) {
			         res.send({
			             status: "failure",
			             data : body
			         });
			       } else {
			           res.send({
			               status: "success",
			               data: body
			           });
			       }
		   });
		   await lms.addMember(req.body.name, res.body['data']['result'], req.body.email, {
					from: web3.eth.accounts[0],
					gas: 6000000
				}, function(err, result) {
				if (!err) {
					console.log("result " + result);
				}
				else {
					console.log(err);
				}
			});
	    });
	// REGISTER OUR ROUTES -------------------------------
	// all of our routes will be prefixed with /api
	app.use('/api', router);

	// START THE SERVER with following command
	// babel-node server.js
	// =============================================================================
	app.listen(port);
	console.log('Magic happens on port ' + port);
});
