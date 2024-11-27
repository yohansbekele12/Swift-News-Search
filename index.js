import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import NewsAPI from "newsapi";
import dotenv from "dotenv";
import pg from "pg";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import flash from "connect-flash";
import passport from "passport";
import Googlestrategy from "passport-google-oauth20";
import { Strategy } from "passport-local";
import { access } from "fs";
import { profile } from "console";

// Create __dirname equivalent for ES modules

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

//
const app = express();
const API_KEY = process.env.APK_KEY;
const newsapi = new NewsAPI(API_KEY);
const port = process.env.PORT;
const saltRounds = 10;

//session config
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 6000 * 24 * 7, secure: false },
  })
);
app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.use(flash());
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(
  "/bootstrap",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist"))
);

//Middleware to check user log status

//middleware to check user Authentication
function AuthUser(req, res, next) {
  if (
    req.isAuthenticated() &&
    (req.user.strategy === "local" || req.user.strategy === "google")
  ) {
    return next();
  } else {
    res.redirect("/login");
  }
}

//middleware to protected routes

app.use("/protected", AuthUser);

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
app.post("/protected/filter", async (req, res) => {
  const { country, source, q, category, language } = req.body;
  const user = req.user;
  const params = {
    source: source,
    q: q,
    language: language,
  };
  console.log(req.body);
  try {
    const response = await newsapi.v2.everything(params);
    const { articles = [] } = response;
    res.render("filtered", { articles, user });
    console.log(response.articles);
  } catch (error) {
    console.log(error);
  }
});

//render filter page
app.get("/protected/filter", async (req, res) => {
  try {
    const user = req.user;

    console.log(user);
    const response = await axios.get(
      `https://newsapi.org/v2/top-headlines?sources=bbc-news&apiKey=${API_KEY}`
    );
    const result = response.data;
    res.render("filtered", { articles: result.articles, user });
    console.log(result.articles);
  } catch (error) {
    console.log(error);
  }
});

//render signUp page

app.get("/signup", (req, res) => {
  res.render("register", { message: null });
});

// Register Route
app.post("/register", async (req, res) => {
  const { username, password, email, term } = req.body;
  console.log(password);
  try {
    const checkUser = await db.query("SELECT * FROM users WHERE email =$1", [
      email,
    ]);

    if (checkUser.rows.length > 0) {
      res.render("register", {
        message: "user with this email alredy exist please log in instade ",
      });
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) console.error(err);
        const newuser = await db.query(
          "INSERT INTO users (username, email, password,terms) VALUES ($1,$2,$3,$4)",
          [username, email, hash, term]
        );

        if (newuser.rowCount > 0) {
          res.render("login", {
            message: "registerd succesfully log in to your account  ",
          });
          console.log(newuser.rows[0]);
        } else {
          console.log("entry faild ");
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
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
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/protected/filter",
    failureRedirect: "/login",
  })
);

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

// google auth invoke route
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/secrets/protected/filter",
  passport.authenticate("google", {
    successRedirect: "/protected/filter",
    failureRedirect: "/login",
  })
);

//local starategy
passport.use(
  "local",
  new Strategy(async function (user, password, cb) {
    try {
      const checkUser = await db.query("SELECT * FROM users WHERE email =$1", [
        user,
      ]);

      if (checkUser.rows.length > 0) {
        const user = checkUser.rows[0];
        const hashpassword = user.password;

        const checkpass = await bcrypt.compare(password, hashpassword);
        console.log(checkpass);
        if (checkpass) {
          user.strategy = "local";
          return cb(null, user);
        } else {
          return cb(null, false, { message: "invalid password" });
        }
      } else {
        return cb(null, false, { message: "User not found " });
      }
    } catch (err) {
      console.error(err);
      return cb(err);
    }
  })
);

passport.use(
  "google",
  new Googlestrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets/protected/filter",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        console.log("Google Profile Data:", profile);

        const checkuser = await db.query(
          "SELECT * FROM users WHERE email =$1",
          [profile.email]
        );
        let user;
        if (checkuser.rows.length > 0) {
          user = checkuser.rows[0];
          user.strategy = "google";

          user.picture = profile.photos[0]?.value || null;
        } else {
          console.log(profile);
          const newuser = await db.query(
            "INSERT INTO users (username, email, password,terms) VALUES ($1,$2,$3,$4) RETURNING *",
            [profile.given_name, profile.email, "google", "GT"]
          );

          if (newuser.rows.length > 0) {
            user = newuser.rows[0];
            user.strategy = "google";
            user.picture = profile.photos[0]?.value || null;
          } else {
            return cb(null, false, { message: "user creation failed" });
          }
        }
        return cb(null, user);
      } catch (err) {
        return cb(err);
      }
    }
  )
);
passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
