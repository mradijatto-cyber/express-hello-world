const express = require("express");
const cors = require("cors");
const { totp } = require("otplib");
const QRCode = require("qrcode");

const app = express();
app.use(cors());
app.use(express.json());

// temporary storage (upgrade to DB later)
const secrets = {};

/*******************************************************
 * HEALTH CHECK
 *******************************************************/
app.get("/", (req, res) => {
  res.send("AHEAD AUTH SERVER ACTIVE");
});

/*******************************************************
 * GENERATE SECRET + QR (Google Authenticator SETUP)
 *******************************************************/
app.get("/setup/:userID", async (req, res) => {

  const userID = req.params.userID;

  const secret = totp.generateSecret();
  secrets[userID] = secret;

  const otpauth = totp.keyuri(userID, "StDavidCollege", secret);

  const qr = await QRCode.toDataURL(otpauth);

  res.json({
    userID,
    secret,
    qr
  });
});

/*******************************************************
 * VERIFY OTP
 *******************************************************/
app.post("/verify", (req, res) => {

  const { userID, token } = req.body;

  const secret = secrets[userID];

  if (!secret) {
    return res.json({
      success: false,
      error: "NO_SECRET"
    });
  }

  const valid = totp.check(token, secret);

  res.json({
    success: valid
  });
});

/*******************************************************
 * START SERVER
 *******************************************************/
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("AHEAD AUTH SERVER RUNNING ON PORT", PORT);
});
