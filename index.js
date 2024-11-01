import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import NewsAPI from "newsapi";
import dotenv from "dotenv";
import db from "./db.js";
import session from "express-session";

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

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

//Middleware to check user log status

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
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
    res.render("filtered", { articles });
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
app.post("/registered", (req, res) => {
  const { username, password } = req.body;
  const query = "INSERT INTO users (username, password) VALUES (?, ?)";

  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error(err);
      res.render("register", { message: "fail to register please try again." });
    } else {
      res.send("User registered successfully!");
      res.redirect("/", {
        message:
          "you have registerd successfully to have advance access and serch log in ",
      });
    }
  });
});

// Render login page

app.get("/login", (req, res) => {
  res.render("login");
});

// Post Login Route
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const query = "SELECT * FROM users WHERE username = ? AND password = ?";

  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error logging in.");
    } else if (results.length > 0) {
      req.session.user = username; // Set session user
      res.redirect("/filter"); // Redirect to /filter after login
    } else {
      res.send("Invalid username or password.");
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
