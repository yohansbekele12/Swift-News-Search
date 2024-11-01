import mysql from "mysql2";

const db = mysql.createConnection({
  host: "localhost",
  user: "root", // Default user for XAMPP
  password: "", // Default password for XAMPP
  database: "login_system",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.stack);
    return;
  }
  console.log("Connected to MySQL database.");
});

export default db; // Use `export default` for ES modules
