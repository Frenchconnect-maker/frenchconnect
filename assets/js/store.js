// =====================
// =====================
// SUPABASE CONFIG (front)
// - Utilisé par checkout.js
// - Publishable key uniquement (PAS de secret key ici)
// =====================
window.SUPABASE_URL = window.SUPABASE_URL || "https://mnsqfagfdahvhlfopfah.supabase.co";
window.SUPABASE_KEY = window.SUPABASE_KEY || "sb_publishable_ZR6JsAS82JL3r8stv_Zdhw_X9UGtmqM";

// REMISES + GRAMMAGES
// =====================
const DISCOUNT = {
  1:   1.00, // 0%
  3:   0.95, // -5%
  5:   0.92, // -8%
  10:  0.88, // -12%
  25:  0.82, // -18%
  50:  0.78, // -22%
  100: 0.72  // -28%
};

function round2(n){ return Math.round(n * 100) / 100; }

function buildGramOptions(price1g){
  const grams = [1,3,5,10,25,50,100];
  return grams.map(g => ({
    id: `${g}g`,
    label: `${g} g`,
    price: round2(price1g * g * (DISCOUNT[g] ?? 1.0)),
    payment_link: ""
  }));
}

// =====================
// CATALOGUE + DESCRIPTIFS
// Grammage sur fleurs/resines/extraits
// Pre Rolls = produit simple sans options
// Stickers : { text, tone?, side? }
// tone: "pink" | "cyan" | "black" | (vide = vert par défaut)
// side: "right" (optionnel)
// =====================
const STORE = [
  // ===== EXTRAITS =====
  {
    id: "cakeberry-rosin",
    name: "Cakeberry Rosin",
    price: 40.00,
    image: "assets/images/cakeberry-rosin.jpg",
    category: "extraits",
    badge: "Rosin",
    desc: "Rosin CBD premium extrait sans solvants par pression à chaud. Cakeberry Rosin offre une texture fondante et un profil aromatique riche, mêlant notes sucrées et pâtissières. Produit artisanal de haute qualité. THC < 0,3 %.",
    sticker: { text: "LIMITED", tone: "pink", side: "right" },
    options: buildGramOptions(40.00),
    payment_link: ""
  },
  {
    id: "cereal-cakes-live-rosin",
    name: "Cereal Cakes Live Rosin",
    price: 40.00,
    image: "assets/images/cereal-cakes-live-rosin.webp",
    category: "extraits",
    badge: "Live Rosin",
    desc: "Live Rosin CBD issu de fleurs fraîches pressées à chaud. Cereal Cakes développe des arômes complexes, céréaliers et légèrement vanillés, avec une forte concentration en terpènes naturels. THC < 0,3 %.",
    sticker: { text: "-28%", tone: "black", side: "right" },
    options: buildGramOptions(40.00),
    payment_link: ""
  },
  {
    id: "sherbet-cookie-live-rosin",
    name: "Sherbet Cookie Live Rosin",
    price: 40.00,
    image: "assets/images/sherbet-cookie-live-rosin.png",
    category: "extraits",
    badge: "Live Rosin",
    desc: "Live Rosin CBD au profil gourmand et intense. Sherbet Cookie associe des notes sucrées, crémeuses et légèrement fruitées. Extraction artisanale pour une pureté maximale. THC < 0,3 %.",
    options: buildGramOptions(40.00),
    payment_link: ""
  },

  // ===== RESINES =====
  {
    id: "sherbet-cookie-hash",
    name: "Sherbet Cookie Hash",
    price: 12.00,
    image: "assets/images/sherbet-cookie-hash.webp",
    category: "resines",
    badge: "Hash",
    desc: "Résine CBD à la texture souple et homogène. Sherbet Cookie dévoile un profil sucré et crémeux, avec des notes biscuitées et légèrement épicées. Extraction soignée pour un rendu aromatique riche. THC < 0,3 %.",
    options: buildGramOptions(12.00),
    payment_link: ""
  },
  {
    id: "banana-kush-hash",
    name: "Banana Kush Hash",
    price: 12.00,
    image: "assets/images/banana-kush-hash.jpg",
    category: "resines",
    badge: "Hash",
    desc: "Hash CBD aux notes exotiques et gourmandes. Banana Kush développe des arômes doux de banane mûre et de fruits tropicaux, avec une texture malléable et un pressage maîtrisé. THC < 0,3 %.",
    options: buildGramOptions(12.00),
    payment_link: ""
  },
  {
    id: "amnesia-hash",
    name: "Amnesia Hash",
    price: 11.00,
    image: "assets/images/amnesia-hash.jpg",
    category: "resines",
    badge: "Hash",
    desc: "Résine CBD inspirée du profil Amnesia : notes citronnées, herbacées et légèrement épicées, associées à une texture fine issue d’un tamisage précis. THC < 0,3 %.",
    options: buildGramOptions(11.00),
    payment_link: ""
  },
  {
    id: "blueberry-hash",
    name: "Blueberry Hash",
    price: 12.00,
    image: "assets/images/blueberry-hash.webp",
    category: "resines",
    badge: "Hash",
    desc: "Hash CBD aux arômes ronds et fruités. Blueberry se distingue par ses notes de myrtille, de fruits rouges et une légère touche sucrée. Texture homogène et finition propre. THC < 0,3 %.",
    options: buildGramOptions(12.00),
    payment_link: ""
  },

  // ===== FLEURS =====
  {
    id: "diamond-og",
    name: "Diamond OG",
    price: 12.90,
    image: "assets/images/diamond-og.jpg",
    category: "fleurs",
    badge: "Fleur",
    desc: "Fleur CBD indoor aux têtes compactes et résineuses. Diamond OG développe un profil aromatique puissant mêlant notes terreuses, boisées et légèrement citronnées. Qualité premium, manucure soignée. THC < 0,3 %.",
    options: buildGramOptions(12.90),
    payment_link: ""
  },
  {
    id: "runtz",
    name: "Runtz",
    price: 12.90,
    image: "assets/images/runtz.jpg",
    category: "fleurs",
    badge: "Fleur",
    desc: "Fleur CBD très appréciée pour son profil gourmand et fruité. Runtz offre des arômes sucrés rappelant les bonbons et les fruits tropicaux, avec de belles têtes denses. THC < 0,3 %.",
    sticker: { text: "BEST" }, // vert par défaut
    options: buildGramOptions(12.90),
    payment_link: ""
  },
  {
    id: "sour-apple",
    name: "Sour Apple",
    price: 12.90,
    image: "assets/images/sour-apple.webp",
    category: "fleurs",
    badge: "Fleur",
    desc: "Fleur CBD au caractère vif et rafraîchissant. Sour Apple se distingue par ses notes acidulées de pomme verte et d’agrumes, avec une structure résineuse et une finition propre. THC < 0,3 %.",
    options: buildGramOptions(12.90),
    payment_link: ""
  },
  {
    id: "strawberry-haze",
    name: "Strawberry Haze",
    price: 12.90,
    image: "assets/images/strawberry-haze.png",
    category: "fleurs",
    badge: "Fleur",
    desc: "Fleur CBD aux arômes doux et fruités dominés par la fraise et les fruits rouges. Strawberry Haze séduit par un profil équilibré, une belle couleur et une richesse aromatique. THC < 0,3 %.",
    sticker: { text: "NEW", tone: "cyan" },
    options: buildGramOptions(12.90),
    payment_link: ""
  },

  // ===== PRE ROLLS (SANS GRAMMAGE) =====
  {
    id: "strawberry-haze-pre-roll",
    name: "Strawberry Haze Pre Roll",
    price: 12.90,
    image: "assets/images/strawberry-haze-pre-roll.webp",
    category: "prerolls",
    badge: "Pre Roll",
    desc: "Pre roll CBD prêt à l’emploi, roulé avec des fleurs Strawberry Haze soigneusement sélectionnées. Saveurs fruitées et douces, combustion régulière et roulage premium. THC < 0,3 %.",
    payment_link: ""
  },
  {
    id: "banana-kush-cakeberry-rosin-pre-roll",
    name: "Banana Kush x Cakeberry Rosin Pre Roll",
    price: 12.90,
    image: "assets/images/banana-kush-cakeberry-rosin-pre-roll.jpeg",
    category: "prerolls",
    badge: "Pre Roll",
    desc: "Pre roll CBD enrichi en rosin Cakeberry pour une expérience aromatique intense. Alliance gourmande entre les notes fruitées de Banana Kush et la richesse du rosin. THC < 0,3 %.",
    payment_link: ""
  },
  {
    id: "runtz-cereal-cakes-pre-roll",
    name: "Runtz x Cereal Cakes Pre Roll",
    price: 12.90,
    image: "assets/images/prerolls3.webp",
    category: "prerolls",
    badge: "Pre Roll",
    desc: "Pre roll CBD premium associant fleurs Runtz et rosin Cereal Cakes. Profil sucré et gourmand, roulage soigné et combustion homogène. THC < 0,3 %.",
    payment_link: ""
  }
];

// =====================
// HELPERS
// =====================
const formatPrice = (n) => Number(n).toFixed(2).replace(".", ",") + " €";
const getOption = (p, optId) => (p.options || []).find(o => o.id === optId);
const defaultOptionId = (p) => (p.options && p.options[0]?.id) || null;
const priceFor = (p, optId) => (getOption(p, optId)?.price ?? p.price);

function findProduct(id){ return STORE.find(p => p.id === id); }

// =====================
// PANIER (localStorage)
// =====================
function getCart(){
  try { return JSON.parse(localStorage.getItem("cart") || "[]"); }
  catch(e){ return []; }
}
function setCart(cart){
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}
function updateCartCount(){
  const cart = getCart();
  const count = cart.reduce((s,l)=>s+(l.qty||0),0);
  const el = document.getElementById("cart-count");
  if(el) el.textContent = count;
}

function clearCart(){
  localStorage.removeItem("cart");
  updateCartCount();
  renderCart();
}
window.clearCart = clearCart;

// =====================
// FILTRE CATEGORIES (shop)
// =====================
const CATEGORY_MAP = {
  "fleurs": "fleurs",
  "fleur": "fleurs",

  "resines": "resines",
  "résines": "resines",
  "resine": "resines",
  "hash": "resines",

  "extraits": "extraits",
  "extracts": "extraits",
  "rosin": "extraits",

  "prerolls": "prerolls",
  "pre rolls": "prerolls",
  "pre-rolls": "prerolls",
  "pre roll": "prerolls",
  "pre-roll": "prerolls"
};

function normCat(c){
  if(!c) return "";
  const k = (""+c).toLowerCase().trim();
  return CATEGORY_MAP[k] || k;
}

function searchProducts(q, cat){
  q = (q||"").toLowerCase();
  const want = normCat(cat);

  return STORE.filter(p => {
    const okQ = !q || (p.name.toLowerCase().includes(q) || (p.desc||"").toLowerCase().includes(q));
    const okC = !want || normCat(p.category) === want;
    return okQ && okC;
  });
}

// =====================
// CARD SHOP (avec STICKERS)
// =====================
function card(p){
  const base = p.options?.length ? p.options[0].price : p.price;
  const priceText = p.options?.length ? `à partir de ${formatPrice(base)}` : formatPrice(base);

  const st = p.sticker;
  const stickerHTML = st
    ? `<div class="sticker ${st.tone || ""} ${st.side === "right" ? "right" : ""}">${st.text}</div>`
    : "";

  return `
  <article class="card">
    ${stickerHTML}
    <a href="product.html?id=${encodeURIComponent(p.id)}">
      <img class="thumb" src="${p.image}" alt="${p.name}" loading="lazy" decoding="async">
    </a>
    <div class="pad">
      <div class="pill">${p.category}</div>
      <h3><a href="product.html?id=${encodeURIComponent(p.id)}">${p.name}</a></h3>
      <div class="price-tag">${priceText}</div>
      <div class="btn-row">
        <a class="btn" href="product.html?id=${encodeURIComponent(p.id)}">Voir</a>
      </div>
    </div>
  </article>`;
}

// =====================
// PAGE BOUTIQUE
// =====================
function bootShopPage(){
  const grid  = document.getElementById("product-grid");
  if(!grid) return;

  const input = document.getElementById("search");
  const select= document.getElementById("category-filter");

  function rerender(){
    const q = input ? input.value : "";
    const cat = select ? select.value : "";
    const results = searchProducts(q, cat);
    grid.innerHTML = results.map(card).join("");
  }

  if(input) input.oninput = rerender;
  if(select) select.onchange = rerender;

  rerender();
}

// =====================
// PAGE PRODUIT (grammage)
// =====================
function bootProductPage(){
  const url = new URL(location.href);
  const id  = url.searchParams.get("id");
  const p = findProduct(id) || STORE[0];

  const img = document.getElementById("p-image");
  const name= document.getElementById("p-name");
  const desc= document.getElementById("p-desc");
  const cat = document.getElementById("p-cat");
  const badge=document.getElementById("p-badge");
  const priceEl = document.getElementById("p-price");

  if(img) img.src = p.image;
  if(name) name.textContent = p.name;
  if(desc) desc.textContent = p.desc || "";
  if(cat) cat.textContent = p.category;
  if(badge) badge.textContent = p.badge || "";

  const gramBox = document.getElementById("grammage-box");
  const optSelect = document.getElementById("option");

  let currentOpt = defaultOptionId(p); // null pour prerolls

  if(p.options && p.options.length && optSelect){
    if(gramBox) gramBox.style.display = "";
    optSelect.innerHTML = p.options
      .map(o => `<option value="${o.id}">${o.label} — ${formatPrice(o.price)}</option>`)
      .join("");
    optSelect.value = currentOpt;

    optSelect.onchange = () => {
      currentOpt = optSelect.value;
      if(priceEl) priceEl.textContent = formatPrice(priceFor(p, currentOpt));
    };
  } else {
    if(gramBox) gramBox.style.display = "none";
  }

  if(priceEl) priceEl.textContent = formatPrice(priceFor(p, currentOpt));

  const addBtn = document.getElementById("add-to-cart");
  if(addBtn){
    addBtn.onclick = () => {
      const qty = parseInt((document.getElementById("qty")?.value || "1"), 10);
      addToCart(p.id, qty, currentOpt);
    };
  }
}

// =====================
// PANIER UI
// =====================
function addToCart(id, qty, optId){
  const p = findProduct(id); if(!p) return;

  const optionId = optId || defaultOptionId(p); // null pour prerolls
  const key = optionId ? `${id}__${optionId}` : id;

  const cart = getCart();
  const line = cart.find(l => l.key === key);

  if(line) line.qty += qty;
  else cart.push({ key, id, optionId, qty });

  setCart(cart);
  alert("Ajouté au panier ✔");
}

function removeFromCart(key){
  const cart = getCart().filter(l => l.key !== key);
  setCart(cart);
  renderCart();
}

function setQty(key, qty){
  const cart = getCart();
  const line = cart.find(l => l.key === key);
  if(!line) return;
  line.qty = Math.max(1, qty|0);
  setCart(cart);
  renderCart();
}

window.removeFromCart = removeFromCart;
window.setQty = setQty;

function renderCart(){
  const box = document.getElementById("cart-items");
  if(!box) return;

  const cart = getCart();
  if(cart.length === 0){
    box.innerHTML = "<p>Votre panier est vide.</p>";
    const t = document.getElementById("cart-total");
    if(t) t.textContent = formatPrice(0);
    return;
  }

  let total = 0;

  box.innerHTML = cart.map(l => {
    const p = findProduct(l.id);
    const price = priceFor(p, l.optionId);
    total += price * l.qty;

    const optLabel = l.optionId ? (getOption(p, l.optionId)?.label || "") : "";

    return `
      <div class="cart-line">
        <img src="${p.image}" alt="${p.name}">
        <div>
          <strong>${p.name}</strong>
          <div class="muted">${p.category} • ${p.badge}${optLabel ? " • " + optLabel : ""}</div>
        </div>
        <div>${formatPrice(price)}</div>
        <div><input type="number" min="1" value="${l.qty}" onchange="setQty('${l.key}', this.value)"></div>
        <div><button class="btn ghost" onclick="removeFromCart('${l.key}')">Retirer</button></div>
      </div>`;
  }).join("");

  const t = document.getElementById("cart-total");
  if(t) t.textContent = formatPrice(total);
}

// =====================
// CHECKOUT (redirige vers checkout.html)
// =====================
function startCheckout(){
  const cart = getCart();
  if(!cart || cart.length === 0){
    alert("Ton panier est vide.");
    return;
  }
  // ✅ nouveau flow : checkout (compte + commandes Supabase)
  // GitHub Pages: on reste en relatif pour éviter les soucis de chemin
  window.location.href = "checkout.html";
}
window.startCheckout = startCheckout;

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  bootShopPage();
  renderCart();
  if(document.getElementById("product-page")) bootProductPage();
});


// =====================
// EXPORTS (utilisables depuis checkout.js)
// =====================
window.STORE = STORE;
window.DISCOUNT = DISCOUNT;
window.round2 = round2;
window.buildGramOptions = buildGramOptions;
window.formatPrice = formatPrice;
window.getOption = getOption;
window.defaultOptionId = defaultOptionId;
window.priceFor = priceFor;
window.findProduct = findProduct;
window.getCart = getCart;
window.setCart = setCart;
window.updateCartCount = updateCartCount;
window.renderCart = renderCart;
window.startCheckout = startCheckout;
