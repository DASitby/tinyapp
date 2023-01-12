const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const PORT = 8080;

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
const users = {};

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

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls.json', (req,res) => {
  res.json(urlDatabase);
});

//REGISTER
app.get('/register', (req,res) => {
  const templateVars = {};
  if (req.cookies) {
    templateVars.user = users[req.cookies['user_id']];
  }
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  let newEmail = req.body.email;
  let newPassword = req.body.password;
  //error handling
  if (newEmail === '' || newPassword === '') {
    res.status(400);
    return res.redirect('/register');
  }
  if (!emailLookup(newEmail)) {
  //user generation
    let newUser = {
      id: generateRandomString(),
      email: newEmail,
      password:newPassword
    };
    users[newUser.id] = newUser;
    res.cookie('user_id', newUser.id);
    res.redirect('/urls');
  } else {
    res.status(400);
    return res.redirect('/register');
  }
});

//LOGIN
app.get('/login', (req,res) => {
  const templateVars = {};
  if (req.cookies) {
    templateVars.user = users[req.cookies['user_id']];
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
    if (user.password === loginPass) {
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
app.post('/urls', (req, res) => {
  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});
app.get('/urls/new', (req, res) => {
  const templateVars = {};
  if (req.cookies) {
    templateVars.user = users[req.cookies['user_id']];
  }
  res.render('urls_new',templateVars);
});

//READ (ALL)
app.get('/urls', (req,res) => {
  const templateVars = {urls: urlDatabase};
  if (req.cookies) {
    templateVars.user = users[req.cookies['user_id']];
  }
  res.render('urls_index', templateVars);
});

//READ(ONE)
app.get('/urls/:id', (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id]};
  if (req.cookies) {
    templateVars.user = users[req.cookies['user_id']];
  }
  res.render('urls_show', templateVars);
});

//UPDATE
app.post('/urls/:id/rewrite', (req,res) => {
  const id = req.params.id;
  const newURL = req.body.newID;
  urlDatabase[id] = newURL;
  res.redirect(`/urls/${id}`);
});

//DELETE
app.post('/urls/:id/delete', (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect(`/urls`);
});

//REDIRECT TO
app.get('/u/:id', (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

/////////////
/// LISTENER
/////////////
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});