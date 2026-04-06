// Global variables
let sneakersData = [];
let activeSneaker = 0;
let activeSize = null;
let carouselIdx = 0;
let carouselItems = [];
let maxZ = 10;
let waitlistCount = 39;

// DOM Elements
let ipcImg, ipcName, ipcMrp, sizeChips, carouselWrap, noResults;
let carousel, carouselTitle, carouselDots, prevBtn, nextBtn;
let sneakerTabs, spCardImg, spTitle, spSub, spSizes, spRows, spScore;
let chaosContainer, searchResults, statsGrid, statsRowFoot;
let waitEmail, waitMsg, joinWaitlistBtn, waitlistCountSpan;

// Load sneakers data from JSON
async function loadSneakers() {
    try {
        const response = await fetch('data/sneakers.json');
        sneakersData = await response.json();
        initializeApp();
    } catch (error) {
        console.error('Error loading sneakers data:', error);
        // Fallback to embedded data
        sneakersData = getFallbackData();
        initializeApp();
    }
}

function getFallbackData() {
    return [
        {
            name: "Nike Air Max 90", mrp: 8495,
            img: "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/af53d53d-561f-450a-a483-70a7ceee380f/air-max-90-shoes-kRsBnD.png",
            sizes: ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"],
            stores: [
                { name: "Superkicks", delivery: "2 day delivery", url: "#", stock: { "UK 7": 7000, "UK 8": 7000, "UK 9": 7000, "UK 10": 7200, "UK 11": 7200 } },
                { name: "VegNonVeg", delivery: "3 day delivery", url: "#", stock: { "UK 7": 7200, "UK 8": 7200, "UK 9": 7200, "UK 10": 7400 } },
                { name: "Myntra", delivery: "Next day delivery", url: "#", stock: { "UK 6": 7999, "UK 7": 7999, "UK 8": 7999, "UK 9": 7999, "UK 10": 7999, "UK 11": 8199, "UK 12": 8199 } },
                { name: "Ajio", delivery: "4–5 day delivery", url: "#", stock: { "UK 7": 8499, "UK 12": 8499 } },
                { name: "Flipkart", delivery: "5–7 day delivery", url: "#", stock: { "UK 8": 8299, "UK 9": 8299, "UK 10": 8299 } }
            ]
        },
        {
            name: "Nike Dunk Low Panda", mrp: 8995,
            img: "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/b1bcbca4-e853-4df7-b329-5f7f5ad9fef0/dunk-low-retro-shoes-76f5BR.png",
            sizes: ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"],
            stores: [
                { name: "Ajio", delivery: "3–4 day delivery", url: "#", stock: { "UK 7": 7995, "UK 8": 7995, "UK 9": 7995, "UK 10": 7995 } },
                { name: "Myntra", delivery: "Next day delivery", url: "#", stock: { "UK 6": 8499, "UK 7": 8499, "UK 8": 8499, "UK 9": 8499, "UK 10": 8499, "UK 11": 8499 } },
                { name: "Superkicks", delivery: "2 day delivery", url: "#", stock: { "UK 8": 8200, "UK 9": 8200, "UK 10": 8200 } }
            ]
        },
        {
            name: "Adidas Samba OG", mrp: 9999,
            img: "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/2f1f3f2a2b2d4d5e8f2d21d7c0a9a9a9_9366/Samba_OG_Shoes_White_B75806_01_standard.jpg",
            sizes: ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"],
            stores: [
                { name: "VegNonVeg", delivery: "2–3 day delivery", url: "#", stock: { "UK 7": 8999, "UK 8": 8999, "UK 9": 8999, "UK 10": 8999 } },
                { name: "Crepdog Crew", delivery: "3 day delivery", url: "#", stock: { "UK 7": 9200, "UK 8": 9200, "UK 9": 9200 } },
                { name: "Myntra", delivery: "Next day delivery", url: "#", stock: { "UK 6": 9499, "UK 7": 9499, "UK 8": 9499, "UK 9": 9499, "UK 10": 9499, "UK 11": 9499 } }
            ]
        },
        {
            name: "Nike Air Force 1 White", mrp: 7495,
            img: "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/b7d9211a-9d7c-4f5e-9d77-e7e5e5e5e5e5/air-force-1-07-shoes-WjV7mP.png",
            sizes: ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"],
            stores: [
                { name: "Ajio", delivery: "2–3 day delivery", url: "#", stock: { "UK 6": 6295, "UK 7": 6295, "UK 8": 6295, "UK 9": 6295, "UK 10": 6295, "UK 11": 6295 } },
                { name: "Myntra", delivery: "Next day delivery", url: "#", stock: { "UK 6": 6999, "UK 7": 6999, "UK 8": 6999, "UK 9": 6999, "UK 10": 6999, "UK 11": 6999, "UK 12": 6999 } },
                { name: "Superkicks", delivery: "2 day delivery", url: "#", stock: { "UK 7": 7000, "UK 8": 7000, "UK 9": 7000, "UK 10": 7000 } },
                { name: "Flipkart", delivery: "3–5 day delivery", url: "#", stock: { "UK 8": 6799, "UK 9": 6799, "UK 10": 6799 } }
            ]
        }
    ];
}

function initializeApp() {
    // Initialize DOM references
    ipcImg = document.getElementById('ipcImg');
    ipcName = document.getElementById('ipcName');
    ipcMrp = document.getElementById('ipcMrp');
    sizeChips = document.getElementById('sizeChips');
    carouselWrap = document.getElementById('carouselWrap');
    noResults = document.getElementById('noResults');
    carousel = document.getElementById('carousel');
    carouselTitle = document.getElementById('carouselTitle');
    carouselDots = document.getElementById('carouselDots');
    prevBtn = document.getElementById('prevBtn');
    nextBtn = document.getElementById('nextBtn');
    sneakerTabs = document.getElementById('sneakerTabs');
    spCardImg = document.getElementById('spCardImg');
    spTitle = document.getElementById('spTitle');
    spSub = document.getElementById('spSub');
    spSizes = document.getElementById('spSizes');
    spRows = document.getElementById('spRows');
    spScore = document.getElementById('spScore');
    chaosContainer = document.getElementById('chaos');
    searchResults = document.getElementById('searchResults');
    statsGrid = document.getElementById('statsGrid');
    statsRowFoot = document.getElementById('statsRowFoot');
    waitEmail = document.getElementById('waitEmail');
    waitMsg = document.getElementById('waitMsg');
    joinWaitlistBtn = document.getElementById('joinWaitlistBtn');
    waitlistCountSpan = document.getElementById('waitlistCount');
    
    // Build UI components
    renderSneakerTabs();
    renderSizes();
    renderChaosWindows();
    renderSearchResults();
    renderStats();
    renderStatsFooter();
    renderTicker();
    updateSPCard();
    
    // Set initial image
    if (sneakersData[0]) {
        ipcImg.src = sneakersData[0].img;
        ipcName.textContent = sneakersData[0].name;
        ipcMrp.innerHTML = `MRP &nbsp;<span>₹${sneakersData[0].mrp.toLocaleString('en-IN')}</span> &nbsp;·&nbsp; Tap a size to compare prices`;
    }
    
    // Event listeners
    prevBtn.addEventListener('click', () => scrollCarousel(-1));
    nextBtn.addEventListener('click', () => scrollCarousel(1));
    joinWaitlistBtn.addEventListener('click', joinWaitlist);
    
    // Update waitlist count display
    waitlistCountSpan.textContent = waitlistCount;
}

function renderSneakerTabs() {
    sneakerTabs.innerHTML = sneakersData.map((sneaker, idx) => 
        `<button class="s-tab ${idx === activeSneaker ? 'active' : ''}" data-sneaker-index="${idx}">${sneaker.name}</button>`
    ).join('');
    
    document.querySelectorAll('.s-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.sneakerIndex);
            selectSneaker(idx);
        });
    });
}

function selectSneaker(idx) {
    activeSneaker = idx;
    activeSize = null;
    carouselIdx = 0;
    
    document.querySelectorAll('.s-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.s-tab[data-sneaker-index="${idx}"]`).classList.add('active');
    
    const s = sneakersData[idx];
    ipcImg.style.opacity = '0';
    setTimeout(() => {
        ipcImg.src = s.img;
        ipcImg.style.opacity = '1';
    }, 200);
    ipcName.textContent = s.name;
    ipcMrp.innerHTML = `MRP &nbsp;<span>₹${s.mrp.toLocaleString('en-IN')}</span> &nbsp;·&nbsp; Tap a size to compare prices`;
    renderSizes();
    carouselWrap.style.display = 'none';
    noResults.style.display = 'none';
    updateSPCard();
}

function renderSizes() {
    const s = sneakersData[activeSneaker];
    sizeChips.innerHTML = s.sizes.map(sz => {
        const avail = s.stores.some(st => st.stock[sz] !== undefined);
        return `<button class="sz ${!avail ? 'unavail' : ''} ${sz === activeSize ? 'sel' : ''}" data-size="${sz}" ${!avail ? 'disabled' : ''}>${sz}</button>`;
    }).join('');
    
    document.querySelectorAll('.sz:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => selectSize(btn.dataset.size));
    });
}

function selectSize(sz) {
    activeSize = sz;
    carouselIdx = 0;
    renderSizes();
    
    const s = sneakersData[activeSneaker];
    carouselItems = s.stores
        .filter(st => st.stock[sz] !== undefined)
        .map(st => ({ ...st, price: st.stock[sz] }))
        .sort((a, b) => a.price - b.price);
    
    if (carouselItems.length === 0) {
        carouselWrap.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    noResults.style.display = 'none';
    carouselWrap.style.display = 'block';
    renderCarousel();
    updateSPCard();
}

function renderCarousel() {
    const s = sneakersData[activeSneaker];
    carouselTitle.textContent = `${carouselItems.length} store${carouselItems.length > 1 ? 's' : ''} found in ${activeSize}`;
    
    carousel.innerHTML = carouselItems.map((st, i) => {
        const pct = Math.round((1 - st.price / s.mrp) * 100);
        const isBest = i === 0;
        const isLow = st.stock && Object.values(st.stock).length < 3;
        return `
        <div class="store-card ${isBest ? 'winner' : ''}" style="min-width:100%">
            <div class="sc-top">
                <div>
                    <div class="sc-store">${st.name}</div>
                    <div class="sc-delivery">${st.delivery}</div>
                </div>
                <div class="sc-badges">
                    ${isBest ? '<span class="sc-badge-best">BEST</span>' : ''}
                    ${pct > 0 ? `<span class="sc-badge-pct">−${pct}%</span>` : ''}
                </div>
            </div>
            <div class="sc-price-row">
                <div class="sc-price">₹${st.price.toLocaleString('en-IN')}</div>
                <div>
                    <div class="sc-mrp-strike">₹${s.mrp.toLocaleString('en-IN')} MRP</div>
                    ${pct > 0 ? `<div style="font-family:var(--font-m);font-size:9px;color:var(--green)">You save ₹${(s.mrp - st.price).toLocaleString('en-IN')}</div>` : ''}
                </div>
            </div>
            <div class="sc-stock ${isLow ? 'low' : 'in'}">${isLow ? 'Low Stock' : 'In Stock'} · ${activeSize}</div>
            <button class="sc-btn" data-url="${st.url}">VIEW DEAL →</button>
        </div>`;
    }).join('');
    
    carouselDots.innerHTML = carouselItems.map((_, i) =>
        `<div class="c-dot ${i === carouselIdx ? 'active' : ''}" data-dot-index="${i}"></div>`
    ).join('');
    
    document.querySelectorAll('.c-dot').forEach(dot => {
        dot.addEventListener('click', () => goToCard(parseInt(dot.dataset.dotIndex)));
    });
    
    document.querySelectorAll('.sc-btn').forEach(btn => {
        btn.addEventListener('click', () => window.open(btn.dataset.url, '_blank'));
    });
    
    prevBtn.disabled = carouselIdx === 0;
    nextBtn.disabled = carouselIdx === carouselItems.length - 1;
}

function scrollCarousel(dir) {
    carouselIdx = Math.max(0, Math.min(carouselItems.length - 1, carouselIdx + dir));
    goToCard(carouselIdx);
}

function goToCard(idx) {
    carouselIdx = idx;
    const cardW = carousel.offsetWidth;
    carousel.scrollLeft = cardW * idx;
    document.querySelectorAll('.c-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === carouselItems.length - 1;
}

function renderChaosWindows() {
    chaosContainer.innerHTML = `
        <div class="bwin w1" id="bw1">
            <div class="bw-bar">
                <span class="bw-d" style="background:#ff5f57"></span><span class="bw-d" style="background:#febc2e"></span><span class="bw-d" style="background:#28c840"></span>
                <span class="bw-url">myntra.com/nike/air-max-90</span>
            </div>
            <div class="bw-body">
                <div class="bw-prod">
                    <img class="bw-thumb" src="https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/af53d53d-561f-450a-a483-70a7ceee380f/air-max-90-shoes-kRsBnD.png" alt=""/>
                    <div>
                        <div class="bw-name">Nike Air Max 90</div>
                        <div class="bw-price" style="color:#e91e8c">₹7,999</div>
                        <span class="bw-stock-tag" style="background:rgba(233,30,140,.12);color:#e91e8c">Size 9 — 1 left!</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="bwin w2" id="bw2">
            <div class="bw-bar">
                <span class="bw-d" style="background:#ff5f57"></span><span class="bw-d" style="background:#febc2e"></span><span class="bw-d" style="background:#28c840"></span>
                <span class="bw-url">ajio.com/nike-air-max-90/p</span>
            </div>
            <div class="bw-body">
                <div class="bw-prod">
                    <img class="bw-thumb" src="https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/af53d53d-561f-450a-a483-70a7ceee380f/air-max-90-shoes-kRsBnD.png" alt=""/>
                    <div>
                        <div class="bw-name">Nike Air Max 90 WHT</div>
                        <div class="bw-price" style="color:#f76b00">₹8,499</div>
                        <span class="bw-stock-tag" style="background:rgba(247,107,0,.1);color:#f76b00">Sizes 7, 12 only</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="bwin w3" id="bw3">
            <div class="bw-bar">
                <span class="bw-d" style="background:#ff5f57"></span><span class="bw-d" style="background:#febc2e"></span><span class="bw-d" style="background:#28c840"></span>
                <span class="bw-url">superkicks.in/products/…</span>
            </div>
            <div class="bw-body">
                <div class="bw-prod">
                    <img class="bw-thumb" src="https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/af53d53d-561f-450a-a483-70a7ceee380f/air-max-90-shoes-kRsBnD.png" alt=""/>
                    <div>
                        <div class="bw-name">Nike Air Max 90</div>
                        <div class="bw-price" style="color:var(--white)">₹7,000</div>
                        <span class="bw-stock-tag" style="background:rgba(184,255,0,.08);color:var(--green)">All sizes available</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="bwin w4" id="bw4">
            <div class="bw-bar">
                <span class="bw-d" style="background:#ff5f57"></span><span class="bw-d" style="background:#febc2e"></span><span class="bw-d" style="background:#28c840"></span>
                <span class="bw-url">flipkart.com/nike-air…</span>
            </div>
            <div class="bw-body">
                <div class="bw-confused">This item is unavailable.<br/><span style="color:#2a2a2a">Did you mean: Air Max 270? ›<br/>Air Max 2090? ›<br/>Air Max SYSTM ›</span></div>
            </div>
        </div>
    `;
    
    document.querySelectorAll('.bwin').forEach(win => {
        win.addEventListener('click', () => bringToFront(win.id));
    });
}

function bringToFront(id) {
    maxZ++;
    document.querySelectorAll('.bwin').forEach(w => w.classList.remove('top'));
    const el = document.getElementById(id);
    el.style.zIndex = maxZ;
    el.classList.add('top');
}

function renderSearchResults() {
    const s = sneakersData[0];
    const stores = s.stores.slice(0, 4);
    searchResults.innerHTML = stores.map((st, i) => {
        const price = Object.values(st.stock)[0] || 0;
        const pct = Math.round((1 - price / s.mrp) * 100);
        const isBest = i === 0;
        return `
        <div class="s-row ${isBest ? 'win' : ''}">
            <img class="s-thumb" src="${s.img}" alt=""/>
            <div class="s-info">
                <div class="s-retailer">${st.name}</div>
                <div class="s-meta">IN STOCK · ${Object.keys(st.stock).join(', ')} · ${st.delivery}</div>
            </div>
            <div class="s-right">
                <span class="s-price ${isBest ? 'g' : ''}">₹${price.toLocaleString('en-IN')}</span>
                ${pct > 0 ? `<span class="s-tag">−${pct}% OFF</span>` : ''}
            </div>
        </div>`;
    }).join('');
}

function renderStats() {
    const stats = [
        { num: 59, label: "of buyers overpaid for a sneaker they later found cheaper at another store", src: "Sneak Peak Survey · 2024" },
        { num: 61, label: "manually check 3+ apps every time they want to buy a new pair", src: "Sneak Peak Survey · 2024" },
        { num: 76, label: "said they'd actively use a platform that finds the best price automatically", src: "Sneak Peak Survey · 2024" }
    ];
    statsGrid.innerHTML = stats.map(stat => `
        <div class="stat-block">
            <span class="stat-num">${stat.num}</span>
            <p class="stat-label">${stat.label}</p>
            <span class="stat-src">${stat.src}</span>
        </div>
    `).join('');
}

function renderStatsFooter() {
    const footStats = [
        { num: 59, label: "overpaid on their last pair" },
        { num: 61, label: "manually tab-switch for prices" },
        { num: 76, label: "want exactly this" }
    ];
    statsRowFoot.innerHTML = footStats.map(stat => `
        <div class="foot-stat">
            <span class="foot-num">${stat.num}</span>
            <span class="foot-lbl">${stat.label}</span>
        </div>
    `).join('');
}

function renderTicker() {
    const tickerItems = [
        "Nike AF1 White", "₹6,295", "Ajio — 14% off MRP",
        "Adidas Samba OG", "₹8,999", "VegNonVeg — 10% off",
        "NB 550 White", "₹7,499", "Myntra — 12% off",
        "Jordan 1 Mid", "₹9,299", "Superkicks — 7% off",
        "Dunk Low Panda", "₹7,995", "Ajio — 11% off",
        "Puma Suede Classic", "₹3,499", "Flipkart — 18% off"
    ];
    
    const ticker = document.getElementById('ticker');
    let tickerHTML = '';
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < tickerItems.length; j += 3) {
            tickerHTML += `
            <span class="t-item">
                <span class="t-dot"></span>
                ${tickerItems[j]}
                <span class="t-price">${tickerItems[j+1]}</span>
                ${tickerItems[j+2]}
            </span>`;
        }
    }
    ticker.innerHTML = tickerHTML;
}

function updateSPCard() {
    const s = sneakersData[activeSneaker];
    spCardImg.src = s.img;
    spTitle.textContent = s.name;
    
    // Get best price and store count
    let bestPrice = Infinity;
    let storeCount = 0;
    s.stores.forEach(store => {
        const prices = Object.values(store.stock);
        if (prices.length > 0) {
            storeCount += prices.length;
            bestPrice = Math.min(bestPrice, Math.min(...prices));
        }
    });
    
    const avgDiscount = Math.round((1 - bestPrice / s.mrp) * 100);
    spScore.textContent = `🔥 ${Math.min(99, 60 + avgDiscount)}`;
    spSub.textContent = `${activeSize || s.sizes[3]} &nbsp;·&nbsp; ${storeCount} STORES IN STOCK &nbsp;·&nbsp; FROM ₹${bestPrice.toLocaleString('en-IN')}`;
    
    // Render sizes
    spSizes.innerHTML = s.sizes.map(sz => 
        `<span class="sp-sz ${sz === activeSize ? 'on' : ''}">${sz.replace('UK ', '')}</span>`
    ).join('');
    
    // Render store rows (top 3)
    const allStores = [];
    s.stores.forEach(store => {
        Object.entries(store.stock).forEach(([size, price]) => {
            allStores.push({ name: store.name, price, size, delivery: store.delivery });
        });
    });
    const topStores = allStores.sort((a, b) => a.price - b.price).slice(0, 3);
    
    spRows.innerHTML = topStores.map((store, idx) => {
        const pct = Math.round((1 - store.price / s.mrp) * 100);
        const isBest = idx === 0;
        return `
        <div class="sp-row ${isBest ? 'b' : ''}">
            <div class="sp-r-l">
                <span class="sp-r-dot"></span>
                <span class="sp-rn">${store.name}</span>
                ${isBest ? '<span class="sp-rt">BEST</span>' : ''}
            </div>
            <span class="sp-rp">₹${store.price.toLocaleString('en-IN')} &nbsp;<small style="color:${isBest ? 'rgba(184,255,0,.5)' : 'var(--muted)'};font-size:9px">−${pct}%</small></span>
        </div>`;
    }).join('');
}

function joinWaitlist() {
    const email = waitEmail.value.trim();
    if (!email || !email.includes('@')) {
        waitMsg.textContent = '✕ Enter a valid email.';
        waitMsg.style.color = '#ff4444';
        return;
    }
    
    // Increment waitlist count
    waitlistCount++;
    waitlistCountSpan.textContent = waitlistCount;
    
    // Here you would send to your backend/webhook
    // fetch('https://your-n8n-webhook.com/waitlist', {
    //     method: 'POST',
    //     body: JSON.stringify({ email }),
    //     headers: { 'Content-Type': 'application/json' }
    // });
    
    waitMsg.textContent = '✓ You\'re in — we\'ll be in touch before launch.';
    waitMsg.style.color = 'var(--green)';
    waitEmail.value = '';
    
    // Reset message after 3 seconds
    setTimeout(() => {
        waitMsg.textContent = 'No credit card &nbsp;·&nbsp; Free forever for early users';
        waitMsg.style.color = 'var(--muted)';
    }, 3000);
}

// Canvas Grid Animation
const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');
let W, H, mx = -999, my = -999, tmx = -999, tmy = -999;
const GRID = 52, WR = 190, WS = 46, SEG = 8;

function resize() { 
    W = canvas.width = window.innerWidth; 
    H = canvas.height = window.innerHeight; 
}
resize();
window.addEventListener('resize', resize);
document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

function warp(x, y) {
    const dx = x - tmx, dy = y - tmy, d = Math.sqrt(dx * dx + dy * dy);
    if (d < WR && d > 0) {
        const f = WS * Math.pow(1 - d / WR, 2.4);
        return { x: x + dx / d * f, y: y + dy / d * f };
    }
    return { x, y };
}

function drawGrid() {
    ctx.clearRect(0, 0, W, H);
    if (tmx > 0) {
        const g = ctx.createRadialGradient(tmx, tmy, 0, tmx, tmy, WR * 1.5);
        g.addColorStop(0, 'rgba(184,255,0,0.06)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
    }
    ctx.lineWidth = 0.55;
    const cols = Math.ceil(W / GRID) + 1, rows = Math.ceil(H / GRID) + 1;
    
    // Horizontal lines
    for (let r = 0; r <= rows; r++) {
        const gy = r * GRID;
        ctx.beginPath();
        let started = false;
        for (let s = 0; s <= cols * SEG; s++) {
            const rawX = (s / SEG) * GRID, pt = warp(rawX, gy);
            const d2 = Math.sqrt((pt.x - tmx) ** 2 + (pt.y - tmy) ** 2);
            const b = tmx < 0 ? 0.1 : Math.max(0.05, Math.min(0.28, 0.05 + 0.23 * (1 - Math.min(d2, WR) / WR) ** 2.5));
            ctx.strokeStyle = `rgba(184,255,0,${b})`;
            if (started) ctx.lineTo(pt.x, pt.y);
            else { ctx.moveTo(pt.x, pt.y); started = true; }
        }
        ctx.stroke();
    }
    
    // Vertical lines
    for (let c = 0; c <= cols; c++) {
        const gx = c * GRID;
        ctx.beginPath();
        let started = false;
        for (let s = 0; s <= rows * SEG; s++) {
            const rawY = (s / SEG) * GRID, pt = warp(gx, rawY);
            const d2 = Math.sqrt((pt.x - tmx) ** 2 + (pt.y - tmy) ** 2);
            const b = tmx < 0 ? 0.1 : Math.max(0.05, Math.min(0.28, 0.05 + 0.23 * (1 - Math.min(d2, WR) / WR) ** 2.5));
            ctx.strokeStyle = `rgba(184,255,0,${b})`;
            if (started) ctx.lineTo(pt.x, pt.y);
            else { ctx.moveTo(pt.x, pt.y); started = true; }
        }
        ctx.stroke();
    }
}

function animateGrid() {
    tmx += (mx - tmx) * 0.1;
    tmy += (my - tmy) * 0.1;
    drawGrid();
    requestAnimationFrame(animateGrid);
}
animateGrid();

// Typewriter effect
const phrases = ['Nike Air Max 90', 'Adidas Samba OG', 'Jordan 1 Low', 'New Balance 550', 'Nike Dunk Low'];
let pi = 0, ci = 0, del = false;
const typer = document.getElementById('typer');

function type() {
    const p = phrases[pi];
    if (!del) {
        typer.textContent = p.slice(0, ++ci);
        if (ci === p.length) {
            del = true;
            setTimeout(type, 2200);
            return;
        }
    } else {
        typer.textContent = p.slice(0, --ci);
        if (ci === 0) {
            del = false;
            pi = (pi + 1) % phrases.length;
        }
    }
    setTimeout(type, del ? 55 : 95);
}
setTimeout(type, 1500);

// Scroll reveal
const obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }), { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// Initialize on load
document.addEventListener('DOMContentLoaded', loadSneakers);