# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Final Product

!["MyURL page"](#)
!["Short URL Show page"](#)
!["Login Page"](#)
## Dependencies

- Node.js
- Express
- EJS
- bcryptjs
- cookie-session
- mocha
- chai
# Summary 
- TinyApp is a tool that can take a full length URL and create a shorter URL that references it, and redirects you to it.

## Getting Started
- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.
- Access TinyApp with `localhost:8080/` in a browser
  - This will default to the login page if you have not yet logged in during this instance of the server
  - If you aren't registered, there is a text link below the login field to redirect to register, and one in the top right corner of the header
- Once registered, a user can access the My URLs and Create New URL pages.
- When logged in, the login and register buttons in the header will be replace with a Logout button

## Creating and Viewing URLs
- In the Create New URL page there is a field where you can enter a Long URL and it will be generated with a corresponding random 6 character short URL
- These pairs are kept in the My URLs table on the My URLs page.
  - Each link pair has some metadata associated which is listed in the table:
    - Times Visited: The number of times the short URL has been visited/used to redirect to the long URL
    - Unique Visitors: The number of different registered users that have used the link + The number of anonymous users that have used the link
    - Date Created: The date the link pair was created
  - Each link pair has an Edit button which redirects to the link pair's respective show page.
  - Each link pair has a Delete button which deletes the pair from the database.

## URL Editing
- On the URL's show page you see:
  - The Short URL ID and the date it was created
  - The long URL it references and a form in which you can enter a new URL to change it
  - An analytics section with view count, viewer count, and a view log

## Helper functions and Unit Testing
- `express_server.js` uses 5 helper functions which are stored in `helpers.js`
- automated testing of these helper functions using mocha and chai can be executed by using the command `npm test`
  - these tests can be examined in `/test/helpersTest.js`