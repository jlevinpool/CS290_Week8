/* **************************************************************************
** Author: James Pool
** ONID: 932664412
** OSU Email: poolj@oregonstate.edu
** Date: 18 February 2016
**
** Program Filename: main.js
** Description: Week 8 Activity - HTTP Requests

** Code for To Do List modified from CS 290 lecture:
** http://eecs.oregonstate.edu/ecampus-video/CS290/core-content/sessions-http/sessions-example.html
*************************************************************************** */

/* Express and Middleware */
var express = require('express');
var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var session = require('express-session');
var bodyParser = require('body-parser');
var credentials = require('./credentials.js');
var stateList = require('./stateListUSA.js');
var request = require('request');

/* Handlebars Setup */
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

/* Session Setup */
app.use(session({secret:(credentials.sessionKey)}));

/* Body Parser Setup */
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

/* CSS Setup */
app.use(express.static(__dirname + '/public'));

/* Application Port */
app.set('port', 3081);

/* Generate City Dropdown */
app.post('/State',function(req,res,next){
	/* Setup page context */
	context = {};
	context.name = req.session.name;
	context.toDoCount = req.session.toDo.length;
	context.toDo = req.session.toDo;
	context.stateList = stateList;  //Load State List
	context.stateID = req.body.stateID;
	for (var stateIdx in context.stateList) {
		if (context.stateList[stateIdx].abr == context.stateID) {
			context.stateList[stateIdx].selected = true;  //Set as selected
		}
		else {
			context.stateList[stateIdx].selected = undefined;  //Clear selected
		}
	}
	console.log(context);
	
	request('http://api.sba.gov/geodata/city_links_for_state_of/' + context.stateID + '.JSON', function(err, response, body) {
		if(!err && response.statusCode < 400) {
			req.session.qSC_raw = JSON.parse(body);
			context.qSC_raw = JSON.parse(body);
			context.qSC = [];
			for (var cityIndex in context.qSC_raw) {
				context.qSC.push({'name':context.qSC_raw[cityIndex].name});
			}
			context.qSC.sort(function(a,b) {  /* Standard sort() was having issues with object */
				if (a.name > b.name) {
					return 1;
				}
				if (a.name < b.name) {
					return -1;
				}
				return 0;
			});
			res.render('toDo',context);
		}
		else {
			next(err);
		}
	});
});

/* GET Catcher */
app.get('/',function(req,res,next){
	var context = {};
	//If there is no session, go to the main page.
	if(!req.session.name){
		res.render('newSession', context);
		return;
	}
	console.log(req.body);
	context.name = req.session.name;
	context.toDoCount = req.session.toDo.length || 0;
	context.toDo = req.session.toDo || [];
	res.render('toDo',context);
});

/* POST Catcher */
app.post('/',function(req,res,next){
	var context = {};
	context.stateList = stateList;  //Load State List
  
	if(req.body['New List']){
		req.session.name = req.body.name;
		req.session.toDo = [];
		req.session.curId = 0;
	}

	//If there is no session, go to the main page.
	if(!req.session.name){
		/* Remove selected state property */
		for (var index in context.stateList) {
			if (context.stateList[index].selected) {
				context.stateList[index].selected = undefined;  //Set as undefined
			}
		}
		context.qSC = undefined;  //Set as undefined
		res.render('newSession', context);
		return;
	}
  
	if(req.body['resetForm']) {
		/* Remove selected state property */
		for (var index in context.stateList) {
			if (context.stateList[index].selected) {
				context.stateList[index].selected = undefined;  //Set as undefined
			}
		}
		context.qSC = undefined;  //Set as undefined
		res.render('newSession', context);
		return;
	}

  if(req.body['Add Item']){
    req.session.toDo.push({"name":req.body.name, "id":req.session.curId});
    req.session.curId++;
  }

  if(req.body['Done']){
    req.session.toDo = req.session.toDo.filter(function(e){
      return e.id != req.body.id;
    })
  }

  context.stateID = req.session.stateID;
  context.name = req.session.name;
  context.toDoCount = req.session.toDo.length;
  context.toDo = req.session.toDo;
  res.render('toDo',context);
});

function jsFunction(){
	console.log("jsFunction!");
}

/* ERROR Handler */
app.use(function(req,res){
	res.status(404);
	res.render('404_-_Not_Found');
});

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500);
  res.render('500_-_Internal_Server_Error');
});

/* Start Application */
app.listen(app.get('port'), function(){
	console.log('Express started on http://localhost:' + app.get('port') + '; press ctrl-c to terminate.');
});