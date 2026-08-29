/* ============================================================
   MEME OS — All Functionality
   ============================================================ */

// ---------- LOCAL STORAGE HELPERS ----------
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}
function loadData(key, fallback = []) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}
function removeData(key) {
    localStorage.removeItem(key);
}
function clearData() {
    localStorage.clear();
}

// ---------- AUTHENTICATION ----------
function isAuthenticated() {
    return localStorage.getItem('memeOS_authenticated') === 'true';
}

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

function logout() {
    localStorage.removeItem('memeOS_authenticated');
    window.location.href = 'index.html';
}

// ---------- TOAST NOTIFICATIONS ----------
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(30px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ---------- DEX SCREENER API ----------
const DEX_SCREENER_API = 'https://api.dexscreener.com/latest/dex';
let lastApiCall = 0;

async function fetchDexScreener(query) {
    // Simple rate limiting (max 1 call per 2 seconds)
    const now = Date.now();
    if (now - lastApiCall < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - (now - lastApiCall)));
    }
    lastApiCall = Date.now();

    try {
        const url = `${DEX_SCREENER_API}/${encodeURIComponent(query)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('DexScreener fetch error:', error);
        return null;
    }
}

async function fetchTrendingMemeTokens() {
    // Using a known search query for demo; we will fetch pairs for a few meme coins.
    // For a real deployment, you could use a search endpoint or a curated list.
    const tokens = ['PEPE', 'WIF', 'BONK', 'SHIB', 'DOGE', 'FLOKI', 'MEME', 'TOSHI'];
    const allPairs = [];
    for (const token of tokens) {
        const data = await fetchDexScreener(`search?q=${token}`);
        if (data && data.pairs && data.pairs.length > 0) {
            allPairs.push(...data.pairs.slice(0, 3)); // take top 3 per token
        }
        // small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    // Deduplicate by pair address
    const unique = [];
    const seen = new Set();
    for (const pair of allPairs) {
        if (!seen.has(pair.pairAddress)) {
            seen.add(pair.pairAddress);
            unique.push(pair);
        }
    }
    return unique;
}

async function fetchPairData(pairAddress) {
    const data = await fetchDexScreener(`pairs/${pairAddress}`);
    return data;
}

function formatCurrency(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(decimals)}`;
}

function formatNumber(value) {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return value.toLocaleString();
}

function formatPercent(value) {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return `${value.toFixed(2)}%`;
}

function getPairAge(pair) {
    if (pair.pairCreatedAt) {
        const created = new Date(pair.pairCreatedAt);
        const now = Date.now();
        const diffMs = now - created.getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `${days}d ${hours}h`;
        return `${hours}h`;
    }
    return 'N/A';
}

// ---------- DEMO DATA ----------
function generateDemoTrades() {
    const setups = ['Breakout', 'Volume Expansion', 'Momentum', 'Narrative', 'Smart Money', 'Reversal'];
    const mistakes = ['', 'FOMO', 'Late Entry', 'Early Exit', 'Overtrading', 'Revenge Trade', 'Poor Risk Management', 'No Confirmation'];
    const tokens = ['PEPE', 'WIF', 'BONK', 'SHIB', 'DOGE', 'FLOKI', 'MEME', 'TOSHI', 'AIDOGE', 'BABYDOGE'];
    const trades = [];
    for (let i = 0; i < 57; i++) {
        const entry = Math.random() * 0.0001 + 0.000001;
        const exit = Math.random() * 0.0002 + 0.0000005;
        const positionSize = Math.floor(Math.random() * 2000) + 100;
        const direction = Math.random() > 0.5 ? 1 : -1;
        const pl = (exit - entry) * (positionSize / entry) * direction;
        const roi = (pl / positionSize) * 100;
        trades.push({
            id: `demo-${i}`,
            token: tokens[Math.floor(Math.random() * tokens.length)],
            entryPrice: entry,
            exitPrice: exit,
            positionSize: positionSize,
            entryMC: Math.random() * 1e8,
            exitMC: Math.random() * 1e8,
            setup: setups[Math.floor(Math.random() * setups.length)],
            mistake: mistakes[Math.floor(Math.random() * mistakes.length)],
            entryReason: '',
            exitReason: '',
            notes: '',
            date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
            pnl: pl,
            roi: roi,
            result: pl >= 0 ? 'win' : 'loss'
        });
    }
    return trades;
}

function generateDemoJournal() {
    return [
        {
            id: 'j1',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            marketConditions: 'High volatility, meme coin rally',
            saw: 'Massive volume spikes on small caps',
            did: 'Entered PEPE breakout',
            well: 'Good entry timing',
            wrong: 'Did not set stop loss',
            lesson: 'Always set stop loss on meme trades'
        },
        {
            id: 'j2',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            marketConditions: 'Choppy market',
            saw: 'Multiple fakeouts',
            did: 'Stayed out',
            well: 'Patience',
            wrong: 'Felt FOMO',
            lesson: 'No trade is better than bad trade'
        }
    ];
}

// ---------- DEMO CHARTS DATA ----------
function generateEquityData() {
    const data = [];
    const days = 60;
    let value = 10000;
    for (let i = 0; i < days; i++) {
        value += Math.random() * 150 - 60;
        data.push({ x: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000), y: value });
    }
    return data;
}

// ---------- GLOBAL STATE ----------
let currentTokenForWatchlist = null;

// ---------- INITIALIZATION ----------
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();

    // Page-specific logic
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        initLoginPage();
    } else if (window.location.pathname.endsWith('dashboard.html')) {
        if (!requireAuth()) return;
        initDashboard();
    } else if (window.location.pathname.endsWith('scanner.html')) {
        if (!requireAuth()) return;
        initScanner();
    }
});

// ---------- LOGIN PAGE ----------
function initLoginPage() {
    // Animated background orbs
    const bg = document.getElementById('loginBgElements');
    if (bg) {
        for (let i = 0; i < 5; i++) {
            const orb = document.createElement('div');
            orb.className = 'bg-orb';
            orb.style.width = orb.style.height = `${Math.random() * 200 + 100}px`;
            orb.style.left = `${Math.random() * 80}%`;
            orb.style.top = `${Math.random() * 80}%`;
            orb.style.background = i % 2 === 0 ? '#6366f1' : '#10b981';
            orb.style.animationDelay = `${Math.random() * 5}s`;
            bg.appendChild(orb);
        }
    }

    // Redirect if already authenticated
    if (isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        if (email === 'demo@memeos.local' && password === 'demo123') {
            localStorage.setItem('memeOS_authenticated', 'true');
            window.location.href = 'dashboard.html';
        } else {
            loginError.textContent = 'Invalid credentials. Use demo@memeos.local / demo123';
            loginError.style.display = 'block';
            setTimeout(() => {
                loginError.style.display = 'none';
            }, 3000);
        }
    });
}

// ---------- DASHBOARD ----------
function initDashboard() {
    // Set up sidebar navigation
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    const sections = document.querySelectorAll('.content-section');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebarClose = document.getElementById('sidebarClose');
    const logoutBtn = document.getElementById('logoutBtn');
    const settingsLogoutBtn = document.getElementById('settingsLogoutBtn');

    function activateSection(sectionId) {
        sections.forEach(sec => sec.classList.remove('active'));
        navItems.forEach(item => item.classList.remove('active'));
        const targetSection = document.getElementById(`section-${sectionId}`);
        const targetNav = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
        if (targetSection) targetSection.classList.add('active');
        if (targetNav) targetNav.classList.add('active');

        // Close mobile sidebar
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            activateSection(section);
        });
    });

    hamburgerBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
    });
    sidebarClose.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    });
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    });

    logoutBtn.addEventListener('click', logout);
    settingsLogoutBtn.addEventListener('click', logout);

    // Initialize demo data if not present
    if (!localStorage.getItem('memeOS_trades')) {
        saveData('memeOS_trades', generateDemoTrades());
    }
    if (!localStorage.getItem('memeOS_journal')) {
        saveData('memeOS_journal', generateDemoJournal());
    }
    if (!localStorage.getItem('memeOS_watchlist')) {
        saveData('memeOS_watchlist', []);
    }
    if (!localStorage.getItem('memeOS_settings')) {
        saveData('memeOS_settings', { chain: 'solana', currency: 'USD' });
    }

    // Load and display stats
    updateDashboardStats();
    renderEquityChart();
    loadOverviewMarketData();
    initSmartMoney();
    initRiskScanner();
    initWatchlist();
    initTrades();
    initJournal();
    initAnalytics();
    initSettings();
}

function updateDashboardStats() {
    const trades = loadData('memeOS_trades', []);
    const totalTrades = trades.length;
    const wins = trades.filter(t => t.result === 'win').length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const startingCapital = 10000;
    const portfolioValue = startingCapital + totalPnL;

    document.getElementById('statPortfolio').textContent = formatCurrency(portfolioValue);
    document.getElementById('statPnL').textContent = `${totalPnL >= 0 ? '+' : ''}${formatCurrency(totalPnL)}`;
    document.getElementById('statWinRate').textContent = `${winRate.toFixed(1)}%`;
    document.getElementById('statTrades').textContent = totalTrades;
}

function renderEquityChart() {
    const ctx = document.getElementById('equityChart').getContext('2d');
    const equityData = generateEquityData();
    new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Equity',
                data: equityData,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99,102,241,0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 0,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: { unit: 'day' },
                    ticks: { color: '#9898a8', maxTicksLimit: 10 },
                    grid: { color: '#1a1a24' }
                },
                y: {
                    ticks: { color: '#9898a8' },
                    grid: { color: '#1a1a24' }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// ---------- LIVE MARKET DATA ----------
async function loadOverviewMarketData() {
    const tokenBody = document.getElementById('overviewTokenBody');
    const lastUpdated = document.getElementById('overviewLastUpdated');
    tokenBody.innerHTML = '<tr><td colspan="8" class="table-loading"><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div></td></tr>';

    const pairs = await fetchTrendingMemeTokens();
    if (!pairs || pairs.length === 0) {
        tokenBody.innerHTML = '<tr><td colspan="8" class="table-loading">Market data temporarily unavailable.</td></tr>';
        lastUpdated.textContent = '';
        return;
    }

    // Update market pulse
    const pulseGrid = document.getElementById('marketPulse');
    pulseGrid.innerHTML = '';
    const topPulse = pairs.slice(0, 4);
    topPulse.forEach(pair => {
        const card = document.createElement('div');
        card.className = 'pulse-card';
        card.innerHTML = `
            <div class="pulse-card-token">
                <span class="token-avatar">${pair.baseToken.symbol.charAt(0)}</span>
                ${pair.baseToken.symbol}
            </div>
            <div class="pulse-card-price">$${parseFloat(pair.priceUsd).toFixed(8)}</div>
            <div class="pulse-card-change ${pair.priceChange.h24 >= 0 ? 'text-success' : 'text-danger'}">
                ${pair.priceChange.h24 >= 0 ? '+' : ''}${pair.priceChange.h24.toFixed(2)}%
            </div>
        `;
        pulseGrid.appendChild(card);
        card.addEventListener('click', () => openTokenModal(pair));
    });

    // Populate table
    tokenBody.innerHTML = '';
    pairs.slice(0, 15).forEach(pair => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="token-cell">
                    <span class="token-avatar">${pair.baseToken.symbol.charAt(0)}</span>
                    ${pair.baseToken.symbol}
                </div>
            </td>
            <td>$${parseFloat(pair.priceUsd).toFixed(8)}</td>
            <td>${formatCurrency(pair.marketCap)}</td>
            <td>${formatCurrency(pair.liquidity?.usd)}</td>
            <td>${formatCurrency(pair.volume?.h24)}</td>
            <td class="${pair.priceChange.h24 >= 0 ? 'text-success' : 'text-danger'}">${pair.priceChange.h24 >= 0 ? '+' : ''}${pair.priceChange.h24.toFixed(2)}%</td>
            <td>${formatNumber(pair.txns?.h24?.buys)}</td>
            <td>${formatNumber(pair.txns?.h24?.sells)}</td>
        `;
        tr.addEventListener('click', () => openTokenModal(pair));
        tokenBody.appendChild(tr);
    });

    lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
}

async function openTokenModal(pair) {
    const modal = document.getElementById('tokenModalOverlay');
    const title = document.getElementById('tokenModalTitle');
    const body = document.getElementById('tokenModalBody');
    title.textContent = `${pair.baseToken.symbol}`;
    body.innerHTML = `
        <p><strong>Price:</strong> $${parseFloat(pair.priceUsd).toFixed(8)}</p>
        <p><strong>Market Cap:</strong> ${formatCurrency(pair.marketCap)}</p>
        <p><strong>Liquidity:</strong> ${formatCurrency(pair.liquidity?.usd)}</p>
        <p><strong>24H Volume:</strong> ${formatCurrency(pair.volume?.h24)}</p>
        <p><strong>24H Change:</strong> ${pair.priceChange.h24 >= 0 ? '+' : ''}${pair.priceChange.h24.toFixed(2)}%</p>
        <hr style="border-color: var(--border-color); margin: 12px 0;">
        <p><strong>Chain:</strong> ${pair.chainId}</p>
        <p><strong>DEX:</strong> ${pair.dexId}</p>
        <p><strong>Pair:</strong> ${pair.pairAddress}</p>
        <p><strong>Buys:</strong> ${formatNumber(pair.txns?.h24?.buys)}</p>
        <p><strong>Sells:</strong> ${formatNumber(pair.txns?.h24?.sells)}</p>
        <p><strong>Transactions:</strong> ${formatNumber(pair.txns?.h24?.buys + pair.txns?.h24?.sells)}</p>
    `;
    currentTokenForWatchlist = pair;
    modal.style.display = 'flex';
}

// Watchlist modal (dashboard)
document.addEventListener('click', function(e) {
    if (e.target.id === 'tokenAddWatchlistBtn') {
        showWatchlistModal(currentTokenForWatchlist);
    }
});

function showWatchlistModal(pair) {
    if (!pair) return;
    const overlay = document.getElementById('watchlistCategoryOverlay');
    document.getElementById('watchlistModalToken').textContent = `$${pair.baseToken.symbol}`;
    document.getElementById('watchlistModalAddress').textContent = pair.pairAddress;
    overlay.style.display = 'flex';
}

document.getElementById('watchlistConfirmBtn').addEventListener('click', function() {
    const category = document.getElementById('watchlistCategorySelect').value;
    const notes = document.getElementById('watchlistNotes').value;
    const pair = currentTokenForWatchlist;
    if (!pair) return;

    const watchlist = loadData('memeOS_watchlist', []);
    // Check if already exists
    if (watchlist.some(item => item.pairAddress === pair.pairAddress)) {
        showToast('Token already in watchlist', 'warning');
        return;
    }
    watchlist.push({
        pairAddress: pair.pairAddress,
        symbol: pair.baseToken.symbol,
        chain: pair.chainId,
        dex: pair.dexId,
        category: category,
        notes: notes,
        addedAt: Date.now()
    });
    saveData('memeOS_watchlist', watchlist);
    document.getElementById('watchlistCategoryOverlay').style.display = 'none';
    showToast('Added to watchlist', 'success');
    renderWatchlist();
});

// Close modals
document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', function() {
        document.getElementById(this.dataset.closeModal).style.display = 'none';
    });
});

// ---------- SMART MONEY ----------
function initSmartMoney() {
    const feed = document.getElementById('smartMoneyFeed');
    const activities = [
        { wallet: 'Alpha 01', action: 'bought', token: '$PEPE', amount: '$8,420', time: '2 minutes ago' },
        { wallet: 'Alpha 03', action: 'sold', token: '$WIF', amount: '$4,820', time: '6 minutes ago' },
        { wallet: 'Alpha 02', action: 'bought', token: '$BONK', amount: '$12,300', time: '15 minutes ago' },
        { wallet: 'Alpha 01', action: 'sold', token: '$FLOKI', amount: '$6,100', time: '25 minutes ago' },
        { wallet: 'Alpha 02', action: 'bought', token: '$TOSHI', amount: '$3,200', time: '40 minutes ago' }
    ];
    feed.innerHTML = '';
    activities.forEach(act => {
        const div = document.createElement('div');
        div.className = 'feed-item';
        div.innerHTML = `
            <span class="feed-action">${act.wallet} ${act.action}</span>
            <span>${act.token}</span>
            <span>${act.amount} position</span>
            <span class="text-muted">${act.time}</span>
        `;
        feed.appendChild(div);
    });
}

// ---------- RISK SCANNER ----------
function initRiskScanner() {
    const scanBtn = document.getElementById('riskScanBtn');
    scanBtn.addEventListener('click', async () => {
        const address = document.getElementById('riskAddressInput').value.trim();
        if (!address) {
            showToast('Please enter a token or pair address', 'warning');
            return;
        }
        showToast('Analyzing...', 'info');
        const data = await fetchDexScreener(`pairs/${address}`);
        if (!data || !data.pairs || data.pairs.length === 0) {
            showToast('No pair found for that address', 'error');
            return;
        }
        const pair = data.pairs[0];
        displayRiskAnalysis(pair);
    });
}

function displayRiskAnalysis(pair) {
    const resultDiv = document.getElementById('riskResult');
    resultDiv.style.display = 'block';

    // Simple heuristic risk scoring (0-100, higher = more risk)
    const liquidity = pair.liquidity?.usd || 0;
    const volume = pair.volume?.h24 || 0;
    const age = getPairAge(pair);
    const priceChange = pair.priceChange?.h24 || 0;
    const txns = (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0);

    let score = 0;
    if (liquidity < 10000) score += 30;
    else if (liquidity < 50000) score += 20;
    else if (liquidity < 100000) score += 10;

    if (volume < 50000) score += 20;
    else if (volume < 100000) score += 10;

    if (age !== 'N/A' && age.includes('d') && parseInt(age) < 1) score += 30;
    else if (age !== 'N/A' && age.includes('h')) score += 20;

    if (priceChange < -10) score += 15;
    else if (priceChange > 50) score += 10;

    score = Math.min(100, score);

    let verdict, colorClass;
    if (score >= 70) { verdict = 'HIGH RISK'; colorClass = 'text-danger'; }
    else if (score >= 40) { verdict = 'MODERATE'; colorClass = 'text-warning'; }
    else { verdict = 'LOW RISK'; colorClass = 'text-success'; }

    document.getElementById('riskScoreValue').textContent = `${score} / 100`;
    document.getElementById('riskScoreValue').className = `risk-score-value ${colorClass}`;
    document.getElementById('riskVerdict').textContent = verdict;
    document.getElementById('riskVerdict').className = `risk-score-verdict ${colorClass}`;

    const breakdown = document.getElementById('riskBreakdown');
    breakdown.innerHTML = `
        <div class="risk-breakdown-item">
            <span>Liquidity Risk</span>
            <span class="risk-level">${liquidity < 10000 ? 'HIGH' : liquidity < 50000 ? 'MODERATE' : 'LOW'}</span>
        </div>
        <div class="risk-breakdown-item">
            <span>Volume Risk</span>
            <span class="risk-level">${volume < 50000 ? 'HIGH' : volume < 100000 ? 'MODERATE' : 'LOW'}</span>
        </div>
        <div class="risk-breakdown-item">
            <span>Token Age</span>
            <span class="risk-level">${age === 'N/A' ? 'N/A' : (age.includes('d') && parseInt(age) < 1 ? 'HIGH' : age.includes('h') ? 'MODERATE' : 'LOW')}</span>
        </div>
        <div class="risk-breakdown-item">
            <span>Market Activity</span>
            <span class="risk-level">${txns > 500 ? 'HIGH' : txns > 100 ? 'MODERATE' : 'LOW'}</span>
        </div>
    `;
}

// ---------- WATCHLIST ----------
function initWatchlist() {
    renderWatchlist();
    document.getElementById('watchlistRefreshBtn').addEventListener('click', () => {
        renderWatchlist();
        showToast('Watchlist refreshed', 'success');
    });
}

async function renderWatchlist() {
    const watchlist = loadData('memeOS_watchlist', []);
    const empty = document.getElementById('watchlistEmpty');
    const content = document.getElementById('watchlistContent');
    if (watchlist.length === 0) {
        empty.style.display = 'block';
        content.style.display = 'none';
        return;
    }
    empty.style.display = 'none';
    content.style.display = 'grid';
    content.innerHTML = '';

    for (const item of watchlist) {
        const card = document.createElement('div');
        card.className = 'watchlist-card';
        // Fetch latest data for this pair
        const data = await fetchDexScreener(`pairs/${item.pairAddress}`);
        let currentPrice = 'N/A';
        let change24h = 'N/A';
        if (data && data.pairs && data.pairs.length > 0) {
            const pair = data.pairs[0];
            currentPrice = `$${parseFloat(pair.priceUsd).toFixed(8)}`;
            change24h = `${pair.priceChange.h24 >= 0 ? '+' : ''}${pair.priceChange.h24.toFixed(2)}%`;
        }
        card.innerHTML = `
            <div class="watchlist-card-header">
                <span class="watchlist-card-token">
                    <span class="token-avatar">${item.symbol.charAt(0)}</span>
                    ${item.symbol}
                </span>
                <span class="watchlist-category">${item.category}</span>
            </div>
            <div class="watchlist-card-stats">
                <span>Price: <strong>${currentPrice}</strong></span>
                <span>24H: <strong class="${change24h.startsWith('+') ? 'text-success' : 'text-danger'}">${change24h}</strong></span>
                <span>Chain: ${item.chain}</span>
            </div>
            ${item.notes ? `<div class="watchlist-card-notes">${item.notes}</div>` : ''}
            <div class="watchlist-card-actions">
                <button class="btn btn-outline" onclick="removeWatchlistItem('${item.pairAddress}')">Remove</button>
            </div>
        `;
        content.appendChild(card);
        // Delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
    }
}

function removeWatchlistItem(pairAddress) {
    let watchlist = loadData('memeOS_watchlist', []);
    watchlist = watchlist.filter(item => item.pairAddress !== pairAddress);
    saveData('memeOS_watchlist', watchlist);
    renderWatchlist();
    showToast('Removed from watchlist', 'info');
}

// ---------- TRADES ----------
function initTrades() {
    renderTrades();
    document.getElementById('addTradeBtn').addEventListener('click', () => {
        document.getElementById('addTradeModalOverlay').style.display = 'flex';
        // Set default dates
        document.getElementById('tradeEntryDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('tradeExitDate').value = new Date().toISOString().split('T')[0];
        updateTradeCalcPreview();
    });

    // Trade form calculation
    document.getElementById('tradeEntryPrice').addEventListener('input', updateTradeCalcPreview);
    document.getElementById('tradeExitPrice').addEventListener('input', updateTradeCalcPreview);
    document.getElementById('tradePositionSize').addEventListener('input', updateTradeCalcPreview);

    document.getElementById('addTradeForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const token = document.getElementById('tradeToken').value.trim();
        const entryPrice = parseFloat(document.getElementById('tradeEntryPrice').value);
        const exitPrice = parseFloat(document.getElementById('tradeExitPrice').value);
        const positionSize = parseFloat(document.getElementById('tradePositionSize').value);
        const entryMC = parseFloat(document.getElementById('tradeEntryMC').value) || null;
        const exitMC = parseFloat(document.getElementById('tradeExitMC').value) || null;
        const setup = document.getElementById('tradeSetup').value;
        const mistake = document.getElementById('tradeMistake').value;
        const entryDate = document.getElementById('tradeEntryDate').value;
        const exitDate = document.getElementById('tradeExitDate').value;
        const entryReason = document.getElementById('tradeEntryReason').value;
        const exitReason = document.getElementById('tradeExitReason').value;
        const notes = document.getElementById('tradeNotes').value;

        if (isNaN(entryPrice) || isNaN(exitPrice) || isNaN(positionSize) || entryPrice <= 0 || exitPrice <= 0 || positionSize <= 0) {
            showToast('Please enter valid numeric values', 'error');
            return;
        }

        const pnl = (exitPrice - entryPrice) * (positionSize / entryPrice);
        const roi = (pnl / positionSize) * 100;
        const result = pnl >= 0 ? 'win' : 'loss';

        const trade = {
            id: Date.now().toString(),
            token,
            entryPrice,
            exitPrice,
            positionSize,
            entryMC,
            exitMC,
            setup,
            mistake: mistake || '',
            entryDate,
            exitDate,
            entryReason,
            exitReason,
            notes,
            pnl,
            roi,
            result
        };

        const trades = loadData('memeOS_trades', []);
        trades.push(trade);
        saveData('memeOS_trades', trades);
        document.getElementById('addTradeModalOverlay').style.display = 'none';
        this.reset();
        renderTrades();
        updateDashboardStats();
        showToast('Trade saved', 'success');
    });
}

function updateTradeCalcPreview() {
    const entry = parseFloat(document.getElementById('tradeEntryPrice').value);
    const exit = parseFloat(document.getElementById('tradeExitPrice').value);
    const size = parseFloat(document.getElementById('tradePositionSize').value);
    const preview = document.getElementById('tradeCalcPreview');
    if (entry > 0 && exit > 0 && size > 0) {
        const pnl = (exit - entry) * (size / entry);
        const roi = (pnl / size) * 100;
        preview.innerHTML = `<span>P&L: <strong class="${pnl >= 0 ? 'text-success' : 'text-danger'}">${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} USD</strong></span>
                             <span>ROI: <strong>${roi.toFixed(2)}%</strong></span>`;
    } else {
        preview.innerHTML = '';
    }
}

function renderTrades() {
    const trades = loadData('memeOS_trades', []);
    const tbody = document.getElementById('tradesBody');
    if (trades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="table-loading">No trades yet. Add your first trade.</td></tr>';
    } else {
        tbody.innerHTML = '';
        trades.forEach(trade => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${trade.token}</td>
                <td>${trade.entryPrice}</td>
                <td>${trade.exitPrice}</td>
                <td>${formatCurrency(trade.positionSize)}</td>
                <td class="${trade.pnl >= 0 ? 'text-success' : 'text-danger'}">${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}</td>
                <td class="${trade.roi >= 0 ? 'text-success' : 'text-danger'}">${trade.roi.toFixed(2)}%</td>
                <td>${trade.setup}</td>
                <td><span class="trade-result-badge ${trade.result}">${trade.result === 'win' ? 'WIN' : 'LOSS'}</span></td>
                <td>${new Date(trade.date || trade.entryDate).toLocaleDateString()}</td>
                <td><button class="btn btn-outline" onclick="deleteTrade('${trade.id}')">Delete</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Update trade stats
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const wins = trades.filter(t => t.result === 'win');
    const losses = trades.filter(t => t.result === 'loss');
    const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length : 0;

    document.getElementById('tradeTotalPnL').textContent = `${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}`;
    document.getElementById('tradeWinRate').textContent = `${winRate.toFixed(1)}%`;
    document.getElementById('tradeAvgWin').textContent = `+${avgWin.toFixed(2)}`;
    document.getElementById('tradeAvgLoss').textContent = avgLoss.toFixed(2);
}

function deleteTrade(id) {
    let trades = loadData('memeOS_trades', []);
    trades = trades.filter(t => t.id !== id);
    saveData('memeOS_trades', trades);
    renderTrades();
    updateDashboardStats();
    showToast('Trade deleted', 'info');
}

// ---------- JOURNAL ----------
function initJournal() {
    renderJournal();
    document.getElementById('addJournalBtn').addEventListener('click', () => {
        document.getElementById('addJournalModalOverlay').style.display = 'flex';
        document.getElementById('journalDate').value = new Date().toISOString().split('T')[0];
    });

    document.getElementById('addJournalForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const entry = {
            id: Date.now().toString(),
            date: document.getElementById('journalDate').value,
            marketConditions: document.getElementById('journalMarketConditions').value,
            saw: document.getElementById('journalSaw').value,
            did: document.getElementById('journalDid').value,
            well: document.getElementById('journalWell').value,
            wrong: document.getElementById('journalWrong').value,
            lesson: document.getElementById('journalLesson').value
        };
        const journal = loadData('memeOS_journal', []);
        journal.push(entry);
        saveData('memeOS_journal', journal);
        document.getElementById('addJournalModalOverlay').style.display = 'none';
        this.reset();
        renderJournal();
        showToast('Journal entry saved', 'success');
    });
}

function renderJournal() {
    const journal = loadData('memeOS_journal', []);
    const empty = document.getElementById('journalEmpty');
    const content = document.getElementById('journalContent');
    if (journal.length === 0) {
        empty.style.display = 'block';
        content.style.display = 'none';
        return;
    }
    empty.style.display = 'none';
    content.style.display = 'grid';
    content.innerHTML = '';
    journal.forEach(entry => {
        const card = document.createElement('div');
        card.className = 'journal-card';
        card.innerHTML = `
            <div class="journal-card-date">${new Date(entry.date).toLocaleDateString()}</div>
            <h4>${entry.marketConditions}</h4>
            <p><span class="journal-label">What I Saw:</span> ${entry.saw}</p>
            <p><span class="journal-label">What I Did:</span> ${entry.did}</p>
            ${entry.well ? `<p><span class="journal-label">Went Well:</span> ${entry.well}</p>` : ''}
            ${entry.wrong ? `<p><span class="journal-label">Went Wrong:</span> ${entry.wrong}</p>` : ''}
            ${entry.lesson ? `<p><span class="journal-label">Lesson:</span> ${entry.lesson}</p>` : ''}
        `;
        content.appendChild(card);
    });
}

// ---------- ANALYTICS ----------
function initAnalytics() {
    renderAnalyticsCharts();
    renderSetupAnalytics();
}

function renderAnalyticsCharts() {
    const trades = loadData('memeOS_trades', []);
    if (trades.length === 0) return;

    // Equity curve
    const equityCtx = document.getElementById('analyticsEquityChart').getContext('2d');
    const equityData = generateEquityData();
    new Chart(equityCtx, {
        type: 'line',
        data: {
            labels: equityData.map(d => d.x.toLocaleDateString()),
            datasets: [{
                label: 'Equity',
                data: equityData.map(d => d.y),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99,102,241,0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#9898a8' } }, x: { ticks: { color: '#9898a8', maxTicksLimit: 10 } } } }
    });

    // Daily P&L (simulated)
    const dailyCtx = document.getElementById('analyticsDailyChart').getContext('2d');
    const dailyData = [];
    for (let i = 0; i < 30; i++) {
        dailyData.push({ x: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000), y: Math.random() * 300 - 100 });
    }
    new Chart(dailyCtx, {
        type: 'bar',
        data: {
            labels: dailyData.map(d => d.x.toLocaleDateString()),
            datasets: [{
                label: 'P&L',
                data: dailyData.map(d => d.y),
                backgroundColor: dailyData.map(d => d.y >= 0 ? '#10b981' : '#ef4444')
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#9898a8' } }, x: { ticks: { color: '#9898a8', maxTicksLimit: 10 } } } }
    });

    // Win vs Loss pie
    const winLossCtx = document.getElementById('analyticsWinLossChart').getContext('2d');
    const wins = trades.filter(t => t.result === 'win').length;
    const losses = trades.length - wins;
    new Chart(winLossCtx, {
        type: 'doughnut',
        data: {
            labels: ['Wins', 'Losses'],
            datasets: [{
                data: [wins, losses],
                backgroundColor: ['#10b981', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#9898a8' } } } }
    });

    // Setup performance
    const setupCtx = document.getElementById('analyticsSetupChart').getContext('2d');
    const setups = [...new Set(trades.map(t => t.setup))];
    const setupData = setups.map(setup => {
        const filtered = trades.filter(t => t.setup === setup);
        const total = filtered.reduce((sum, t) => sum + t.pnl, 0);
        return total;
    });
    new Chart(setupCtx, {
        type: 'bar',
        data: {
            labels: setups,
            datasets: [{
                label: 'Total P&L',
                data: setupData,
                backgroundColor: setupData.map(v => v >= 0 ? '#10b981' : '#ef4444')
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#9898a8' } }, x: { ticks: { color: '#9898a8' } } } }
    });

    // Mistake impact
    const mistakeCtx = document.getElementById('analyticsMistakeChart').getContext('2d');
    const mistakes = ['FOMO', 'Early Exit', 'Late Entry', 'Overtrading', 'Revenge Trade', 'Poor Risk Management', 'No Confirmation'];
    const mistakeData = mistakes.map(m => {
        const filtered = trades.filter(t => t.mistake === m);
        const total = filtered.reduce((sum, t) => sum + t.pnl, 0);
        return total;
    });
    new Chart(mistakeCtx, {
        type: 'bar',
        data: {
            labels: mistakes,
            datasets: [{
                label: 'Impact ($)',
                data: mistakeData,
                backgroundColor: mistakeData.map(v => v >= 0 ? '#10b981' : '#ef4444')
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#9898a8' } }, x: { ticks: { color: '#9898a8' } } } }
    });
}

function renderSetupAnalytics() {
    const trades = loadData('memeOS_trades', []);
    if (trades.length === 0) return;
    const tbody = document.getElementById('setupAnalyticsBody');
    const setups = [...new Set(trades.map(t => t.setup))];
    tbody.innerHTML = '';
    setups.forEach(setup => {
        const filtered = trades.filter(t => t.setup === setup);
        const totalTrades = filtered.length;
        const wins = filtered.filter(t => t.result === 'win').length;
        const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
        const avgPnl = filtered.reduce((sum, t) => sum + t.pnl, 0) / totalTrades;
        const totalPnl = filtered.reduce((sum, t) => sum + t.pnl, 0);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${setup}</td>
            <td>${totalTrades}</td>
            <td>${winRate.toFixed(1)}%</td>
            <td class="${avgPnl >= 0 ? 'text-success' : 'text-danger'}">${avgPnl.toFixed(2)}</td>
            <td class="${totalPnl >= 0 ? 'text-success' : 'text-danger'}">${totalPnl.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ---------- SETTINGS ----------
function initSettings() {
    document.getElementById('resetDemoBtn').addEventListener('click', () => {
        clearData();
        localStorage.setItem('memeOS_authenticated', 'true');
        location.reload();
    });
    document.getElementById('clearWatchlistBtn').addEventListener('click', () => {
        saveData('memeOS_watchlist', []);
        renderWatchlist();
        showToast('Watchlist cleared', 'info');
    });
    document.getElementById('clearTradesBtn').addEventListener('click', () => {
        saveData('memeOS_trades', []);
        renderTrades();
        updateDashboardStats();
        showToast('Trades cleared', 'info');
    });
    document.getElementById('clearJournalBtn').addEventListener('click', () => {
        saveData('memeOS_journal', []);
        renderJournal();
        showToast('Journal cleared', 'info');
    });
}

// ---------- SCANNER PAGE ----------
function initScanner() {
    const tableBody = document.getElementById('scannerTableBody');
    const lastUpdated = document.getElementById('scannerLastUpdated');
    const errorState = document.getElementById('scannerError');
    const searchBtn = document.getElementById('scannerSearchBtn');
    const refreshBtn = document.getElementById('scannerRefreshBtn');
    const retryBtn = document.getElementById('scannerRetryBtn');

    let currentPairs = [];

    async function loadScannerData() {
        tableBody.innerHTML = '<tr><td colspan="9" class="table-loading">Loading…</td></tr>';
        errorState.style.display = 'none';
        const pairs = await fetchTrendingMemeTokens();
        if (!pairs || pairs.length === 0) {
            tableBody.innerHTML = '';
            errorState.style.display = 'block';
            lastUpdated.textContent = '';
            return;
        }
        currentPairs = pairs;
        applyFiltersAndRender();
        lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    }

    function applyFiltersAndRender() {
        const searchTerm = document.getElementById('scannerSearchInput').value.toLowerCase();
        const chain = document.getElementById('scannerChainFilter').value;
        const minMC = parseFloat(document.getElementById('scannerMcFilter').value) || 0;
        const minLiq = parseFloat(document.getElementById('scannerLiquidityFilter').value) || 0;
        const minVol = parseFloat(document.getElementById('scannerVolumeFilter').value) || 0;
        const changeFilter = document.getElementById('scannerChangeFilter').value;
        const sortBy = document.getElementById('scannerSortSelect').value;

        let filtered = currentPairs.filter(pair => {
            const symbol = pair.baseToken.symbol.toLowerCase();
            const name = (pair.baseToken.name || '').toLowerCase();
            const address = pair.pairAddress.toLowerCase();
            const matchesSearch = !searchTerm || symbol.includes(searchTerm) || name.includes(searchTerm) || address.includes(searchTerm);
            const matchesChain = !chain || pair.chainId === chain;
            const matchesMC = !minMC || (pair.marketCap || 0) >= minMC;
            const matchesLiq = !minLiq || (pair.liquidity?.usd || 0) >= minLiq;
            const matchesVol = !minVol || (pair.volume?.h24 || 0) >= minVol;
            const priceChange = pair.priceChange?.h24 || 0;
            let matchesChange = true;
            if (changeFilter === 'positive') matchesChange = priceChange >= 0;
            else if (changeFilter === 'negative') matchesChange = priceChange < 0;
            else if (changeFilter === '10') matchesChange = priceChange >= 10;
            else if (changeFilter === '25') matchesChange = priceChange >= 25;
            else if (changeFilter === '50') matchesChange = priceChange >= 50;
            else if (changeFilter === '-10') matchesChange = priceChange <= -10;
            return matchesSearch && matchesChain && matchesMC && matchesLiq && matchesVol && matchesChange;
        });

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'volume': return (b.volume?.h24 || 0) - (a.volume?.h24 || 0);
                case 'liquidity': return (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0);
                case 'marketCap': return (b.marketCap || 0) - (a.marketCap || 0);
                case 'priceChange': return (b.priceChange?.h24 || 0) - (a.priceChange?.h24 || 0);
                case 'txns': return ((b.txns?.h24?.buys || 0) +
