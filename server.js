const express = require("express");
const cors = require("cors");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Add your HubSpot domain(s) here.
// e.g. "https://www.yourdomain.com" or "https://12345678.hs-sites.com"
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
  })
);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Google Reviews Proxy is running" });
});

// ─── Reviews endpoint ─────────────────────────────────────────────────────────
app.get("/reviews", async (req, res) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  const placeId = process.env.PLACE_ID;

  if (!apiKey || !placeId) {
    return res
      .status(500)
      .json({ error: "Server misconfiguration: missing GOOGLE_API_KEY or PLACE_ID" });
  }

  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  const headers = {
    "X-Goog-Api-Key": apiKey,
    "X-Goog-FieldMask": "displayName,rating,userRatingCount,reviews",
  };

  try {
    const data = await fetchJson(url, headers);

    if (data.error) {
      return res.status(502).json({ error: data.error.message || "Google API error" });
    }

    const reviews = (data.reviews || []).map((r) => ({
      author: r.authorAttribution?.displayName || "Anonymous",
      authorPhoto: r.authorAttribution?.photoUri || null,
      rating: r.rating,
      text: r.text?.text || "",
      time: r.relativePublishTimeDescription || "",
    }));

    res.json({
      name: data.displayName?.text || "",
      rating: data.rating || 0,
      totalRatings: data.userRatingCount || 0,
      reviews,
    });
  } catch (err) {
    console.error("Error fetching reviews:", err.message);
    res.status(500).json({ error: "Failed to fetch reviews from Google" });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fetchJson(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (response) => {
      let raw = "";
      response.on("data", (chunk) => (raw += chunk));
      response.on("end", () => {
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error("Invalid JSON response from Google API"));
        }
      });
    });
    req.on("error", reject);
  });
}

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Google Reviews Proxy running on port ${PORT}`);
});
