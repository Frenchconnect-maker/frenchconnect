// ====== CATALOGUE PRODUITS (avec options de grammage) ======
const STORE = [
  {
    id: "cakeberry-rosin",
    name: "Cakeberry Rosin",
    price: 40.00,
    image: "assets/images/cakeberry-rosin.jpg",
    category: "extraits",
    badge: "Rosin",
    desc: "",
    options: [
      { id: "1g", label: "1 g", price: 40.00, payment_link: "" },
      { id: "3g", label: "3 g", price: 120.00, payment_link: "" },
      { id: "5g", label: "5 g", price: 200.00, payment_link: "" },
      { id: "10g", label: "10 g", price: 400.00, payment_link: "" },
      { id: "25g", label: "25 g", price: 1000.00, payment_link: "" },
      { id: "50g", label: "50 g", price: 2000.00, payment_link: "" },
      { id: "100g", label: "100 g", price: 4000.00, payment_link: "" }
    ],
    payment_link: ""
  },
  {
    id: "cereal-cakes-live-rosin",
    name: "Cereal Cakes Live Rosin",
    price: 40.00,
    image: "assets/images/cereal-cakes-live-rosin.webp",
    category: "extraits",
    badge: "Live Rosin",
    desc: "",
    options: [
      { id: "1g", label: "1 g", price: 40.00, payment_link: "" },
      { id: "3g", label: "3 g", price: 120.00, payment_link: "" },
      { id: "5g", label: "5 g", price: 200.00, payment_link: "" },
      { id: "10g", label: "10 g", price: 400.00, payment_link: "" },
      { id: "25g", label: "25 g", price: 1000.00, payment_link: "" },
      { id: "50g", label: "50 g", price: 2000.00, payment_link: "" },
      { id: "100g", label: "100 g", price: 4000.00, payment_link: "" }
    ],
    payment_link: ""
  },
  {
    id: "sherbet-cookie-live-rosin",
    name: "Sherbet Cookie Live Rosin",
    price: 40.00,
    image: "assets/images/sherbet-cookie-live-rosin.png",
    category: "extraits",
    badge: "Live Rosin",
    desc: "",
    options: [
      { id: "1g", label: "1 g", price: 40.00, payment_link: "" },
      { id: "3g", label: "3 g", price: 120.00, payment_link: "" },
      { id: "5g", label: "5 g", price: 200.00, payment_link: "" },
      { id: "10g", label: "10 g", price: 400.00, payment_link: "" },
      { id: "25g", label: "25 g", price: 1000.00, payment_link: "" },
      { id: "50g", label: "50 g", price: 2000.00, payment_link: "" },
      { id: "100g", label: "100 g", price: 4000.00, payment_link: "" }
    ],
    payment_link: ""
  },
  {
    id: "sherbet-cookie-hash",
    name: "Sherbet Cookie Hash",
    price: 12.00,
    image: "assets/images/sherbet-cookie-hash.webp",
    category: "resines",
    badge: "Hash",
    desc: "",
    options: [
      { id: "1g", label: "1 g", price: 12.00, payment_link: "" },
      { id: "3g", label: "3 g", price: 36.00, payment_link: "" },
      { id: "5g", label: "5 g", price: 60.00, payment_link: "" },
      { id: "10g", label: "10 g", price: 120.00, payment_link: "" },
      { id: "25g", label: "25 g", price: 300.00, payment_link: "" },
      { id: "50g", label: "50 g", price: 600.00, payment_link: "" },
      { id: "100g", label: "100 g", price: 1200.00, payment_link: "" }
    ],
    payment_link: ""
  },
  {
    id: "banana-kush-hash",
    name: "Banana Kush Hash",
    price: 12.00,
    image: "assets/images/banana-kush-hash.jpg",
    category: "resines",
    badge: "Hash",
    desc: "",
    options: [
      { id: "1g", label: "1 g", price: 12.00, payment_link: "" },
      { id: "3g", label: "3 g", price: 36.00, payment_link: "" },
      { id: "5g", label: "5 g", price: 60.00, payment_link: "" },
      { id: "10g", label: "10 g", price: 120.00, payment_link: "" },
      { id: "25g", label: "25 g", price: 300.00, payment_link: "" },
      { id: "50g", label: "50 g", price: 600.00, payment_link: "" },
      { id: "100g", label: "100 g", price: 1200.00, payment_link: "" }
    ],
    payment_link: ""
  },
  {
    id: "amnesia-hash",
    name: "Amnesia Hash",
    price: 11.00,
    image: "assets/images/amnesia-hash.jpg",
    category: "resines",
    badge: "Hash",
    desc: "",
    options: [
      { id: "1g", label: "1 g", price: 11.00, payment_link: "" },
      { id: "3g", label: "3 g", price: 33.00, payment_link: "" },
      { id: "5g", label: "5 g", price: 55.00, payment_link: "" },
      { id: "10g", label: "10 g", price: 110.00, payment_link: "" },
      { id: "25g", label: "25 g", price: 275.00, payment_link: "" },
      { id: "50g", label: "50 g", price: 550.00, payment_link: "" },
      { id: "100g", label: "100 g", price: 1100.00, payment_link: "" }
    ],
    payment_link: ""
  },
  {
    id: "blueberry-hash",
    name: "Blueberry Hash",
    price: 12.00,
    image: "assets/images/blueberry-hash.webp",
    category: "resines",
    badge: "Hash",
    desc: "",
    options: [
      { id: "1g", label: "1 g", price: 12.00, payment_link: "" },
      { id: "3g", label: "3 g", price: 36.00, payment_link: "" },
      { id: "5g", label: "5 g", price: 60.00, payment_link: "" },
      { id: "10g", label: "10 g", price: 120.00, payment_link: "" },
      { id: "25g", label: "25 g", price: 300.00, payment_link: "" },
      { id: "50g", label: "50 g", price: 600.00, payment_link: "" },
      { id: "100g", label: "100 g", price: 1200.00, payment_link: "" }
    ],
    payment_link: ""
  },
  {
    id: "diamond-og",
    name: "Diamond OG",
    price: 12.90,
    image: "assets/images/diamond-og.jpg",
    category: "fleurs",
    badge: "Fleur",
    desc: "",
    options: [
      { id: "1g", label: "1 g", price: 12.90, payment_link: "" },
      { id: "3g", label: "3 g", price: 38.70, payment_link: "" },
      { id: "5g", label: "5 g", price: 64.50, payment_link: "" },
      { id: "10g", label: "10 g", price: 129.00, payment_link: "" },
      { id: "25g", label: "25 g", price: 322.50, payment_link: "" },
      { id: "50g", label: "50 g", price: 645.00, payment_link: "" },
      { id: "100g", label: "100 g", price: 1290.00, payment_link: "" }
    ],
    payment_link: ""
  },
  {
    id: "runtz",
    name: "Runtz",
    price: 12.90,
    image: "assets/images/runtz.jpg",
    category: "fleurs",
    badge: "Fleur",
    desc: "",
    options: [
      { id: "1g", label: "1 g", price: 12.90, payment_link: "" },
      { id: "3g", label: "3 g", price: 38.70, payment_link: "" },
      { id: "5g", label: "5 g", price: 64.50, payment_link: "" },
      { id: "10g", label: "10 g", price: 129.00, payment_link: "" },
      { id: "25g", label: "25 g", price: 322.50, payment_link: "" },
      { id: "50g", label: "50 g", price: 645.00, payment_link: "" },
      { id: "100g", label: "100 g", price: 1290.00, payment_link: "" }
    ],
    payment_link: ""
  },
  {
    id: "sour-apple",
    name: "Sour Apple",
    price: 12.90,
    image: "assets/images/sour-apple.webp",
    category: "fleurs",
    badge: "Fleur",
    desc: "",
    options: [
      { id: "1g", label: "1 g", price: 12.90, payment_link: "" },
      { id: "3g", label: "3 g", price: 38.70, payment_link: "" },
      { id: "5g", label: "5 g", price: 64.50, payment_link: "" },
      { id: "10g", label: "10 g", price: 129.00, payment_link: "" },
      { id: "25g", label: "25 g", price: 322.50, payment_link: "" },
      { id: "50g", label: "50 g", price: 645.00, payment_link: "" },
      { id: "100g", label: "100 g", price: 1290.00, payment_link: "" }
    ],
    payment_link: ""
  },
  {
    id: "strawberry-haze",
    name: "Strawberry Haze",
    price: 12.90,
    image: "assets/images/strawberry-haze.png",
    category: "fleurs",
    badge: "Fleur",
    desc: "",
    options: [
      { id: "1g", label: "1 g", price: 12.90, payment_link: "" },
      { id: "3g", label: "3 g", price: 38.70, payment_link: "" },
      { id: "5g", label: "5 g", price: 64.50, payment_link: "" },
      { id: "10g", label: "10 g", price: 129.00, payment_link: "" },
      { id: "25g", label: "25 g", price: 322.50, payment_link: "" },
      { id: "50g", label: "50 g", price: 645.00, payment_link: "" },
      { id: "100g", label: "100 g", price: 1290.00, payment_link: "" }
    ],
    payment_link: ""
  },
  {
    id: "strawberry-haze-pre-roll",
    name: "Strawberry Haze Pre Roll",
    price: 12.90,
    image: "assets/images/strawberry-haze-pre-roll.webp",
    category: "prerolls",
    badge: "Pre Roll",
    desc: "",
    payment_link: ""
  },
  {
    id: "banana-kush-cakeberry-rosin-pre-roll",
    name: "Banana Kush x Cakeberry Rosin Pre Roll",
    price: 12.90,
    image: "assets/images/banana-kush-cakeberry-rosin-pre-roll.jpeg",
    category: "prerolls",
    badge: "Pre Roll",
    desc: "",
    payment_link: ""
  },
  {
    id: "runtz-cereal-cakes-pre-roll",
    name: "Runtz x Cereal Cakes Pre Roll",
    price: 12.90,
    image: "assets/images/prerolls3.webp",
    category: "prerolls",
    badge: "Pre Roll",
    desc: "",
    payment_link: ""
  }
];

// ====== HELPERS ======
const formatPrice = (n) => n.toFixed(2).replace(".", ",") + " €";
const getOption   = (p, optId) => (p.options || []).find(o => o.id === optId);
const defaultOptionId = (p) => (p.options && p.options[0]?.id) || null;
const priceFor = (p, optId) => (getOption(p, optId)?.price ?? p.price);

// Panier localStorage
function getCart(){ try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch(e){ return []; } }
function setCart(cart){ localStorage.setItem("cart", JSON.stringify(cart)); updateCartCount(); }
function updateCartCount(){
  const cart = getCart();
  const count = cart.reduce((s,l)=>s+l.qty,0);
  const el = document.getElementById("cart-count");
  if(el) el.textContent = count;
}
function findProduct(id){ return STORE.find(p => p.id === id); }

// ====== CATEGORIES (normalisation + alias) ======
const CATEGORY_MAP = {
  "fleurs": "fleurs",
  "fleur": "fleurs",
  "resines": "resines",
  "résines": "resines",
  "resine": "resines",
  "hash": "resines",      // ✅ alias hash
  "prerolls": "prerolls",
  "pre rolls": "prerolls",
  "pre-rolls": "prerolls",
  "pre roll": "prerolls",
  "pre-roll": "prerolls",
  "extraits": "extraits",
  "extracts": "extraits",
  "rosin": "extraits"     // rosin = sous-famille d'extraits
};
function normCat(c){
  if(!c) return "";
  const k = (""+c).toLowerCase().trim();
  return CATEGORY_MAP[k] || k;
}

// Recherche + filtre catégorie (inclut rosin)
function searchProducts(q, cat){
  q = (q||"").toLowerCase();
  const want = normCat(cat);

  return STORE.filter(p => {
    const okQ = !q || (p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    const pCat = normCat(p.category);
    let okC = !want || pCat === want;

    // si on demande rosin (?cat=rosin) -> extraits + badge rosin
    if(want === "extraits" && (cat||"").toLowerCase().includes("rosin")){
      okC = pCat === "extraits" && /rosin/i.test(p.badge || "");
    }
    return okQ && okC;
  });
}

// ====== HOME ======
function renderHome(){
  const box = document.getElementById("home-collection");
  if(!box) return;
  box.innerHTML = STORE.slice(0,3).map(card).join("");
}

// ====== CARTES PRODUITS (liens absolus + lazy) ======
function card(p){
  const base = p.options?.length ? p.options[0].price : p.price;
  return `
  <article class="card">
    <a href="/frenchconnect/product.html?id=${p.id}">
      <img class="thumb" src="${p.image}" alt="${p.name}" loading="lazy" decoding="async">
    </a>
    <div class="pad">
      <div class="pill">${p.category}</div>
      <h3><a href="/frenchconnect/product.html?id=${p.id}">${p.name}</a></h3>
      <div class="price-tag">à partir de ${formatPrice(base)}</div>
      <div class="btn-row">
        <a class="btn" href="/frenchconnect/product.html?id=${p.id}">Choisir le grammage</a>
      </div>
    </div>
  </article>`;
}

// ====== PANIER ======
function addToCart(id, qty, optId){
  const p = findProduct(id); if(!p) return;
  const optionId = optId || defaultOptionId(p);
  const key = optionId ? `${id}__${optionId}` : id;
  const cart = getCart();
  const line = cart.find(l => l.key === key);
  if(line) line.qty += qty; else cart.push({ key, id, optionId, qty });
  setCart(cart);
  alert("Ajouté au panier ✔");
}
function removeFromCart(key){
  const cart = getCart().filter(l => l.key !== key);
  setCart(cart); renderCart();
}
function setQty(key, qty){
  const cart = getCart();
  const line = cart.find(l => l.key === key);
  if(!line) return;
  line.qty = Math.max(1, qty|0);
  setCart(cart); renderCart();
}
function renderCart(){
  const box = document.getElementById("cart-items");
  if(!box) return;
  const cart = getCart();
  if(cart.length === 0){
    box.innerHTML = "<p>Votre panier est vide.</p>";
    const t = document.getElementById("cart-total"); if(t) t.textContent = formatPrice(0);
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
  const t = document.getElementById("cart-total"); if(t) t.textContent = formatPrice(total);
  const btn = document.getElementById("checkout-btn");
  if(btn){
    btn.onclick = function(e){
      e.preventDefault();
      startCheckout();
    };
  }
}

// ====== CHECKOUT ======
function startCheckout(){
  const cart = getCart();
  if(cart.length === 1){
    const { id, qty, optionId } = cart[0];
    const p = findProduct(id);
    const opt  = optionId ? getOption(p, optionId) : null;
    const link = (opt && opt.payment_link) || p.payment_link;
    if(link && link.startsWith("http")){
      const url = link + (qty>1 ? ("?quantity=" + qty) : "");
      window.location.href = url; return;
    }
  }
  alert("Pour un vrai checkout multi-produit, raccorde Stripe.");
}

// ====== PAGE PRODUIT ======
function bootProductPage(){
  const url = new URL(location.href);
  const id  = url.searchParams.get("id");
  const p = findProduct(id) || STORE[0];

  document.getElementById("p-image").src = p.image;
  document.getElementById("p-name").textContent = p.name;
  document.getElementById("p-desc").textContent = p.desc;
  document.getElementById("p-cat").textContent = p.category;
  document.getElementById("p-badge").textContent = p.badge;

  const optSelect = document.getElementById("option");
  let currentOpt = defaultOptionId(p);
  if(p.options && optSelect){
    optSelect.innerHTML = p.options
      .map(o => `<option value="${o.id}">${o.label} — ${formatPrice(o.price)}</option>`)
      .join("");
    optSelect.value = currentOpt;
    optSelect.onchange = () => {
      currentOpt = optSelect.value;
      document.getElementById("p-price").textContent = formatPrice(priceFor(p, currentOpt));
    };
  }
  document.getElementById("p-price").textContent = formatPrice(priceFor(p, currentOpt));

  document.getElementById("add-to-cart").onclick = () => {
    const qty = parseInt(document.getElementById("qty").value || "1", 10);
    addToCart(p.id, qty, currentOpt);
  };
  document.getElementById("buy-now").onclick = () => {
    const opt  = currentOpt ? getOption(p, currentOpt) : null;
    const link = (opt && opt.payment_link) || p.payment_link;
    if(link && link.startsWith("http")){
      const qty = parseInt(document.getElementById("qty").value || "1", 10);
      const url = link + (qty>1 ? ("?quantity=" + qty) : "");
      location.href = url;
    } else {
      alert("Ajoute un lien Stripe (sur l’option ou le produit) pour activer \"Acheter maintenant\".");
    }
  };
}

// ====== PAGE BOUTIQUE ======
function bootShopPage(){
  const grid  = document.getElementById("product-grid");
  if(!grid) return;

  const input = document.getElementById("search");
  const select= document.getElementById("category-filter");

  // Lecture du paramètre d'URL ?cat=
  const url   = new URL(location.href);
  const urlCatRaw = (url.searchParams.get("cat") || "").toLowerCase();
  const possible = ["", "fleurs", "resines", "extraits", "prerolls", "rosin", "hash"];
  if(possible.includes(urlCatRaw)){
    // si rosin -> on met "extraits" dans le select (cohérence UI)
    // si hash  -> on met "resines" (alias)
    select.value = (urlCatRaw === "rosin") ? "extraits" : (urlCatRaw === "hash" ? "resines" : urlCatRaw);
  }

  function rerender(){
    // conserve le filtre "rosin" ou "hash" si demandé en URL
    const catParam = (urlCatRaw === "rosin") ? "rosin" : (urlCatRaw === "hash" ? "hash" : select.value);
    const results = searchProducts(input.value, catParam);
    grid.innerHTML = results.map(card).join("");
  }

  input.oninput   = rerender;
  select.onchange = () => {
    // si on change depuis une URL rosin/hash, on nettoie l'URL
    if((urlCatRaw === "rosin" || urlCatRaw === "hash") && select.value !== "extraits" && select.value !== "resines"){
      const clean = location.pathname.replace(/\/+$/, "") + "?" + new URLSearchParams().toString();
      history.replaceState({}, "", clean);
    }
    rerender();
  };

  rerender();
}

// ====== INIT ======
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  renderHome();
  bootShopPage();
  renderCart();
  if(document.getElementById("product-page")) bootProductPage();
});


