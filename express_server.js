const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

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
//READ (ALL)
app.get("/urls", (req,res) => {
  let templateVars = {urls: urlDatabase};
  res.render("urls_index", templateVars);
});

//CREATE
app.post("/urls", (req, res) => {
  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//READ(ONE)
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
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
  console.log(id);
  res.redirect(`/urls`);
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});