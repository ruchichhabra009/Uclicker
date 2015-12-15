  //Use mongoose for modelling data (schema based modelling)
  var mongoose = require('mongoose');
  // connect and fetch a database instance
  var db = require('../db');
  // local import?
  var Stopwatch = require('timer-stopwatch');
  var nodemailer = require("nodemailer");

  // Get instances of various schemas
  var PollSchema = require('../app/models/poll.js').PollSchema;
  var CourseSchema = require('../app/models/course.js').CourseSchema;
  var SCourseSchema = require('../app/models/scourse.js').SCourseSchema;

  // Use the schema instance to model data
  var Poll = db.model('polls', PollSchema);
  var Course = db.model('courses', CourseSchema);
  var SCourse = db.model('scourses', SCourseSchema);


  // Email authentication for node mailer (for confirmation emails) 
  var transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
          user: 'khonakr@gmail.com',
          pass: 'Hsej@r1992'
      }
  });

  var rand, mailOptions, host, link;

  module.exports = function(app, passport, io) {

      //Render home page for user
      app.get('/', isLoggedInHome, function(req, res) {
          // If the user is not logged in, render generic home page
          res.render('index', {
              title: 'Home'
          });
      });

      function isLoggedInHome(req, res, next) {
        // if user is authenticated in the session, carry on 
        if (!req.isAuthenticated()) {
            // if they aren't redirect them to the home page
            return next();
        }
        // If the user is logged in, render specialized home page
        res.render('loggedindex', {
            title: 'Home',
            loggedUser: req.user.local
        });

     }
      // app.get('/vote', function(req, res) {
      //     res.render('vote');
      // });

      // Post request for poll list
      app.post('/polllist', function(req, res) {

          if (req.user.hasAccess('createPolls')) {
              // If it is a professor, view pollist for that course / have a button to create a poll
              Poll.find({
                  course: req.body.selcourse
              }, 'polls', function(error, polls) {
                  res.render('./prof/polllist', {
                      title: 'Poll List',
                      loggedUser: req.user.local,
                      plist: polls,
                      selectedCourse: req.body.selcourse
                  }); 
              });
          } else {
              // If it is a student, just view pollist for that course
              Poll.find({
                  course: req.body.selcourse
              }, 'polls', function(error, polls) {
                  res.render('./stud/polllist', {
                      title: 'Poll List',
                      loggedUser: req.user.local,
                      plist: polls,
                      selectedCourse: req.body.selcourse
                  }); 
              });
          }
      });

      // app.get('/courselist', function(req, res) {
      //     Course.find({}, 'courses', function(error, courses) {
      //         res.render('courselist', {
      //             clist: courses
      //         });
      //     });

      // });

      // Post request for creating a poll
      app.post('/createpoll', function(req, res) {
          if (req.user.hasAccess('createPolls')) {
              // If it is a professor, let him create polls
              res.render('./prof/createPoll', {
                  title: "Polls",
                  loggedUser: req.user.local,
                  selectedCourse: req.body.selcourse
              });
          } else {
              // If it is a student, don't let poll creation
              res.end("You need to be a prof to create polls");
          }
      });

      //Post request for viewing current poll
      app.post('/currentpoll', function(req, res) {
          if (req.user.hasAccess('createPolls')) {
              // If it is a professor, let him view the poll, but don't let him vote
              Poll.find({
                  'polls.question': req.body.selquestion
              }, {
                  polls: {
                      $elemMatch: {
                          question: req.body.selquestion
                      }
                  }
              }, function(error, options) {
                  res.render('./prof/currentpoll', {
                      title: "Poll",
                      loggedUser: req.user.local,
                      selectedCourse: req.body.selcourse,
                      selquestion: req.body.selquestion,
                      choices: options[0].polls[0]
                  });
              });
          } else {
              // If it is a student, let him view the poll, but let him vote
              Poll.find({
                  'polls.question': req.body.selquestion
              }, {
                  polls: {
                      $elemMatch: {
                          question: req.body.selquestion
                      }
                  }
              }, function(error, options) {
                  res.render('./stud/currentpoll', {
                      title: "Poll",
                      loggedUser: req.user.local,
                      selectedCourse: req.body.selcourse,
                      selquestion: req.body.selquestion,
                      choices: options[0].polls[0]
                  });
              });
          }
      });

      //Post request for poll menu
      app.post('/pollmain', function(req, res) {
          if (req.user.hasAccess('createPolls')) {
          	//If it is a professor, then only display options to create poll or view current poll list
              res.render('./prof/pollmain', {
                  title: "Poll Menu",
                  loggedUser: req.user.local,
                  selectedCourse: req.body.selcourse
              });
          } else {
              res.end("You need to be a prof to create polls");
          }
      });

      //Render course selection page
      app.get('/createcourse', function(req, res) {
          if (req.user.hasAccess('createPolls')) {
          	//if it is professor, let him select / add courses
              Course.find({
                  professor: req.user.local.email
              }, 'courses', function(error, courses) {
                  res.render('./prof/createCourse', {
                      title: "Courses",
                      loggedUser: req.user.local,
                      clist: courses
                  });
              });
          } else {
          	//if it is a student let him only select courses 
              Course.find('courses', function(error, courses) {
                  SCourse.find({
                      student: req.user.local.email
                  }, 'scourses', function(error, scourses) {
                      res.render('./stud/createCourse', {
                          title: "Courses",
                          loggedUser: req.user.local,
                          clist: courses,
                          sclist: scourses
                      });
                  });
              });
          }
      });

      //Render login page
      app.get('/login', function(req, res) {
          res.render('login', {
              message: req.flash('loginMessage'),
              title: 'Sign In'
          });
      });

      //Render signup page
      app.get('/signup', function(req, res) {
          res.render('signup', {
              message: req.flash('signupMessage'),
              title: 'Sign Up'
          });
      });

      //Post request for signup
      app.post('/signup', passport.authenticate('local-signup', {
          successRedirect: '/send', // redirect to the secure profile section
          failureRedirect: '/signup', // redirect back to the signup page if there is an error
          failureFlash: true // allow flash messages
      }));

      //Post request for login
      app.post('/login', passport.authenticate('local-login', {
          successRedirect: '/profile', // redirect to the secure profile section
          failureRedirect: '/login', // redirect back to the signup page if there is an error
          failureFlash: true // allow flash messages
      }));

      //Logout from the session and redirect to home page
      app.get('/logout', function(req, res) {
          req.logout();
          req.session.destroy();
          res.redirect('/');
      });

      // Render Backend dashboard
      app.get('/profile', isLoggedIn, function(req, res) {
          if (req.user.hasAccess('createPolls')) {
              //professor
              res.render('./prof/back_index.ejs', {
                  title: "Welcome " + req.user.local.fname,
                  loggedUser: req.user.local
              });
          } else if (req.user.hasAccess('createProf')) {
              //admin
              res.end("admin page");
          } else if (req.user.hasAccess('vote')) {
              //student
              if (req.user.local.activated == 1) {
                  res.render('./stud/back_index.ejs', {
                      title: "Welcome " + req.user.local.fname,
                      loggedUser: req.user.local
                  });
              } else if (req.user.local.activated == 0) {
              	  //if the account is not activated
                  res.end("<h1> Please activate the email address </h1>");
              } else {
              	  // if trying to access without registering
                  res.end("<h1> Please register    </h1>");
              }


          } else {
              // do nothing
          }
      });
  
       // to make sure a user is logged in
		  function isLoggedIn(req, res, next) {
		      // if user is authenticated in the session, carry on 
		      if (req.isAuthenticated())
		          return next();
		      // if they aren't redirect them to the home page
		      res.redirect('/login');
		  }

      
      //Post request on voting. (to register a vote)
      app.post('/voteAction', function(req, res) {
          var voterUser = req.user.local.email;
          var userVote = req.body.selected_vote;
          var userQues = req.body.q;
          //Find the question and users choice
          Poll.findOne({
              'polls.question': userQues,
              'polls.choices.ctext': userVote
          }, function(err, question) {
              var temp;
              for (i = 0; i < question.polls.length; i++) {
                  for (j = 0; j < question.polls[i].choices.length; j++) {
                      var detail = question.polls[i].choices[j];
                      if (detail.ctext === userVote) {
                          temp = j;
                          break;
                      }
                  }
              }
              var temp1;
              for (i = 0; i < question.polls.length; i++) {
                  var detail = question.polls[i];
                  if (detail.question === userQues) {
                      temp1 = i;
                      for (j = 0; j < question.polls[i].choices.length; j++) {
                          var detail2 = question.polls[i].choices[j];
                          if (detail2.ctext === userVote) {
                              temp = j;
                              break;
                          }
                      }

                  }
              }
              if (err)
                  return done(err);
              if (question) {

                  var temp2;
                  var abc = {};
                  abc["polls." + temp1 + ".choices." + temp + ".votes"] = voterUser;
                  Poll.findOne({
                      'polls.question': userQues,
                      'polls.choices.ctext': userVote,
                      'polls.choices.votes': voterUser
                  }, function(err, check) {
                      if (check) {
                      	  //replace the users vote every time he revotes
                          function callback() {
                              Poll.update({
                                  'polls.question': userQues,
                                  'polls.choices.ctext': userVote
                              }, {
                                  "$push": abc
                              }, function(err, removed) {});

                          }

                          function iterate(question, callback) {
                              var run = 0;
                              for (i = 0; i < question.polls[0].choices.length; i++) {
                                  var xyz = {};
                                  xyz["polls." + temp1 + ".choices." + i + ".votes"] = voterUser;
                                  Poll.update({
                                      'polls.question': userQues,
                                      'polls.choices.votes': voterUser
                                  }, {
                                      "$pull": xyz
                                  }, function(err, removed) {
                                      if (++run == question.polls[0].choices.length) {
                                          callback();
                                      }
                                  });
                              }
                          }
                          iterate(question, callback);
                      } else {
                      	  //insert the vote count and user's email address, if it was voted for first time
                          Poll.update({
                              'polls.question': userQues,
                              'polls.choices.ctext': userVote
                          }, {
                              "$push": abc
                          }, function(err, removed) {});
                      }
                  });
              }
          });
      });

      //Post request for creating a new poll (from prof)
      app.post('/pollCreateAction', createp);

      function createp(req, res) {
          var Myquestion = req.body.q;
          var myInputs = req.body.myInputs;
          var selcourse = req.body.selcourse;
          //Milliseconds to seconds (1 extra second for delay)
          var time = req.body.TimerValue*1000+1000;
          var op = {
              refreshRateMS: 1000
          }
          var timer = new Stopwatch(time, op);
          var pollObj = {
              course: selcourse,
              polls: []
          };
          var choices = [];

          Poll.findOne({
              course: selcourse
          }, function(err, course) {
              // if there are any errors, return the error
              if (err)
                  return done(err);

             //various cases for single option /muliple options
              if (course) {
                  if (myInputs instanceof Array) {
                      var filteredInputs = myInputs.slice() // slice makes copy of array before sorting it
                          .sort(function(a, b) {
                              return a - b;
                          })
                          .reduce(function(a, b) {
                              if (a.slice(-1)[0] !== b) a.push(b); // slice(-1)[0] means last item in array without removing it (like .pop())
                              return a;
                          }, []);

                      for (var i in filteredInputs) {

                          var item = filteredInputs[i];
                          if (item.length === 0 || item.trim().length === 0) {

                          } else {
                              choices.push({
                                  "ctext": item
                              });


                          }

                      }

                      Poll.findOne({
                          'polls.question': Myquestion
                      }, function(err, question) {

                          if (err)
                              return done(err);
                          if (question) {
                              console.log("question already exist");
                              Poll.find({
                                  'polls.question': Myquestion
                              }, {
                                  polls: {
                                      $elemMatch: {
                                          question: Myquestion
                                      }
                                  }
                              }, function(error, options) {
                                  res.render('./prof/currentpoll', {
                                      title: "Poll",
                                      loggedUser: req.user.local,
                                      selectedCourse: req.body.selcourse,
                                      selquestion: req.body.selquestion,
                                      choices: options[0].polls[0]
                                  });
                              });
                          } else {

                              console.log("add poll");

                              Poll.update({
                                  course: selcourse
                              }, {
                                  $push: {
                                      polls: {
                                          'question': Myquestion,
                                          'choices': choices,
                                          'glink': ""
                                      }
                                  }
                              }, function(err, removed) {
                                  Poll.find({
                                      'polls.question': Myquestion
                                  }, {
                                      polls: {
                                          $elemMatch: {
                                              question: req.body.q
                                          }
                                      }
                                  }, function(error, options) {
                                  	//Count down timer, socket io
                                      timer.start();
                                      io.on('connection', function(socket) {
                                          timer.on('time', function(time) {



                                              io.emit(Myquestion, time.ms * 0.001);

                                          });
                                          timer.on('done', function() {
                                              //on timer finish

                                              Poll.findOne({
                                                  course: selcourse,
                                                  'polls.question': Myquestion
                                              }, {
                                                  polls: {
                                                      $elemMatch: {
                                                          question: Myquestion
                                                      }
                                                  }
                                              }, function(err, check) {
                                              	  // for creating a graph on timer finish
                                                  var plotly = require('plotly')('kkhona2', 'sevksr2kbi');
                                                  var tempchoices = [];
                                                  var tempvotes = [];

                                                  for (var i = 0; i < choices.length; i++) {
                                                      console.log("Look here0" + check.polls[0].choices[i].votes);
                                                      tempchoices.push(check.polls[0].choices[i].ctext);
                                                      tempvotes.push(check.polls[0].choices[i].votes.length);
                                                  }
                                                  console.log("Look here 1" + tempchoices)
                                                  console.log("Look here 2" + tempvotes)
                                                  var data = [{
                                                      x: tempchoices,
                                                      y: tempvotes,
                                                      type: "bar"
                                                  }];
                                                  var graphOptions = {
                                                      filename: Myquestion,
                                                      fileopt: "overwrite"
                                                  };
                                                  var graphlink;
                                                  plotly.plot(data, graphOptions, function(err, msg) {
                                                      console.log(msg);
                                                      graphlink = msg.url;
                                                      console.log(graphlink);
                                                      Poll.update({
                                                              course: selcourse,
                                                              'polls.question': Myquestion
                                                          }, {
                                                              '$set': {
                                                                  'polls.$.glink': graphlink
                                                              }
                                                          },
                                                          function(err, removed) {
                                                              io.emit('timerdone', "timerdone");
                                                          });
                                                  });
                                              });
                                          });
                                      });


                                      res.render('./prof/currentpoll', {
                                          title: "Poll",
                                          loggedUser: req.user.local,
                                          selectedCourse: selcourse,
                                          selquestion: Myquestion,
                                          choices: options[0].polls[0]
                                      });
                                  });
                              });

                          }
                      });



                  } else {
                      if (myInputs.length === 0 || myInputs.trim().length === 0) {

                      } else {
                          choices.push({
                              "ctext": myInputs
                          });
                          pollObj.polls.push({
                              "question": Myquestion,

                              "choices": choices
                          });


                          Poll.findOne({
                              'polls.question': Myquestion
                          }, function(err, question) {

                              if (err)
                                  return done(err);
                              if (question) {
                                  console.log("question already exist");
                              } else {

                                  console.log("add poll");

                                  Poll.update({
                                      course: selcourse
                                  }, {
                                      $push: {
                                          polls: {
                                              'question': Myquestion,
                                              'choices': choices
                                          }
                                      }
                                  }, function(err, removed) {
                                      Poll.find({
                                          'polls.question': Myquestion
                                      }, {
                                          polls: {
                                              $elemMatch: {
                                                  question: req.body.q
                                              }
                                          }
                                      }, function(error, options) {
                                          timer.start();
                                          io.on('connection', function(socket) {
                                              timer.on('time', function(time) {



                                                  io.emit('chat message', time.ms * 0.001);

                                              });

                                          });
                                          res.render('./prof/currentpoll', {
                                              title: "Poll",
                                              loggedUser: req.user.local,
                                              selectedCourse: selcourse,
                                              selquestion: Myquestion,
                                              choices: options[0].polls[0]
                                          });
                                      });
                                  });

                              }
                          });

                      }
                  }

              } else {


                  if (myInputs instanceof Array) {
                      var filteredInputs = myInputs.slice() // slice makes copy of array before sorting it
                          .sort(function(a, b) {
                              return a - b;
                          })
                          .reduce(function(a, b) {
                              if (a.slice(-1)[0] !== b) a.push(b); // slice(-1)[0] means last item in array without removing it (like .pop())
                              return a;
                          }, []);

                      for (var i in filteredInputs) {

                          var item = filteredInputs[i];
                          if (item.length === 0 || item.trim().length === 0) {

                          } else {
                              choices.push({
                                  "ctext": item
                              });

                          }

                      }
                      pollObj.polls.push({
                          "question": Myquestion,

                          "choices": choices
                      });
                      var newPoll = new Poll(pollObj);

                      newPoll.save(function(err) {
                          if (err)
                              throw err;
                          timer.start();
                          io.on('connection', function(socket) {
                              timer.on('time', function(time) {



                                  io.emit('chat message', time.ms * 0.001);

                              });

                          });
                          Poll.find({
                              'polls.question': Myquestion
                          }, {
                              polls: {
                                  $elemMatch: {
                                      question: req.body.q
                                  }
                              }
                          }, function(error, options) {

                              res.render('./prof/currentpoll', {
                                  title: "Poll",
                                  loggedUser: req.user.local,
                                  selectedCourse: selcourse,
                                  selquestion: Myquestion,
                                  choices: options[0].polls[0]
                              });
                          });
                          return;
                      });

                  } else {
                      if (myInputs.length === 0 || myInputs.trim().length === 0) {

                      } else {
                          choices.push({
                              "ctext": myInputs
                          });
                          pollObj.polls.push({
                              "question": Myquestion,

                              "choices": choices
                          });
                          var newPoll = new Poll(pollObj);
                          newPoll.save(function(err) {
                              if (err)
                                  throw err;
                              timer.start();
                              io.on('connection', function(socket) {
                                  timer.on('time', function(time) {

                                      io.emit('chat message', time.ms * 0.001);

                                  });

                              });
                              Poll.find({
                                  'polls.question': Myquestion
                              }, {
                                  polls: {
                                      $elemMatch: {
                                          question: req.body.q
                                      }
                                  }
                              }, function(error, options) {

                                  res.render('./prof/currentpoll', {
                                      title: "Poll",
                                      loggedUser: req.user.local,
                                      selectedCourse: selcourse,
                                      selquestion: Myquestion,
                                      choices: options[0].polls[0]
                                  });
                              });
                              return;
                          });

                      }

                  }

              }
          });

      }

      //Student adds / registers for a course
      app.post('/registerCourseAction', regcourse);

      function regcourse(req, res) {

          var regcourseinput = req.body.coption;
          var studUser = req.user.local.email;
          var regi = regcourseinput.substring(regcourseinput.indexOf("myi") + 3, regcourseinput.indexOf("myj"));
          var regj = regcourseinput.substring(regcourseinput.indexOf("myj") + 3);
          var myInputs = null;
          Course.find({}, 'courses', function(error, courses) {
              var myInputstemp = courses[regi].courses[regj];
              myInputs = myInputstemp.ctext;
              console.log(myInputs);

              SCourse.findOne({
                  student: studUser
              }, function(err, student) {
                  if (err)
                      return done(err);
                  
                  if (student) {
                  	  //if student info already exists, update
                      var courseObj = {
                          student: studUser,
                          scourses: []
                      };

                      if (myInputs.length === 0 || myInputs.trim().length === 0) {

                      } else {
                          var item = myInputs;
                          SCourse.findOne({
                              'scourses.ctext': item
                          }, function(err, scourses) {
                              if (err)
                                  return done(err);
                              if (scourses) {

                              } else {
                                  SCourse.update({
                                      student: studUser
                                  }, {
                                      $push: {
                                          scourses: {
                                              'ctext': item
                                          }
                                      }
                                  }, function(err, removed) {});
                              }
                          });
                      }
                  } else {
                  	//else add new student info (first time student)
                      var courseObj = {
                          student: studUser,
                          scourses: []
                      };
                      if (myInputs.length === 0 || myInputs.trim().length === 0) {

                      } else {
                          courseObj.scourses.push({
                              "ctext": myInputs
                          });
                          var newCourse = new SCourse(courseObj);
                          newCourse.save(function(err) {
                              if (err)
                                  throw err;
                              return
                          });
                      }

                  }

              });
          });
          res.redirect("/createcourse");
      }

      // post request for creating a course
      app.post('/courseCreateAction', create);

      function create(req, res) {
          if (req.user.hasAccess('createPolls')) {
              var myInputs = req.body.myInputs;
              var profUser = req.user.local.email;

              console.log(myInputs);

              Course.findOne({
                  professor: profUser
              }, function(err, professor) {
                  // if there are any errors, return the error
                  if (err)
                      return done(err);

                  if (professor) {
                  	//Professor entry exists
                      var courseObj = {
                          professor: profUser,
                          courses: []
                      };

                      if (myInputs.length === 0 || myInputs.trim().length === 0) {
                      //no input
                      } else {
                          var item = myInputs;
                          Course.findOne({
                              'courses.ctext': item
                          }, function(err, courses) {

                              if (err)
                                  return done(err);
                              if (courses) {
                                  console.log("course already exist");
                              } else {
                                  console.log("add course");
                                  Course.update({
                                      professor: profUser
                                  }, {
                                      $push: {
                                          courses: {
                                              'ctext': item
                                          }
                                      }
                                  }, function(err, removed) {});
                              }
                          });
                      }
                  } else {
                  		//Professor entry does not exists 
                      var courseObj = {
                          professor: profUser,
                          courses: []
                      };

                      if (myInputs instanceof Array) {
                      		// multiple courses as input
                          var filteredInputs = myInputs.slice() // slice makes copy of array before sorting it
                              .sort(function(a, b) {
                                  return a - b;
                              })
                              .reduce(function(a, b) {
                                  if (a.slice(-1)[0] !== b) a.push(b); // slice(-1)[0] means last item in array without removing it (like .pop())
                                  return a;
                              }, []);
                              // create objects to be added
                          for (var i in filteredInputs) {

                              var item = filteredInputs[i];
                              if (item.length === 0 || item.trim().length === 0) {

                              } else {

                                  courseObj.courses.push({
                                      "ctext": item
                                  });

                              }

                          }
                          //insert into db
                          var newCourse = new Course(courseObj);
                          newCourse.save(function(err) {
                              if (err)
                                  throw err;
                              return
                          });
                      } else {
                      	// single course as input
                          if (myInputs.length === 0 || myInputs.trim().length === 0) {

                          } else {
                              courseObj.courses.push({
                                  "ctext": myInputs
                              });
                              var newCourse = new Course(courseObj);
                              newCourse.save(function(err) {
                                  if (err)
                                      throw err;
                                  return
                              });
                          }

                      }

                  }
              });

              res.redirect("/createcourse");
          } else {

          }
      }

      //post request from polllist
      app.post('/pollListAction', function(req, res) {
          Poll.find({
              'question': req.body.que
          }, function(error, polls) {
              res.render('vote', {
                  qlist: polls
              });
          });
      });

      // Send confirmation email to registered user with randomly generated token in the link
      app.get('/send', function(req, res) {
          rand = Math.floor((Math.random() * 100) + 54);
          host = req.get('host');
          link = "http://" + req.get('host') + "/verify?email=" + req.user.local.email;
          // Mail paramters
          mailOptions = {
              from: 'UIC Clicker <foo@blurdybloop.com>', // sender address
              to: req.user.local.email, // list of receivers
              subject: "Please confirm your Email account", // Subject line
              html: "Hello " + req.user.local.fname + "<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify</a>" // html body
          };
          // Send email
          transporter.sendMail(mailOptions, function(error, info) {
              if (error) {
                  console.log(error);
              } else {
                  res.end("<h1>Email sent. Please confirm your email address and continue.<h1>");
              }
          });
      });

      // Verify email confirmation and activate user
      app.get('/verify', function(req, res) {
          console.log(req.protocol + ":/" + req.get('host'));
          if ((req.protocol + "://" + req.get('host')) == ("http://" + host)) {
              User.findOne({
                  "local.email": req.query.email
              }, function(err, u) {
                  if (err)
                      return done(err);
                  if (u) {
                  	//activate user
                      User.update({
                          "local.email": req.query.email
                      }, {
                          "local.activated": 1
                      }, function(err, removed) {});
                  }
                  res.redirect('/profile');
              });
          } else {
          	// incorrect verification email
              res.end("<h1>Request is from unknown source");
          }
      });
  };

 
  
