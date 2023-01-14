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
  "b2xVn2": {longURL:'http://www.lighthouselabs.ca',userID: 'aJ48lW'},
  "9sm5xK": {longURL:'http://www.google.com', userID: 'aJ48lW'},
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

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls.json', (req,res) => {
  res.json(urlDatabase);
});

//REGISTER
app.get('/register', (req,res) => {
  let currentUser = req.session.user_id;
  const templateVars = {user: users[currentUser]};
  if (currentUser) {
    res.redirect('/urls');
    return;
  }
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  let newEmail = req.body.email;
  let newPassword = bcrypt.hashSync(req.body.password, 10);
  //error handling
  if (newEmail === '' || newPassword === '') {
    return res.status(400).redirect('/register');
  }
  if (!getUserByEmail(newEmail, users)) {
  //user generation
    let newUser = {
      id: generateRandomString(),
      email: newEmail,
      password:newPassword
    };
    users[newUser.id] = newUser;
    req.session['user_id'] = newUser.id;
    res.redirect('/urls');
  } else {
    return res.status(400).redirect('/register');
  }
});

//LOGIN
app.get('/login', (req,res) => {
  let currentUser = req.session.user_id;
  const templateVars = {user: users[currentUser]};
  if (req.session.user_id) {
    res.redirect('/urls');
    return;
  }
  res.render('login',templateVars);
});

app.post('/login', (req, res) => {
  let loginEmail = req.body.email;
  let loginPass = req.body.password;
  let user = getUserByEmail(loginEmail, users);
  if (!user) {
    return res.status(403).redirect('/login');
  } else {
    if (bcrypt.compareSync(loginPass, user.password)) {
      res.cookie('user_id', user.id);
      res.redirect('/urls');
    } else {
      return res.status(403).redirect('/login');
    }
  }
});

//LOGOUT
app.post('/logout', (req,res) => {
  res.clearCookie('session');
  res.clearCookie('session.sig');
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
    urlDatabase[id] = {longURL: req.body.longURL,userID: currentUser};
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
    //req.session.views = (req.session.views || 0) + 1;
    const templateVars = {
      id: currentID,
      longURL: urlDatabase[currentID].longURL,
      user: users[currentUser],
      views: req.session.views,
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
  let currentID = req.params.id;
  if (!urlExists(currentID, urlDatabase)) {
    res.status(404).send('<p>Error 404: This shortened URL does not exist</p>');
  }
  for (const url in urlDatabase) {
    if (url === currentID) {
      req.session.views = (req.session.views || 0) + 1;
      const longURL = urlDatabase[currentID].longURL;
      return res.redirect(longURL);
    }
  }
  res.status(404).send('<p>URL not found</p>');
});

/////////////
/// LISTENER
/////////////
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});