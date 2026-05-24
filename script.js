// ─── SUPABASE CONFIG ───────────────────────────────────
const SUPABASE_URL = 'https://nqoxlvswayznrzyrhebn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xb3hsdnN3YXl6bnJ6eXJoZWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTA3MzYsImV4cCI6MjA5NTEyNjczNn0.x36GwgV1TTVcXLvwamhodvNi3oYrVjmMnq4Q3ocsFK8';

// ─── SUPABASE CLIENT (for Realtime) ────────────────────
const supabaseClient = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// Global state
let sneakersData = [];
let activeSneaker = 0;
let activeSize = null;
let carouselIdx = 0;
let carouselItems = [];
let maxZ = 10;
let waitlistCount = 0;
let submittedEmails = new Set();

// DOM refs
let ipcImg, ipcName, ipcMrp, sizeChips, carouselWrap, noResults;
let carousel, carouselTitle, carouselDots, prevBtn, nextBtn;
let sneakerTabs, spCardImg, spTitle, spSub, spSizes, spRows, spScore;
let chaosContainer, searchResults, statsGrid;
let waitEmail, waitMsg, joinWaitlistBtn, waitlistCountSpan;

// ─── WAITLIST COUNT ─────────────────────────────────────
async function updateWaitlistCount() {
    try {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/waitlist?select=id`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Prefer': 'count=exact',
                    'Range': '0-0'
                }
            }
        );
        const range = res.headers.get('content-range');
        if (range) {
            const total = parseInt(range.split('/')[1]);
            if (!isNaN(total)) {
                waitlistCount = total;
                document.querySelectorAll('#waitlistCount').forEach(el => el.textContent = total);
            }
        } else {
            const data = await res.json();
            waitlistCount = data.length;
            document.querySelectorAll('#waitlistCount').forEach(el => el.textContent = waitlistCount);
        }
    } catch (err) {
        console.error('Waitlist count error:', err);
    }
}

// ─── LOAD SNEAKERS (Supabase-first, JSON fallback) ──────
async function loadSneakers() {
    let loaded = false;

    // Try loading prices from Supabase sneaker_listings table
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('sneaker_listings')
                .select('*');

            if (!error && data && data.length > 0) {
                sneakersData = buildSneakersFromDB(data);
                loaded = true;
                subscribeToRealtimePrices();
            }
        } catch (e) {
            // fall through to JSON
        }
    }

    // Fallback: load from JSON
    if (!loaded) {
        try {
            const response = await fetch('data/sneakers.json');
            sneakersData = await response.json();
        } catch (error) {
            sneakersData = getFallbackData();
        }
    }

    initializeApp();
    updateWaitlistCount();
}

// Reshape flat DB rows into the nested sneakersData structure
function buildSneakersFromDB(rows) {
    const map = {};
    rows.forEach(row => {
        if (!map[row.sneaker_name]) {
            map[row.sneaker_name] = {
                name: row.sneaker_name,
                mrp: row.mrp,
                img: row.img,
                sizes: [],
                stores: {}
            };
        }
        const sn = map[row.sneaker_name];
        if (!sn.sizes.includes(row.size)) sn.sizes.push(row.size);
        if (!sn.stores[row.store_name]) {
            sn.stores[row.store_name] = {
                name: row.store_name,
                delivery: row.delivery,
                url: row.url,
                stock: {}
            };
        }
        if (row.in_stock) sn.stores[row.store_name].stock[row.size] = row.price;
    });
    return Object.values(map).map(sn => ({
        ...sn,
        sizes: sn.sizes.sort(),
        stores: Object.values(sn.stores)
    }));
}

// Live price updates via Supabase Realtime
function subscribeToRealtimePrices() {
    if (!supabaseClient) return;
    supabaseClient.channel('price-updates')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'sneaker_listings'
        }, async () => {
            // Re-fetch and rebuild on any change
            const { data } = await supabaseClient.from('sneaker_listings').select('*');
            if (data && data.length > 0) {
                sneakersData = buildSneakersFromDB(data);
                renderSneakerTabs();
                renderSizes();
                updateSPCard();
                renderSearchResults(activeSneaker);
                // Show subtle "prices updated" flash on the live badge
                const badge = document.querySelector('.live-badge');
                if (badge) {
                    badge.textContent = 'Updated';
                    setTimeout(() => { badge.textContent = 'Live Prices'; }, 2000);
                }
            }
        })
        .subscribe();
}

function getFallbackData() {
    return [
        {
            name: "Nike Air Max 90", mrp: 8495,
            img: "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/af53d53d-561f-450a-a483-70a7ceee380f/air-max-90-shoes-kRsBnD.png",
            sizes: ["UK 6","UK 7","UK 8","UK 9","UK 10","UK 11","UK 12"],
            stores: [
                { name:"Superkicks", delivery:"2 day delivery", url:"https://www.superkicks.in/search?type=product&q=air+max+90", stock:{"UK 7":7000,"UK 8":7000,"UK 9":7000,"UK 10":7200,"UK 11":7200} },
                { name:"VegNonVeg", delivery:"3 day delivery", url:"https://www.vegnveg.com/search?q=nike+air+max+90", stock:{"UK 7":7200,"UK 8":7200,"UK 9":7200,"UK 10":7400} },
                { name:"Myntra", delivery:"Next day delivery", url:"https://www.myntra.com/nike%20air%20max%2090", stock:{"UK 6":7999,"UK 7":7999,"UK 8":7999,"UK 9":7999,"UK 10":7999,"UK 11":8199,"UK 12":8199} },
                { name:"Ajio", delivery:"4-5 day delivery", url:"https://www.ajio.com/search/?text=nike+air+max+90", stock:{"UK 7":8499,"UK 12":8499} },
                { name:"Flipkart", delivery:"5-7 day delivery", url:"https://www.flipkart.com/search?q=nike+air+max+90", stock:{"UK 8":8299,"UK 9":8299,"UK 10":8299} }
            ]
        }
    ];
}

function initializeApp() {
    ipcImg           = document.getElementById('ipcImg');
    ipcName          = document.getElementById('ipcName');
    ipcMrp           = document.getElementById('ipcMrp');
    sizeChips        = document.getElementById('sizeChips');
    carouselWrap     = document.getElementById('carouselWrap');
    noResults        = document.getElementById('noResults');
    carousel         = document.getElementById('carousel');
    carouselTitle    = document.getElementById('carouselTitle');
    carouselDots     = document.getElementById('carouselDots');
    prevBtn          = document.getElementById('prevBtn');
    nextBtn          = document.getElementById('nextBtn');
    sneakerTabs      = document.getElementById('sneakerTabs');
    spCardImg        = document.getElementById('spCardImg');
    spTitle          = document.getElementById('spTitle');
    spSub            = document.getElementById('spSub');
    spSizes          = document.getElementById('spSizes');
    spRows           = document.getElementById('spRows');
    spScore          = document.getElementById('spScore');
    chaosContainer   = document.getElementById('chaos');
    searchResults    = document.getElementById('searchResults');
    statsGrid        = document.getElementById('statsGrid');
    waitEmail        = document.getElementById('waitEmail');
    waitMsg          = document.getElementById('waitMsg');
    joinWaitlistBtn  = document.getElementById('joinWaitlistBtn');
    waitlistCountSpan = document.getElementById('waitlistCount');

    renderSneakerTabs();
    renderSizes();
    renderChaosWindows();
    renderSearchResults(0);
    renderStats();
    renderTicker();
    updateSPCard();

    if (sneakersData[0]) {
        ipcImg.src = sneakersData[0].img;
        addImgFallback(ipcImg, sneakersData[0]);
        ipcName.textContent = sneakersData[0].name;
        ipcMrp.innerHTML = `MRP &nbsp;<span>&#8377;${sneakersData[0].mrp.toLocaleString('en-IN')}</span> &nbsp;&middot;&nbsp; Tap a size to compare prices`;
    }

    prevBtn.addEventListener('click', () => scrollCarousel(-1));
    nextBtn.addEventListener('click', () => scrollCarousel(1));
    joinWaitlistBtn.addEventListener('click', () => joinWaitlist('waitlist'));
}

// ─── IMAGE FALLBACK ─────────────────────────────────────
function addImgFallback(imgEl, sneaker) {
    imgEl.onerror = () => {
        if (sneaker.imgFallback && imgEl.src !== sneaker.imgFallback) {
            imgEl.src = sneaker.imgFallback;
        } else {
            // Generic sneaker silhouette placeholder
            imgEl.style.opacity = '0.15';
            imgEl.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMTIwIj48cGF0aCBkPSJNMTkwIDcwYy0yMC0xMC00MC0xNS02MC0xNWwtMjAtMzBIMzBMMTAgNzBjLTE1IDAtMjAgMTAtNSAxNWg5MGMxMCAwIDE1LTUgMjAtMTBsNTAgMTBoMjVjMTAgMCAxNS0xMCAwLTE1eiIgZmlsbD0iI2I4ZmYwMCIgb3BhY2l0eT0iLjMiLz48L3N2Zz4=';
        }
    };
}

function renderSneakerTabs() {
    sneakerTabs.innerHTML = sneakersData.map((sneaker, idx) =>
        `<button class="s-tab ${idx === activeSneaker ? 'active' : ''}" data-sneaker-index="${idx}">${sneaker.name}</button>`
    ).join('');
    document.querySelectorAll('.s-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            selectSneaker(parseInt(e.target.dataset.sneakerIndex));
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
        addImgFallback(ipcImg, s);
        ipcImg.style.opacity = '1';
    }, 200);
    ipcName.textContent = s.name;
    ipcMrp.innerHTML = `MRP &nbsp;<span>&#8377;${s.mrp.toLocaleString('en-IN')}</span> &nbsp;&middot;&nbsp; Tap a size to compare prices`;
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
                    ${pct > 0 ? `<span class="sc-badge-pct">&#8722;${pct}%</span>` : ''}
                </div>
            </div>
            <div class="sc-price-row">
                <div class="sc-price">&#8377;${st.price.toLocaleString('en-IN')}</div>
                <div>
                    <div class="sc-mrp-strike">&#8377;${s.mrp.toLocaleString('en-IN')} MRP</div>
                    ${pct > 0 ? `<div style="font-family:var(--font-m);font-size:9px;color:var(--green)">You save &#8377;${(s.mrp - st.price).toLocaleString('en-IN')}</div>` : ''}
                </div>
            </div>
            <div class="sc-stock ${isLow ? 'low' : 'in'}">${isLow ? 'Low Stock' : 'In Stock'} &middot; ${activeSize}</div>
            <button class="sc-btn" data-url="${st.url}">VIEW DEAL &#8594;</button>
        </div>`;
    }).join('');

    carouselDots.innerHTML = carouselItems.map((_, i) =>
        `<div class="c-dot ${i === carouselIdx ? 'active' : ''}" data-dot-index="${i}"></div>`
    ).join('');

    document.querySelectorAll('.c-dot').forEach(dot => {
        dot.addEventListener('click', () => goToCard(parseInt(dot.dataset.dotIndex)));
    });

    document.querySelectorAll('.sc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const url = btn.dataset.url;
            if (url && url !== '#') window.open(url, '_blank', 'noopener');
        });
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
                    <img class="bw-thumb" src="https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/af53d53d-561f-450a-a483-70a7ceee380f/air-max-90-shoes-kRsBnD.png" alt="" onerror="this.style.opacity='.1'"/>
                    <div>
                        <div class="bw-name">Nike Air Max 90</div>
                        <div class="bw-price" style="color:#e91e8c">&#8377;7,999</div>
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
                    <img class="bw-thumb" src="https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/af53d53d-561f-450a-a483-70a7ceee380f/air-max-90-shoes-kRsBnD.png" alt="" onerror="this.style.opacity='.1'"/>
                    <div>
                        <div class="bw-name">Nike Air Max 90 WHT</div>
                        <div class="bw-price" style="color:#f76b00">&#8377;8,499</div>
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
                    <img class="bw-thumb" src="https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/af53d53d-561f-450a-a483-70a7ceee380f/air-max-90-shoes-kRsBnD.png" alt="" onerror="this.style.opacity='.1'"/>
                    <div>
                        <div class="bw-name">Nike Air Max 90</div>
                        <div class="bw-price" style="color:var(--white)">&#8377;7,000</div>
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
                <div class="bw-confused">This item is unavailable.<br/><span style="color:#2a2a2a">Did you mean: Air Max 270? &#8250;<br/>Air Max 2090? &#8250;<br/>Air Max SYSTM &#8250;</span></div>
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

// ─── SEARCH RESULTS — synced to typewriter ──────────────
function renderSearchResults(sneakerIdx) {
    const idx = (sneakerIdx !== undefined) ? sneakerIdx : 0;
    const s = sneakersData[Math.min(idx, sneakersData.length - 1)];
    if (!s || !searchResults) return;
    const stores = s.stores.slice(0, 4);
    searchResults.innerHTML = stores.map((st, i) => {
        const price = Object.values(st.stock)[0] || 0;
        const pct = Math.round((1 - price / s.mrp) * 100);
        const isBest = i === 0;
        return `
        <div class="s-row ${isBest ? 'win' : ''}">
            <img class="s-thumb" src="${s.img}" alt="" onerror="this.style.opacity='.1'"/>
            <div class="s-info">
                <div class="s-retailer">${st.name}</div>
                <div class="s-meta">IN STOCK &middot; ${Object.keys(st.stock).join(', ')} &middot; ${st.delivery}</div>
            </div>
            <div class="s-right">
                <span class="s-price ${isBest ? 'g' : ''}">&#8377;${price.toLocaleString('en-IN')}</span>
                ${pct > 0 ? `<span class="s-tag">&#8722;${pct}% OFF</span>` : ''}
                <a class="s-link" href="${st.url}" target="_blank" rel="noopener" title="View on ${st.name}">&#8599;</a>
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

function renderTicker() {
    const tickerItems = [
        "Nike AF1 White", "&#8377;6,295", "Ajio — 14% off MRP",
        "Adidas Samba OG", "&#8377;8,999", "VegNonVeg — 10% off",
        "NB 550 White", "&#8377;7,499", "Myntra — 12% off",
        "Jordan 1 Mid", "&#8377;9,299", "Superkicks — 7% off",
        "Dunk Low Panda", "&#8377;7,995", "Ajio — 11% off",
        "Puma Suede Classic", "&#8377;3,499", "Flipkart — 18% off"
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
    addImgFallback(spCardImg, s);
    spTitle.textContent = s.name;

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
    spScore.textContent = `${Math.min(99, 60 + avgDiscount)}`;

    // Use innerHTML so &nbsp; renders properly
    spSub.innerHTML = `${activeSize || s.sizes[3]} &nbsp;&middot;&nbsp; ${storeCount} STORES IN STOCK &nbsp;&middot;&nbsp; FROM &#8377;${bestPrice.toLocaleString('en-IN')}`;

    spSizes.innerHTML = s.sizes.map(sz =>
        `<span class="sp-sz ${sz === activeSize ? 'on' : ''}">${sz.replace('UK ', '')}</span>`
    ).join('');

    const allStores = [];
    s.stores.forEach(store => {
        Object.entries(store.stock).forEach(([size, price]) => {
            allStores.push({ name: store.name, price, size, delivery: store.delivery, url: store.url });
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
            <span class="sp-rp">&#8377;${store.price.toLocaleString('en-IN')} &nbsp;<small style="color:${isBest ? 'rgba(184,255,0,.5)' : 'var(--muted)'};font-size:9px">&#8722;${pct}%</small></span>
        </div>`;
    }).join('');
}

// ─── EMAIL VALIDATION ──────────────────────────────────
function isValidEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
}

// ─── CONFIRMATION EMAIL via Edge Function ───────────────
async function sendConfirmationEmail(email, position) {
    try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-confirmation`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, position })
        });
    } catch (e) {
        // Non-blocking — don't surface email errors to user
        console.warn('Confirmation email failed:', e);
    }
}

// ─── MAIN SIGNUP FUNCTION ──────────────────────────────
async function joinWaitlist(source) {
    source = source || 'waitlist';

    let inputEl, msgEl, btnEl;
    if (source === 'modal') {
        inputEl = document.getElementById('modalEmail');
        msgEl   = document.getElementById('modalMsg');
        btnEl   = document.getElementById('modalBtn');
    } else {
        inputEl = waitEmail;
        msgEl   = waitMsg;
        btnEl   = joinWaitlistBtn;
    }

    const email = inputEl.value.trim();

    if (!isValidEmail(email)) {
        msgEl.textContent = 'Please enter a valid email address.';
        msgEl.style.color = '#ff4444';
        inputEl.focus();
        return;
    }

    if (submittedEmails.has(email)) {
        msgEl.textContent = "You're already on the list.";
        msgEl.style.color = 'var(--green)';
        return;
    }

    if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'JOINING...'; }

    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                email: email.toLowerCase(),
                source: source,
                signed_up_at: new Date().toISOString()
            })
        });

        if (res.status === 201) {
            submittedEmails.add(email);
            await updateWaitlistCount();
            document.querySelectorAll('#waitlistCount').forEach(el => el.textContent = waitlistCount);

            // Clean success message — no emoji
            msgEl.textContent = `You're #${waitlistCount} on the list. We'll be in touch before launch.`;
            msgEl.style.color = 'var(--green)';
            inputEl.value = '';

            // Send confirmation email (non-blocking)
            sendConfirmationEmail(email, waitlistCount);

            if (source === 'modal') setTimeout(showModalSuccess, 600);

        } else if (res.status === 409) {
            msgEl.textContent = "You're already on the list — see you at launch.";
            msgEl.style.color = 'var(--green)';
        } else {
            throw new Error('Unexpected status: ' + res.status);
        }

    } catch (err) {
        console.error(err);
        msgEl.textContent = 'Something went wrong. Please try again.';
        msgEl.style.color = '#ff4444';
    } finally {
        if (btnEl) {
            btnEl.disabled = false;
            btnEl.textContent = source === 'modal' ? 'GET EARLY ACCESS →' : 'JOIN WAITLIST →';
        }
    }
}

// ─── MODAL ─────────────────────────────────────────────
function openModal() {
    document.getElementById('spModal').classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('modalEmail').focus(), 300);
}

function closeModal() {
    document.getElementById('spModal').classList.remove('open');
    document.body.style.overflow = '';
}

// Professional success screen — no emoji
function showModalSuccess() {
    const card = document.querySelector('#spModal .modal-card');
    card.innerHTML = `
        <button class="modal-close" onclick="closeModal()">&#10005;</button>
        <div style="text-align:center;padding:20px 0 12px">
            <div class="modal-logo">SNEAK<em>PEAK</em></div>
            <div style="width:40px;height:2px;background:var(--green);margin:20px auto 24px;border-radius:2px"></div>
            <h3 class="modal-title" style="margin-top:0">You're <em>In.</em></h3>
            <p class="modal-sub" style="margin-top:12px">
                You're <strong style="color:var(--green)">#${waitlistCount}</strong> on the list.<br/>
                Check your inbox — a confirmation is on its way.
            </p>
            <div style="margin:24px 0 8px;display:flex;flex-direction:column;gap:8px;align-items:center">
                <span style="font-family:var(--font-m);font-size:9px;color:var(--muted);letter-spacing:2px;text-transform:uppercase">What happens next</span>
                <span style="font-family:var(--font-m);font-size:10px;color:var(--white);letter-spacing:1px">✦ &nbsp;Confirmation email sent to your inbox</span>
                <span style="font-family:var(--font-m);font-size:10px;color:var(--white);letter-spacing:1px">✦ &nbsp;Early access invite before public launch</span>
                <span style="font-family:var(--font-m);font-size:10px;color:var(--white);letter-spacing:1px">✦ &nbsp;Founding member badge locked in</span>
            </div>
            <button class="modal-btn" style="margin-top:28px" onclick="closeModal()">CLOSE</button>
        </div>`;
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const a = document.activeElement;
    if (a && a.id === 'waitEmail') joinWaitlist('waitlist');
    if (a && a.id === 'modalEmail') joinWaitlist('modal');
});

window.addEventListener('scroll', () => {
    const bar = document.getElementById('mobileSticky');
    if (bar) bar.classList.toggle('visible', window.scrollY > 300);
});

// ─── CANVAS GRID ───────────────────────────────────────
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

// ─── TYPEWRITER — synced to search results ──────────────
const phrases = ['Nike Air Max 90', 'Adidas Samba OG', 'Jordan 1 Low', 'New Balance 550', 'Nike Dunk Low'];
// Maps phrase index to sneakersData index (by name match, fallback to 0)
function getSneakerIdxForPhrase(phraseIdx) {
    const phraseName = phrases[phraseIdx].toLowerCase();
    const found = sneakersData.findIndex(s => s.name.toLowerCase().includes(phraseName.split(' ')[1] || ''));
    return found >= 0 ? found : 0;
}

let pi = 0, ci = 0, del = false;
const typer = document.getElementById('typer');

function type() {
    const p = phrases[pi];
    if (!del) {
        typer.textContent = p.slice(0, ++ci);
        if (ci === p.length) {
            del = true;
            // Update search results to match this phrase
            renderSearchResults(getSneakerIdxForPhrase(pi));
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

// ─── SCROLL REVEAL ─────────────────────────────────────
const obs = new IntersectionObserver(
    es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }),
    { threshold: 0.1 }
);
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// ─── INIT ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadSneakers);