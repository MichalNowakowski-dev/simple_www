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

// Pobieranie wpłat i sumy
app.get("/api/payments", async (req, res) => {
  try {
    const payments = await pool.query(
      "SELECT * FROM payments ORDER BY created_at DESC",
    );
    const total = await pool.query(
      "SELECT SUM(amount) as total_sum FROM payments",
    );

    res.json({
      list: payments.rows,
      total: total.rows[0].total_sum || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dodawanie wpłaty
app.post("/api/payments", async (req, res) => {
  const { person, amount } = req.body;
  try {
    await pool.query("INSERT INTO payments (person, amount) VALUES ($1, $2)", [
      person,
      amount,
    ]);
    res.sendStatus(201);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// usuwanie wpłaty
app.delete("/api/payments/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM payments WHERE id = $1", [id]);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, "127.0.0.1", () =>
  console.log(`API działa na porcie ${port}`),
);
