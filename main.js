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

/* Reset Form */
function _ResetForm(context) {
	/* Remove selected state property */
	for (var index in context.stateList) {
		if (context.stateList[index].selected) {
			context.stateList[index].selected = undefined;  //Set as undefined
		}
	}
	context.qSC = undefined;  //Set as undefined
	return context;
}

/* Set Selected State */
function _selectState(session) {
	for (var stateIdx in session.stateList) {
		if (session.stateList[stateIdx].abr == session.stateID) {
			session.stateList[stateIdx].selected = true;  //Set as selected
		}
		else {
			session.stateList[stateIdx].selected = undefined;  //Clear selected
		}
	}
}

function _selectCity(session) {
	for (var cityIdx in session.qSC) {
		if (session.qSC[cityIdx].id == session.cityID) {
			session.qSC[cityIdx].selected = true;  //Set as selected
			session.cityName = session.qSC[cityIdx].name;
		}
		else {
			session.qSC[cityIdx].selected = undefined;  //Clear selected
		}
	}
}

/* POST Catcher */
app.post('/',function(req,res,next){
	var context = {};
	
	/* Create new list (aka new session)*/
 	if(req.body['New List']){
		req.session.name = req.body.name;
		req.session.toDo = [];
		req.session.curId = 0;
		req.session.stateList = stateList;  //Load State List
	}
	
	/* Add item to List */
	if(req.body['Add Item']){
		req.session.toDo.push({"name":req.body.name, "id":req.session.curId});
		req.session.curId++;
	}

	/* Remove item from list */
	if(req.body['Done']){
		req.session.toDo = req.session.toDo.filter(function(e){
			return e.id != req.body.id;
		})
	}
	
		/* Handle City Dropdown */
	if (req.body['cityID']) {
		req.session.cityID = req.body.cityID;  //Get cityID from body
		_selectCity(req.session);
		
	}
	
	/* Copy session into context */
	context.stateID = req.session.stateID;
	context.cityName = req.session.cityName;	
	context.name = req.session.name;
	context.toDo = req.session.toDo || [];
	context.toDoCount = context.toDo.length;
	context.stateList = req.session.stateList;
	context.qSC = req.session.qSC;
 
	//If there is no session or reset was sent, go to the main page.
	if((req.body['resetForm']) || (!req.session.name)) {
		res.render('newSession', _ResetForm(context));
		return;
	}
	
	/* Handle State Dropdown */
	if (req.body['stateID']) {
		req.session.stateID = req.body.stateID;  //Get stateID from body
		_selectState(req.session);
		request('http://api.sba.gov/geodata/city_links_for_state_of/' + req.session.stateID + '.JSON', function(err, response, body) {
			if(!err && response.statusCode < 400) {
				var qSC_raw = JSON.parse(body);
				req.session.qSC = [];
				for (var cityIndex in qSC_raw) {
					req.session.qSC.push({'id':cityIndex, 'name':qSC_raw[cityIndex].name});
				}
				req.session.qSC.sort(function(a,b) {  /* Standard sort() was having issues with object */
					if (a.name > b.name) {
						return 1;
					}
					if (a.name < b.name) {
						return -1;
					}
					return 0;
				});
				context.qSC = req.session.qSC;  //Copy cities to context
				console.log(context.qSC);
				res.render('toDo',context);
			}
			else {;
				console.log(response.statusCode);
				next(err);
			}
		});
		return;
	}
		
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