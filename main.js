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
  context.name = req.session.name;
  context.toDoCount = req.session.toDo.length || 0;
  context.toDo = req.session.toDo || [];
  console.log(context.toDo);
  res.render('toDo',context);
});

/* POST Catcher */


/* Start Application */
app.listen(app.get('port'), function(){
	console.log('Express started on http://localhost:' + app.get('port') + '; press ctrl-c to terminate.');
});