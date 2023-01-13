const { assert } = require('chai');
const {
  getUserByEmail,
  generateRandomString,
  urlsforUser,
  urlExists,
  ownerCheck,
} = require('../helpers');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const testURLS = {
  "b2xVn2": {longURL:'http://www.lighthouselabs.ca',userID: 'aJ48lW'},
  "9sm5xK": {longURL:'http://www.google.com', userID: 'oTh3R2'},
};

describe('getUserByEmail', function() {
  const user = getUserByEmail('user@example.com', testUsers);
  const expectedUserID = 'userRandomID';
  const expectedUserEmail = 'user@example.com';
  it('should return an object', function() {
    assert.strictEqual(typeof user,'object');
  });
  it('should return a user with the right ID', function() {
    assert.strictEqual(user.id,expectedUserID);
  });
  it('should return a user with the right Email', function() {
    assert.strictEqual(user.email,expectedUserEmail);
  });
  it('should return null with a nonexistent email', function() {
    assert.strictEqual(getUserByEmail("davidsooley@nowhere.com"), null);
  });
});

describe('generateRandomString', function() {
  const string = generateRandomString();
  it('should return a string', function() {
    assert.strictEqual(typeof string, 'string');
  });
  it('should return a string of length 6 if fed no parameter', function() {
    assert.strictEqual(string.length, 6);
  });
  it('should return a string of length 10 if fed 10', function() {
    assert.strictEqual(generateRandomString(10).length, 10);
  });
});

describe('urlsForUser', function() {
  const urls = urlsforUser("aJ48lW", testURLS);
  const expectedURLS = {
    "b2xVn2": {longURL:'http://www.lighthouselabs.ca',userID: 'aJ48lW'},
  };
  it('should return an object', function() {
    assert.strictEqual(typeof urls, 'object');
  });
  it('should return the urls with a matching userID', function() {
    assert.deepEqual(urls, expectedURLS);
  });
  it('should not return the urls without a matching userID', function() {
    assert.deepEqual(urlsforUser("R4nD0m", testURLS), {});
  });
});

describe('urlExists', function() {
  it('should return true with a valid URL ID', function() {
    const checkTrue = urlExists("9sm5xK", testURLS);
    assert.strictEqual(checkTrue, true);
  });
  it('should return false with an invalid URL ID', function() {
    const checkFalse = urlExists("oTh3R2", testURLS);
    assert.strictEqual(checkFalse, false);
  });
  it('should return false with an empty URL ID', function() {
    const checkEmpty = urlExists("", testURLS);
    assert.strictEqual(checkEmpty, false);
  });
});

describe('ownerCheck', function() {
  const validOwner = ownerCheck("aJ48lW", "b2xVn2", testURLS);
  const invalidUser = ownerCheck("oTh3R2", "b2xVn2", testURLS);
  const invalidOwner = ownerCheck("aJ48lW", "9sm5xK", testURLS);
  const invalidID = ownerCheck("aJ48lW", "oTh3R2", testURLS);
  const emptyDatabase = ownerCheck("aJ48lW", "b2xVn2", {});
  it('should return true if fed the correct owner', function() {
    assert.strictEqual(validOwner, true);
  });
  it('should return false if fed an invalid owner of an existing URL', function() {
    assert.strictEqual(invalidUser, false);
  });
  it('should return false if fed a URL owned by a different user', function() {
    assert.strictEqual(invalidOwner, false);
  });
  it('should return undefined if fed a nonexistent ID', function() {
    assert.strictEqual(invalidID, undefined);
  });
  it('should return undefined if fed a database with no URLs', function() {
    assert.strictEqual(emptyDatabase, undefined);
  });
});
