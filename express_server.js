//////////
///IMPORTS
//////////
const express = require("express");
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const bcrypt = require('bcryptjs');
const {
  getUserByEmail,
  generateRandomString,
  urlsforUser,
  urlExists,
  ownerCheck,
} = require('./helpers');

////////////
///CONSTANTS
////////////
const app = express();
const PORT = 8080;
const urlDatabase = {
  "b2xVn2": {longURL:'http://www.lighthouselabs.ca',userID: 'aJ48lW',viewCount: 0, viewers: [], viewLog: []},
  "9sm5xK": {longURL:'http://www.google.com', userID: 'aJ48lW',viewCount: 0, viewers: [], viewLog: []},
};
const users = {};

/////////////
///MIDDLEWARE
/////////////
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['yeahmyboyyeah'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));

/////////////////
///ROUTE HANDLERS
/////////////////

//ROOT
app.get('/', (req, res) => {
  let currentUser = req.session.user_id;
  //check if user is logged in
  if (!currentUser) {
    //if not logged in redirect to /login
    return res.redirect('/login');
  }
  //if logged in redirect to /urls
  res.redirect('/urls');
});

//REGISTER
app.get('/register', (req,res) => {
  let currentUser = req.session.user_id;
  const templateVars = {user: users[currentUser]};
  //check if user is logged in
  if (currentUser) {
    //if logged in redirect to /urls
    res.redirect('/urls');
    return;
  }
  //if not logged in, render register page
  res.render('register', templateVars);
});
app.post('/register', (req, res) => {
  let newEmail = req.body.email;
  let newPassword = bcrypt.hashSync(req.body.password, 10);
  //error handling
  //check if either email or password are blank
  if (newEmail === '' || newPassword === '') {
    //if either is blank redirect back to register
    return res.status(400).redirect('/register');
  }
  //check if the entered email is already in the users object
  if (!getUserByEmail(newEmail, users)) {
  //if not in the users object, generate a new user
    let newUser = {
      id: generateRandomString(),
      email: newEmail,
      password:newPassword
    };
    //add that user to the users object
    users[newUser.id] = newUser;
    //add the new user's ID to the session cookie
    req.session['user_id'] = newUser.id;
    //redirect to /urls after a successful registration
    res.redirect('/urls');
  } else {
    //if user is already in users object, redirect to /login
    return res.status(400).redirect('/login');
  }
});

//LOGIN
app.get('/login', (req,res) => {
  let currentUser = req.session.user_id;
  const templateVars = {user: users[currentUser]};
  //check if already logged in
  if (req.session.user_id) {
    //if already logged in redirect to /urls
    res.redirect('/urls');
    return;
  }
  //if not already logged in render login
  res.render('login',templateVars);
});
app.post('/login', (req, res) => {
  let loginEmail = req.body.email;
  let loginPass = req.body.password;
  let user = getUserByEmail(loginEmail, users);
  //if user doesn't exist, redirect to register
  if (!user) {
    return res.status(404).redirect('/register');
  } else {
    /*
    if user does exist, check if encrypted password
    is the same as what was passed in the form
    */
    if (bcrypt.compareSync(loginPass, user.password)) {
      //if the passwords match, set the session cookie to the user's id
      req.session['user_id'] = user.id;
      //render /urls
      res.redirect('/urls');
    } else {
      //if the passwords don't match, redirect back to /login
      return res.status(403).redirect('/login');
    }
  }
});

//LOGOUT
app.post('/logout', (req,res) => {
  //clear the session cookie
  req.session = null;
  //redirect to /login
  res.redirect('/login');
});

///////////////
///URL HANDLERS
///////////////

//CREATE
app.get('/urls/new', (req, res) => {
  let currentUser = req.session.user_id;
  const templateVars = {user: users[req.session.user_id]};
  if (!currentUser) {
    res.redirect('/login');
    return;
  }
  res.render('urls_new',templateVars);
});
app.post('/urls', (req, res) => {
  let currentUser = req.session.user_id;
  if (!currentUser) {
    res.send('<p>Cannot shorten URLs unless you <a href="/register">register</a> for tinyapp</p>');
    return;
  } else {
    const id = generateRandomString();
    urlDatabase[id] = {
      longURL: req.body.longURL,
      userID: currentUser,
      viewCount: 0,
      viewers: [],
      viewLog: [],
    };
    res.redirect(`/urls/${id}`);
  }
});

//READ (ALL)
app.get('/urls', (req,res) => {
  let currentUser = req.session.user_id;
  if (!currentUser) {
    res.send('<p>Cannot display URLs unless you <a href="/register">register</a> or <a href="/login">login</a></p>');
    return;
  } else {
    let userUrls = urlsforUser(currentUser,urlDatabase);
    const templateVars = {urls: userUrls,user: users[currentUser]};
    res.render('urls_index', templateVars);
  }
});

//READ(ONE)
app.get('/urls/:id', (req, res) => {
  let currentUser = req.session.user_id;
  let currentID = req.params.id;
  if (!urlExists(currentID, urlDatabase)) {
    res.status(404).send('<p>Error 404: This shortened URL does not exist</p>');
    return;
  } else if (!currentUser) {
    res.status(403).send('<p>Cannot display URL page unless you <a href="/register">register</a> or <a href="/login">login</a></p>');
  } else if (!ownerCheck(currentUser, currentID, urlDatabase)) {
    res.status(403).send('<p>Error 403: This URL is not yours to edit</p>');
  } else {
    const templateVars = {
      id: currentID,
      longURL: urlDatabase[currentID].longURL,
      user: users[currentUser],
      viewCount: urlDatabase[currentID].viewCount,
      viewerCount: urlDatabase[currentID].viewers.length,
      viewLog: urlDatabase[currentID].viewLog,
    };
    res.render('urls_show', templateVars);
  }
});

//UPDATE
app.put('/urls/:id', (req,res) => {
  let currentUser = req.session.user_id;
  let currentID = req.params.id;
  if (!urlExists(currentID, urlDatabase)) {
    res.status(404).send('<p>Error 404: This shortened URL does not exist</p>');
    return;
  } else if (!currentUser) {
    res.status(403).send('<p>Cannot display URL page unless you <a href="/register">register</a> or <a href="/login">login</a></p>');
  } else if (!ownerCheck(currentUser, currentID, urlDatabase)) {
    res.status(403).send('<p>Error 403: This URL is not yours to edit</p>');
  } else {
    const newURL = req.body.newID;
    urlDatabase[currentID].longURL = newURL;
    res.redirect(`/urls/${currentID}`);
  }
});

//DELETE
app.delete('/urls/:id', (req, res) => {
  let currentUser = req.session.user_id;
  let currentID = req.params.id;
  if (!urlExists(currentID, urlDatabase)) {
    res.status(404).send('<p>Error 404: This shortened URL does not exist</p>');
    return;
  } else if (!currentUser) {
    res.status(403).send('<p>Cannot display URL page unless you <a href="/register">register</a> or <a href="/login">login</a></p>');
  } else if (!ownerCheck(currentUser, currentID, urlDatabase)) {
    res.status(403).send('<p>Error 403: This URL is not yours to edit</p>');
  } else {
    delete urlDatabase[currentID];
    res.redirect(`/urls`);
  }
});

//REDIRECT TO
app.get('/u/:id', (req, res) => {
  //simplifying variables
  let currentUser = req.session.user_id;
  let currentID = req.params.id;
  //Check if url exists in the database, if not, send an error message
  if (!urlExists(currentID, urlDatabase)) {
    res.status(404).send('<p>Error 404: This shortened URL does not exist</p>');
  }
  //Find which id in the URL database matches :id
  for (const url in urlDatabase) {
    if (url === currentID) {
      //Increment view count
      urlDatabase[currentID].viewCount++;
      //Check if viewer is in the viewers array
      if (!urlDatabase[currentID].viewers.includes(currentUser)) {
        //Add them if they aren't already in there
        urlDatabase[currentID].viewers.push(currentUser);
      }
      //Log the view
      urlDatabase[currentID].viewLog.push({
        'timestamp': new Date(Date.now()),
        'visitor_id': generateRandomString(4),
      });
      //Redirect to longURL corresponding to :id
      const longURL = urlDatabase[currentID].longURL;
      return res.redirect(longURL);
    }
  }
});

/////////////
/// LISTENER
/////////////
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});