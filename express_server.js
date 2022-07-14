const express = require("express"); // Requires Express (Routing / Server).
const app = express(); // Create an express server and reference it with app.
const PORT = 8080;
const cookieParser = require('cookie-parser'); // A parser that looks through cookies and parses them from their objects.
const bcrypt = require("bcryptjs"); // A hash creator that encrypts passwords.
const salt = bcrypt.genSaltSync(10);
const cookieSession = require("cookie-session");
const { generateRandomString, emailRetriever, urlsForUser } = require("./helpers")

app.set("view engine", "ejs"); // Sets our template engine to .ejs files.
app.use(express.urlencoded({ extended: true})); // Middleware to receieve request information.
app.use(cookieParser()); // allows the app variable to use the value of cookie-parser.
app.use(cookieSession({
  name: 'session',
  keys: ["gorp and maybe shlorp", "but it could be norp also"],

  maxAge: 24 * 60 * 60 * 1000
})); // Allows Encrypted cookie sessions to be created for different user visits.

const urlDatabase = { // Database of shortened URLs with their accompanying longURLs and the users who own them.
};

const users = { // Database of users and user information.
};

app.get('/register', (req, res) => { // Registration page
  const templateVars = { user: req.session.user_id };
  if (templateVars.user) {
    return res.redirect('/urls');
  }
  res.render("urls_register", templateVars);
});

app.post('/register', (req, res) => { // setting up the users object
  if (!req.body.email|| !req.body.password) {
    return res.send("Error 400: Email or Password is undefined. Please enter a valid email address and password and try again.");
  } else if (emailRetriever(req.body.email, users)) {
    return res.send("Error 404: Email already registered.")
  } else if (emailRetriever(req.body.email, users) === undefined) {
    const randomUserID = generateRandomString(); // this is the user ID
    users[randomUserID] = { id: randomUserID, email: req.body.email, password: bcrypt.hashSync(req.body.password, salt) }; // What is being added to the object
    req.session.user_id = users[randomUserID].id; // Here,
    req.session.user =  users[randomUserID]; // and here are cookies to create after registering.
    return res.redirect('/urls');
  }
});

app.get('/login', (req, res) => { // Login page
  const templateVars = { user: req.session.user };
  if (templateVars.user) {
    return res.redirect('/urls');
  }
  return res.render("urls_login", templateVars);
});

app.post('/login', (req, res) => { // Logging in to an existing user.
  if (!req.body.email || !req.body.password) {
    return res.send("Error 400: Email or Password is undefined. Please enter a valid email address and password and try again.");
  } 
  const user = emailRetriever(req.body.email, users); // Retrieves email from the appropriate user as long as it is stored in the "users" object.
  if (user) {
    const password = user.password;
    if (!bcrypt.compareSync(req.body.password, password)) { // Retrieves encrypted password to check against the password entered.
      return res.send("Error 403: Password is incorrect.")
    }
    req.session.user_id = user.id; // Assigning new cookies.
    req.session.user = user;
    return res.redirect("/urls");
  } else {
    return res.redirect('/register');
  }
});

app.post('/logout', (req, res) => {
  req.session.user = null;
  req.session.user_id = null;
  res.redirect("/login");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlsForUser(req.session.user_id, urlDatabase), user: req.session.user };
  if (!templateVars.user) {
    return res.send("Please login before viewing your URLs.");
  }
  return res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const templateVars = { user: req.session.user };
  if (!templateVars.user) {
    return res.send("Please register or log in before attempting to shorten a URL.")
  }
  const randomId = generateRandomString();
  urlDatabase[randomId] = { longURL: req.body.longURL, userID: req.session.user_id };
  const id = randomId;
  return res.redirect(`/urls/${id}`);
});

app.get("/urls/new", (req, res) => { // page to create new URL
  const templateVars = { user: req.session.user };
  if (!templateVars.user) {
    return res.redirect('/login');
  }
  return res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => { // Adds URLs
  const urlsForCurrentUser = urlsForUser(req.session.user_id, urlDatabase);
  if (!req.params.id) {
    return res.send("Please submit a valid Shortened URL.")
  } else if (!req.session.user_id) {
    return res.send("Please log in before trying to shorten a URL.")
  } else if (!urlsForCurrentUser[req.params.id]) {
    return res.send("Use the correct user please, these are not your URLS.")
  } else if (urlsForCurrentUser[req.params.id]) {
  const templateVars = { user: req.session.user, id: req.params.id, longURL: urlDatabase[req.params.id].longURL };
  return res.render("urls_show", templateVars);
  }
});

app.post('/urls/:id', (req, res) => { // Edits URLs
  const urlsForCurrentUser = urlsForUser(req.session.user_id, urlDatabase);
  if (!req.params.id) {
    return res.send("Please submit a valid Shortened URL.")
  } else if (!req.session.user_id) {
    return res.send("Please log in before trying to edit a shortened URL.")
  } else if (!urlsForCurrentUser[req.params.id]) {
    return res.send("Use the correct user please, these are not your URLS.")
  } else if (urlsForCurrentUser[req.params.id]) {
  urlDatabase[req.params.id] = { longURL: req.body.longURL, userID: req.session.user_id };
  return res.redirect(`/urls`);
  }
});

app.post("/urls/:id/delete", (req, res) => { // Deletes URLs
  const urlsForCurrentUser = urlsForUser(req.session.user_id, urlDatabase);
  if (!req.params.id) {
    return res.send("Please submit a valid Shortened URL.")
  } else if (!req.session.user_id) {
    return res.send("Please log in before trying to delete a URL.")
  } else if (!urlsForCurrentUser[req.params.id]) {
    return res.send("Use the correct user please, these are not your URLS.")
  } else if (urlsForCurrentUser[req.params.id]) {
  delete urlDatabase[req.params.id];
  return res.redirect("/urls");
  }
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  return res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Tinyapp listening on port ${PORT}.`);
});


