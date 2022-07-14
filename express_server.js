const express = require("express"); // Requires Express (Routing / Server).
const app = express(); // Create an express server and reference it with app.
const PORT = 8080;
const cookieParser = require('cookie-parser'); // A parser that looks through cookies and parses them from their objects.
const bcrypt = require("bcryptjs"); // A hash creator that encrypts passwords.
const salt = bcrypt.genSaltSync(10);

app.set("view engine", "ejs"); // Sets our template engine to .ejs files.
app.use(express.urlencoded({ extended: true})); // Middleware to receieve request information.
app.use(cookieParser()); // allows the app variable to use the value of cookie-parser.

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
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
    password: bcrypt.compareSync("dishwasher-funk", salt),
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

const passwordRetriever = password => {
  for (let user in users) {
    if (password === users[user].password) {
      return users[user];
    }
  }
  return null;
};

const urlsForUser = userid => {
  let output = {};
  for (let url in urlDatabase) {
    if (userid === urlDatabase[url].userID) {
      output[url] = urlDatabase[url];
    }
  }
  return output;
};

app.get('/register', (req, res) => {
  const templateVars = { user: req.cookies["user"] };
  if (templateVars.user) {
    return res.redirect('/urls');
  }
  res.render("urls_register", templateVars);
});

app.post('/register', (req, res) => { // setting up the users object
  if (!req.body.email|| !req.body.password) {
    return res.send("Error 400: Email or Password is undefined. Please enter a valid email address and password and try again.");
  } else if (emailRetriever(req.body.email)) {
    return res.send("Error 404: Email already registered.")
  } else if (emailRetriever(req.body.email) === null) {
    const randomUserID = generateRandomString(); // this is the user ID
    users[randomUserID] = { id: randomUserID, email: req.body.email, password: bcrypt.hashSync(req.body.password, salt) }; // What is being added to the object
    console.log(users[randomUserID]);
    res.cookie("user_id", users[randomUserID].id); // Here
    res.cookie("user", users[randomUserID]); // and here cookies to create after signing up
    return res.redirect('/urls');
  }
});

app.get('/login', (req, res) => {
  const templateVars = { user: req.cookies["user"] };
  if (templateVars.user) {
    return res.redirect('/urls');
  }
  return res.render("urls_login", templateVars);
});

app.post('/login', (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.send("Error 400: Email or Password is undefined. Please enter a valid email address and password and try again.");
  } 
  const user = emailRetriever(req.body.email);
  if (user) {
    const password = user.password;
    if (!bcrypt.compareSync(req.body.password, password)) {
      return res.send("Error 403: Password is incorrect.")
    } 
    res.cookie("user", user);
    res.cookie("user_id", user.id);
    return res.redirect("/urls");
  } else {
    return res.send("Error 403: Login failed, Email is not registered.");
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie("user");
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlsForUser(req.cookies["user_id"]), user: req.cookies["user"] };
  if (!templateVars.user) {
    return res.send("Please login before viewing your URLs.");
  }
  return res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const templateVars = { user: req.cookies["user"] };
  if (!templateVars.user) {
    return res.send("Please register or log in before attempting to shorten a URL.")
  }
  const randomId = generateRandomString();
  urlDatabase[randomId] = { longURL: req.body.longURL, userID: req.cookies["user_id"] };
  const id = randomId;
  return res.redirect(`/urls/${id}`);
});

app.get("/urls/new", (req, res) => { // page to create new URL
  const templateVars = { user: req.cookies["user"] };
  if (!templateVars.user) {
    return res.redirect('/login');
  }
  return res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => { // Adds URLs
  const urlsForCurrentUser = urlsForUser(req.cookies["user_id"]);
  if (!req.params.id) {
    return res.send("Please submit a valid Shortened URL.")
  } else if (!req.cookies["user_id"]) {
    return res.send("Please log in before trying to shorten a URL.")
  } else if (!urlsForCurrentUser[req.params.id]) {
    return res.send("Use the correct user please, these are not your URLS.")
  } else if (urlsForCurrentUser[req.params.id]) {
  const templateVars = { user: req.cookies["user"], id: req.params.id, longURL: urlDatabase[req.params.id].longURL };
  return res.render("urls_show", templateVars);
  }
});

app.post('/urls/:id', (req, res) => { // Edits URLs
  const urlsForCurrentUser = urlsForUser(req.cookies["user_id"]);
  if (!req.params.id) {
    return res.send("Please submit a valid Shortened URL.")
  } else if (!req.cookies["user_id"]) {
    return res.send("Please log in before trying to edit a shortened URL.")
  } else if (!urlsForCurrentUser[req.params.id]) {
    return res.send("Use the correct user please, these are not your URLS.")
  } else if (urlsForCurrentUser[req.params.id]) {
    console.log(req.params.id);
    console.log("Before editing", urlDatabase);
  urlDatabase[req.params.id] = { longURL: req.body.longURL, userID: req.cookies['user_id'] };
  console.log("After editing", urlDatabase);
  return res.redirect(`/urls`);
  }
});

app.post("/urls/:id/delete", (req, res) => { // Deletes URLs
  const urlsForCurrentUser = urlsForUser(req.cookies["user_id"]);
  if (!req.params.id) {
    return res.send("Please submit a valid Shortened URL.")
  } else if (!req.cookies["user_id"]) {
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


