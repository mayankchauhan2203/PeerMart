const express = require("express");
const cors = require("cors");
require("dotenv").config();

const admin = require("firebase-admin");
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);

// ── Initialise Firebase Admin SDK ─────────────────────────────────────────────
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(
  cors({
    origin: process.env.REACT_APP_FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());

const IITD_BASE_URL = "https://auth.devclub.in";

// ── Decode JWT payload without signature verification ─────────────────────────
// Safe here because we received the token directly from IITD over HTTPS.
function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

// ── Robust field extractors (handle all known IITD field name variants) ───────
function extractKerberos(obj) {
  return (
    obj?.kerberos ||
    obj?.kerberos_id ||
    obj?.uid ||
    obj?.user_id ||
    obj?.uniqueiitdid ||
    obj?.sub ||
    ""
  );
}

function extractName(obj) {
  return obj?.name || obj?.cn || obj?.displayName || obj?.full_name || "";
}

function extractEmail(obj) {
  return obj?.email || obj?.mail || "";
}

function extractPhone(obj) {
  return (
    obj?.mobile_number ||
    obj?.phone ||
    obj?.mobileNo ||
    obj?.contact ||
    obj?.telephone ||
    obj?.phone_number ||
    ""
  );
}

function extractDepartment(obj) {
  return obj?.department || obj?.dept || obj?.ou || obj?.departmentNumber || "";
}

function extractHostel(obj) {
  return (
    obj?.hostel ||
    obj?.hostel_name ||
    obj?.hostelName ||
    obj?.hall ||
    obj?.hall_name ||
    ""
  );
}

function extractEntryNumber(obj) {
  return (
    obj?.entry_number ||
    obj?.roll ||
    obj?.roll_number ||
    obj?.entryNumber ||
    obj?.roll_no ||
    ""
  );
}


// ── Merge two objects; non-empty value from `a` wins over `b` ─────────────────
function mergeUserData(primary, fallback) {
  const pick = (extractFn) => {
    const v = extractFn(primary);
    return v || extractFn(fallback);
  };
  return {
    kerberos: pick(extractKerberos),
    name: pick(extractName),
    email: pick(extractEmail),
    phone: pick(extractPhone),
    department: pick(extractDepartment),
    hostel: pick(extractHostel),
    entry_number: pick(extractEntryNumber),
  };
}

// ── Main endpoint: IITD token exchange → Firebase Custom Token ────────────────
app.post("/api/auth/iitd/token", async (req, res) => {
  try {
    const { code, code_verifier } = req.body;

    if (!code || !code_verifier) {
      return res
        .status(400)
        .json({ error: "Missing required fields: code, code_verifier" });
    }

    // ── Step 1: Exchange authorization code with IITD ─────────────────────────
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.REACT_APP_IITD_REDIRECT_URI,
      client_id: process.env.REACT_APP_IITD_CLIENT_ID,
      client_secret: process.env.REACT_APP_IITD_CLIENT_SECRET,
      code_verifier,
    });

    const tokenRes = await fetch(`${IITD_BASE_URL}/api/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      console.error("[IITD] Token exchange failed:", tokenData);
      return res.status(400).json({
        error: tokenData.error_description || tokenData.error || "Token exchange failed",
      });
    }

    // Decode the id_token JWT for user claims (primary source if userinfo fails)
    const idTokenClaims = tokenData.id_token
      ? decodeJwtPayload(tokenData.id_token)
      : null;

    console.log("[IITD] id_token claims:", idTokenClaims);

    // ── Step 2: Fetch userinfo from IITD ──────────────────────────────────────
    let rawUserInfo = null;
    try {
      const userRes = await fetch(`${IITD_BASE_URL}/api/oauth/userinfo`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (userRes.ok) {
        rawUserInfo = await userRes.json();
        console.log("[IITD] Raw userinfo response:", rawUserInfo);
      } else {
        console.warn("[IITD] Userinfo endpoint returned", userRes.status, "— falling back to id_token claims");
      }
    } catch (e) {
      console.warn("[IITD] Userinfo fetch threw error:", e.message, "— falling back to id_token claims");
    }

    // Unwrap nested structures: { user: {...} }, { data: {...} }, { profile: {...} }
    const unwrapped =
      rawUserInfo?.user ||
      rawUserInfo?.data ||
      rawUserInfo?.profile ||
      rawUserInfo ||
      {};

    // Merge userinfo + id_token claims (userinfo wins, id_token is fallback)
    const merged = mergeUserData(unwrapped, idTokenClaims || {});
    console.log("[IITD] Merged user data:", merged);

    // ── Step 3: Mint Firebase Custom Token ────────────────────────────────────
    const kerberos = merged.kerberos;
    if (!kerberos) {
      console.error("[IITD] Could not determine kerberos ID. unwrapped:", unwrapped, "idTokenClaims:", idTokenClaims);
      return res.status(400).json({ error: "Could not determine user identity from IITD. Please try again." });
    }

    // Enforce IITD-only access: reject non-@iitd.ac.in accounts
    const email = merged.email || "";
    const deptartment = merged.department || "";
    if (!email.endsWith("@" + deptartment + ".iitd.ac.in")) {
      console.warn(`[AUTH] Rejected non-IITD login attempt: ${email || "(no email)"}`);
      return res.status(403).json({
        error: "Access restricted to IIT Delhi accounts only. Please sign in with your @iitd.ac.in email.",
      });
    }

    const uid = `iitd_${kerberos}`;

    const customToken = await admin.auth().createCustomToken(uid, {
      kerberos_id: kerberos,
      email: merged.email,
      name: merged.name,
      entry_number: merged.entry_number,
      department: merged.department,
      hostel: merged.hostel,
      phone: merged.phone,
    });

    console.log(`[AUTH] Custom token minted for ${merged.email || kerberos}`);

    res.json({
      customToken,
      userInfo: {
        name: merged.name,
        email: merged.email,
        kerberos_id: kerberos,
        entry_number: merged.entry_number,
        department: merged.department,
        hostel: merged.hostel,
        category: merged.category,
        phone: merged.phone,
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

const PORT = process.env.PORT || process.env.REACT_APP_PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 PeerMart auth server running on http://localhost:${PORT}`);
  console.log(`   Firebase Admin: ✅ Initialised`);
  console.log(`   IITD OAuth:     ${IITD_BASE_URL}`);
  console.log(`   Redirect URI:   ${process.env.REACT_APP_IITD_REDIRECT_URI || "(not set)"}\n`);
});
