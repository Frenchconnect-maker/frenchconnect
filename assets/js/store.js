// =====================================================
// store.js — FrenchConnect
// - Catalogue + shop/product/cart
// - Grammages fleurs/résines/extraits
// - ✅ Cali Weed US : grammages SANS remise (prix = prix1g * grammes)
// - ✅ Bloc descriptif premium Cali (affiché sur product.html si tu as les IDs)
// - ✅ Filtres shop via URL : ?cat= & ?search= (tu as déjà mis le script dans shop.html)
// =====================================================

// =====================
// SUPABASE CONFIG (front)
// - Utilisé par checkout.js
// - Publishable key uniquement (PAS de secret key ici)
// =====================
window.SUPABASE_URL = window.SUPABASE_URL || "https://mnsqfagfdahvhlfopfah.supabase.co";
window.SUPABASE_KEY = window.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc3FmYWdmZGFodmhsZm9wZmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MDE3NjEsImV4cCI6MjA4MzE3Nzc2MX0.yvzgQ9MVXN6lH8pnfiBAB0kFHCAkCzQYIQwNrSXDVEQ";

// =====================
// REMISES + GRAMMAGES (pour le catalogue normal)
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

// ✅ Cali US : PAS de remises selon les grammes
function buildGramOptionsNoDiscount(price1g){
  const grams = [1,3,5,10,25,50,100];
  return grams.map(g => ({
    id: `${g}g`,
    label: `${g} g`,
    price: round2(price1g * g), // prix linéaire, aucune remise
    payment_link: ""
  }));
}

// =====================
// CATALOGUE + DESCRIPTIFS
// - Grammage sur fleurs/resines/extraits
// - Pre Rolls = produit simple sans options
// - Stickers : { text, tone?, side? }
//   tone: "pink" | "cyan" | "black" | (vide = vert par défaut)
//   side: "right" (optionnel)
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
    desc: "Rosin CBD premium extrait sans solvants par pression à chaud. Cakeberry Rosin offre une texture fondante et un profil aromatique riche, mêlant notes sucrées et pâtissières. THC < 0,3 %.",
    sticker: { text: "LIMITED", tone: "pink", side: "right" },
    options: buildGramOptions(29.00),
    payment_link: ""
  },
  {
    id: "cereal-cakes-live-rosin",
    name: "Cereal Cakes Live Rosin",
    price: 40.00,
    image: "assets/images/cereal-cakes-live-rosin.webp",
    category: "extraits",
    badge: "Live Rosin",
    desc: "Live Rosin CBD issu de fleurs fraîches pressées à chaud. Arômes céréaliers et légèrement vanillés, forte concentration en terpènes naturels. THC < 0,3 %.",
    sticker: { text: "-28%", tone: "black", side: "right" },
    options: buildGramOptions(30.00),
    payment_link: ""
  },
  {
    id: "sherbet-cookie-live-rosin",
    name: "Sherbet Cookie Live Rosin",
    price: 40.00,
    image: "assets/images/sherbet-cookie-live-rosin.png",
    category: "extraits",
    badge: "Live Rosin",
    desc: "Live Rosin CBD au profil gourmand et intense. Notes sucrées, crémeuses et légèrement fruitées. THC < 0,3 %.",
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
    desc: "Résine CBD souple et homogène. Notes sucrées, crémeuses, biscuitées et légèrement épicées. THC < 0,3 %.",
    options: buildGramOptions(6.00),
    payment_link: ""
  },
  {
    id: "banana-kush-hash",
    name: "Banana Kush Hash",
    price: 12.00,
    image: "assets/images/banana-kush-hash.jpg",
    category: "resines",
    badge: "Hash",
    desc: "Hash CBD aux notes exotiques et gourmandes. Arômes de banane mûre et fruits tropicaux. THC < 0,3 %.",
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
    desc: "Résine CBD inspirée du profil Amnesia : citronné, herbacé, légèrement épicé. THC < 0,3 %.",
    options: buildGramOptions(8.00),
    payment_link: ""
  },
  {
    id: "blueberry-hash",
    name: "Blueberry Hash",
    price: 12.00,
    image: "assets/images/blueberry-hash.webp",
    category: "resines",
    badge: "Hash",
    desc: "Hash CBD fruité : myrtille, fruits rouges et légère touche sucrée. Texture homogène. THC < 0,3 %.",
    options: buildGramOptions(9.00),
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
    desc: "Fleur CBD indoor : têtes compactes et résineuses. Notes terreuses, boisées, citronnées. THC < 0,3 %.",
    options: buildGramOptions(7.90),
    payment_link: ""
  },
  {
    id: "runtz",
    name: "Runtz",
    price: 12.90,
    image: "assets/images/runtz.jpg",
    category: "fleurs",
    badge: "Fleur",
    desc: "Fleur CBD gourmande et fruitée : notes sucrées type bonbon et fruits tropicaux. THC < 0,3 %.",
    sticker: { text: "BEST" },
    options: buildGramOptions(6.90),
    payment_link: ""
  },
  {
    id: "sour-apple",
    name: "Sour Apple",
    price: 12.90,
    image: "assets/images/sour-apple.webp",
    category: "fleurs",
    badge: "Fleur",
    desc: "Fleur CBD : notes acidulées de pomme verte et agrumes. Structure résineuse. THC < 0,3 %.",
    options: buildGramOptions(6.90),
    payment_link: ""
  },
  {
    id: "strawberry-haze",
    name: "Strawberry Haze",
    price: 12.90,
    image: "assets/images/strawberry-haze.png",
    category: "fleurs",
    badge: "Fleur",
    desc: "Fleur CBD fruitée : fraise et fruits rouges. Profil équilibré et aromatique. THC < 0,3 %.",
    sticker: { text: "NEW", tone: "cyan" },
    options: buildGramOptions(5.90),
    payment_link: ""
  },

  // ===== CALI WEED US (SANS REMISES) =====
  // ⚠️ Mets bien les fichiers ici :
  // - assets/images/cali/sunset-sherbet-cali.webp
  // - assets/images/cali/royal-runtz-cali.webp
  // - assets/images/cali/ghost-train-haze-cali.webp
  {
    id: "sunset-sherbet-cali",
    name: "Sunset Sherbet Cali Weed US 🇺🇸",
    price: 14.90,
    image: "assets/images/cali/sunset-sherbet-cali.webp",
    category: "fleurs",
    badge: "Cali Weed",
    desc: "Cali Weed US ultra premium : buds denses, manucure clean, profil fruité/gourmand. THC < 0,3%.",
    sticker: { text: "CALI", tone: "black", side: "right" },
    options: buildGramOptionsNoDiscount(14.90),
    payment_link: ""
  },
  {
    id: "royal-runtz-cali",
    name: "Royal Runtz Cali Weed US 🇺🇸",
    price: 15.90,
    image: "assets/images/cali/royal-caliweed-optimized.webp",
    category: "fleurs",
    badge: "Cali Weed",
    desc: "Hybride équilibrée : terpènes sucrés type bonbon, buds très compacts. Qualité US premium. THC < 0,3%.",
    sticker: { text: "BEST CALI", tone: "pink", side: "right" },
    options: buildGramOptionsNoDiscount(15.90),
    payment_link: ""
  },
  {
    id: "ghost-train-haze-cali",
    name: "Ghost Train Haze Cali Weed US 🇺🇸",
    price: 15.90,
    image: "assets/images/cali/ghost-caliweed-optimized.webp",
    category: "fleurs",
    badge: "Cali Weed",
    desc: "Dominante sativa : agrumes puissants, buds résineux et denses. Sélection US. THC < 0,3%.",
    sticker: { text: "CALI", tone: "cyan", side: "right" },
    options: buildGramOptionsNoDiscount(15.90),
    payment_link: ""
  },

  
  // ===== FLEURS FR (Sud-Ouest 🇫🇷) =====
  {
    id: "pineapple-kush-fr",
    name: "Pineapple Kush 🇫🇷",
    price: 4.80,
    image: "assets/images/fr/pineapple-kush.webp",
    category: "fleurs",
    badge: "Fleur FR",
    desc: "Fleur CBD cultivée dans le Sud-Ouest 🇫🇷. Profil tropical/ananas 🍍 avec une touche kush plus ronde. Buds propres, aromatique marquée. THC < 0,3 %.",
    sticker: { text: "FR", tone: "cyan", side: "right" },
    options: buildGramOptions(4.80),
    payment_link: ""
  },
  {
    id: "sour-pineapple-fr",
    name: "Sour Pineapple 🇫🇷",
    price: 4.50,
    image: "assets/images/fr/sour-pineapple.webp",
    category: "fleurs",
    badge: "Fleur FR",
    desc: "Fleur CBD cultivée dans le Sud-Ouest 🇫🇷. Notes fruitées 🍍 avec une pointe acidulée/agrumes 🍋. Sélection clean, THC < 0,3 %.",
    sticker: { text: "FR", tone: "cyan", side: "right" },
    options: buildGramOptions(4.50),
    payment_link: ""
  },
  {
    id: "oregon-guava-fr",
    name: "Oregon Guava 🇫🇷",
    price: 4.70,
    image: "assets/images/fr/oregon-guava.webp",
    category: "fleurs",
    badge: "Fleur FR",
    desc: "Fleur CBD cultivée dans le Sud-Ouest 🇫🇷. Profil fruit exotique/guava 🥭, aromatique expressif et clean. THC < 0,3 %.",
    sticker: { text: "LOCAL", tone: "black" },
    options: buildGramOptions(4.70),
    payment_link: ""
  },
  {
    id: "blue-orchid-fr",
    name: "Blue Orchid 🇫🇷",
    price: 4.70,
    image: "assets/images/fr/blue-orchid.webp",
    category: "fleurs",
    badge: "Fleur FR",
    desc: "Fleur CBD cultivée dans le Sud-Ouest 🇫🇷. Notes florales + fruitées 🌸🫐, rendu aromatique doux et propre. THC < 0,3 %.",
    sticker: { text: "FR", tone: "cyan" },
    options: buildGramOptions(4.70),
    payment_link: ""
  },
  {
    id: "kompolti-fr",
    name: "Kompolti 🇫🇷",
    price: 3.90,
    image: "assets/images/fr/kompolti.webp",
    category: "fleurs",
    badge: "Fleur FR",
    desc: "Fleur CBD cultivée dans le Sud-Ouest 🇫🇷. Variété connue pour un profil plus “terreux/herbacé” 🌿. Bon rapport qualité/prix. THC < 0,3 %.",
    sticker: { text: "BEST VALUE", tone: "pink", side: "right" },
    options: buildGramOptions(3.90),
    payment_link: ""
  },
  {
    id: "peach-buddha-fr",
    name: "Peach Buddha 🇫🇷",
    price: 3.90,
    image: "assets/images/fr/peach-buddha.webp",
    category: "fleurs",
    badge: "Fleur FR",
    desc: "Fleur CBD cultivée dans le Sud-Ouest 🇫🇷. Notes fruitées “pêche” 🍑, aromatique doux, sélection clean. THC < 0,3 %.",
    sticker: { text: "FR", tone: "cyan", side: "right" },
    options: buildGramOptions(3.90),
    payment_link: ""
  },
  {
    id: "orange-buddha-fr",
    name: "Orange Buddha 🇫🇷",
    price: 3.80,
    image: "assets/images/fr/orange-buddha.webp",
    category: "fleurs",
    badge: "Fleur FR",
    desc: "Fleur CBD cultivée dans le Sud-Ouest 🇫🇷. Notes agrumes/orange 🍊, profil frais et clean. THC < 0,3 %.",
    sticker: { text: "FR", tone: "cyan" },
    options: buildGramOptions(3.80),
    payment_link: ""
  },


  // ===== PRE ROLLS (SANS GRAMMAGE) =====
  {
    id: "RuntZ-haze-pre-roll",
    name: "Runtz Haze Pre Roll",
    price: 4.90,
    image: "assets/images/RuntZ-haze-pre-roll.jpg",
    category: "prerolls",
    badge: "Pre Roll",
    desc: "Pre roll CBD prêt à l’emploi : roulage premium, combustion régulière. THC < 0,3 %.",
    payment_link: ""
  },
  {
    id: "strawberry-haze-pre-roll",
    name: "Strawberry Haze Pre Roll",
    price: 4.90,
    image: "assets/images/strawberry-haze-pre-roll.webp",
    category: "prerolls",
    badge: "Pre Roll",
    desc: "Pre roll CBD prêt à l’emploi : saveurs fruitées et douces. THC < 0,3 %.",
    payment_link: ""
  },
  {
    id: "banana-kush-cakeberry-rosin-pre-roll",
    name: "Banana Kush x Cakeberry Rosin Pre Roll",
    price: 4.90,
    image: "assets/images/banana-kush-cakeberry-rosin-pre-roll.jpeg",
    category: "prerolls",
    badge: "Pre Roll",
    desc: "Pre roll CBD enrichi en rosin : expérience aromatique intense. THC < 0,3 %.",
    payment_link: ""
  },
  {
    id: "runtz-cereal-cakes-pre-roll",
    name: "Runtz x Cereal Cakes Pre Roll",
    price: 4.90,
    image: "assets/images/prerolls3.webp",
    category: "prerolls",
    badge: "Pre Roll",
    desc: "Pre roll CBD premium : profil sucré et gourmand, combustion homogène. THC < 0,3 %.",
    payment_link: ""
  }
];

// =====================
// DESCRIPTIFS PREMIUM CALI US (affichés sur product.html si tu ajoutes le bloc HTML)
// =====================
const CALI_DESCRIPTIFS = {
  "sunset-sherbet-cali": {
    title: "🍧 Sunset Sherbet — Cali Weed US",
    html: `
<strong>Ultra premium, vibe dessert</strong> 😮‍💨🍓<br>
Buds denses, manucure clean, terpènes gourmands.

<br><br><strong>🌿 Arômes</strong><br>
• Fruité / dessert 🍓🍧<br>
• Sucré / crémeux 🍬

<br><br><strong>✅ Points forts</strong><br>
• Densité “Cali” 💎<br>
• Odeur nette 👃🔥<br>
• Visuel premium ✂️

<br><br><strong>🕒 Idéal</strong><br>
• Soir / chill 🌙

<br><br><strong>⚖️ Légal</strong><br>
THC &lt; 0,3% • Conforme UE
`
  },

  "royal-runtz-cali": {
    title: "🍬 Royal Runtz — Cali Weed US (Best)",
    html: `
<strong>La Cali “bonbon”</strong> 🍭🔥<br>
Hybride équilibrée, terpènes sucrés, buds ultra compacts.

<br><br><strong>🌿 Arômes</strong><br>
• Candy / bonbons 🍬<br>
• Fruits mûrs 🍇<br>
• Rond & doux 🍯

<br><br><strong>✅ Points forts</strong><br>
• Aromatique intense 👃🔥<br>
• Buds très denses 💎<br>
• Finition premium ✂️

<br><br><strong>🕒 Idéal</strong><br>
• Jour / soir ⚖️

<br><br><strong>⚖️ Légal</strong><br>
THC &lt; 0,3% • Conforme UE
`
  },

  "ghost-train-haze-cali": {
    title: "🍋 Ghost Train Haze — Cali Weed US",
    html: `
<strong>Fresh & puissant</strong> ⚡🍋<br>
Dominante sativa, agrumes marqués, vibe très “clean”.

<br><br><strong>🌿 Arômes</strong><br>
• Citron / agrumes 🍋<br>
• Notes haze fraîches 🌿

<br><br><strong>✅ Points forts</strong><br>
• Odeur puissante 👃🔥<br>
• Résineux & dense 💎<br>
• Finition propre ✂️

<br><br><strong>🕒 Idéal</strong><br>
• Journée ☀️

<br><br><strong>⚖️ Légal</strong><br>
THC &lt; 0,3% • Conforme UE
`
  }
};

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
// ⚠️ IDs attendus dans product.html :
// - p-image, p-name, p-desc, p-cat, p-badge, p-price
// - grammage-box, option, qty, add-to-cart
// - (optionnel premium cali) : cali-desc, cali-title, cali-content
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

  // =====================
  // ✅ DESCRIPTIF PREMIUM CALI (sous grammage)
  // (s'affiche uniquement pour les 3 IDs cali)
  // =====================
  const caliBox = document.getElementById("cali-desc");
  const caliTitle = document.getElementById("cali-title");
  const caliContent = document.getElementById("cali-content");

  if(caliBox && caliTitle && caliContent && CALI_DESCRIPTIFS[p.id]){
    caliBox.style.display = "block";
    caliTitle.textContent = CALI_DESCRIPTIFS[p.id].title;
    caliContent.innerHTML = CALI_DESCRIPTIFS[p.id].html;
  } else if(caliBox){
    caliBox.style.display = "none";
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
    if(!p) return "";

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
window.buildGramOptionsNoDiscount = buildGramOptionsNoDiscount;
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

