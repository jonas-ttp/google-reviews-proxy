# Google Reviews Proxy

A lightweight Node.js/Express proxy server that securely fetches Google Reviews via the **Places API (New)** — keeping your API key server-side.

Used as a backend for HubSpot modules that display Google Reviews.

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/reviews` | Returns reviews JSON |

### Sample Response — `/reviews`
```json
{
  "name": "Your Business Name",
  "rating": 4.8,
  "totalRatings": 124,
  "reviews": [
    {
      "author": "Jane Doe",
      "authorPhoto": "https://...",
      "rating": 5,
      "text": "Amazing service!",
      "time": "a week ago"
    }
  ]
}
```

---

## Environment Variables

Set these in **GoDaddy cPanel → Setup Node.js App → Environment Variables**:

| Variable | Description |
|---|---|
| `GOOGLE_API_KEY` | Your Google Cloud API key (Places API New enabled) |
| `PLACE_ID` | Your Google Place ID |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins |
| `PORT` | Port to run on (GoDaddy sets this automatically) |

---

## GoDaddy Deployment

1. Connect this GitHub repo in cPanel → **Setup Node.js App**
2. Set Node.js version to **18.x**
3. Set startup file to `server.js`
4. Add environment variables (see above)
5. Click **Run NPM Install**
6. Click **Start App**

---

## Local Development

```bash
cp .env.example .env
# Fill in your values in .env

npm install
npm start
# → http://localhost:3000/reviews
```
