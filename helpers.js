const getUserByEmail = (checkEmail, userList) => {
  for (const key in userList) {
    if (Object.hasOwnProperty.call(userList, key)) {
      const user = userList[key];
      if (user.email === checkEmail) {
        return user;
      }
    }
  }
  return null;
};
const generateRandomString = (length = 6)=>Math.random().toString(36).substr(2, length);

const urlsforUser = (loggedInAs, urlDatabase) => {
  let results = {};
  for (const url in urlDatabase) {
    let ID = urlDatabase[url].userID;
    if (ID === loggedInAs) {
      results[url] = urlDatabase[url];
    }
  }
  return results;
};
const urlExists = (url, urlDatabase) => {
  for (const key in urlDatabase) {
    if (url === key) {
      return true;
    }
  }
  return false;
};
const ownerCheck = (loggedInAs, URL, urlDatabase) => {
  if (urlExists(URL, urlDatabase)) {
    if (urlDatabase[URL].userID === loggedInAs) {
      return true;
    } else {
      return false;
    }
  }
};

module.exports = {
  getUserByEmail,
  generateRandomString,
  urlsforUser,
  urlExists,
  ownerCheck,
};