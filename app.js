require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");

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

// Endpoint: Pobieranie wszystkich zadań
app.get("/zadania", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM zadania ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Błąd serwera przy pobieraniu danych");
  }
});

// Endpoint: Dodawanie nowego zadania (prosty CRUD)
app.post("/zadania", async (req, res) => {
  const { tytul } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO zadania (tytul) VALUES ($1) RETURNING *",
      [tytul],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Błąd przy dodawaniu zadania");
  }
});

app.listen(port, () => {
  console.log(`Serwer działa na http://localhost:${port}`);
});
