
function card(p){return `<div class="card"><img class="thumb" src="${p.image}"><h3>${p.name}</h3><p>${p.desc}</p></div>`}
document.addEventListener("DOMContentLoaded",()=>{
const g=document.getElementById("product-grid");
if(g) g.innerHTML=STORE.map(card).join("");
});
