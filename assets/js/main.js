
function card(p){return `<article class="card">
<img class="thumb" src="${p.image}">
<div class="pad">
<span class="pill">${p.badge}</span>
<h3>${p.name}</h3>
<p>${p.desc}</p>
<div class="price">à partir de ${p.price} €</div>
</div></article>`}
document.addEventListener("DOMContentLoaded",()=>{
const g=document.getElementById("product-grid");
if(g) g.innerHTML=STORE.map(card).join("");
});
