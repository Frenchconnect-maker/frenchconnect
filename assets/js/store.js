// ====== CATALOGUE PRODUITS (avec options de grammage) ======
const STORE = [
  {
    "id": "cakeberry-rosin",
    "name": "Cakeberry Rosin",
    "price": 40.0,
    "image": "assets/images/cakeberry-rosin.jpg",
    "category": "extraits",
    "badge": "Rosin",
    "desc": "",
    "options": [
      {
        "id": "1g",
        "label": "1 g",
        "price": 40.0,
        "payment_link": ""
      },
      {
        "id": "3g",
        "label": "3 g",
        "price": 120.0,
        "payment_link": ""
      },
      {
        "id": "5g",
        "label": "5 g",
        "price": 200.0,
        "payment_link": ""
      },
      {
        "id": "10g",
        "label": "10 g",
        "price": 400.0,
        "payment_link": ""
      },
      {
        "id": "25g",
        "label": "25 g",
        "price": 1000.0,
        "payment_link": ""
      },
      {
        "id": "50g",
        "label": "50 g",
        "price": 2000.0,
        "payment_link": ""
      },
      {
        "id": "100g",
        "label": "100 g",
        "price": 4000.0,
        "payment_link": ""
      }
    ],
    "payment_link": ""
  },
  {
    "id": "cereal-cakes-live-rosin",
    "name": "Cereal Cakes Live Rosin",
    "price": 40.0,
    "image": "assets/images/cereal-cakes-live-rosin.webp",
    "category": "extraits",
    "badge": "Live Rosin",
    "desc": "",
    "options": [
      {
        "id": "1g",
        "label": "1 g",
        "price": 40.0,
        "payment_link": ""
      },
      {
        "id": "3g",
        "label": "3 g",
        "price": 120.0,
        "payment_link": ""
      },
      {
        "id": "5g",
        "label": "5 g",
        "price": 200.0,
        "payment_link": ""
      },
      {
        "id": "10g",
        "label": "10 g",
        "price": 400.0,
        "payment_link": ""
      },
      {
        "id": "25g",
        "label": "25 g",
        "price": 1000.0,
        "payment_link": ""
      },
      {
        "id": "50g",
        "label": "50 g",
        "price": 2000.0,
        "payment_link": ""
      },
      {
        "id": "100g",
        "label": "100 g",
        "price": 4000.0,
        "payment_link": ""
      }
    ],
    "payment_link": ""
  },
  {
    "id": "sherbet-cookie-live-rosin",
    "name": "Sherbet Cookie Live Rosin",
    "price": 40.0,
    "image": "assets/images/sherbet-cookie-live-rosin.png",
    "category": "extraits",
    "badge": "Live Rosin",
    "desc": "",
    "options": [
      {
        "id": "1g",
        "label": "1 g",
        "price": 40.0,
        "payment_link": ""
      },
      {
        "id": "3g",
        "label": "3 g",
        "price": 120.0,
        "payment_link": ""
      },
      {
        "id": "5g",
        "label": "5 g",
        "price": 200.0,
        "payment_link": ""
      },
      {
        "id": "10g",
        "label": "10 g",
        "price": 400.0,
        "payment_link": ""
      },
      {
        "id": "25g",
        "label": "25 g",
        "price": 1000.0,
        "payment_link": ""
      },
      {
        "id": "50g",
        "label": "50 g",
        "price": 2000.0,
        "payment_link": ""
      },
      {
        "id": "100g",
        "label": "100 g",
        "price": 4000.0,
        "payment_link": ""
      }
    ],
    "payment_link": ""
  },
  {
    "id": "sherbet-cookie-hash",
    "name": "Sherbet Cookie Hash",
    "price": 12.0,
    "image": "assets/images/sherbet-cookie-hash.webp",
    "category": "resines",
    "badge": "Hash",
    "desc": "",
    "options": [
      {
        "id": "1g",
        "label": "1 g",
        "price": 12.0,
        "payment_link": ""
      },
      {
        "id": "3g",
        "label": "3 g",
        "price": 36.0,
        "payment_link": ""
      },
      {
        "id": "5g",
        "label": "5 g",
        "price": 60.0,
        "payment_link": ""
      },
      {
        "id": "10g",
        "label": "10 g",
        "price": 120.0,
        "payment_link": ""
      },
      {
        "id": "25g",
        "label": "25 g",
        "price": 300.0,
        "payment_link": ""
      },
      {
        "id": "50g",
        "label": "50 g",
        "price": 600.0,
        "payment_link": ""
      },
      {
        "id": "100g",
        "label": "100 g",
        "price": 1200.0,
        "payment_link": ""
      }
    ],
    "payment_link": ""
  },
  {
    "id": "banana-kush-hash",
    "name": "Banana Kush Hash",
    "price": 12.0,
    "image": "assets/images/banana-kush-hash.jpg",
    "category": "resines",
    "badge": "Hash",
    "desc": "",
    "options": [
      {
        "id": "1g",
        "label": "1 g",
        "price": 12.0,
        "payment_link": ""
      },
      {
        "id": "3g",
        "label": "3 g",
        "price": 36.0,
        "payment_link": ""
      },
      {
        "id": "5g",
        "label": "5 g",
        "price": 60.0,
        "payment_link": ""
      },
      {
        "id": "10g",
        "label": "10 g",
        "price": 120.0,
        "payment_link": ""
      },
      {
        "id": "25g",
        "label": "25 g",
        "price": 300.0,
        "payment_link": ""
      },
      {
        "id": "50g",
        "label": "50 g",
        "price": 600.0,
        "payment_link": ""
      },
      {
        "id": "100g",
        "label": "100 g",
        "price": 1200.0,
        "payment_link": ""
      }
    ],
    "payment_link": ""
  },
  {
    "id": "amnesia-hash",
    "name": "Amnesia Hash",
    "price": 11.0,
    "image": "assets/images/amnesia-hash.jpg",
    "category": "resines",
    "badge": "Hash",
    "desc": "",
    "options": [
      {
        "id": "1g",
        "label": "1 g",
        "price": 11.0,
        "payment_link": ""
      },
      {
        "id": "3g",
        "label": "3 g",
        "price": 33.0,
        "payment_link": ""
      },
      {
        "id": "5g",
        "label": "5 g",
        "price": 55.0,
        "payment_link": ""
      },
      {
        "id": "10g",
        "label": "10 g",
        "price": 110.0,
        "payment_link": ""
      },
      {
        "id": "25g",
        "label": "25 g",
        "price": 275.0,
        "payment_link": ""
      },
      {
        "id": "50g",
        "label": "50 g",
        "price": 550.0,
        "payment_link": ""
      },
      {
        "id": "100g",
        "label": "100 g",
        "price": 1100.0,
        "payment_link": ""
      }
    ],
    "payment_link": ""
  },
  {
    "id": "blueberry-hash",
    "name": "Blueberry Hash",
    "price": 12.0,
    "image": "assets/images/blueberry-hash.webp",
    "category": "resines",
    "badge": "Hash",
    "desc": "",
    "options": [
      {
        "id": "1g",
        "label": "1 g",
        "price": 12.0,
        "payment_link": ""
      },
      {
        "id": "3g",
        "label": "3 g",
        "price": 36.0,
        "payment_link": ""
      },
      {
        "id": "5g",
        "label": "5 g",
        "price": 60.0,
        "payment_link": ""
      },
      {
        "id": "10g",
        "label": "10 g",
        "price": 120.0,
        "payment_link": ""
      },
      {
        "id": "25g",
        "label": "25 g",
        "price": 300.0,
        "payment_link": ""
      },
      {
        "id": "50g",
        "label": "50 g",
        "price": 600.0,
        "payment_link": ""
      },
      {
        "id": "100g",
        "label": "100 g",
        "price": 1200.0,
        "payment_link": ""
      }
    ],
    "payment_link": ""
  },
  {
    "id": "diamond-og",
    "name": "Diamond OG",
    "price": 12.9,
    "image": "assets/images/diamond-og.jpg",
    "category": "fleurs",
    "badge": "Fleur",
    "desc": "",
    "options": [
      {
        "id": "1g",
        "label": "1 g",
        "price": 12.9,
        "payment_link": ""
      },
      {
        "id": "3g",
        "label": "3 g",
        "price": 38.7,
        "payment_link": ""
      },
      {
        "id": "5g",
        "label": "5 g",
        "price": 64.5,
        "payment_link": ""
      },
      {
        "id": "10g",
        "label": "10 g",
        "price": 129.0,
        "payment_link": ""
      },
      {
        "id": "25g",
        "label": "25 g",
        "price": 322.5,
        "payment_link": ""
      },
      {
        "id": "50g",
        "label": "50 g",
        "price": 645.0,
        "payment_link": ""
      },
      {
        "id": "100g",
        "label": "100 g",
        "price": 1290.0,
        "payment_link": ""
      }
    ],
    "payment_link": ""
  },
  {
    "id": "runtz",
    "name": "Runtz",
    "price": 12.9,
    "image": "assets/images/runtz.jpg",
    "category": "fleurs",
    "badge": "Fleur",
    "desc": "",
    "options": [
      {
        "id": "1g",
        "label": "1 g",
        "price": 12.9,
        "payment_link": ""
      },
      {
        "id": "3g",
        "label": "3 g",
        "price": 38.7,
        "payment_link": ""
      },
      {
        "id": "5g",
        "label": "5 g",
        "price": 64.5,
        "payment_link": ""
      },
      {
        "id": "10g",
        "label": "10 g",
        "price": 129.0,
        "payment_link": ""
      },
      {
        "id": "25g",
        "label": "25 g",
        "price": 322.5,
        "payment_link": ""
      },
      {
        "id": "50g",
        "label": "50 g",
        "price": 645.0,
        "payment_link": ""
      },
      {
        "id": "100g",
        "label": "100 g",
        "price": 1290.0,
        "payment_link": ""
      }
    ],
    "payment_link": ""
  },
  {
    "id": "sour-apple",
    "name": "Sour Apple",
    "price": 12.9,
    "image": "assets/images/sour-apple.webp",
    "category": "fleurs",
    "badge": "Fleur",
    "desc": "",
    "options": [
      {
        "id": "1g",
        "label": "1 g",
        "price": 12.9,
        "payment_link": ""
      },
      {
        "id": "3g",
        "label": "3 g",
        "price": 38.7,
        "payment_link": ""
      },
      {
        "id": "5g",
        "label": "5 g",
        "price": 64.5,
        "payment_link": ""
      },
      {
        "id": "10g",
        "label": "10 g",
        "price": 129.0,
        "payment_link": ""
      },
      {
        "id": "25g",
        "label": "25 g",
        "price": 322.5,
        "payment_link": ""
      },
      {
        "id": "50g",
        "label": "50 g",
        "price": 645.0,
        "payment_link": ""
      },
      {
        "id": "100g",
        "label": "100 g",
        "price": 1290.0,
        "payment_link": ""
      }
    ],
    "payment_link": ""
  },
  {
    "id": "strawberry-haze",
    "name": "Strawberry Haze",
    "price": 12.9,
    "image": "assets/images/strawberry-haze.png",
    "category": "fleurs",
    "badge": "Fleur",
    "desc": "",
    "options": [
      {
        "id": "1g",
        "label": "1 g",
        "price": 12.9,
        "payment_link": ""
      },
      {
        "id": "3g",
        "label": "3 g",
        "price": 38.7,
        "payment_link": ""
      },
      {
        "id": "5g",
        "label": "5 g",
        "price": 64.5,
        "payment_link": ""
      },
      {
        "id": "10g",
        "label": "10 g",
        "price": 129.0,
        "payment_link": ""
      },
      {
        "id": "25g",
        "label": "25 g",
        "price": 322.5,
        "payment_link": ""
      },
      {
        "id": "50g",
        "label": "50 g",
        "price": 645.0,
        "payment_link": ""
      },
      {
        "id": "100g",
        "label": "100 g",
        "price": 1290.0,
        "payment_link": ""
      }
    ],
    "payment_link": ""
  },
  {
    "id": "strawberry-haze-pre-roll",
    "name": "Strawberry Haze Pre Roll",
    "price": 12.9,
    "image": "assets/images/strawberry-haze-pre-roll.webp",
    "category": "prerolls",
    "badge": "Pre Roll",
    "desc": "",
    "payment_link": ""
  },
  {
    "id": "banana-kush-cakeberry-rosin-pre-roll",
    "name": "Banana Kush x Cakeberry Rosin Pre Roll",
    "price": 12.9,
    "image": "assets/images/banana-kush-cakeberry-rosin-pre-roll.jpeg",
    "category": "prerolls",
    "badge": "Pre Roll",
    "desc": "",
    "payment_link": ""
  },
  {
    "id": "runtz-cereal-cakes-pre-roll",
    "name": "Runtz x Cereal Cakes Pre Roll",
    "price": 12.9,
    "image": "assets/images/prerolls3.webp",
    "category": "prerolls",
    "badge": "Pre Roll",
    "desc": "",
    "payment_link": ""
  }
];

// ====== HELPERS ======
const formatPrice = (n) => Number(n).toFixed(2).replace(".", ",") + " €";
const getOption   = (p, optId) => (p.options || []).find(o => o.id === optId);
const defaultOptionId = (p) => (p.options && p.options[0]?.id) || null;
const priceFor = (p, optId) => (getOption(p, optId)?.price ?? p.price);

// Panier localStorage
function getCart(){ try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch(e){ return []; } }
function setCart(cart){ localStorage.setItem("cart", JSON.stringify(cart)); updateCartCount(); }
function updateCartCount(){
  const cart = getCart();
  const count = cart.reduce((s,l)=>s+(l.qty||0),0);
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
  "hash": "resines",
  "extraits": "extraits",
  "extracts": "extraits",
  "rosin": "extraits",
  "prerolls": "prerolls",
  "pre rolls": "prerolls",
  "pre-rolls": "prerolls",
  "pre roll": "prerolls"
};
function normCat(c){
  if(!c) return "";
  const k = (""+c).toLowerCase().trim();
  return CATEGORY_MAP[k] || k;
}

// Recherche + filtre catégorie (inclut rosin + hash)
function searchProducts(q, cat){
  q = (q||"").toLowerCase();
  const want = normCat(cat);

  return STORE.filter(p => {
    const okQ = !q || (p.name.toLowerCase().includes(q) || (p.desc||"").toLowerCase().includes(q));
    const pCat = normCat(p.category);
    let okC = !want || pCat === want;

    // si on demande rosin (?cat=rosin) -> extraits + badge rosin
    if(want === "extraits" && (cat||"").toLowerCase().includes("rosin")){
      okC = pCat === "extraits" && /rosin/i.test(p.badge || "");
    }
    // si on demande hash (?cat=hash) -> resines
    if((cat||"").toLowerCase().includes("hash")){
      okC = pCat === "resines";
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

// ====== CARTES PRODUITS ======
function card(p){
  const base = p.options?.length ? p.options[0].price : p.price;
  // liens RELATIFS = évite les soucis de clic sur GitHub Pages
  return `
  <article class="card">
    <a href="product.html?id=${encodeURIComponent(p.id)}">
      <img class="thumb" src="${p.image}" alt="${p.name}" loading="lazy" decoding="async">
    </a>
    <div class="pad">
      <div class="pill">${p.category}</div>
      <h3><a href="product.html?id=${encodeURIComponent(p.id)}">${p.name}</a></h3>
      <div class="price-tag">à partir de ${formatPrice(base)}</div>
      <div class="btn-row">
        <a class="btn" href="product.html?id=${encodeURIComponent(p.id)}">Voir le produit</a>
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
          <div class="muted">${p.category} • ${p.badge||""}${optLabel ? " • " + optLabel : ""}</div>
        </div>
        <div>${formatPrice(price)}</div>
        <div><input type="number" min="1" value="${l.qty}" onchange="setQty('${l.key}', this.value)"></div>
        <div><button class="btn ghost" onclick="removeFromCart('${l.key}')">Retirer</button></div>
      </div>`;
  }).join("");
  const t = document.getElementById("cart-total"); if(t) t.textContent = formatPrice(total);
  const btn = document.getElementById("checkout-btn");
  if(btn){
    btn.onclick = function(e){ e.preventDefault(); startCheckout(); };
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

  const img = document.getElementById("p-image"); if(img) img.src = p.image;
  const name = document.getElementById("p-name"); if(name) name.textContent = p.name;
  const desc = document.getElementById("p-desc"); if(desc) desc.textContent = p.desc || "";
  const cat = document.getElementById("p-cat"); if(cat) cat.textContent = p.category;
  const badge = document.getElementById("p-badge"); if(badge) badge.textContent = p.badge || "";

  const optSelect = document.getElementById("option");
  const optWrap = document.getElementById("option-wrap"); // si présent, on peut masquer
  let currentOpt = defaultOptionId(p);

  if(p.options && p.options.length && optSelect){
    if(optWrap) optWrap.style.display = "";
    optSelect.innerHTML = p.options
      .map(o => `<option value="${o.id}">${o.label} — ${formatPrice(o.price)}</option>`)
      .join("");
    optSelect.value = currentOpt;
    optSelect.onchange = () => {
      currentOpt = optSelect.value;
      const priceEl = document.getElementById("p-price");
      if(priceEl) priceEl.textContent = formatPrice(priceFor(p, currentOpt));
    };
  } else {
    // pas de grammage (pre rolls) -> masque le select si possible
    if(optWrap) optWrap.style.display = "none";
  }

  const priceEl = document.getElementById("p-price");
  if(priceEl) priceEl.textContent = formatPrice(priceFor(p, currentOpt));

  const addBtn = document.getElementById("add-to-cart");
  if(addBtn) addBtn.onclick = () => {
    const qty = parseInt((document.getElementById("qty")?.value) || "1", 10);
    addToCart(p.id, qty, currentOpt);
  };

  const buyBtn = document.getElementById("buy-now");
  if(buyBtn) buyBtn.onclick = () => {
    const opt  = currentOpt ? getOption(p, currentOpt) : null;
    const link = (opt && opt.payment_link) || p.payment_link;
    if(link && link.startsWith("http")){
      const qty = parseInt((document.getElementById("qty")?.value) || "1", 10);
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

  const url   = new URL(location.href);
  const urlCatRaw = (url.searchParams.get("cat") || "").toLowerCase();
  const possible = ["", "fleurs", "resines", "extraits", "rosin", "hash", "prerolls"];
  if(select && possible.includes(urlCatRaw)){
    select.value = (urlCatRaw === "rosin") ? "extraits"
                : (urlCatRaw === "hash") ? "resines"
                : urlCatRaw;
  }

  function rerender(){
    const catParam = (urlCatRaw === "rosin") ? "rosin"
                  : (urlCatRaw === "hash") ? "hash"
                  : (select ? select.value : "");
    const results = searchProducts(input ? input.value : "", catParam);
    grid.innerHTML = results.map(card).join("");
  }

  if(input) input.oninput = rerender;
  if(select) select.onchange = () => rerender();

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
