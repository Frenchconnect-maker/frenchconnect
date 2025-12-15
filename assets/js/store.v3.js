const STORE = [

{
id:"flower-gelato",
name:"Gelato #41 CBD – USA",
price:15,
image:"assets/images/flower1.jpg",
category:"fleurs",
badge:"Indoor USA",
desc:"Fleur premium cultivée aux États-Unis.",
options: grammages()
},
{
id:"flower-ogkush",
name:"OG Kush CBD – California",
price:15,
image:"assets/images/flower2.jpg",
category:"fleurs",
badge:"Top Shelf",
desc:"Génétique iconique américaine.",
options: grammages()
},
{
id:"flower-zkittlez",
name:"Zkittlez CBD",
price:15,
image:"assets/images/flower3.jpg",
category:"fleurs",
badge:"Exotic",
desc:"Explosion aromatique fruitée.",
options: grammages()
},

{
id:"hash-ice",
name:"Ice-O-Lator CBD",
price:14,
image:"assets/images/hash1.jpg",
category:"resines",
badge:"Premium Hash",
desc:"Extraction à froid haut de gamme.",
options: grammages()
},

{
id:"extract-rosin",
name:"Rosin Gold Press CBD",
price:30,
image:"assets/images/extract1.jpg",
category:"extraits",
badge:"Solventless",
desc:"Extraction sans solvants.",
options: grammages()
}

];

function grammages(){
return [
{ id:"1g", label:"1 g", price:15 },
{ id:"2g", label:"2 g", price:28 },
{ id:"5g", label:"5 g", price:65 },
{ id:"10g", label:"10 g", price:120 },
{ id:"25g", label:"25 g", price:280 },
{ id:"50g", label:"50 g", price:520 },
{ id:"100g", label:"100 g", price:950 }
];
}



