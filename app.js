require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const client = require("prom-client");

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

// Ustawienia Prometheus
client.collectDefaultMetrics(); // CPU, memory, event loop, itp.

// Licznik błędów HTTP 500
const httpErrors = new client.Counter({
  name: "http_500_total",
  help: "Total number of HTTP 500 errors",
});

app.use(express.json());

// Middleware do zliczania błędów
app.use((req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode >= 500) {
      httpErrors.inc();
    }
  });
  next();
});

// Health endpoint
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1"); // sprawdzenie DB
    res.status(200).json({ status: "OK", db: "connected" });
  } catch (err) {
    console.error("Health check failed:", err.message);
    res.status(500).json({ status: "ERROR", db: "disconnected" });
  }
});

// Prometheus metrics
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

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
