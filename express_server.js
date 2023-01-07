const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const PORT = 8080;

app.set("view engine", "ejs");
app.use(cookieParser());
let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = (length = 6)=>Math.random().toString(36).substr(2, length);

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req,res) => {
  res.json(urlDatabase);
});

//LOGIN
app.post("/login", (req, res) => {
  res.cookie('username', res.req.body.username);
  res.redirect('/urls');
});

//LOGOUT
app.post("/logout", (req,res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

//CREATE
app.post("/urls", (req, res) => {
  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});
app.get("/urls/new", (req, res) => {
  const templateVars = {};
  if (req.cookies) {
    templateVars.username = req.cookies['username'];
  }
  res.render("urls_new",templateVars);
});

//READ (ALL)
app.get("/urls", (req,res) => {
  const templateVars = {urls: urlDatabase};
  if (req.cookies) {
    templateVars.username = req.cookies['username'];
  }
  console.log(templateVars);
  res.render("urls_index", templateVars);
});

//READ(ONE)
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id]};
  if (req.cookies) {
    templateVars.username = req.cookies['username'];
  }
  res.render("urls_show", templateVars);
});

//UPDATE
app.post("/urls/:id/rewrite", (req,res) => {
  const id = req.params.id;
  const newURL = res.req.body.newID;
  urlDatabase[id] = newURL;
  res.redirect(`/urls/${id}`);
});

//DELETE
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect(`/urls`);
});

//REDIRECT
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});