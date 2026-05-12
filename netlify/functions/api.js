const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');

const app = express();

app.use(cors());
app.use(express.json());

// In-memory store (resets between cold starts)
const subscribers = [];
const contacts = [];

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PhishGuard API running' });
});

app.post('/api/subscribe', (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const already = subscribers.find((s) => s.email === email);
  if (already) {
    return res.status(409).json({ error: 'Already subscribed' });
  }

  subscribers.push({ email, date: new Date().toISOString() });
  console.log(`New subscriber: ${email}`);
  return res.json({ success: true, message: 'Subscribed successfully!' });
});

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  contacts.push({ name, email, message, date: new Date().toISOString() });
  console.log(`New contact from: ${name} <${email}>`);
  return res.json({ success: true, message: 'Message received!' });
});

app.post('/api/track/install', (req, res) => {
  const { source } = req.body;
  console.log(`Install clicked from: ${source || 'unknown'}`);
  return res.json({ success: true });
});

app.post('/api/check-url', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  const domain = parsedUrl.hostname.toLowerCase();
  const reasons = [];
  let status = 'safe';

  const phishingKeywords = ['login', 'verify', 'secure', 'account', 'update', 'confirm', 'banking'];
  const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top'];
  const trustedDomains = ['google.com', 'github.com', 'amazon.com', 'microsoft.com', 'apple.com'];

  if (trustedDomains.some((d) => domain.endsWith(d))) {
    reasons.push({ safe: true, message: 'Domain is from a verified trusted source' });
  } else {
    reasons.push({ safe: false, message: 'Domain is not in our trusted list' });
    status = 'warning';
  }

  if (suspiciousTLDs.some((tld) => domain.endsWith(tld))) {
    reasons.push({ safe: false, message: 'Uses a high-risk domain extension commonly used in scams' });
    status = 'danger';
  } else {
    reasons.push({ safe: true, message: 'Domain extension is commonly used and legitimate' });
  }

  const hasNumbers = /\d/.test(domain.replace(/\.(com|net|org)$/, ''));
  if (hasNumbers && phishingKeywords.some((kw) => domain.includes(kw))) {
    reasons.push({ safe: false, message: 'Domain contains numbers mixed with common phishing keywords' });
    status = 'danger';
  } else {
    reasons.push({ safe: true, message: 'No obvious typosquatting patterns detected' });
  }

  if (parsedUrl.protocol === 'https:') {
    reasons.push({ safe: true, message: 'Uses secure HTTPS connection' });
  } else {
    reasons.push({ safe: false, message: 'Does not use HTTPS — connection is not encrypted' });
    status = status === 'safe' ? 'warning' : status;
  }

  const subdomains = domain.split('.');
  if (subdomains.length > 3) {
    reasons.push({ safe: false, message: 'Unusual number of subdomains — often used to mimic legitimate sites' });
    status = 'danger';
  } else {
    reasons.push({ safe: true, message: 'Domain structure looks normal' });
  }

  console.log(`URL checked: ${url} — Status: ${status}`);
  return res.json({ status, url: parsedUrl.href, reasons });
});

module.exports.handler = serverless(app);
