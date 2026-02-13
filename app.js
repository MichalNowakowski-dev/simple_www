require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const axios = require("axios");

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

// API: Pobieranie (teraz z sortowaniem po dacie)
app.get("/zadania", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM zadania ORDER BY termin ASC, id DESC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Dodawanie z datą
app.post("/zadania", async (req, res) => {
  const { tytul, termin } = req.body;
  try {
    // Jeśli użytkownik nie poda daty, zapisujemy jako null lub aktualny czas
    await pool.query("INSERT INTO zadania (tytul, termin) VALUES ($1, $2)", [
      tytul,
      termin || null,
    ]);
    res.status(201).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Zmiana statusu (Ukończone / Nieukończone)
app.patch("/zadania/:id", async (req, res) => {
  const { id } = req.params;
  const { zrobione } = req.body;
  try {
    await pool.query("UPDATE zadania SET zrobione = $1 WHERE id = $2", [
      zrobione,
      id,
    ]);
    res.send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/billing", async (req, res) => {
  try {
    // 1. Pobieranie tokena dostępu
    const authResponse = await axios.post(
      "https://idp.oktawave.com/auth/realms/oktawave/protocol/openid-connect/token",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.OKTAWAVE_CLIENT_ID,
        client_secret: process.env.OKTAWAVE_CLIENT_SECRET,
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    const token = authResponse.data.access_token;

    // 2. Pobieranie bilingu przy użyciu tokena
    const billingResponse = await axios.get(
      "https://pl1-api.oktawave.com/billing/balance",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    res.json(billingResponse.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Nie udało się pobrać danych bilingowych" });
  }
});

app.listen(port, () => console.log(`API działa na porcie ${port}`));
