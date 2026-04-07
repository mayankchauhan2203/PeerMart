const express = require("express");
const cors = require("cors");
require("dotenv").config();

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// ── Initialise Firebase Admin SDK ─────────────────────────────────────────────
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());

const IITD_BASE_URL = "https://oauth.devclub.in";

// ── Main endpoint: IITD token exchange → Firebase Custom Token ────────────────
app.post("/api/auth/iitd/token", async (req, res) => {
  try {
    const { code, code_verifier } = req.body;

    if (!code || !code_verifier) {
      return res
        .status(400)
        .json({ error: "Missing required fields: code, code_verifier" });
    }

    // Step 1: Exchange authorization code with IITD
    const tokenParams = new URLSearchParams({
      grant_type:    "authorization_code",
      code,
      redirect_uri:  process.env.IITD_REDIRECT_URI,
      client_id:     process.env.IITD_CLIENT_ID,
      client_secret: process.env.IITD_CLIENT_SECRET,
      code_verifier,
    });

    const tokenRes = await fetch(`${IITD_BASE_URL}/api/oauth/token`, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    tokenParams.toString(),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      console.error("[IITD] Token exchange failed:", tokenData);
      return res.status(400).json({
        error: tokenData.error_description || tokenData.error || "Token exchange failed",
      });
    }

    // Step 2: Fetch user info from IITD
    const userRes = await fetch(`${IITD_BASE_URL}/api/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userInfo = await userRes.json();

    if (!userRes.ok) {
      console.error("[IITD] Userinfo fetch failed:", userInfo);
      return res.status(400).json({ error: "Failed to fetch user info from IITD" });
    }

    // Step 3: Mint a Firebase Custom Token
    // Use kerberos_id as the stable UID (prefixed to avoid conflicts)
    const kerberos = userInfo.user_id || userInfo.kerberos_id || userInfo.uniqueiitdid || userInfo.sub || "";
    const uid = `iitd_${kerberos}`;

    const customToken = await admin.auth().createCustomToken(uid, {
      // Custom claims — accessible via getIdTokenResult() on the frontend
      kerberos_id:  kerberos,
      email:        userInfo.email || userInfo.mail || "",
      name:         userInfo.name         || "",
      entry_number: userInfo.entry_number || "",
      department:   userInfo.department   || "",
      hostel:       userInfo.hostel       || "",
    });

    console.log(`[AUTH] Custom token minted for ${userInfo.email || userInfo.mail || kerberos}`);

    res.json({
      customToken,
      userInfo: {
        name:         userInfo.name         || "",
        email:        userInfo.email || userInfo.mail || "",
        kerberos_id:  kerberos,
        entry_number: userInfo.entry_number || "",
        department:   userInfo.department   || "",
        hostel:       userInfo.hostel       || "",
        category:     userInfo.category     || "",
      },
    });
  } catch (err) {
    console.error("[AUTH] Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/auth/status", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 PeerMart auth server running on http://localhost:${PORT}`);
  console.log(`   Firebase Admin: ✅ Initialised`);
  console.log(`   IITD OAuth:     ${IITD_BASE_URL}`);
  console.log(`   Redirect URI:   ${process.env.IITD_REDIRECT_URI || "(not set)"}\n`);
});
