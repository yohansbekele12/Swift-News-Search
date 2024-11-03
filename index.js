import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import NewsAPI from "newsapi";
import dotenv from "dotenv";
import db from "./db.js";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import flash from "connect-flash";

// Create __dirname equivalent for ES modules

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Good staff
const app = express();
const API_KEY = process.env.API_KEY;
const newsapi = new NewsAPI(API_KEY);
const port = process.env.PORT;

//session config
app.use(
  session({
    secret: "loka",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);
app.use(flash());
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(
  "/bootstrap",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist"))
);

//Middleware to check user log status

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
}

// Middleware to stor username in res.locals

app.use((req, res, next) => {
  res.locals.username = req.session.user || null;
  next();
});

// Middleware to fetch articles
async function fetchArticles(req, res, next) {
  try {
    const response = await axios.get(
      `https://newsapi.org/v2/top-headlines?sources=bbc-news&apiKey=${API_KEY}`
    );
    res.locals.articles = response.data.articles; // Store in res.locals
    next();
  } catch (error) {
    console.log(error);
    next(error);
  }
}

// Random news route for unauthenticated users
app.get("/", async (req, res) => {
  console.log(req.body);
  try {
    const response = await axios.get(
      `https://newsapi.org/v2/top-headlines?sources=bbc-news&apiKey=${API_KEY}`
    );
    const result = response.data;
    res.render("index", { articles: result.articles });
    console.log(result.articles);
  } catch (error) {
    console.log(error);
  }
});

// Filtered article search route for authenticated users
app.post("/filter", isAuthenticated, async (req, res) => {
  const { country, source, q, category, language } = req.body;
  const params = {
    source: source,
    q: q,
    language: language,
  };
  console.log(req.body);
  try {
    const response = await newsapi.v2.everything(params);
    const { articles = [] } = response;
    res.render("filtered", { articles, username: req.session.user });
    console.log(response.articles);
  } catch (error) {
    console.log(error);
  }
});

//render filter page
app.get("/filter", isAuthenticated, async (req, res) => {
  try {
    const response = await axios.get(
      `https://newsapi.org/v2/top-headlines?sources=bbc-news&apiKey=${API_KEY}`
    );
    const result = response.data;
    res.render("filtered", { articles: result.articles });
    console.log(result.articles);
  } catch (error) {
    console.log(error);
  }
});

//render signUp page

app.get("/signup", (req, res) => {
  res.render("register");
});

// Register Route
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  // Encrypt password
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error hashing password."); // Ensure to return here
    }

    console.log("Password hashed:", hash);
    const query = "INSERT INTO users (username, password) VALUES (?, ?)";

    db.query(query, [username, hash], (err, results) => {
      if (err) {
        console.error(err);
        return res.render("register", {
          // Return to avoid further execution
          message: "Failed to register. Please try again.",
        });
      } else {
        // Assuming you are using flash messages
        req.flash(
          "success",
          "You have registered successfully! Please log in."
        ); // Use flash message
        return res.redirect("/"); // Redirect without trying to send a message
      }
    });
  });
});

// Render login page

app.get("/login", fetchArticles, (req, res) => {
  const successMessage = req.flash("success");
  const errorMessage = req.flash("error");
  let message = "";
  let articles = "";

  if (successMessage.length > 0) {
    message = successMessage[0];
  } else if (errorMessage.length > 0) {
    message = errorMessage[0];
  }
  return res.render("login", { message, articles: res.locals.articles });
});

// Post Login Route
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const query = "SELECT * FROM users WHERE username = ?";
  let articles = "";

  db.query(query, [username], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error logging in.");
    }

    if (results.length > 0) {
      const user = results[0]; // Get the first result
      // Compare password using bcrypt
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Error checking password.");
        }

        if (isMatch) {
          req.session.user = username; // Set session user
          return res.redirect("/filter"); // Redirect to /filter after login
        } else {
          // Password does not match
          res.render("login", {
            articles: res.locals.articles,
            message: "Login failed, User name or password not match.",
          });
        }
      });
    } else {
      // No user found
      res.render("login", {
        articles: res.locals.articles,
        message: "no User found with this name, please try again.",
      });
    }
  });
});

// Logout route to clear session and redirect to home
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error logging out.");
    } else {
      res.redirect("/"); // Redirect to homepage after logout
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
