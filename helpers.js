const generateRandomString = () => {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabzdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const emailRetriever = (email, database) => {
  for (let user in database) {
    if (email === database[user].email) {
      return database[user];
    }
  }
  return undefined;
};

const urlsForUser = (userid, database) => {
  let output = {};
  for (let url in database) {
    if (userid === database[url].userID) {
      output[url] = database[url];
    }
  }
  return output;
};

module.exports = { generateRandomString, emailRetriever, urlsForUser };