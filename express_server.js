//////////
///IMPORTS
//////////
const express = require("express");
const app = express();
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

////////////
///CONSTANTS
////////////
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

///////////////////
///HELPER FUNCTIONS
///////////////////

const emailLookup = (checkEmail) => {
  for (const key in users) {
    if (Object.hasOwnProperty.call(users, key)) {
      const user = users[key];
      if (user.email === checkEmail) {
        return user;
      }
    }
  }
  return null;
};
const generateRandomString = (length = 6)=>Math.random().toString(36).substr(2, length);
const urlsforUser = (loggedInAs) => {
  let results = {};
  for (const url in urlDatabase) {
    let ID = urlDatabase[url].userID;
    if (ID === loggedInAs) {
      results[url] = urlDatabase[url];
    }
  }
  return results;
};
const urlExists = (url) => {
  for (const key in urlDatabase) {
    if (url === key) {
      return true;
    }
  }
  return false;
};
const ownerCheck = (loggedInAs, URL) => {
  if (urlExists(URL)) {
    if (urlDatabase[URL].userID === loggedInAs) {
      return true;
    } else {
      return false;
    }
  }
};


app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls.json', (req,res) => {
  res.json(urlDatabase);
});

//REGISTER
app.get('/register', (req,res) => {
  const templateVars = {user: users[req.session.user_id]};
  if (req.session.user_id) {
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
  if (!emailLookup(newEmail)) {
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
  const templateVars = {user: users[req.session.user_id]};
  if (req.session.user_id) {
    res.redirect('/urls');
    return;
  }
  res.render('login',templateVars);
});

app.post('/login', (req, res) => {
  let loginEmail = req.body.email;
  let loginPass = req.body.password;
  let user = emailLookup(loginEmail);
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
  res.clearCookie('user_id');
  res.redirect('/login');
});
///////////////
///URL HANDLERS
///////////////

//CREATE
app.get('/urls/new', (req, res) => {
  const templateVars = {user: users[req.session.user_id]};
  if (!req.session.user_id) {
    res.redirect('/login');
    return;
  }
  res.render('urls_new',templateVars);
});
app.post('/urls', (req, res) => {
  if (!req.session.user_id) {
    res.send('<p>Cannot shorten URLs unless you <a href="/register">register</a> for tinyapp</p>');
    return;
  } else {
    const id = generateRandomString();
    urlDatabase[id] = {longURL: req.body.longURL,userID: req.session.user_id};
    res.redirect(`/urls/${id}`);
  }
});

//READ (ALL)
app.get('/urls', (req,res) => {
  if (!req.session.user_id) {
    res.send('<p>Cannot display URLs unless you <a href="/register">register</a> or <a href="/login">login</a></p>');
    return;
  } else {
    let userUrls = urlsforUser(req.session.user_id);
    const templateVars = {urls: userUrls,user: users[req.session.user_id]};
    res.render('urls_index', templateVars);
  }
});

//READ(ONE)
app.get('/urls/:id', (req, res) => {
  let currentUser = req.session.user_id;
  if (!urlExists(req.params.id)) {
    res.status(404).send('<p>Error 404: This shortened URL does not exist</p>');
    return;
  } else if (!currentUser) {
    res.status(403).send('<p>Cannot display URL page unless you <a href="/register">register</a> or <a href="/login">login</a></p>');
  } else if (!ownerCheck(currentUser, req.params.id)) {
    res.status(403).send('<p>Error 403: This URL is not yours to edit</p>');
  } else {
    const templateVars = {
      id: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      user: users[req.session.user_id],
    };
    res.render('urls_show', templateVars);
  }
});

//UPDATE
app.post('/urls/:id/rewrite', (req,res) => {
  let currentUser = req.session.user_id;
  if (!urlExists(req.params.id)) {
    res.status(404).send('<p>Error 404: This shortened URL does not exist</p>');
    return;
  } else if (!currentUser) {
    res.status(403).send('<p>Cannot display URL page unless you <a href="/register">register</a> or <a href="/login">login</a></p>');
  } else if (!ownerCheck(currentUser, req.params.id)) {
    res.status(403).send('<p>Error 403: This URL is not yours to edit</p>');
  } else {
    const id = req.params.id;
    const newURL = req.body.newID;
    urlDatabase[id].longURL = newURL;
    res.redirect(`/urls/${id}`);
  }
});

//DELETE
app.post('/urls/:id/delete', (req, res) => {
  let currentUser = req.session.user_id;
  if (!urlExists(req.params.id)) {
    res.status(404).send('<p>Error 404: This shortened URL does not exist</p>');
    return;
  } else if (!currentUser) {
    res.status(403).send('<p>Cannot display URL page unless you <a href="/register">register</a> or <a href="/login">login</a></p>');
  } else if (!ownerCheck(currentUser, req.params.id)) {
    res.status(403).send('<p>Error 403: This URL is not yours to edit</p>');
  } else {
    const id = req.params.id;
    delete urlDatabase[id];
    res.redirect(`/urls`);
  }
});

//REDIRECT TO
app.get('/u/:id', (req, res) => {
  if (!urlExists(req.params.id)) {
    res.status(404).send('<p>Error 404: This shortened URL does not exist</p>');
  }
  for (const url in urlDatabase) {
    if (url === req.params.id) {
      const longURL = urlDatabase[req.params.id].longURL;
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