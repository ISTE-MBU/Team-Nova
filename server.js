const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // serve frontend

// In-memory store (replace with DB later)
const subscribers = [];
const contacts = [];

// ===== ROUTES =====

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PhishGuard API running' });
});

// Email subscription
app.post('/api/subscribe', (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const already = subscribers.find(s => s.email === email);
  if (already) {
    return res.status(409).json({ error: 'Already subscribed' });
  }

  subscribers.push({ email, date: new Date().toISOString() });
  console.log(`New subscriber: ${email}`);
  res.json({ success: true, message: 'Subscribed successfully!' });
});

// Contact form
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  contacts.push({ name, email, message, date: new Date().toISOString() });
  console.log(`New contact from: ${name} <${email}>`);
  res.json({ success: true, message: 'Message received!' });
});

// Install click tracking
app.post('/api/track/install', (req, res) => {
  const { source } = req.body;
  console.log(`Install clicked from: ${source || 'unknown'}`);
  res.json({ success: true });
});

// URL checker (phishing detection logic)
app.post('/api/check-url', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Parse URL
  let parsedUrl;
  try {
    parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  const domain = parsedUrl.hostname.toLowerCase();
  const reasons = [];
  let status = 'safe';

  // Known phishing patterns
  const phishingKeywords = ['login', 'verify', 'secure', 'account', 'update', 'confirm', 'banking'];
  const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top'];
  const trustedDomains = ['google.com', 'github.com', 'amazon.com', 'microsoft.com', 'apple.com'];

  // Check 1: Trusted domain
  if (trustedDomains.some(d => domain.endsWith(d))) {
    reasons.push({ safe: true, message: 'Domain is from a verified trusted source' });
  } else {
    reasons.push({ safe: false, message: 'Domain is not in our trusted list' });
    status = 'warning';
  }

  // Check 2: Suspicious TLD
  if (suspiciousTLDs.some(tld => domain.endsWith(tld))) {
    reasons.push({ safe: false, message: 'Uses a high-risk domain extension commonly used in scams' });
    status = 'danger';
  } else {
    reasons.push({ safe: true, message: 'Domain extension is commonly used and legitimate' });
  }

  // Check 3: Typosquatting detection
  const hasNumbers = /\d/.test(domain.replace(/\.(com|net|org)$/, ''));
  if (hasNumbers && phishingKeywords.some(kw => domain.includes(kw))) {
    reasons.push({ safe: false, message: 'Domain contains numbers mixed with common phishing keywords' });
    status = 'danger';
  } else {
    reasons.push({ safe: true, message: 'No obvious typosquatting patterns detected' });
  }

  // Check 4: HTTPS
  if (parsedUrl.protocol === 'https:') {
    reasons.push({ safe: true, message: 'Uses secure HTTPS connection' });
  } else {
    reasons.push({ safe: false, message: 'Does not use HTTPS — connection is not encrypted' });
    status = status === 'safe' ? 'warning' : status;
  }

  // Check 5: Subdomain depth
  const subdomains = domain.split('.');
  if (subdomains.length > 3) {
    reasons.push({ safe: false, message: 'Unusual number of subdomains — often used to mimic legitimate sites' });
    status = 'danger';
  } else {
    reasons.push({ safe: true, message: 'Domain structure looks normal' });
  }

  console.log(`URL checked: ${url} — Status: ${status}`);
  res.json({ status, url: parsedUrl.href, reasons });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🛡️  PhishGuard server running at http://localhost:${PORT}\n`);
});
