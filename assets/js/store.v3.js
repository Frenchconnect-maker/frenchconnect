// ====== CATALOGUE PRODUITS (avec options de grammage) ======
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
    desc: "Issu de la collaboration exclusive FrenchConnect x Smellz, ce Rosin CBD Bananacake / Cakeberry est un coup de cœur 2025. Extraction sans solvants, terpènes naturels, série limitée. THC < 0,3 %.",
    options: [
      { id: "0_5g", label: "0,5 g", price: 20.00, payment_link: "" },
      { id: "1g",   label: "1 g",   price: 40.00, payment_link: "" },
      { id: "2g",   label: "2 g",   price: 80.00, payment_link: "" }
    ],
    payment_link: ""
  }
];

// ====== HELPERS ======
const formatPrice = (n) => n.toFixed(2).replace('.', ',') + ' €';
const getOption = (p, optId) => (p.options || []).find(o => o.id === optId);
const defaultOptionId = (p) => (p.options && p.options[0]?.id) || null;
const priceFor = (p, optId) => (getOption(p, optId)?.price ?? p.price);

// ====== PANIER ======
function getCart(){ try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch(e){ return []; } }
function setCart(cart){ localStorage.setItem('cart', JSON.stringify(cart)); updateCartCount(); }
function updateCartCount(){
  const cart = getCart();
  const count = cart.reduce((s,l)=>s+l.qty,0);
  const el = document.getElementById('cart-count');
  if(el) el.textContent = count;
}
function findProduct(id){ return STORE.find(p => p.id === id); }
function searchProducts(q, cat){
  q=(q||'').toLowerCase();
  return STORE.filter(p =>
    (!q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)) &&
    (!cat || p.category===cat)
  );
}

// ====== HOME ======
function renderHome(){
  const box=document.getElementById('home-collection');
  if(!box) return;
  box.innerHTML = STORE.slice(0,3).map(card).join('');
}

// ====== CARTES PRODUITS (LIENS ABSOLUS) ======
function card(p){
  const base = p.options?.length ? p.options[0].price : p.price;
  return `
  <article class="card">
    <a href="/frenchconnect/product.html?id=${p.id}">
      <img class="thumb" src="${p.image}" alt="${p.name}">
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
  const p=findProduct(id); if(!p) return;
  const optionId = optId || defaultOptionId(p);
  const key = optionId ? `${id}__${optionId}` : id;
  const cart=getCart();
  const line=cart.find(l=>l.key===key);
  if(line) line.qty+=qty; else cart.push({ key, id, optionId, qty });
  setCart(cart);
  alert('Ajouté au panier ✔');
}
function removeFromCart(key){
  const cart=getCart().filter(l=>l.key!==key);
  setCart(cart); renderCart();
}
function setQty(key, qty){
  const cart=getCart();
  const line=cart.find(l=>l.key===key);
  if(!line) return;
  line.qty=Math.max(1, qty|0);
  setCart(cart); renderCart();
}
function renderCart(){
  const box=document.getElementById('cart-items'); if(!box) return;
  const cart=getCart();
  if(cart.length===0){
    box.innerHTML='<p>Votre panier est vide.</p>';
    const t=document.getElementById('cart-total'); if(t) t.textContent=formatPrice(0);
    return;
  }
  let total=0;
  box.innerHTML = cart.map(l=>{
    const p=findProduct(l.id);
    const price=priceFor(p,l.optionId);
    total+=price*l.qty;
    const optLabel=l.optionId ? (getOption(p,l.optionId)?.label||'') : '';
    return `
      <div class="cart-line">
        <img src="${p.image}" alt="${p.name}">
        <div>
          <strong>${p.name}</strong>
          <div class="muted">${p.category} • ${p.badge}${optLabel?' • '+optLabel:''}</div>
        </div>
        <div>${formatPrice(price)}</div>
        <div><input type="number" min="1" value="${l.qty}" onchange="setQty('${l.key}',this.value)"></div>
        <div><button class="btn ghost" onclick="removeFromCart('${l.key}')">Retirer</button></div>
      </div>`;
  }).join('');
  const t=document.getElementById('cart-total'); if(t) t.textContent=formatPrice(total);
}

// ====== CHECKOUT ======
function startCheckout(){
  const cart=getCart();
  if(cart.length===1){
    const {id,qty,optionId}=cart[0];
    const p=findProduct(id);
    const opt=optionId?getOption(p,optionId):null;
    const link=(opt&&opt.payment_link)||p.payment_link;
    if(link && link.startsWith('http')){
      window.location.href = link + (qty>1?('?quantity='+qty):'');
      return;
    }
  }
  alert('Pour un vrai checkout multi-produit, raccorde Stripe.');
}

// ====== PAGE PRODUIT ======
function bootProductPage(){
  const url=new URL(location.href);
  const id=url.searchParams.get('id');
  const p=findProduct(id)||STORE[0];

  document.getElementById('p-image').src=p.image;
  document.getElementById('p-name').textContent=p.name;
  document.getElementById('p-desc').textContent=p.desc;
  document.getElementById('p-cat').textContent=p.category;
  document.getElementById('p-badge').textContent=p.badge;

  const optSelect=document.getElementById('option');
  let currentOpt=defaultOptionId(p);
  if(p.options && optSelect){
    optSelect.innerHTML=p.options.map(o=>`<option value="${o.id}">${o.label} — ${formatPrice(o.price)}</option>`).join('');
    optSelect.value=currentOpt;
    optSelect.onchange=()=>document.getElementById('p-price').textContent=formatPrice(priceFor(p, optSelect.value));
  }
  document.getElementById('p-price').textContent=formatPrice(priceFor(p,currentOpt));

  document.getElementById('add-to-cart').onclick=()=>{
    const qty=parseInt(document.getElementById('qty').value||'1',10);
    addToCart(p.id,qty,optSelect?optSelect.value:null);
  };
}

// ====== PAGE BOUTIQUE ======
function bootShopPage(){
  const grid=document.getElementById('product-grid'); if(!grid) return;
  const input=document.getElementById('search');
  const select=document.getElementById('category-filter');
  const rerender=()=>grid.innerHTML=searchProducts(input.value,select.value).map(card).join('');
  input.oninput=rerender; select.onchange=rerender; rerender();
}

// ====== INIT ======
document.addEventListener('DOMContentLoaded',()=>{
  updateCartCount();
  renderHome();
  bootShopPage();
  renderCart();
  if(document.getElementById('product-page')) bootProductPage();
});
