const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const generateRandomString = () => {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabzdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

console.log(generateRandomString());

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);
  res.send("Ok");
})

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}.`);
});