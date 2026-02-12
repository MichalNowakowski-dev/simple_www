require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const path = require("path");

const app = express();
const port = 3000; // Port, na którym będzie działać Twoja apka

// Konfiguracja połączenia z bazą (dane pobierane z pliku .env)
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
});

app.use(express.json());

// MAGIA: To serwuje index.html automatycznie pod adresem "/"
app.use(express.static(path.join(__dirname, "public")));

// API: Pobieranie
app.get("/zadania", async (req, res) => {
  const result = await pool.query("SELECT * FROM zadania ORDER BY id DESC");
  res.json(result.rows);
});

// API: Dodawanie
app.post("/zadania", async (req, res) => {
  const { tytul } = req.body;
  await pool.query("INSERT INTO zadania (tytul) VALUES ($1)", [tytul]);
  res.status(201).send();
});

app.listen(port, () => console.log(`API działa na porcie ${port}`));
