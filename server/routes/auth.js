const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const { getUserFromEmail } = require('../config/roles');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback'
  );
}

router.get('/google', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${CLIENT_URL}?auth_error=not_configured`);
  }
  const oauth2Client = getOAuth2Client();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'online',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    prompt: 'select_account',
  });
  res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(req.query.code);
    oauth2Client.setCredentials(tokens);

    const oauth2Api = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2Api.userinfo.get();
    const { email, name, picture } = data;

    const userInfo = getUserFromEmail(email);
    if (!userInfo) {
      return res.redirect(`${CLIENT_URL}?auth_error=unauthorized`);
    }

    const token = jwt.sign(
      { email, displayName: name, picture, ...userInfo },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.redirect(`${CLIENT_URL}?token=${token}`);
  } catch (err) {
    console.error('OAuth callback error:', err.message);
    res.redirect(`${CLIENT_URL}?auth_error=server_error`);
  }
});

// Weryfikacja tokenu (używana przez frontend przy starcie)
router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Brak tokenu' });
  try {
    const user = jwt.verify(auth.slice(7), JWT_SECRET);
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Token wygasł lub nieprawidłowy' });
  }
});

module.exports = router;
