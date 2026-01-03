// Product catalog
const STORE = [
  {
    id: "flr-french31",
    name: "French Connect 31 - Fleurs CBD",
    price: 12.90,
    image: "assets/images/hero.jpg",
    category: "fleurs",
    badge: "Indoor",
    desc: "Fleurs CBD au profil aromatique marqué. Lot limité. THC < 0,3 %.",
    payment_link: ""
  },
  {
    id: "rosin-gold",
    name: "Rosin CBD – Gold Press",
    price: 29.90,
    image: "assets/images/hero.jpg",
    category: "extraits",
    badge: "Rosin",
    desc: "Extraction sans solvants (pression à chaud). Texture pure et aromatique.",
    payment_link: ""
  },
  {
    id: "huile-10",
    name: "Huile CBD 10%",
    price: 24.90,
    image: "assets/images/hero.jpg",
    category: "huiles",
    badge: "Full-spectrum",
    desc: "Huile CBD 10% avec spectre complet. Usage cosmétique. THC < 0,3 %.",
    payment_link: ""
  },
  {
    id: "frenchconnect-smellz-bananacake-cakeberry-rosin",
    name: "FrenchConnect x Smellz – Bananacake / Cakeberry Rosin CBD",
    price: 40.00,
    image: "assets/images/cakeberry-rosin.jpg",
    category: "extraits",
    badge: "Rosin Ultra Premium",
    desc: "Issu de la collaboration exclusive FrenchConnect x Smellz, ce Rosin CBD Bananacake / Cakeberry est un coup de cœur 2025. Fruit de près de trois mois de travail, il offre une texture pure et un profil aromatique d’exception. Notes gourmandes et fruitées, terpènes 100 % naturels, extraction sans solvants. Série limitée. THC < 0,3 %.",
    payment_link: ""
  }
];

// ----- DO NOT EDIT BELOW -----
const formatPrice = (n) => n.toFixed(2).replace('.', ',') + ' €';

function getCart(){ try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch(e){ return []; } }
function setCart(cart){ localStorage.setItem('cart', JSON.stringify(cart)); updateCartCount(); }
function updateCartCount(){ const cart = getCart(); const count = cart.reduce((s,l)=>s+l.qty,0); const el = document.getElementById('cart-count'); if(el) el.textContent = count; }
function findProduct(id){ return STORE.find(p => p.id === id); }
function searchProducts(q, cat){ q=(q||'').toLowerCase(); return STORE.filter(p => (!q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)) && (!cat || p.category===cat)); }

// Pre-render for home
function renderHome(){ const box=document.getElementById('home-collection'); if(!box) return; box.innerHTML = STORE.slice(0,3).map(card).join(''); }

// Product cards
function card(p){
  return `
  <article class="card">
    <a href="product.html?id=${p.id}">
      <img class="thumb" src="${p.image}" alt="${p.name}">
    </a>
    <div class="pad">
      <div class="pill">${p.category}</div>
      <h3><a href="product.html?id=${p.id}">${p.name}</a></h3>
      <div class="price-tag">${formatPrice(p.price)}</div>
      <div class="btn-row">
        <button class="btn" onclick="addToCart('${p.id}',1)">Ajouter</button>
        <a class="btn ghost" href="product.html?id=${p.id}">Voir</a>
      </div>
    </div>
  </article>`;
}

// Cart logic
function addToCart(id, qty){ const p=findProduct(id); if(!p) return; const cart=getCart(); const line=cart.find(l=>l.id===id); if(line) line.qty+=qty; else cart.push({id,qty}); setCart(cart); alert('Ajouté au panier ✔'); }
function removeFromCart(id){ const cart=getCart().filter(l=>l.id!==id); setCart(cart); renderCart(); }
function setQty(id, qty){ const cart=getCart(); const line=cart.find(l=>l.id===id); if(!line) return; line.qty=Math.max(1, qty|0); setCart(cart); renderCart(); }

function renderCart(){
  const box=document.getElementById('cart-items'); if(!box) return;
  const cart=getCart(); if(cart.length===0){ box.innerHTML='<p>Votre panier est vide.</p>'; const t=document.getElementById('cart-total'); if(t) t.textContent=formatPrice(0); return; }
  let total=0;
  box.innerHTML = cart.map(l => { const p=findProduct(l.id); const lineTotal=p.price*l.qty; total+=lineTotal; return `
    <div class="cart-line">
      <img src="${p.image}" alt="${p.name}">
      <div><div><strong>${p.name}</strong></div><div class="muted">${p.category} • ${p.badge}</div></div>
      <div>${formatPrice(p.price)}</div>
      <div><input type="number" min="1" value="${l.qty}" onchange="setQty('${l.id}', this.value)"></div>
      <div><button class="btn ghost" onclick="removeFromCart('${l.id}')">Retirer</button></div>
    </div>`; }).join('');
  const t=document.getElementById('cart-total'); if(t) t.textContent=formatPrice(total);
  const btn=document.getElementById('checkout-btn'); if(btn){ btn.onclick=function(e){ e.preventDefault(); startCheckout(); }; }
}

// Checkout
function startCheckout(){
  const cart=getCart();
  if(cart.length===1){
    const {id,qty}=cart[0]; const p=findProduct(id);
    if(p && p.payment_link && p.payment_link.startsWith('http')){ const url=p.payment_link + (qty>1?('?quantity='+qty):''); window.location.href=url; return; }
  }
  alert('Pour un vrai checkout multi-produit, raccorde Stripe (server) ou utilise Shopify.');
}

// Product page boot
function bootProductPage(){
  const url=new URL(location.href); const id=url.searchParams.get('id'); const p=findProduct(id) || STORE[0];
  document.getElementById('p-image').src=p.image;
  document.getElementById('p-name').textContent=p.name;
  document.getElementById('p-desc').textContent=p.desc;
  document.getElementById('p-cat').textContent=p.category;
  document.getElementById('p-badge').textContent=p.badge;
  document.getElementById('p-price').textContent=formatPrice(p.price);
  document.getElementById('add-to-cart').onclick=()=>{ const qty=parseInt(document.getElementById('qty').value||'1',10); addToCart(p.id, qty); };
  document.getElementById('buy-now').onclick=()=>{ if(p.payment_link && p.payment_link.startsWith('http')){ const qty=parseInt(document.getElementById('qty').value||'1',10); const url=p.payment_link + (qty>1?('?quantity='+qty):''); location.href=url; } else { alert('Ajoute un lien Stripe dans store.js pour activer "Acheter maintenant".'); } };
}

// Shop page boot
function bootShopPage(){
  const grid=document.getElementById('product-grid'); if(!grid) return;
  const input=document.getElementById('search'); const select=document.getElementById('category-filter');
  function rerender(){ const results=searchProducts(input.value, select.value); grid.innerHTML=results.map(card).join(''); }
  input.oninput=rerender; select.onchange=rerender; rerender();
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount(); renderHome(); bootShopPage(); renderCart(); if(document.getElementById('product-page')) bootProductPage();
});
