// Dependencies
var express = require("express");
var exphbs = require('express-handlebars');
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

//Require mdels

var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

// Scraper Tools
var request = require("request");
var cheerio = require("cheerio");

var Promise = require("bluebird");

var PORT = process.env.PORT || 3000;

//mongoose promise

mongoose.Promise = Promise;

//Initialize Express
var app = express();

//morgan and body parser init

app.use(logger("dev"));
app.use(bodyParser.urlencoded({
	extended:false
}));

//handlebars

app.engine("handlebars", exphbs({
	defaultLayout:"main"
}));

app.set("view engine", "handlebars");

app.use(express.static("public"));

if(process.env.NODE_ENV == 'production'){
  mongoose.connect('mongodb://heroku_07djq2tm:lim1p7d8subb43h9jfp7bt3slj@ds127842.mlab.com:27842/heroku_07djq2tm');
}
// For Local Environment
else{
  mongoose.connect('mongodb://localhost/week18day3mongoose');
}
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
    console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
    console.log("Mongoose connection successful.");
});

// mongoose.connect("mongodb://heroku_ftmcxwjb:frmtdj2fie03n5b63ukbo440sm@ds119768.mlab.com:19768/heroku_ftmcxwjb");
// var db = mongoose.connection;

// // Show any mongoose errors
// db.on("error", function(error) {
//   console.log("Mongoose Error: ", error);
// });

// // Once logged in to the db through mongoose, log a success message
// db.once("open", function() {
//   console.log("Mongoose connection successful.");
// });


// Models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  request("http://www.echojs.com/", function(error, response, html) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);
    // Now, we grab every h2 within an article tag, and do the following:
    $("article h2").each(function(i, element) {

      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");

      // Using our Article model, create a new entry
      // This effectively passes the result object to the entry (and the title and link)
      var entry = new Article(result);

      // Now, save that entry to the db
      entry.save(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        // Or log the doc
        else {
          console.log(doc);
        }
      });

    });
  });
  // Tell the browser that we finished scraping the text

  res.redirect("/articles");
});


app.get("/articles", function(req, res) {
  // Grab every doc in the Articles array
  	Article.find({}).populate("note").exec(function(error,doc){
  		if(error){
  			res.send(error);
  		}
  	
  	}).then(function(data){

  		var articleObj = {articles:data};
  		console.log(articleObj);

  		res.render("articles", articleObj);
  	});
  	});



app.post("/submit/:id", function(req, res){
	var newNote = new Note(req.body);

	newNote.save(function(error,doc){
		if(error){
			console.log(error);
		}
		else{
			Article.findOneAndUpdate({"_id": req.params.id}, { $push: { "note": doc._id } }, { new: true }, function(err, newdoc){
				if(error){
					res.send(err);
				}
				else{
					redirect("articles");
				}
			});
		}
	});
});

app.post("/delete/:id", function(req,res){

	Note.findOneAndRemove({"_id":req.params.id}, function(error,removed){
		if(error){
			res.send(error);
		}
		else{
			res.redirect("/articles");
		}
	});
});



// Listen on port 3000
app.listen(PORT, function() {
  console.log("App running on port 3000!");
});

// // Launch App
// var port = process.env.PORT || 3000;
// app.listen(port, function(){
//   console.log('Running on port: ' + port);
// });

