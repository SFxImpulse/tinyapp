const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true})); // Middleware to receieve request information.
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const generateRandomString = () => {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabzdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const emailRetriever = email => {
  for (let user in users) {
    if (email === users[user].email) {
      return users[user];
    }
  }
  return null;
};

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: req.cookies["user"] };
  res.render("urls_index", templateVars);
});

app.get('/login', (req, res) => {
  const templateVars = { user: req.cookies["user"] };
  res.render("urls_login", templateVars);
})

app.post('/login', (req, res) => {
  res.cookie("user_id", req.body.user_id);
  res.redirect("/urls");
});

app.get('/register', (req, res) => {
  const templateVars = { user: req.cookies["user"] };
  res.render("urls_register", templateVars);
});

app.post('/register', (req, res) => { // setting up the users object
  console.log(req.body);
  console.log(users);
  if (!req.body.email|| !req.body.password) {
    return res.send("Error 400: Email or Password is undefined. Please enter a valid email address and password and try again.");
  } else if (emailRetriever(req.body.email)) {
    return res.send("Error 404: Email already registered.")
  } else if (emailRetriever(req.body.email) === null) {
    const randomUserID = generateRandomString(); // this is the user ID
    users[randomUserID] = { id: randomUserID, email: req.body.email, password: req.body.password }; // What is being added to the object
    res.cookie("user_id", users[randomUserID].id); // Here
    res.cookie("user", users[randomUserID]); // and here cookies to create after signing up
    return res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie("user");
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => { // page to create new URL
  const templateVars = { user: req.cookies["user"] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const randomId = generateRandomString();
  urlDatabase[randomId] = req.body.longURL;
  const id = randomId;
  res.redirect(`/urls/${id}`);
});

app.get("/urls/:id", (req, res) => { // Adds URLs
  const templateVars = { user: req.cookies["user"], id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.post('/urls/:id', (req, res) => { // Edits URLs
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls`);
});

app.post("/urls/:id/delete", (req, res) => { // Deletes URLs
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Tinyapp listening on port ${PORT}.`);
});


