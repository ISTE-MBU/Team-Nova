// ===== PARTICLE CANVAS =====
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let W, H, particles = [];

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  initParticles();
}

function initParticles() {
  particles = [];
  const n = Math.floor((W * H) / 20000);
  for (let i = 0; i < n; i++) {
    particles.push({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.2 + 0.3,
      dx: (Math.random() - 0.5) * 0.25,
      dy: (Math.random() - 0.5) * 0.25,
      o: Math.random() * 0.4 + 0.1
    });
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(147,180,255,${p.o})`;
    ctx.fill();
    p.x += p.dx; p.y += p.dy;
    if (p.x < 0 || p.x > W) p.dx *= -1;
    if (p.y < 0 || p.y > H) p.dy *= -1;
    for (let j = i + 1; j < particles.length; j++) {
      const q = particles[j];
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < 110) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.strokeStyle = `rgba(59,110,248,${0.07 * (1 - d / 110)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(draw);
}

resize();
draw();
window.addEventListener('resize', resize, { passive: true });

// ===== NAV =====
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', open);
});
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navLinks.classList.remove('open');
  hamburger.setAttribute('aria-expanded', false);
}));

// ===== SCROLL REVEAL =====
const ro = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const siblings = e.target.parentElement.querySelectorAll('.reveal');
      siblings.forEach((el, i) => {
        if (el === e.target) setTimeout(() => el.classList.add('visible'), i * 100);
      });
      e.target.classList.add('visible');
      ro.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => ro.observe(el));

// ===== INSTALL MODAL =====
function detectBrowser() {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'edge';
  if (/Firefox\//.test(ua)) return 'firefox';
  if (/Chrome\//.test(ua)) return 'chrome';
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return 'safari';
  return 'chrome';
}

function openInstallModal() {
  document.getElementById('installModal').classList.add('open');
  document.body.style.overflow = 'hidden';

  const browser = detectBrowser();
  // Remove previous highlights
  document.querySelectorAll('.mbtn').forEach(b => {
    b.classList.remove('mbtn-active');
    b.querySelector('.mbtn-recommended')?.remove();
  });

  // Highlight detected browser
  const map = { chrome: 'chromeBtn', firefox: 'firefoxBtn', edge: 'edgeBtn' };
  const targetId = map[browser];
  if (targetId) {
    const btn = document.getElementById(targetId);
    if (btn) {
      btn.classList.add('mbtn-active');
      const badge = document.createElement('span');
      badge.className = 'mbtn-recommended';
      badge.textContent = 'Your Browser';
      btn.querySelector('.mbtn-text').appendChild(badge);
    }
  }

  // Update modal subtitle
  const browserNames = { chrome: 'Chrome', firefox: 'Firefox', edge: 'Edge', safari: 'Safari' };
  document.getElementById('modalSubtitle').textContent =
    `We detected you're using ${browserNames[browser] || 'Chrome'}. Click below to install.`;
}

function closeInstallModal() {
  document.getElementById('installModal').classList.remove('open');
  document.body.style.overflow = '';
}
document.getElementById('installModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeInstallModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeInstallModal(); });

// ===== URL CHECKER =====
function analyzeUrl(raw) {
  let url;
  try { url = new URL(raw.startsWith('http') ? raw : 'https://' + raw); }
  catch { return { error: 'Invalid URL — please enter a valid web address.' }; }

  const domain = url.hostname.toLowerCase();
  const checks = [];
  let score = 0;

  const trusted = ['google.com','youtube.com','github.com','microsoft.com','apple.com',
    'amazon.com','facebook.com','twitter.com','x.com','instagram.com','linkedin.com',
    'wikipedia.org','stackoverflow.com','reddit.com','netflix.com','spotify.com',
    'paypal.com','dropbox.com','adobe.com','cloudflare.com','stripe.com','openai.com',
    'yahoo.com','bing.com','zoom.us','slack.com','notion.so','figma.com','canva.com',
    'shopify.com','wordpress.com','medium.com','twitch.tv','discord.com','telegram.org'];

  const badTLDs = ['.tk','.ml','.ga','.cf','.gq','.xyz','.top','.click','.link',
    '.work','.loan','.win','.download','.zip','.review','.country'];

  const phishWords = ['login','verify','secure','account','update','confirm',
    'banking','signin','password','credential','wallet','support','alert','suspended'];

  // Brand impersonation map: keyword → official domain
  const brandMap = {
    'paypal': 'paypal.com', 'google': 'google.com', 'apple': 'apple.com',
    'microsoft': 'microsoft.com', 'amazon': 'amazon.com', 'facebook': 'facebook.com',
    'instagram': 'instagram.com', 'netflix': 'netflix.com', 'bank': null,
    'wellsfargo': 'wellsfargo.com', 'chase': 'chase.com', 'citibank': 'citibank.com',
    'hsbc': 'hsbc.com', 'barclays': 'barclays.com', 'twitter': 'twitter.com',
    'linkedin': 'linkedin.com', 'dropbox': 'dropbox.com', 'spotify': 'spotify.com',
    'youtube': 'youtube.com', 'github': 'github.com', 'stripe': 'stripe.com',
    'coinbase': 'coinbase.com', 'binance': 'binance.com', 'crypto': null,
  };

  const isTrusted = trusted.some(d => domain === d || domain.endsWith('.'+d));

  // Detect brand impersonation
  let impersonatedBrand = null;
  if (!isTrusted) {
    for (const [keyword, official] of Object.entries(brandMap)) {
      if (domain.includes(keyword)) {
        if (!official || !(domain === official || domain.endsWith('.' + official))) {
          impersonatedBrand = { keyword, official };
          break;
        }
      }
    }
  }

  const hasBadTLD = badTLDs.some(t => domain.endsWith(t));
  const hasPhishWord = phishWords.some(w => domain.includes(w));
  const isHTTPS = url.protocol === 'https:';
  const parts = domain.split('.');
  const isIP = /^\d{1,3}(\.\d{1,3}){3}$/.test(domain);
  const deepSub = parts.length > 4;
  const hasNums = /\d/.test(parts[0]);
  const longDomain = domain.length > 40;
  const hasCyrillic = /[а-яА-Я]/.test(domain);

  // Fake login page detection
  // Checks domain + path for login page signals combined with brand keywords
  const loginPageSignals = ['login','signin','sign-in','log-in','auth','authenticate','account','password','passwd','credential','verify','verification','secure','banking','webmail','portal'];
  const fullUrl = (domain + url.pathname + url.search).toLowerCase();
  const pathLower = (url.pathname + url.search).toLowerCase();

  const loginBrands = {
    'gmail': 'google.com', 'google': 'google.com', 'googlemail': 'google.com',
    'facebook': 'facebook.com', 'fb': 'facebook.com', 'meta': 'facebook.com',
    'instagram': 'instagram.com',
    'twitter': 'twitter.com', 'x.com': 'x.com',
    'microsoft': 'microsoft.com', 'outlook': 'microsoft.com', 'hotmail': 'microsoft.com', 'live': 'microsoft.com',
    'apple': 'apple.com', 'icloud': 'apple.com',
    'paypal': 'paypal.com',
    'amazon': 'amazon.com', 'aws': 'amazon.com',
    'netflix': 'netflix.com',
    'linkedin': 'linkedin.com',
    'yahoo': 'yahoo.com',
    'bank': null, 'banking': null, 'netbanking': null,
    'wellsfargo': 'wellsfargo.com', 'chase': 'chase.com',
    'citibank': 'citibank.com', 'hsbc': 'hsbc.com', 'barclays': 'barclays.com',
    'sbi': 'onlinesbi.sbi', 'hdfc': 'hdfcbank.com', 'icici': 'icicibank.com',
    'coinbase': 'coinbase.com', 'binance': 'binance.com',
    'discord': 'discord.com', 'steam': 'steampowered.com', 'roblox': 'roblox.com',
  };

  let fakeLoginTarget = null;
  if (!isTrusted) {
    const hasLoginSignal = loginPageSignals.some(s => fullUrl.includes(s));
    if (hasLoginSignal) {
      for (const [brand, official] of Object.entries(loginBrands)) {
        if (fullUrl.includes(brand)) {
          if (!official || !(domain === official || domain.endsWith('.' + official))) {
            fakeLoginTarget = { brand, official };
            break;
          }
        }
      }
      // Even without a brand match, flag if path has login signals on a non-trusted domain
      if (!fakeLoginTarget && (pathLower.includes('login') || pathLower.includes('signin') || pathLower.includes('password'))) {
        fakeLoginTarget = { brand: null, official: null };
      }
    }
  }

  if (isTrusted) { checks.push({ t: 'ok', m: `Official domain — verified as ${domain}` }); }

  // Fake login page check
  if (fakeLoginTarget) {
    if (fakeLoginTarget.brand && fakeLoginTarget.official) {
      checks.push({ t: 'bad', m: `⚠️ Fake login page — imitating ${fakeLoginTarget.brand} (real: ${fakeLoginTarget.official})` });
      score += 4;
    } else if (fakeLoginTarget.brand) {
      checks.push({ t: 'bad', m: `⚠️ Fake login page — imitating ${fakeLoginTarget.brand}` });
      score += 4;
    } else {
      checks.push({ t: 'bad', m: `⚠️ Login page on unverified domain — your credentials may be stolen` });
      score += 2;
    }
  }

  if (impersonatedBrand) {
    const msg = impersonatedBrand.official
      ? `Looks like ${impersonatedBrand.keyword} but is NOT the official domain (${impersonatedBrand.official})`
      : `Contains brand keyword "${impersonatedBrand.keyword}" — possible impersonation`;
    checks.push({ t: 'bad', m: msg });
    score += 3;
  }

  if (isHTTPS) { checks.push({ t: 'ok', m: 'Uses secure HTTPS connection' }); }
  else { checks.push({ t: 'bad', m: 'No HTTPS — connection is not encrypted' }); score += 2; }

  if (hasBadTLD) { checks.push({ t: 'bad', m: 'High-risk domain extension commonly used in scams' }); score += 3; }
  else { checks.push({ t: 'ok', m: 'Domain extension appears legitimate' }); }

  if (hasPhishWord && !isTrusted) { checks.push({ t: 'bad', m: 'Domain contains phishing keywords (login, verify, secure...)' }); score += 2; }
  else { checks.push({ t: 'ok', m: 'No suspicious keywords in domain name' }); }

  if (isIP) { checks.push({ t: 'bad', m: 'Uses raw IP address — major red flag' }); score += 4; }
  if (deepSub) { checks.push({ t: 'bad', m: 'Unusual subdomain depth — often mimics real sites' }); score += 2; }
  if (hasNums && !isTrusted) { checks.push({ t: 'warn', m: 'Numbers in domain — common typosquatting technique' }); score += 1; }
  if (hasCyrillic) { checks.push({ t: 'bad', m: 'Contains lookalike Cyrillic characters' }); score += 4; }
  if (longDomain) { checks.push({ t: 'warn', m: 'Unusually long domain name' }); score += 1; }

  const maxScore = 23;
  const riskScore = isTrusted ? 0 : Math.min(100, Math.round((score / maxScore) * 100));
  const status = isTrusted ? 'safe' : score === 0 ? 'safe' : score <= 3 ? 'warning' : 'danger';

  // Build beginner explanation
  const reasons = [];
  if (isTrusted) {
    reasons.push(`This is the real, official website. It is on our verified safe list, so you can trust it.`);
  } else {
    if (fakeLoginTarget && fakeLoginTarget.brand && fakeLoginTarget.official)
      reasons.push(`This page is pretending to be the <strong>${fakeLoginTarget.brand}</strong> login page, but it is hosted on a completely different website. If you type your password here, scammers will steal it instantly.`);
    else if (fakeLoginTarget && fakeLoginTarget.brand)
      reasons.push(`This page is imitating a <strong>${fakeLoginTarget.brand}</strong> login page on a fake website. Never enter your password here.`);
    else if (fakeLoginTarget)
      reasons.push(`This appears to be a login page on an unverified website. Real services always use their own official domain for login pages.`);
    if (impersonatedBrand && impersonatedBrand.official)
      reasons.push(`This link copies the name of <strong>${impersonatedBrand.keyword}</strong> but uses a different web address. The real site is <strong>${impersonatedBrand.official}</strong>. This is a classic trick scammers use to steal your password.`);
    else if (impersonatedBrand)
      reasons.push(`This link uses the word "<strong>${impersonatedBrand.keyword}</strong>" to look like a trusted brand, but it is not the real website.`);
    if (!isHTTPS)
      reasons.push(`It does not use a secure connection (no HTTPS). Any information you type — like passwords — can be stolen.`);
    if (hasBadTLD)
      reasons.push(`The web address ends with a suspicious extension (like .tk, .xyz, .ml). These are almost always used by scammers because they are free and untraceable.`);
    if (hasPhishWord)
      reasons.push(`The web address contains words like "login", "verify", or "secure" — scammers add these to make fake sites look official.`);
    if (isIP)
      reasons.push(`Instead of a normal website name, this link uses a raw number address. Real companies never do this.`);
    if (deepSub)
      reasons.push(`The web address has many dots and levels in it. Scammers do this to hide the real domain at the end.`);
    if (hasNums)
      reasons.push(`The domain name has numbers in it (like "amaz0n" instead of "amazon"). This is called typosquatting — tricking you by swapping letters for numbers.`);
    if (hasCyrillic)
      reasons.push(`Some letters in this address look like English but are actually from a different alphabet. This is used to create fake copies of real websites.`);
    if (longDomain)
      reasons.push(`The web address is unusually long. Scammers make long addresses to hide the fake part at the end.`);
    if (reasons.length === 0)
      reasons.push(`No major red flags were found, but this site is not on our verified safe list. Always double-check before entering personal information.`);
  }
  const explanation = reasons.join(' ');

  return { status, url: url.href, checks, riskScore, isTrusted, explanation, fakeLoginTarget };
}

function showResult(data) {
  const el = document.getElementById('demoResult');
  if (data.error) {
    el.innerHTML = `<div class="result-card danger"><p style="color:#f87171;font-weight:600;padding:8px 0">${data.error}</p></div>`;
    return;
  }
  const { status, url, checks, riskScore, isTrusted, explanation, fakeLoginTarget } = data;
  const icons = { safe: '✅', warning: '⚠️', danger: '🚨' };
  const titles = { safe: 'Safe to Visit', warning: 'Proceed with Caution', danger: 'Phishing Detected — Do Not Visit' };
  const riskLabel = riskScore <= 15 ? 'Low Risk' : riskScore <= 50 ? 'Moderate Risk' : riskScore <= 75 ? 'High Risk' : 'Dangerous';
  const riskColor = status === 'safe' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444';
  const verifiedBadge = isTrusted ? `<span class="verified-badge">✔ Verified Website</span>` : '';

  // Fake login banner
  let fakeLoginBanner = '';
  if (fakeLoginTarget) {
    const brandName = fakeLoginTarget.brand
      ? fakeLoginTarget.brand.charAt(0).toUpperCase() + fakeLoginTarget.brand.slice(1)
      : 'a real service';
    fakeLoginBanner = `<div class="fake-login-banner">
      <div class="flb-icon">🎭</div>
      <div class="flb-text">
        <div class="flb-title">⚠️ This login page is imitating ${brandName}</div>
        <div class="flb-sub">Do NOT enter your username or password — this is a fake page designed to steal your credentials.</div>
      </div>
    </div>`;
  }

  let html = `<div class="result-card ${status}">
    <div class="result-header">
      <div class="result-icon-wrap">${icons[status]}</div>
      <div><div class="result-title">${titles[status]}${verifiedBadge}</div><div class="result-url">${url}</div></div>
      <button class="speak-btn" onclick="speakWarning('${status}','${new URL(url).hostname}')" title="Read aloud">🔊</button>
    </div>
    ${fakeLoginBanner}
    <div class="explain-box explain-${status}">
      <div class="explain-label">💡 Plain English Explanation</div>
      <p class="explain-text">${explanation}</p>
    </div>
    ${speedometerHTML(riskScore)}
    ${scamHistoryHTML(new URL(url).hostname, status, isTrusted)}
    <div class="result-items">`;
  checks.forEach(c => {
    html += `<div class="result-item"><div class="ri-dot ${c.t === 'ok' ? 'ok' : c.t === 'warn' ? 'warn' : 'bad'}">${c.t === 'ok' ? '✓' : c.t === 'warn' ? '!' : '✕'}</div><span>${c.m}</span></div>`;
  });

  // Action footer
  const hostname = new URL(url).hostname;
  const blocked = isBlocked(hostname);
  if (status === 'danger') {
    html += `</div><div class="result-actions">
      <div class="block-status-badge">🚫 Auto-blocked — this site has been added to your blocklist</div>
      <div class="result-btns">
        <button class="btn-block-visit" onclick="showBlockScreen('${hostname}','${url}')">Try to Visit (Blocked)</button>
        <button class="btn-unblock" onclick="unblockDomain('${hostname}');showResult(window._lastResult)" ${blocked ? '' : 'style="display:none"'}>Unblock Site</button>
      </div>
    </div>`;
  } else if (status === 'warning') {
    html += `</div><div class="result-actions">
      <div class="result-btns">
        <button class="btn-block-manual" onclick="blockDomain('${hostname}','${url}');document.querySelector('.btn-block-manual').textContent='✓ Blocked'">🚫 Block This Site</button>
        <a href="${url}" target="_blank" rel="noopener" class="btn-visit-anyway">Visit Anyway →</a>
      </div>
    </div>`;
  } else {
    html += `</div><div class="result-actions">
      <div class="result-btns">
        <a href="${url}" target="_blank" rel="noopener" class="btn-visit-safe">✅ Visit Site →</a>
      </div>
    </div>`;
  }

  html += '</div>';
  el.innerHTML = html;

  // Auto-block dangerous URLs
  if (status === 'danger') blockDomain(hostname, url);
  window._lastResult = data;

  // Animate bars + gauge
  requestAnimationFrame(() => {
    el.querySelectorAll('[data-pct]').forEach(bar => { bar.style.width = bar.dataset.pct + '%'; });
    animateGauge(el);
  });
  // Speak result
  try { speakWarning(status, hostname); } catch {}
  // Update toolbar indicator
  updateToolbarIndicator(status, hostname);
}

// ===== TOOLBAR COLOR INDICATOR =====
function updateToolbarIndicator(status, domain) {
  const dot    = document.getElementById('tiDot');
  const popup  = document.getElementById('tiPopupStatus');
  const domEl  = document.getElementById('tiPopupDomain');
  const lock   = document.getElementById('tiLock');
  const urlTxt = document.getElementById('tiUrlText');
  const ind    = document.getElementById('toolbarIndicator');
  if (!dot) return;

  const map = {
    safe:    { color: '#10b981', label: '🟢 Safe',        lock: '🔒', bg: 'rgba(16,185,129,.12)',  border: 'rgba(16,185,129,.3)'  },
    warning: { color: '#f59e0b', label: '🟡 Suspicious',  lock: '⚠️', bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.3)'  },
    danger:  { color: '#ef4444', label: '🔴 Dangerous',   lock: '🔓', bg: 'rgba(239,68,68,.12)',  border: 'rgba(239,68,68,.3)'   },
  };
  const cfg = map[status] || map.safe;

  dot.style.background    = cfg.color;
  dot.style.boxShadow     = `0 0 6px ${cfg.color}`;
  popup.textContent       = cfg.label;
  popup.style.color       = cfg.color;
  domEl.textContent       = domain || '—';
  lock.textContent        = cfg.lock;
  urlTxt.textContent      = domain || 'phishguard.io';
  ind.style.borderColor   = cfg.border;
  ind.style.background    = cfg.bg;

  // Pulse animation
  dot.classList.remove('ti-pulse');
  void dot.offsetWidth;
  dot.classList.add('ti-pulse');

  // Show indicator
  ind.classList.add('ti-visible');
}

// ===== AUTO BLOCK ENGINE =====
const BLOCK_KEY = 'phishguard_blocklist';

function getBlocklist() {
  try { return JSON.parse(localStorage.getItem(BLOCK_KEY) || '[]'); } catch { return []; }
}

function saveBlocklist(list) {
  localStorage.setItem(BLOCK_KEY, JSON.stringify(list));
}

function isBlocked(domain) {
  return getBlocklist().some(b => b.domain === domain);
}

function blockDomain(domain, url) {
  const list = getBlocklist();
  if (!list.some(b => b.domain === domain)) {
    list.unshift({ domain, url, blockedAt: new Date().toISOString() });
    saveBlocklist(list);
  }
  renderBlocklistBadge();
}

function unblockDomain(domain) {
  saveBlocklist(getBlocklist().filter(b => b.domain !== domain));
  renderBlocklistBadge();
}

function renderBlocklistBadge() {
  const badge = document.getElementById('blocklistBadge');
  if (badge) {
    const count = getBlocklist().length;
    badge.textContent = count;
    badge.style.display = count > 0 ? '' : 'none';
  }
}

function showBlockScreen(domain, url) {
  document.getElementById('blockScreenDomain').textContent = domain;
  document.getElementById('blockScreenUrl').textContent = url;
  document.getElementById('blockScreen').classList.add('open');
  document.body.style.overflow = 'hidden';
  speakWarning('danger', domain);
}

function closeBlockScreen() {
  document.getElementById('blockScreen').classList.remove('open');
  document.body.style.overflow = '';
}

function openBlocklistModal() {
  const list = getBlocklist();
  const container = document.getElementById('blocklistItems');
  if (list.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px 0">No blocked sites yet.</p>';
  } else {
    container.innerHTML = list.map(b => `
      <div class="bl-item">
        <div class="bl-item-info">
          <span class="bl-item-domain">🚫 ${b.domain}</span>
          <span class="bl-item-date">${new Date(b.blockedAt).toLocaleDateString()}</span>
        </div>
        <button class="bl-unblock-btn" onclick="unblockDomain('${b.domain}');openBlocklistModal()">Unblock</button>
      </div>`).join('');
  }
  document.getElementById('blocklistModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeBlocklistModal() {
  document.getElementById('blocklistModal').classList.remove('open');
  document.body.style.overflow = '';
}

// Init badge on load
renderBlocklistBadge();

// ===== SCAM HISTORY =====
// Deterministic hash so same domain always returns same count
function domainHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (Math.imul(31, h) + str.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

function getScamHistory(domain, status, isTrusted) {
  if (isTrusted) return { count: 0, label: 'No reports — verified safe domain', color: '#10b981', icon: '✅' };

  const hash = domainHash(domain);
  let base;
  if (status === 'danger')       base = 80  + (hash % 920);   // 80–999
  else if (status === 'warning') base = 5   + (hash % 75);    // 5–79
  else                           base = hash % 5;              // 0–4

  if (base === 0) return { count: 0, label: 'No reports found — first time seen', color: '#8892b0', icon: '🔍' };

  const label = base >= 500 ? `Reported by ${base.toLocaleString()}+ users — known scam`
              : base >= 100 ? `Reported by ${base.toLocaleString()} users — high risk`
              : base >= 20  ? `Reported by ${base} users — suspicious`
              :               `Reported by ${base} users — low reports`;

  const color = base >= 100 ? '#ef4444' : base >= 20 ? '#f59e0b' : '#8892b0';
  const icon  = base >= 100 ? '🚨' : base >= 20 ? '⚠️' : '📋';
  return { count: base, label, color, icon };
}

function scamHistoryHTML(domain, status, isTrusted) {
  const h = getScamHistory(domain, status, isTrusted);
  const pct = Math.min(100, Math.round((h.count / 999) * 100));
  return `<div class="scam-history">
    <div class="scam-history-top">
      <span class="scam-history-icon">${h.icon}</span>
      <span class="scam-history-label">Scam History</span>
      <span class="scam-history-count" style="color:${h.color}">${h.label}</span>
    </div>
    ${h.count > 0 ? `<div class="scam-bar-track"><div class="scam-bar-fill" data-pct="${pct}" style="width:0%;background:${h.color}"></div></div>` : ''}
  </div>`;
}

// ===== SPEEDOMETER =====
function speedometerHTML(score) {
  // Arc: semicircle from 180° to 0° (left to right)
  // SVG viewBox 0 0 200 110, center 100,100, radius 80
  const cx = 100, cy = 100, r = 80;
  const toRad = d => (d * Math.PI) / 180;

  // Arc path helper
  function arcPath(startDeg, endDeg, radius, color, strokeW) {
    const s = { x: cx + radius * Math.cos(toRad(startDeg)), y: cy + radius * Math.sin(toRad(startDeg)) };
    const e = { x: cx + radius * Math.cos(toRad(endDeg)),   y: cy + radius * Math.sin(toRad(endDeg))   };
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    return `<path d="M${s.x},${s.y} A${radius},${radius} 0 ${large},1 ${e.x},${e.y}"
      fill="none" stroke="${color}" stroke-width="${strokeW}" stroke-linecap="round"/>`;
  }

  // Zones: 180°→252° green, 252°→324° yellow, 324°→360° red
  const trackArcs = [
    arcPath(180, 252, r, 'rgba(16,185,129,.2)',  14),
    arcPath(252, 324, r, 'rgba(245,158,11,.2)',  14),
    arcPath(324, 360, r, 'rgba(239,68,68,.2)',   14),
  ];

  // Filled arc up to score (180° + score*1.8°)
  const fillDeg = 180 + score * 1.8;
  const fillColor = score <= 30 ? '#10b981' : score <= 70 ? '#f59e0b' : '#ef4444';
  const filledArc = score > 0 ? arcPath(180, Math.min(fillDeg, 360), r, fillColor, 14) : '';

  // Needle
  const needleDeg = 180 + score * 1.8;
  const needleLen = 62;
  const nx = cx + needleLen * Math.cos(toRad(needleDeg));
  const ny = cy + needleLen * Math.sin(toRad(needleDeg));
  const needle = `<line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}"
    stroke="${fillColor}" stroke-width="3" stroke-linecap="round"
    class="gauge-needle" data-deg="${needleDeg}"/>
    <circle cx="${cx}" cy="${cy}" r="6" fill="${fillColor}"/>
    <circle cx="${cx}" cy="${cy}" r="3" fill="#0b0f28"/>`;

  // Zone labels
  const labels = `
    <text x="22"  y="98" fill="rgba(16,185,129,.7)" font-size="9" font-family="Inter,sans-serif" font-weight="700">SAFE</text>
    <text x="86"  y="30" fill="rgba(245,158,11,.7)"  font-size="9" font-family="Inter,sans-serif" font-weight="700">RISK</text>
    <text x="162" y="98" fill="rgba(239,68,68,.7)"   font-size="9" font-family="Inter,sans-serif" font-weight="700">DANGER</text>`;

  const label = score <= 30 ? 'Safe' : score <= 70 ? 'Suspicious' : 'Dangerous';
  const emoji  = score <= 30 ? '🟢' : score <= 70 ? '🟡' : '🔴';

  return `<div class="speedometer-wrap">
    <svg viewBox="0 0 200 110" class="speedometer-svg" id="gaugesvg">
      ${trackArcs.join('')}
      ${filledArc}
      ${needle}
      ${labels}
    </svg>
    <div class="gauge-score-wrap">
      <div class="gauge-score" data-target="${score}" style="color:${fillColor}">0</div>
      <div class="gauge-label">${emoji} ${label}</div>
    </div>
  </div>`;
}

function animateGauge(container) {
  const scoreEl = container.querySelector('.gauge-score');
  const needle  = container.querySelector('.gauge-needle');
  if (!scoreEl) return;
  const target = parseInt(scoreEl.dataset.target);
  const targetDeg = 180 + target * 1.8;
  const startDeg  = 180;
  const duration  = 1000;
  const start = performance.now();

  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
    const cur = Math.round(target * ease);
    const deg = startDeg + cur * 1.8;
    scoreEl.textContent = cur;
    if (needle) {
      const rad = (deg * Math.PI) / 180;
      const nx = 100 + 62 * Math.cos(rad);
      const ny = 100 + 62 * Math.sin(rad);
      needle.setAttribute('x2', nx);
      needle.setAttribute('y2', ny);
    }
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ===== LIVE THREAT TICKER =====
const countryKeywords = {
  'india': 'IN', 'indian': 'IN', 'sbi': 'IN', 'hdfc': 'IN', 'icici': 'IN',
  'upi': 'IN', 'npci': 'IN', 'bsnl': 'IN', 'irctc': 'IN', 'uidai': 'IN',
  'uk': 'GB', 'barclays': 'GB', 'lloyds': 'GB', 'natwest': 'GB', 'hsbc': 'GB',
  'usa': 'US', 'irs': 'US', 'fedex': 'US', 'usps': 'US', 'chase': 'US',
  'canada': 'CA', 'rbc': 'CA', 'cibc': 'CA', 'australia': 'AU', 'anz': 'AU',
  'germany': 'DE', 'deutsche': 'DE', 'france': 'FR', 'japan': 'JP',
  'china': 'CN', 'russia': 'RU', 'brazil': 'BR',
};

const countryNames = {
  'IN':'India','GB':'United Kingdom','US':'United States','CA':'Canada',
  'AU':'Australia','DE':'Germany','FR':'France','JP':'Japan',
  'CN':'China','RU':'Russia','BR':'Brazil',
};

async function checkLocationMismatch(hostname) {
  try {
    const res = await fetch(`https://ip-api.com/json/${hostname}?fields=status,country,countryCode,org`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 'success') return null;
    return { country: data.country, countryCode: data.countryCode, org: data.org };
  } catch { return null; }
}

function detectImpliedCountry(domain) {
  const d = domain.toLowerCase();
  for (const [kw, code] of Object.entries(countryKeywords)) {
    if (d.includes(kw)) return { keyword: kw, code };
  }
  // Check ccTLD
  const ccTLDs = { '.in': 'IN', '.uk': 'GB', '.co.uk': 'GB', '.us': 'US', '.ca': 'CA', '.au': 'AU', '.de': 'DE', '.fr': 'FR', '.jp': 'JP', '.cn': 'CN', '.ru': 'RU', '.br': 'BR' };
  for (const [tld, code] of Object.entries(ccTLDs)) {
    if (d.endsWith(tld)) return { keyword: tld, code };
  }
  return null;
}

function tryExample(url) {
  document.getElementById('urlInput').value = url;
  document.getElementById('demoForm').dispatchEvent(new Event('submit'));
}

document.getElementById('demoForm').addEventListener('submit', async e => {
  e.preventDefault();
  const raw = document.getElementById('urlInput').value.trim();
  if (!raw) return;
  const el = document.getElementById('demoResult');
  el.innerHTML = '<div class="demo-loading"><div class="demo-spinner"></div>Analyzing URL...</div>';

  let result;
  try {
    const res = await fetch('/api/check-url', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: raw })
    });
    if (res.ok) result = await res.json();
  } catch {}
  if (!result) result = analyzeUrl(raw);
  if (result.error) { showResult(result); return; }

  // Location mismatch check
  el.innerHTML = '<div class="demo-loading"><div class="demo-spinner"></div>Checking server location...</div>';
  try {
    let url2;
    try { url2 = new URL(raw.startsWith('http') ? raw : 'https://' + raw); } catch {}
    if (url2) {
      const implied = detectImpliedCountry(url2.hostname);
      const geo = await checkLocationMismatch(url2.hostname);
      if (geo && implied && geo.countryCode !== implied.code) {
        result.checks.push({
          t: 'bad',
          m: `⚠️ Location mismatch — domain implies ${countryNames[implied.code] || implied.code} but server is in ${geo.country}${geo.org ? ' (' + geo.org + ')' : ''}`
        });
        result.riskScore = Math.min(100, result.riskScore + 20);
        result.status = result.status === 'safe' ? 'warning' : 'danger';
      } else if (geo && implied && geo.countryCode === implied.code) {
        result.checks.push({ t: 'ok', m: `Server location matches — hosted in ${geo.country}` });
      } else if (geo) {
        result.checks.push({ t: 'ok', m: `Server location: ${geo.country}${geo.org ? ' · ' + geo.org : ''}` });
      }
    }
  } catch {}

  showResult(result);
});

// ===== SPEECH WARNING =====
function speakWarning(status, domain) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const messages = {
    danger:  `Warning! This link is dangerous. The domain ${domain} has been flagged as a phishing site. Do not proceed.`,
    warning: `Caution! This link looks suspicious. The domain ${domain} may not be safe. Proceed with care.`,
    safe:    `This link appears safe. The domain ${domain} passed all security checks.`,
  };
  const msg = new SpeechSynthesisUtterance(messages[status] || messages.safe);
  msg.rate = 0.95;
  msg.pitch = status === 'danger' ? 0.8 : 1;
  msg.volume = 1;
  window.speechSynthesis.speak(msg);
}
const threats = [
  'paypal-secure-login.tk blocked — credential harvesting',
  'amaz0n-deals.xyz blocked — fake shopping site',
  'secure-bank-verify.net blocked — domain mismatch',
  'netflix-account-update.ml blocked — phishing email link',
  'apple-id-suspended.cf blocked — lookalike domain',
  'microsoft-support-alert.xyz blocked — tech support scam',
  'fedex-delivery-confirm.tk blocked — parcel scam',
  'crypto-wallet-verify.top blocked — crypto phishing',
  'instagram-login-verify.ml blocked — account takeover',
  'irs-tax-refund-claim.cf blocked — government impersonation',
];

function buildTicker() {
  const ticker = document.getElementById('ticker');
  if (!ticker) return;
  const doubled = [...threats, ...threats];
  ticker.innerHTML = doubled.map(t =>
    `<span class="ticker-item"><span class="ti-dot"></span>${t}</span>`
  ).join('');
}
buildTicker();

// ===== ANIMATED COUNTERS =====
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const duration = 2000;
  const step = target / (duration / 16);
  let current = 0;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = target >= 1000000
      ? (current / 1000000).toFixed(1) + 'M+'
      : target >= 1000
      ? Math.floor(current).toLocaleString() + '+'
      : Math.floor(current) + (el.dataset.target === '99' ? '%' : 'ms');
  }, 16);
}

const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.counter-num').forEach(animateCounter);
      counterObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.counters-grid').forEach(el => counterObserver.observe(el));

// ===== FAQ TOGGLE =====
function toggleFaq(item) {
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(f => f.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

// ===== QR CODE SCANNER =====
let cameraStream = null;
let qrScanInterval = null;
let qrTimeoutId = null;

function switchTab(tab) {
  const isCamera = tab === 'camera';
  document.getElementById('panelCamera').style.display = isCamera ? '' : 'none';
  document.getElementById('panelUpload').style.display = isCamera ? 'none' : '';
  document.getElementById('tabCamera').classList.toggle('active', isCamera);
  document.getElementById('tabUpload').classList.toggle('active', !isCamera);
  if (!isCamera) stopCamera();
}

async function startCamera() {
  const video = document.getElementById('qrVideo');
  const startBtn = document.getElementById('startCamBtn');
  const stopBtn = document.getElementById('stopCamBtn');
  const el = document.getElementById('qrResult');
  el.innerHTML = '';

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = cameraStream;
    startBtn.style.display = 'none';
    stopBtn.style.display = '';

    const canvas = document.getElementById('qrCanvas');
    const ctx2 = canvas.getContext('2d');

    el.innerHTML = `<div class="qr-countdown"><div class="qr-cd-ring"><span>📷</span></div><div class="qr-cd-label">Scanning… Point camera at QR code</div></div>`;

    // Silent 15s timeout — no countdown shown
    qrTimeoutId = setTimeout(() => {
      clearInterval(qrScanInterval);
      qrScanInterval = null;
      stopCamera();
      speakWarning('danger', 'unknown');
      el.innerHTML = `<div class="qr-result-card danger">
        <div class="qr-result-header"><span>🚨</span><strong>Suspicious QR Code</strong></div>
        <div class="fake-login-banner" style="margin-top:12px">
          <div class="flb-icon">⚠️</div>
          <div class="flb-text">
            <div class="flb-title">QR Code could not be verified</div>
            <div class="flb-sub">Legitimate QR codes scan instantly. This code may be:<br>
            • Deliberately distorted to hide its destination<br>
            • A fake or tampered code designed to evade scanners<br>
            • Too low resolution to be legitimate<br><br>
            <strong style="color:#f87171">Do not trust this QR code.</strong></div>
          </div>
        </div>
      </div>`;
    }, 15000);

    qrScanInterval = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx2.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx2.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
        if (code) {
          clearTimeout(qrTimeoutId);
          stopCamera();
          processQrResult(code.data);
        }
      }
    }, 300);
  } catch (err) {
    document.getElementById('qrResult').innerHTML =
      `<div class="qr-result-card danger"><p>⚠️ Camera access denied or not available. Please allow camera permissions and try again.</p></div>`;
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
  if (qrScanInterval) { clearInterval(qrScanInterval); qrScanInterval = null; }
  if (qrTimeoutId) { clearTimeout(qrTimeoutId); qrTimeoutId = null; }
  const video = document.getElementById('qrVideo');
  video.srcObject = null;
  document.getElementById('startCamBtn').style.display = '';
  document.getElementById('stopCamBtn').style.display = 'none';
}

function handleQrFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const el = document.getElementById('qrResult');
  el.innerHTML = '<div class="demo-loading"><div class="demo-spinner"></div>Reading QR code...</div>';

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      // Scale down large images — jsQR works best under 1000px
      const MAX = 800;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        const ratio = Math.min(MAX / w, MAX / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx2 = canvas.getContext('2d');
      ctx2.drawImage(img, 0, 0, w, h);
      const imageData = ctx2.getImageData(0, 0, w, h);

      // Try normal, then inverted (some QR codes are dark-on-light vs light-on-dark)
      let code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });

      if (code) {
        processQrResult(code.data);
      } else {
        el.innerHTML = `<div class="qr-result-card danger">
          <div class="qr-result-header"><span>❌</span><strong>No QR Code Detected</strong></div>
          <p style="font-size:13px;color:var(--text-muted);margin-top:8px">
            Could not find a QR code in this image. Tips:<br>
            • Make sure the QR code is clear and not blurry<br>
            • Try a screenshot or cropped image of just the QR code<br>
            • Ensure good contrast (dark code on white background)
          </p>
        </div>`;
      }
    };
    img.onerror = () => {
      el.innerHTML = `<div class="qr-result-card danger"><p style="color:#f87171">⚠️ Could not load image. Please try a different file.</p></div>`;
    };
    img.src = e.target.result;
  };
  reader.onerror = () => {
    el.innerHTML = `<div class="qr-result-card danger"><p style="color:#f87171">⚠️ Failed to read file.</p></div>`;
  };
  reader.readAsDataURL(file);
  // Reset after read starts (not before)
  setTimeout(() => { event.target.value = ''; }, 500);
}

function processQrResult(raw) {
  const el = document.getElementById('qrResult');
  // Check if it's a URL
  let isUrl = false;
  try { new URL(raw); isUrl = true; } catch {}

  if (!isUrl) {
    el.innerHTML = `<div class="qr-result-card safe">
      <div class="qr-result-header"><span>📋</span><strong>QR Code Decoded</strong></div>
      <p class="qr-decoded-text">${escapeHtml(raw)}</p>
      <p style="font-size:13px;color:var(--text-muted);margin-top:8px">This QR code contains plain text, not a URL.</p>
    </div>`;
    return;
  }

  el.innerHTML = '<div class="demo-loading"><div class="demo-spinner"></div>Analyzing URL from QR code...</div>';
  // Run geo check then show
  (async () => {
    const result = analyzeUrl(raw);
    if (!result.error) {
      try {
        let url2; try { url2 = new URL(raw.startsWith('http') ? raw : 'https://' + raw); } catch {}
        if (url2) {
          const implied = detectImpliedCountry(url2.hostname);
          const geo = await checkLocationMismatch(url2.hostname);
          if (geo && implied && geo.countryCode !== implied.code) {
            result.checks.push({ t: 'bad', m: `⚠️ Location mismatch — domain implies ${countryNames[implied.code] || implied.code} but server is in ${geo.country}` });
            result.riskScore = Math.min(100, result.riskScore + 20);
            result.status = result.status === 'safe' ? 'warning' : 'danger';
          } else if (geo && implied && geo.countryCode === implied.code) {
            result.checks.push({ t: 'ok', m: `Server location matches — hosted in ${geo.country}` });
          } else if (geo) {
            result.checks.push({ t: 'ok', m: `Server location: ${geo.country}${geo.org ? ' · ' + geo.org : ''}` });
          }
        }
      } catch {}
    }
    const icons = { safe: '✅', warning: '⚠️', danger: '🚨' };
    const titles = { safe: 'QR Code is Safe', warning: 'QR Code — Proceed with Caution', danger: 'QR Code Phishing Detected!' };
    if (result.error) {
      el.innerHTML = `<div class="qr-result-card danger"><p style="color:#f87171">${result.error}</p></div>`;
      return;
    }
    const { status, url: href, checks, riskScore, isTrusted, explanation } = result;
    const verifiedBadge = isTrusted ? `<span class="verified-badge">✔ Verified Website</span>` : '';
    let html = `<div class="qr-result-card ${status}">
      <div class="qr-result-header">
        <span>${icons[status]}</span>
        <div><strong>${titles[status]}</strong>${verifiedBadge}<div class="result-url">${href}</div></div>
      </div>
      <div class="explain-box explain-${status}">
        <div class="explain-label">💡 Plain English Explanation</div>
        <p class="explain-text">${explanation}</p>
      </div>
      ${speedometerHTML(riskScore)}
      ${scamHistoryHTML(new URL(href).hostname, status, isTrusted)}
      <div class="result-items">`;
    checks.forEach(c => {
      html += `<div class="result-item"><div class="ri-dot ${c.t === 'ok' ? 'ok' : c.t === 'warn' ? 'warn' : 'bad'}">${c.t === 'ok' ? '✓' : c.t === 'warn' ? '!' : '✕'}</div><span>${c.m}</span></div>`;
    });
    html += '</div></div>';
    el.innerHTML = html;
    requestAnimationFrame(() => {
      el.querySelectorAll('[data-pct]').forEach(bar => { bar.style.width = bar.dataset.pct + '%'; });
      animateGauge(el);
    });
    // Speak result
    try { speakWarning(status, new URL(href).hostname); } catch {}
    // Update toolbar indicator
    updateToolbarIndicator(status, new URL(href).hostname);
  })();
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
