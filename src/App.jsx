import { useState, useMemo, useEffect, useRef } from "react";

function useIsMobile(bp=768){const[m,setM]=useState(()=>typeof window!=="undefined"&&window.innerWidth<bp);useEffect(()=>{const h=()=>setM(window.innerWidth<bp);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[bp]);return m;}

const uid=()=>Math.random().toString(36).slice(2,10);
const nowStr=()=>new Date().toLocaleString("en-GB",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
const fmtRs=n=>n==null||n===""?"—":`Rs${Number(n).toLocaleString("en-LK",{minimumFractionDigits:2,maximumFractionDigits:2})}`;

// ── THEMES ─────────────────────────────────────────────────────────────────
const DARK={
  mode:"dark",bg:"#0d0b09",card:"#17130f",card2:"#1e1812",border:"#2e2519",
  accent:"#c9966b",accentDim:"#c9966b14",accentText:"#e8b48a",
  text:"#f0e8df",muted:"#7a6555",
  ok:"#5a9e72",okBg:"#5a9e7215",warn:"#c9966b",warnBg:"#c9966b15",
  low:"#c0524a",lowBg:"#c0524a14",blue:"#6b9fd4",blueBg:"#6b9fd414",
  purple:"#a07bbf",purpleBg:"#a07bbf14",
  front:"#6b9fd4",kitchen:"#5a9e72",
  inputBg:"#0d0b09",navBg:"#17130f",navBorder:"#2e2519",
  btnPrimary:"#c9966b",btnPrimaryText:"#fff",shadow:"0 2px 16px rgba(0,0,0,0.5)",
};
const LIGHT={
  mode:"light",bg:"#f5ede4",card:"#fdf8f3",card2:"#f8f0e8",border:"#e2cfc0",
  accent:"#8c5c38",accentDim:"#8c5c3812",accentText:"#6b4228",
  text:"#2e1e12",muted:"#9c7b68",
  ok:"#3d7a52",okBg:"#3d7a5215",warn:"#a0722a",warnBg:"#a0722a15",
  low:"#b03a30",lowBg:"#b03a3014",blue:"#2c6ea8",blueBg:"#2c6ea814",
  purple:"#7a4ea0",purpleBg:"#7a4ea014",
  front:"#2c6ea8",kitchen:"#3d7a52",
  inputBg:"#fdf8f3",navBg:"#ede0d4",navBorder:"#d4bfad",
  btnPrimary:"#8c5c38",btnPrimaryText:"#fff",shadow:"0 2px 12px rgba(100,60,20,0.1)",
};

const ROLES={
  admin:{label:"Admin",tabs:["out","in","inv","count","var","po","hist","reports","users","devices"],canEditItems:true,canEditUsers:true,canEditDevices:true,canViewReports:true},
  supervisor:{label:"Supervisor",tabs:["out","in","inv","count","var","po","hist","reports"],canEditItems:true,canViewReports:true},
  counter:{label:"Stock Counter",tabs:["out","in","count","hist"],canEditItems:false},
  staff:{label:"Staff",tabs:["out","in"],canEditItems:false},
};
const roleColor=(r,T)=>({admin:T.accent,supervisor:T.purple,counter:T.blue,staff:T.ok}[r]||T.muted);
const roleBg=(r,T)=>({admin:T.accentDim,supervisor:T.purpleBg,counter:T.blueBg,staff:T.okBg}[r]||T.border+"44");

const DEFAULT_USERS=[
  {id:"u1",username:"admin",password:"admin123",role:"admin",name:"Admin User",email:"admin@hazelcafe.lk",active:true,createdAt:"01/01/2025, 00:00"},
  {id:"u2",username:"supervisor",password:"super123",role:"supervisor",name:"Supervisor",email:"supervisor@hazelcafe.lk",active:true,createdAt:"01/01/2025, 00:00"},
  {id:"u3",username:"counter1",password:"count123",role:"counter",name:"Stock Counter",email:"counter@hazelcafe.lk",active:true,createdAt:"01/01/2025, 00:00"},
  {id:"u4",username:"staff1",password:"staff123",role:"staff",name:"Staff Member",email:"staff@hazelcafe.lk",active:true,createdAt:"01/01/2025, 00:00"},
];
// Devices start empty — admin registers each physical device after installing the app
const DEFAULT_DEVICES=[];
const DEFAULT_ITEMS=[
  {id:"F100",dept:"Front",location:"Stores",supplier:"Sivasakthy",brand:"Nestle",name:"Milo 400g",code:"F100",unit:"Grams (g)",stock:7,minQty:5,perUnit:865},
  {id:"F101",dept:"Front",location:"Stores",supplier:"Udula Distributors",brand:"Lakspray",name:"Milk Powder 1kg",code:"F101",unit:"Grams (g)",stock:2,minQty:3,perUnit:null},
  {id:"F102",dept:"Front",location:"Stores",supplier:"CBL Food Solution",brand:"Munchee",name:"Kalos 140g",code:"F102",unit:"Nos",stock:12,minQty:10,perUnit:263.23},
  {id:"F103",dept:"Front",location:"Stores",supplier:"Sivasakthy",brand:"Sivasakthy",name:"White Sugar 1kg",code:"F103",unit:"Grams (g)",stock:0,minQty:0,perUnit:220},
  {id:"F104",dept:"Front",location:"Stores",supplier:"Sivasakthy",brand:"Bulk",name:"Brown Sugar 1kg",code:"F104",unit:"Grams (g)",stock:8,minQty:3,perUnit:290},
  {id:"F105",dept:"Front",location:"Stores",supplier:"HNB",brand:"HNB",name:"Card Terminal Bill Roll 5s",code:"F105",unit:"Nos",stock:4,minQty:10,perUnit:null},
  {id:"F106",dept:"Front",location:"Stores",supplier:"UBER",brand:"Uber",name:"Uber Tape",code:"F106",unit:"Nos",stock:15,minQty:10,perUnit:null},
  {id:"F107",dept:"Front",location:"Stores",supplier:"Ahamed Tea",brand:"Ahmad",name:"BOPF Tea 500g",code:"F107",unit:"Grams (g)",stock:1,minQty:5,perUnit:null},
  {id:"F108",dept:"Front",location:"Stores",supplier:"Sivasakthy",brand:"Zesta",name:"Zesta Tea Bags 100s",code:"F108",unit:"Nos",stock:8,minQty:0,perUnit:750},
  {id:"F109",dept:"Front",location:"Stores",supplier:"Dilmah",brand:"Dilmah",name:"Strawberry Tea Bag 20s",code:"F109",unit:"Nos",stock:0,minQty:0,perUnit:null},
  {id:"F110",dept:"Front",location:"Stores",supplier:"Ahamed Tea",brand:"Ahmad",name:"Chai Spice 100g",code:"F110",unit:"Nos",stock:0,minQty:5,perUnit:null},
  {id:"F111",dept:"Front",location:"Stores",supplier:"Dilmah",brand:"Dilmah",name:"English Breakfast Tea 50s Tea Bag",code:"F111",unit:"Nos",stock:1,minQty:5,perUnit:null},
  {id:"F112",dept:"Front",location:"Stores",supplier:"Dilmah",brand:"Ahmad",name:"Green Tea 25s Tea Bag",code:"F112",unit:"Nos",stock:2,minQty:3,perUnit:null},
  {id:"F113",dept:"Front",location:"Stores",supplier:"Dilmah",brand:"Dilmah",name:"Green Apple Tea 20s Tea Bag",code:"F113",unit:"Nos",stock:7,minQty:5,perUnit:null},
  {id:"F114",dept:"Front",location:"Stores",supplier:"Beldon Lanka",brand:"Beldon",name:"POS Bill Roll 2s",code:"F114",unit:"Nos",stock:0,minQty:10,perUnit:null},
  {id:"F115",dept:"Front",location:"Stores",supplier:"Ahamed Polythene",brand:"4*6",name:"Zip Lock Bag 4x6 100s",code:"F115",unit:"Nos",stock:12,minQty:10,perUnit:null},
  {id:"F116",dept:"Front",location:"Stores",supplier:"LIQUIDISLAND",brand:"Monin",name:"Apple Syrup 700ml",code:"F116",unit:"Mililitres (ml)",stock:3,minQty:2,perUnit:5168.37},
  {id:"F117",dept:"Front",location:"Stores",supplier:"Sivasakthy",brand:"Roza",name:"Milkmaid 1kg",code:"F117",unit:"Grams (g)",stock:4,minQty:5,perUnit:890},
  {id:"F118",dept:"Front",location:"Stores",supplier:"LIQUIDISLAND",brand:"Monin",name:"Frappe Powder 1kg",code:"F118",unit:"Grams (g)",stock:4,minQty:2,perUnit:null},
  {id:"F119",dept:"Front",location:"Stores",supplier:"SIMPLY FRESH",brand:"Giffard",name:"Passion Syrup 1L",code:"F119",unit:"Mililitres (ml)",stock:4,minQty:3,perUnit:4100},
  {id:"F120",dept:"Front",location:"Stores",supplier:"LIQUIDISLAND",brand:"Monin",name:"Vanilla Syrup 1L",code:"F120",unit:"Mililitres (ml)",stock:4,minQty:4,perUnit:5679.92},
  {id:"F121",dept:"Front",location:"Stores",supplier:"LIQUIDISLAND",brand:"Monin",name:"Hazelnut Syrup 1L",code:"F121",unit:"Mililitres (ml)",stock:4,minQty:4,perUnit:5765.97},
  {id:"F122",dept:"Front",location:"Stores",supplier:"LIQUIDISLAND",brand:"Monin",name:"Peach Syrup 1L",code:"F122",unit:"Mililitres (ml)",stock:3,minQty:3,perUnit:5846.51},
  {id:"F123",dept:"Front",location:"Stores",supplier:"SIMPLY FRESH",brand:"Giffard",name:"Banana Syrup 1L",code:"F123",unit:"Mililitres (ml)",stock:0,minQty:0,perUnit:null},
  {id:"F124",dept:"Front",location:"Stores",supplier:"LIQUIDISLAND",brand:"Monin",name:"Mint Syrup 1L",code:"F124",unit:"Mililitres (ml)",stock:4,minQty:4,perUnit:5846.51},
  {id:"F125",dept:"Front",location:"Stores",supplier:"LIQUIDISLAND",brand:"Monin",name:"Strawberry Syrup 1L",code:"F125",unit:"Mililitres (ml)",stock:3,minQty:2,perUnit:5846.51},
  {id:"F126",dept:"Front",location:"Stores",supplier:"LIQUIDISLAND",brand:"Monin",name:"Strawberry Puree 1.32kg",code:"F126",unit:"Grams (g)",stock:2,minQty:2,perUnit:7853.05},
  {id:"F127",dept:"Front",location:"Stores",supplier:"LIQUIDISLAND",brand:"Monin",name:"Caramel Sauce 2.46kg",code:"F127",unit:"Grams (g)",stock:2,minQty:2,perUnit:8303.51},
  {id:"F128",dept:"Front",location:"Stores",supplier:"LIQUIDISLAND",brand:"Monin",name:"Chocolate Sauce 2.46kg",code:"F128",unit:"Grams (g)",stock:2,minQty:2,perUnit:null},
  {id:"F129",dept:"Front",location:"Stores",supplier:"Edinborough",brand:"Edingborough",name:"Chocolate Topping 360g",code:"F129",unit:"Grams (g)",stock:2,minQty:2,perUnit:null},
  {id:"F130",dept:"Front",location:"Stores",supplier:"Sivasakthy",brand:"Hersheys",name:"Hershley Chocolate Topping 680g",code:"F130",unit:"Grams (g)",stock:6,minQty:3,perUnit:null},
  {id:"F131",dept:"Front",location:"Stores",supplier:"Edinborough",brand:"Edingborough",name:"Strawberry Topping 360g",code:"F131",unit:"Grams (g)",stock:2,minQty:2,perUnit:null},
  {id:"F132",dept:"Front",location:"Stores",supplier:"Colombo Coffee Company",brand:"Colombo Coffee Company",name:"Hot Chocolate Powder 500g",code:"F132",unit:"Grams (g)",stock:8,minQty:5,perUnit:null},
  {id:"F133",dept:"Front",location:"Stores",supplier:"Damn Fine",brand:"Damn Fine",name:"Coffee Bean 1kg",code:"F133",unit:"Grams (g)",stock:7,minQty:10,perUnit:11505},
  {id:"F134",dept:"Front",location:"Stores",supplier:"Flora (Pee Bee Management Services)",brand:"Flora",name:"Toilet Tissue Roll 25s",code:"F134",unit:"Nos",stock:52,minQty:10,perUnit:183},
  {id:"F135",dept:"Front",location:"Stores",supplier:"Standard Holdings",brand:"200ml",name:"TA Hot Cup 50s",code:"F135",unit:"Nos",stock:11,minQty:10,perUnit:null},
  {id:"F136",dept:"Front",location:"Stores",supplier:"Standard Holdings",brand:"",name:"TA Hot Caps 100s",code:"F136",unit:"Nos",stock:5,minQty:5,perUnit:null},
  {id:"F137",dept:"Front",location:"Stores",supplier:"Critco",brand:"15x6",name:"TA Bowls 50s",code:"F137",unit:"Nos",stock:5,minQty:5,perUnit:null},
  {id:"F138",dept:"Front",location:"Stores",supplier:"Critco",brand:"",name:"TA Bowl Lids 25s",code:"F138",unit:"Nos",stock:11,minQty:10,perUnit:null},
  {id:"F139",dept:"Front",location:"Stores",supplier:"Flora (Pee Bee Management Services)",brand:"Flora",name:"Flora Napkins 250s",code:"F139",unit:"Nos",stock:10,minQty:10,perUnit:552},
  {id:"F140",dept:"Front",location:"Stores",supplier:"Standard Holdings",brand:"600ml",name:"600ml Large TA Iced Cup 100s",code:"F140",unit:"Nos",stock:8,minQty:0,perUnit:null},
  {id:"F141",dept:"Front",location:"Stores",supplier:"Standard Holdings",brand:"400ml",name:"400ml TA Iced Cup 100s",code:"F141",unit:"Nos",stock:8,minQty:5,perUnit:1650},
  {id:"F142",dept:"Front",location:"Stores",supplier:"Flora (Pee Bee Management Services)",brand:"Flora",name:"Tissue Towel",code:"F142",unit:"Nos",stock:23,minQty:5,perUnit:251},
  {id:"F143",dept:"Front",location:"Stores",supplier:"Standard Holdings",brand:"",name:"Iced TA Cap 50s",code:"F143",unit:"Nos",stock:16,minQty:10,perUnit:625},
  {id:"F144",dept:"Front",location:"Stores",supplier:"Petform Group",brand:"",name:"TA Straw 250s",code:"F144",unit:"Nos",stock:7,minQty:5,perUnit:null},
  {id:"F145",dept:"Front",location:"Stores",supplier:"Paper Bag Shop",brand:"34*33*15",name:"TA Bag Large 100s",code:"F145",unit:"Nos",stock:4,minQty:3,perUnit:null},
  {id:"F146",dept:"Front",location:"Stores",supplier:"Petform Group",brand:"30*27*15",name:"TA Bag Medium 100s",code:"F146",unit:"Nos",stock:0,minQty:3,perUnit:null},
  {id:"F147",dept:"Front",location:"Stores",supplier:"Petform Group",brand:"28*18*15",name:"TA Bag Small 100s",code:"F147",unit:"Nos",stock:7,minQty:3,perUnit:null},
  {id:"F148",dept:"Front",location:"Stores",supplier:"Lanka Milk Foods",brand:"Ambewela",name:"Ambewela 1L",code:"F148",unit:"Mililitres (ml)",stock:91,minQty:60,perUnit:495},
  {id:"F149",dept:"Front",location:"Stores",supplier:"",brand:"14.5x9x14.5",name:"TA Box 100s",code:"F149",unit:"Nos",stock:0,minQty:0,perUnit:2000},
  {id:"F150",dept:"Front",location:"Stores",supplier:"",brand:"",name:"TA Straw 100s",code:"F150",unit:"Nos",stock:6,minQty:5,perUnit:null},
  {id:"K100",dept:"Kitchen",location:"Stores",supplier:"Sivasakthy/Edinborough",brand:"Edinborough",name:"Edinborough Vinegar 4L",code:"K100",unit:"Mililitres (ml)",stock:6,minQty:3,perUnit:1065},
  {id:"K101",dept:"Kitchen",location:"Stores",supplier:"Sivasakthy",brand:"Kist",name:"Kist Tomato Sauce 4L",code:"K101",unit:"Mililitres (ml)",stock:4,minQty:2,perUnit:1850},
  {id:"K102",dept:"Kitchen",location:"Stores",supplier:"Sivasakthy",brand:"Bertini",name:"Bertini Olive Oil 4L",code:"K102",unit:"Mililitres (ml)",stock:3,minQty:3,perUnit:8250},
  {id:"K103",dept:"Kitchen",location:"Stores",supplier:"Sivasakthy",brand:"Gold Winner",name:"Sunflower Oil 5L",code:"K103",unit:"Mililitres (ml)",stock:8,minQty:5,perUnit:4450},
  {id:"K104",dept:"Kitchen",location:"Stores",supplier:"Ahamed Palace",brand:"Premium",name:"Dish Wash Liquid 10L",code:"K104",unit:"Mililitres (ml)",stock:1,minQty:2,perUnit:null},
  {id:"K105",dept:"Kitchen",location:"Stores",supplier:"Ahamed Palace",brand:"Premium",name:"Mopping Liquid 10L",code:"K105",unit:"Mililitres (ml)",stock:2,minQty:1,perUnit:null},
  {id:"K106",dept:"Kitchen",location:"Stores",supplier:"Ahamed Palace",brand:"Premium",name:"Hand Wash Liquid 10L",code:"K106",unit:"Mililitres (ml)",stock:3,minQty:2,perUnit:null},
  {id:"K107",dept:"Kitchen",location:"Stores",supplier:"Ahamed Palace",brand:"Premium",name:"Glass Cleaner Liquid 5L",code:"K107",unit:"Mililitres (ml)",stock:3,minQty:2,perUnit:null},
  {id:"K108",dept:"Kitchen",location:"Stores",supplier:"Ahamed Palace",brand:"32x38",name:"Garbage Bag (XL) 100s",code:"K108",unit:"Nos",stock:5,minQty:3,perUnit:null},
  {id:"K109",dept:"Kitchen",location:"Stores",supplier:"Ahamed Palace",brand:"19x23",name:"Garbage Bag (S) 100s",code:"K109",unit:"Nos",stock:3,minQty:3,perUnit:null},
  {id:"K110",dept:"Kitchen",location:"Stores",supplier:"CBL Food Solutions",brand:"Munchee",name:"Gold Marie 80g",code:"K110",unit:"Grams (g)",stock:42,minQty:10,perUnit:null},
  {id:"K111",dept:"Kitchen",location:"Stores",supplier:"Sivasakthy",brand:"Milan",name:"Milan Penne 1kg",code:"K111",unit:"Grams (g)",stock:15,minQty:10,perUnit:460},
  {id:"K112",dept:"Kitchen",location:"Stores",supplier:"CBL Food Solution",brand:"Ritsbury",name:"Righboury Dark Chocolate 1.8kg",code:"K112",unit:"Grams (g)",stock:2,minQty:3,perUnit:2950.51},
  {id:"K113",dept:"Kitchen",location:"Stores",supplier:"East-West",brand:"East West",name:"Walnuts 1kg",code:"K113",unit:"Grams (g)",stock:2,minQty:1,perUnit:10620},
  {id:"K114",dept:"Kitchen",location:"Stores",supplier:"Keells",brand:"Oateo",name:"Oats 500g",code:"K114",unit:"Grams (g)",stock:0,minQty:2,perUnit:null},
  {id:"K115",dept:"Kitchen",location:"Stores",supplier:"Sivasakthy",brand:"Sivashakthy",name:"White Sugar 1kg",code:"K115",unit:"Grams (g)",stock:17,minQty:10,perUnit:220},
  {id:"K116",dept:"Kitchen",location:"Stores",supplier:"Sivasakthy",brand:"Motha",name:"Icing Sugar 1kg",code:"K116",unit:"Grams (g)",stock:1,minQty:2,perUnit:null},
  {id:"K117",dept:"Kitchen",location:"Stores",supplier:"Sivasakthy",brand:"Mauri",name:"Baking Soda 100g",code:"K117",unit:"Grams (g)",stock:2,minQty:2,perUnit:null},
  {id:"K118",dept:"Kitchen",location:"Stores",supplier:"Sivasakthy/Edinborough",brand:"Edinborough",name:"Mustard 675g",code:"K118",unit:"Grams (g)",stock:9,minQty:3,perUnit:997.50},
  {id:"K119",dept:"Kitchen",location:"Stores",supplier:"Sivasakthy",brand:"Motha",name:"Motha Baking Powder 100g",code:"K119",unit:"Grams (g)",stock:1,minQty:5,perUnit:null},
  {id:"K120",dept:"Kitchen",location:"Stores",supplier:"Sivasakthy",brand:"Nutridor",name:"Nutridor Milkmaid 410g",code:"K120",unit:"Grams (g)",stock:0,minQty:0,perUnit:null},
  {id:"K121",dept:"Kitchen",location:"Stores",supplier:"Sivasakthy",brand:"Wijaya",name:"Chilli Powder 500g",code:"K121",unit:"Grams (g)",stock:4,minQty:3,perUnit:700},
  {id:"K122",dept:"Kitchen",location:"Stores",supplier:"",brand:"Nature",name:"Mustard Seeds 100g",code:"K122",unit:"Grams (g)",stock:0,minQty:0,perUnit:null},
  {id:"K123",dept:"Kitchen",location:"Stores",supplier:"Sivasakthy",brand:"Sivashakthy",name:"Pepper Sivashakthy 1kg",code:"K123",unit:"Grams (g)",stock:1,minQty:1,perUnit:2450},
  {id:"K124",dept:"Kitchen",location:"Stores",supplier:"",brand:"Nature",name:"Pepper 1kg",code:"K124",unit:"Grams (g)",stock:0,minQty:0,perUnit:2450},
  {id:"K125",dept:"Kitchen",location:"Stores",supplier:"",brand:"Mc Currie",name:"Cinnamon Powder 70g",code:"K125",unit:"Grams (g)",stock:0,minQty:0,perUnit:null},
  {id:"K126",dept:"Kitchen",location:"Stores",supplier:"",brand:"Nature Love/Keells",name:"Chia Seeds 100g",code:"K126",unit:"Grams (g)",stock:1,minQty:3,perUnit:null},
  {id:"K127",dept:"Kitchen",location:"Stores",supplier:"Mas",brand:"Mas",name:"Garlic Powder 50g",code:"K127",unit:"Grams (g)",stock:45,minQty:10,perUnit:238},
  {id:"K128",dept:"Kitchen",location:"Stores",supplier:"Sivasakthy",brand:"Shan",name:"Thandoori Masala 50g",code:"K128",unit:"Grams (g)",stock:0,minQty:0,perUnit:390},
  {id:"K129",dept:"Kitchen",location:"Stores",supplier:"",brand:"S.R.Soorya",name:"Salt 400g",code:"K129",unit:"Grams (g)",stock:12,minQty:10,perUnit:null},
  {id:"K130",dept:"Kitchen",location:"Stores",supplier:"",brand:"First Harvest",name:"Tomato Paste 2.2kg",code:"K130",unit:"Grams (g)",stock:3,minQty:0,perUnit:null},
  {id:"K131",dept:"Kitchen",location:"Stores",supplier:"L B N Food Services Pvt Ltd",brand:"MD",name:"MD Tomato Paste 615g",code:"K131",unit:"Grams (g)",stock:4,minQty:5,perUnit:909.09},
  {id:"K132",dept:"Kitchen",location:"Stores",supplier:"",brand:"Komas",name:"Corn Starch 1kg",code:"K132",unit:"Grams (g)",stock:6,minQty:5,perUnit:null},
  {id:"K133",dept:"Kitchen",location:"Stores",supplier:"",brand:"Komas",name:"Brown Sugar 1kg",code:"K133",unit:"Grams (g)",stock:0,minQty:5,perUnit:290},
  {id:"K134",dept:"Kitchen",location:"Stores",supplier:"L&L Distributors",brand:"San Remo",name:"Fettuccine 500g",code:"K134",unit:"Grams (g)",stock:100,minQty:30,perUnit:826},
  {id:"K135",dept:"Kitchen",location:"Stores",supplier:"L B N Food Service Pvt Ltd",brand:"MD",name:"MD Tomato Puree 600g",code:"K135",unit:"Grams (g)",stock:22,minQty:10,perUnit:727.27},
  {id:"K136",dept:"Kitchen",location:"Stores",supplier:"",brand:"Sera",name:"Sera Coconut Milk 180ml",code:"K136",unit:"Mililitres (ml)",stock:1,minQty:5,perUnit:null},
  {id:"K137",dept:"Kitchen",location:"Stores",supplier:"",brand:"Crying Thaiger",name:"Siracha 200ml",code:"K137",unit:"Mililitres (ml)",stock:0,minQty:3,perUnit:null},
  {id:"K138",dept:"Kitchen",location:"Stores",supplier:"East-West",brand:"Heinz",name:"Heinz Beans 415g",code:"K138",unit:"Grams (g)",stock:9,minQty:7,perUnit:772.90},
  {id:"K139",dept:"Kitchen",location:"Stores",supplier:"",brand:"Kist",name:"Treacle 340g",code:"K139",unit:"Mililitres (ml)",stock:0,minQty:2,perUnit:null},
  {id:"K140",dept:"Kitchen",location:"Stores",supplier:"",brand:"Edingborough",name:"Chocolate Topping 360g",code:"K140",unit:"Mililitres (ml)",stock:1,minQty:2,perUnit:null},
  {id:"K141",dept:"Kitchen",location:"Stores",supplier:"",brand:"Flavorome",name:"Vanilla Flavour 500ml",code:"K141",unit:"Mililitres (ml)",stock:2,minQty:2,perUnit:null},
  {id:"K142",dept:"Kitchen",location:"Stores",supplier:"",brand:"Motha",name:"Motha Cocoa Powder 100g",code:"K142",unit:"Grams (g)",stock:1,minQty:3,perUnit:null},
  {id:"K143",dept:"Kitchen",location:"Stores",supplier:"",brand:"",name:"Hair Net 100s",code:"K143",unit:"Nos",stock:4,minQty:2,perUnit:null},
  {id:"K144",dept:"Kitchen",location:"Stores",supplier:"",brand:"Safety",name:"Disposable Gloves 100s",code:"K144",unit:"Nos",stock:4,minQty:2,perUnit:null},
  {id:"K145",dept:"Kitchen",location:"Stores",supplier:"",brand:"Araliya",name:"Lunch Sheet 500s",code:"K145",unit:"Nos",stock:1,minQty:2,perUnit:null},
  {id:"K146",dept:"Kitchen",location:"Stores",supplier:"",brand:"Flora",name:"Kitchen Towel 30s",code:"K146",unit:"Nos",stock:12,minQty:10,perUnit:null},
  {id:"K147",dept:"Kitchen",location:"Stores",supplier:"Ahamed Palace",brand:"",name:"Baking Paper",code:"K147",unit:"Nos",stock:3,minQty:2,perUnit:null},
  {id:"K148",dept:"Kitchen",location:"Stores",supplier:"",brand:"Edingborough",name:"Mayonnaise 3kg",code:"K148",unit:"Grams (g)",stock:5,minQty:3,perUnit:3564.44},
  {id:"K149",dept:"Kitchen",location:"Stores",supplier:"Sivasakthy",brand:"Star",name:"Star Tissue",code:"K149",unit:"Nos",stock:38,minQty:10,perUnit:1750},
  {id:"K150",dept:"Kitchen",location:"Stores",supplier:"Standard Holdings",brand:"",name:"Greaseproof Paper 100s",code:"K150",unit:"Nos",stock:5,minQty:2,perUnit:1800},
  {id:"K151",dept:"Kitchen",location:"Stores",supplier:"Glomark",brand:"Savoiordi",name:"Ladies Fingers 24s",code:"K151",unit:"Nos",stock:1,minQty:1,perUnit:null},
  {id:"K152",dept:"Kitchen",location:"Stores",supplier:"",brand:"Sivasakthy",name:"Hazelnut 500g",code:"K152",unit:"Grams (g)",stock:0,minQty:2,perUnit:null},
  {id:"K153",dept:"Kitchen",location:"Stores",supplier:"",brand:"Mas",name:"Mas Mustard Seed 100g",code:"K153",unit:"Grams (g)",stock:0,minQty:2,perUnit:153},
  {id:"K154",dept:"Kitchen",location:"Stores",supplier:"",brand:"Mas",name:"Mas Cinnamon Powder 60g",code:"K154",unit:"Grams (g)",stock:5,minQty:2,perUnit:323},
  {id:"K155",dept:"Kitchen",location:"Stores",supplier:"",brand:"Mas",name:"Cumin Powder 100g",code:"K155",unit:"Grams (g)",stock:3,minQty:2,perUnit:408},
  {id:"K156",dept:"Kitchen",location:"Stores",supplier:"",brand:"Mas",name:"Mas Thandori Masala 500g",code:"K156",unit:"Grams (g)",stock:8,minQty:3,perUnit:1652},
  {id:"K157",dept:"Kitchen",location:"Stores",supplier:"Ahamed Polythene",brand:"300x30",name:"Cling Film 300x30",code:"K157",unit:"Nos",stock:3,minQty:2,perUnit:null},
  {id:"K158",dept:"Kitchen",location:"Stores",supplier:"",brand:"5*7",name:"Zip Lock Bag 5x7 100s",code:"K158",unit:"Nos",stock:6,minQty:10,perUnit:null},
  {id:"K159",dept:"Kitchen",location:"Stores",supplier:"",brand:"Rigtbury",name:"Righboury Dark Chocolate 400g",code:"K159",unit:"Grams (g)",stock:0,minQty:2,perUnit:null},
  {id:"K160",dept:"Kitchen",location:"Stores",supplier:"",brand:"",name:"Flat Lid 50s",code:"K160",unit:"Nos",stock:16,minQty:5,perUnit:537.50},
  {id:"K161",dept:"Kitchen",location:"Stores",supplier:"",brand:"",name:"TA Sauce Cup 200s LFP",code:"K161",unit:"Nos",stock:2,minQty:2,perUnit:null},
  {id:"K162",dept:"Kitchen",location:"Stores",supplier:"",brand:"Astra",name:"Astra Margarine 5kg",code:"K162",unit:"Grams (g)",stock:0,minQty:0,perUnit:null},
  {id:"K163",dept:"Kitchen",location:"Stores",supplier:"Ahamed Palace",brand:"Premium",name:"Hand Sanitizer 5L",code:"K163",unit:"Mililitres (ml)",stock:2,minQty:1,perUnit:null},
  {id:"K164",dept:"Kitchen",location:"Stores",supplier:"",brand:"Edingborough",name:"Kithul Treacle",code:"K164",unit:"Mililitres (ml)",stock:1,minQty:1,perUnit:1531.25},
  {id:"K165",dept:"Kitchen",location:"Stores",supplier:"",brand:"",name:"Garbage Bag (M) 100s",code:"K165",unit:"Nos",stock:3,minQty:3,perUnit:null},
  {id:"K166",dept:"Kitchen",location:"Stores",supplier:"",brand:"Mauri",name:"Baking Powder Soda 1kg",code:"K166",unit:"Grams (g)",stock:2,minQty:0,perUnit:5850},
  {id:"K167",dept:"Kitchen",location:"Stores",supplier:"",brand:"",name:"Chia Seeds",code:"K167",unit:"Grams (g)",stock:0,minQty:0,perUnit:null},
  {id:"K168",dept:"Kitchen",location:"Stores",supplier:"",brand:"",name:"TA Sauce Cup 80ml Connected Lid",code:"K168",unit:"Nos",stock:0,minQty:0,perUnit:null},
  {id:"K169",dept:"Kitchen",location:"Stores",supplier:"East-West",brand:"",name:"Almond",code:"K169",unit:"Grams (g)",stock:0,minQty:1,perUnit:5548.60},
  {id:"K170",dept:"Kitchen",location:"Stores",supplier:"Ahamed Polythene",brand:"",name:"Rubber Gloves (Black)",code:"K170",unit:"Nos",stock:1,minQty:0,perUnit:null},
  {id:"K171",dept:"Kitchen",location:"Office",supplier:"Daraz",brand:"",name:"Electronic Kitchen Scale",code:"K171",unit:"Nos",stock:0,minQty:0,perUnit:799},
  {id:"K172",dept:"Kitchen",location:"Stores",supplier:"East-West",brand:"",name:"Oregano Leaves",code:"K172",unit:"Grams (g)",stock:9,minQty:0,perUnit:null},
];

// ── STORAGE ───────────────────────────────────────────────────────────────────
const ITEMS_VERSION="v3";
async function load(key,fb){try{const r=await window.storage.get(key,true);return r?JSON.parse(r.value):fb;}catch{return fb;}}
async function save(key,val){try{await window.storage.set(key,JSON.stringify(val),true);}catch(e){console.warn(e);}}
const CHUNK=150;
async function saveMov(arr){
  const n=Math.max(1,Math.ceil(arr.length/CHUNK));
  for(let i=0;i<n;i++) await save("hz_mov_"+i,arr.slice(i*CHUNK,(i+1)*CHUNK));
  await save("hz_mov_meta",{chunks:n});
  for(let i=n;i<n+10;i++){try{await window.storage.delete("hz_mov_"+i,true);}catch{}}
}
async function loadMov(){
  try{
    const meta=await load("hz_mov_meta",null);
    if(!meta) return await load("hz_movements",[]);
    const parts=await Promise.all(Array.from({length:meta.chunks},(_,i)=>load("hz_mov_"+i,[])));
    return parts.flat();
  }catch{return[];}
}

// ── SHARED UI ─────────────────────────────────────────────────────────────────
const MO="'DM Mono','Courier New',monospace";
const SE="'Cormorant Garamond','Georgia',serif";

function inp(T){return{background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:14,padding:"10px 13px",outline:"none",fontFamily:MO,width:"100%",boxSizing:"border-box",transition:"border-color 0.2s"};}
function Inp({T,value,onChange,placeholder,type="text",s={},onKeyDown}){
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} onKeyDown={onKeyDown} style={{...inp(T),...s}}/>;
}
function Sel({T,value,onChange,children,s={}}){
  return <select value={value} onChange={e=>onChange(e.target.value)} style={{...inp(T),...s}}>{children}</select>;
}
function Btn({T,children,onClick,v="ghost",s={},disabled=false}){
  const vs={primary:{background:T.btnPrimary,color:T.btnPrimaryText,border:"none"},ghost:{background:"transparent",border:`1px solid ${T.border}`,color:T.muted},danger:{background:T.lowBg,border:`1px solid ${T.low}55`,color:T.low},ok:{background:T.okBg,border:`1px solid ${T.ok}55`,color:T.ok}};
  return <button onClick={disabled?undefined:onClick} disabled={disabled} style={{padding:"9px 18px",borderRadius:8,fontWeight:700,cursor:disabled?"not-allowed":"pointer",fontSize:13,fontFamily:MO,opacity:disabled?0.4:1,...(vs[v]||vs.ghost),...s}}>{children}</button>;
}
function Label({T,children}){return <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:5,fontFamily:MO}}>{children}</div>;}
function Card({T,children,s={}}){return <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,boxShadow:T.shadow,...s}}>{children}</div>;}
function DeptBadge({T,dept}){const c=dept==="Front"?T.front:T.kitchen;return <span style={{fontSize:10,fontWeight:700,color:c,background:c+"28",padding:"2px 7px",borderRadius:4,letterSpacing:"0.05em",fontFamily:MO}}>{dept}</span>;}
function RoleBadge({T,role}){const c=roleColor(role,T),b=roleBg(role,T),l={admin:"Admin",supervisor:"Supervisor",counter:"Counter",staff:"Staff"}[role]||role;return <span style={{fontSize:10,fontWeight:700,color:c,background:b,padding:"2px 8px",borderRadius:4,letterSpacing:"0.04em",fontFamily:MO}}>{l}</span>;}
function StockBadge({T,surplus}){
  if(surplus>0) return <span style={{fontSize:11,fontWeight:700,color:T.ok,background:T.okBg,padding:"2px 8px",borderRadius:4,fontFamily:MO}}>+{surplus}</span>;
  if(surplus===0) return <span style={{fontSize:11,fontWeight:700,color:T.muted,background:T.border+"88",padding:"2px 8px",borderRadius:4,fontFamily:MO}}>exact</span>;
  return <span style={{fontSize:11,fontWeight:700,color:T.low,background:T.lowBg,padding:"2px 8px",borderRadius:4,fontFamily:MO}}>{surplus}</span>;
}
function Divider({T}){return <div style={{height:1,background:T.border,margin:"0"}}/>;}

function HazelLogo({T,size=34}){
  const rays=[0,30,60,90,120,150,180,210,240,270,300,330];
  return(
    <svg width={size} height={size*1.1} viewBox="0 0 80 92" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 46 C5 22 18 5 40 5 C62 5 75 22 75 46 L75 88 L5 88 Z" stroke={T.accent} strokeWidth="1.8" fill="none"/>
      {rays.map((a,i)=>{const rad=a*Math.PI/180,x1=40+11*Math.cos(rad),y1=32+11*Math.sin(rad),x2=40+16*Math.cos(rad),y2=32+16*Math.sin(rad);return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={T.accent} strokeWidth="1.2"/>;})}
      <circle cx="40" cy="32" r="4.5" fill={T.accent}/>
      <circle cx="40" cy="32" r="9" stroke={T.accent} strokeWidth="1.2" fill="none"/>
    </svg>
  );
}

function ThemeToggle({T,isDark,onToggle}){
  return(
    <button onClick={onToggle} title={isDark?"Light Mode":"Dark Mode"}
      style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:20,border:`1px solid ${T.border}`,background:T.card,cursor:"pointer",fontFamily:MO,fontSize:11,color:T.muted,transition:"all 0.2s"}}>
      <span style={{fontSize:13}}>{isDark?"☀️":"🌙"}</span>
      <span style={{fontWeight:700}}>{isDark?"Light":"Dark"}</span>
    </button>
  );
}

function ItemSearch({T,items,onSelect,value,onChange}){
  const filtered=useMemo(()=>{
    if(!value.trim()) return [];
    const q=value.toLowerCase();
    return items.filter(i=>i.name.toLowerCase().includes(q)||i.code.toLowerCase().includes(q)||i.dept.toLowerCase().includes(q)).slice(0,12);
  },[items,value]);
  return(
    <div>
      <Inp T={T} value={value} onChange={onChange} placeholder="Type item name or code…"/>
      {value&&filtered.length>0&&(
        <div style={{background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,maxHeight:240,overflowY:"auto",marginTop:4,boxShadow:T.shadow}}>
          {filtered.map(i=>(
            <div key={i.id} onClick={()=>onSelect(i)}
              style={{padding:"10px 14px",cursor:"pointer",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}
              onMouseEnter={e=>e.currentTarget.style.background=T.card2}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:T.text}}>{i.name}</div>
                <div style={{fontSize:11,color:T.muted,marginTop:2,display:"flex",gap:6,alignItems:"center"}}>
                  <DeptBadge T={T} dept={i.dept}/>
                  <span style={{fontFamily:MO}}>{i.code} · {i.unit}</span>
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:15,fontWeight:700,color:i.stock<=0?T.low:i.stock<i.minQty?T.warn:T.ok,fontFamily:MO}}>{i.stock}</div>
                <div style={{fontSize:10,color:T.muted}}>in stock</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {value&&filtered.length===0&&<div style={{padding:"10px 14px",color:T.muted,fontSize:13,fontStyle:"italic"}}>No items found</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD — real OTP flow via /api/send-reset
// ══════════════════════════════════════════════════════════════════════════════
function ForgotPasswordFlow({T,users,setUsers,onBack}){
  // steps: "email" → "verify" → "reset" → "done"
  const [step,setStep]=useState("email");
  const [email,setEmail]=useState("");
  const [error,setError]=useState("");
  const [found,setFound]=useState(null);
  const secretCodeRef=useRef("");   // NEVER put in state that gets rendered
  const [typedCode,setTypedCode]=useState("");
  const [sending,setSending]=useState(false);
  const [newPw,setNewPw]=useState("");
  const [confirmPw,setConfirmPw]=useState("");
  const [showNew,setShowNew]=useState(false);
  const [attemptsLeft,setAttemptsLeft]=useState(5);

  const genCode=()=>{
    const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({length:6},()=>chars[Math.floor(Math.random()*chars.length)]).join("");
  };

  // ── Step 1: find account, generate & send code via API ───────────────────
  const sendCode=async()=>{
    setError("");
    if(!email.trim()){setError("Please enter your email address.");return;}
    const u=users.find(u=>u.email&&u.email.toLowerCase()===email.trim().toLowerCase()&&u.active);
    if(!u){
      // Security: don't reveal if email exists or not — generic message
      setError("If that email is registered, a code will be sent. Check your inbox.");
      return;
    }
    if(!u.email){
      setError("No email address is linked to this account. Contact your admin.");
      return;
    }
    const code=genCode();
    secretCodeRef.current=code;   // store only in ref — never rendered
    setFound(u);
    setSending(true);
    try{
      const res=await fetch("/api/send-reset",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({to:u.email,name:u.name,code}),
      });
      if(!res.ok){
        const data=await res.json().catch(()=>({}));
        throw new Error(data.error||"Server error");
      }
      setStep("verify");
    }catch(e){
      setError("Failed to send email: "+e.message+". Check your Vercel environment variables.");
    }finally{
      setSending(false);
    }
  };

  // ── Step 2: verify OTP ────────────────────────────────────────────────────
  const verifyCode=()=>{
    setError("");
    if(!typedCode.trim()){setError("Please enter the code from your email.");return;}
    if(typedCode.trim().toUpperCase()!==secretCodeRef.current){
      const left=attemptsLeft-1;
      setAttemptsLeft(left);
      if(left<=0){
        secretCodeRef.current="";
        setError("Too many wrong attempts. Please start over.");
        setTimeout(()=>{setStep("email");setTypedCode("");setAttemptsLeft(5);setFound(null);setEmail("");setError("");},2000);
        return;
      }
      setError(`Incorrect code. ${left} attempt${left!==1?"s":""} remaining.`);
      return;
    }
    secretCodeRef.current="";  // clear immediately after successful verify
    setStep("reset");
  };

  // ── Step 3: set new password ──────────────────────────────────────────────
  const setFinalPw=()=>{
    setError("");
    if(newPw.length<6){setError("Password must be at least 6 characters.");return;}
    if(newPw!==confirmPw){setError("Passwords do not match.");return;}
    setUsers(prev=>prev.map(p=>p.id===found.id?{...p,password:newPw,tempPw:undefined}:p));
    setStep("done");
  };

  // ── Done ──────────────────────────────────────────────────────────────────
  if(step==="done") return(
    <Card T={T} s={{padding:32,textAlign:"center"}}>
      <div style={{fontSize:44,marginBottom:14}}>✓</div>
      <div style={{fontSize:20,fontWeight:600,fontFamily:SE,color:T.ok,marginBottom:8}}>Password Updated</div>
      <div style={{fontSize:13,color:T.muted,marginBottom:24,lineHeight:1.7}}>
        Your password has been successfully reset.<br/>You can now sign in with your new password.
      </div>
      <Btn T={T} v="primary" onClick={onBack} s={{width:"100%",padding:"13px",fontFamily:SE,fontWeight:600,fontSize:15}}>
        ← Back to Sign In
      </Btn>
    </Card>
  );

  // ── Step 3: new password form ─────────────────────────────────────────────
  if(step==="reset") return(
    <Card T={T} s={{padding:32}}>
      <div style={{marginBottom:4}}>
        <div style={{fontSize:18,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:4}}>Set New Password</div>
        <div style={{fontSize:12,color:T.muted,fontFamily:MO,marginBottom:16}}>
          Account: <strong style={{color:T.accent}}>{found?.name}</strong>
        </div>
      </div>
      <div style={{background:T.okBg,border:`1px solid ${T.ok}44`,borderRadius:8,padding:"10px 14px",marginBottom:20,fontSize:12,color:T.ok,fontFamily:MO}}>
        ✓ Identity verified — choose a new password below
      </div>
      <div style={{display:"grid",gap:13,marginBottom:18}}>
        <div>
          <Label T={T}>New Password</Label>
          <div style={{position:"relative"}}>
            <Inp T={T} type={showNew?"text":"password"} value={newPw} onChange={setNewPw} placeholder="At least 6 characters" s={{paddingRight:46}}/>
            <button onClick={()=>setShowNew(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15,padding:2,lineHeight:1}}>{showNew?"🙈":"👁"}</button>
          </div>
        </div>
        <div>
          <Label T={T}>Confirm New Password</Label>
          <Inp T={T} type="password" value={confirmPw} onChange={setConfirmPw} placeholder="Repeat new password" onKeyDown={e=>e.key==="Enter"&&setFinalPw()}/>
        </div>
      </div>
      {error&&<div style={{background:T.lowBg,border:`1px solid ${T.low}44`,borderRadius:8,padding:"10px 14px",fontSize:12,color:T.low,marginBottom:14,fontFamily:MO}}>⚠ {error}</div>}
      <div style={{display:"flex",gap:10}}>
        <Btn T={T} onClick={onBack} s={{flex:1}}>Cancel</Btn>
        <Btn T={T} v="primary" onClick={setFinalPw} s={{flex:2,padding:"12px",fontFamily:SE,fontWeight:600}} disabled={!newPw||!confirmPw}>
          Set New Password
        </Btn>
      </div>
    </Card>
  );

  // ── Step 2: enter code ────────────────────────────────────────────────────
  if(step==="verify") return(
    <Card T={T} s={{padding:32}}>
      <div style={{marginBottom:18}}>
        <div style={{fontSize:18,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:6}}>Enter Reset Code</div>
        <div style={{fontSize:12,color:T.muted,lineHeight:1.7}}>
          A 6-character code was sent to<br/>
          <strong style={{color:T.accent}}>{found?.email}</strong>.<br/>
          Check your inbox and enter it below.
        </div>
      </div>

      <div style={{background:T.okBg,border:`1px solid ${T.ok}44`,borderRadius:8,padding:"9px 13px",marginBottom:18,fontSize:12,color:T.ok,fontFamily:MO,display:"flex",alignItems:"center",gap:8}}>
        <span>✉</span> Email sent — check your inbox (and spam folder)
      </div>

      <div style={{marginBottom:18}}>
        <Label T={T}>6-Character Code</Label>
        <input
          value={typedCode}
          onChange={e=>setTypedCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6))}
          onKeyDown={e=>e.key==="Enter"&&typedCode.length===6&&verifyCode()}
          placeholder="A3K9PZ"
          maxLength={6}
          autoComplete="one-time-code"
          style={{
            ...inp(T),
            fontSize:32,fontWeight:800,textAlign:"center",letterSpacing:"0.4em",
            fontFamily:MO,padding:"16px 13px",
            border:`2px solid ${typedCode.length===6?T.accent:T.border}`,
            transition:"border-color 0.2s",
          }}
        />
        <div style={{fontSize:10,color:T.muted,marginTop:6,fontFamily:MO,textAlign:"center"}}>
          Uppercase letters &amp; numbers · {6-typedCode.length} characters remaining
        </div>
      </div>

      {error&&(
        <div style={{background:T.lowBg,border:`1px solid ${T.low}44`,borderRadius:8,padding:"10px 14px",fontSize:12,color:T.low,marginBottom:14,fontFamily:MO}}>
          ⚠ {error}
        </div>
      )}

      <div style={{display:"flex",gap:10,marginBottom:14}}>
        <Btn T={T} onClick={onBack} s={{flex:1}}>Cancel</Btn>
        <Btn T={T} v="primary" onClick={verifyCode} s={{flex:2,padding:"12px",fontFamily:SE,fontWeight:600}} disabled={typedCode.length!==6}>
          Verify Code →
        </Btn>
      </div>

      <div style={{textAlign:"center",paddingTop:8,borderTop:`1px solid ${T.border}`}}>
        <div style={{fontSize:11,color:T.muted,marginBottom:6}}>Didn't receive the email?</div>
        <button
          onClick={()=>{setStep("email");setTypedCode("");setError("");setAttemptsLeft(5);setFound(null);secretCodeRef.current="";}}
          style={{background:"none",border:"none",color:T.accent,cursor:"pointer",fontSize:12,fontFamily:MO,fontWeight:700,textDecoration:"underline"}}>
          ← Try a different email / resend
        </button>
      </div>
    </Card>
  );

  // ── Step 1: email entry ───────────────────────────────────────────────────
  return(
    <Card T={T} s={{padding:32}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:18,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:6}}>Forgot Password</div>
        <div style={{fontSize:12,color:T.muted,lineHeight:1.7}}>
          Enter your account email address. We'll send a 6-character reset code directly to your inbox — you'll need to type it back here to continue.
        </div>
      </div>
      <div style={{marginBottom:16}}>
        <Label T={T}>Email Address</Label>
        <Inp T={T} value={email} onChange={setEmail} placeholder="your@email.com" type="email" onKeyDown={e=>e.key==="Enter"&&!sending&&sendCode()}/>
      </div>
      {error&&<div style={{background:T.lowBg,border:`1px solid ${T.low}44`,borderRadius:8,padding:"10px 14px",fontSize:12,color:T.low,marginBottom:14,fontFamily:MO}}>⚠ {error}</div>}
      <div style={{display:"flex",gap:10}}>
        <Btn T={T} onClick={onBack} s={{flex:1}}>← Back</Btn>
        <Btn T={T} v="primary" onClick={sendCode} disabled={!email.trim()||sending} s={{flex:2,padding:"12px",fontFamily:SE,fontWeight:600}}>
          {sending?"Sending…":"Send Reset Code →"}
        </Btn>
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function LoginScreen({T,isDark,onToggle,users,setUsers,onLogin}){
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [showPass,setShowPass]=useState(false);
  const [shake,setShake]=useState(false);
  const [showForgot,setShowForgot]=useState(false);

  const attempt=()=>{
    const u=users.find(u=>u.username===username.trim()&&u.password===password&&u.active);
    if(u){setError("");onLogin(u);}
    else{setError("Invalid username or password");setShake(true);setTimeout(()=>setShake(false),500);}
  };

  return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:SE,padding:20,position:"relative",overflow:"hidden",transition:"background 0.25s"}}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}} @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{position:"absolute",inset:0,backgroundImage:`radial-gradient(${T.border} 1.2px,transparent 0)`,backgroundSize:"24px 24px",opacity:isDark?0.5:0.6,pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"-2%",right:"-2%",opacity:0.055,pointerEvents:"none",transform:"rotate(-10deg)"}}><HazelLogo T={T} size={280}/></div>
      <div style={{position:"absolute",top:"5%",left:"-1%",opacity:0.03,pointerEvents:"none",transform:"rotate(15deg)"}}><HazelLogo T={T} size={180}/></div>
      <div style={{position:"absolute",top:16,right:16}}><ThemeToggle T={T} isDark={isDark} onToggle={onToggle}/></div>
      <CreatorStamp T={T}/>

      <div style={{width:"100%",maxWidth:420,position:"relative",animation:"fadeUp 0.5s ease"}}>
        <div style={{textAlign:"center",marginBottom:30}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><HazelLogo T={T} size={60}/></div>
          <div style={{fontSize:32,fontWeight:600,color:T.accent,letterSpacing:"0.18em",textTransform:"uppercase",lineHeight:1}}>Hazel</div>
          <div style={{fontSize:11,color:T.muted,letterSpacing:"0.35em",textTransform:"uppercase",marginTop:3}}>Cafe &amp; Cakery</div>
          <div style={{display:"flex",alignItems:"center",gap:10,margin:"14px 0 0",justifyContent:"center"}}>
            <div style={{flex:1,height:"1px",background:`linear-gradient(to right,transparent,${T.border})`}}/>
            <div style={{fontSize:9,color:T.muted,letterSpacing:"0.2em",textTransform:"uppercase"}}>Inventory</div>
            <div style={{flex:1,height:"1px",background:`linear-gradient(to left,transparent,${T.border})`}}/>
          </div>
        </div>

        {showForgot?(
          <ForgotPasswordFlow T={T} users={users} setUsers={setUsers} onBack={()=>setShowForgot(false)}/>
        ):(
          <>
            <Card T={T} s={{padding:32,animation:shake?"shake 0.45s ease":"none"}}>
              <div style={{marginBottom:16}}>
                <Label T={T}>Username</Label>
                <Inp T={T} value={username} onChange={setUsername} placeholder="Enter username" onKeyDown={e=>e.key==="Enter"&&attempt()}/>
              </div>
              <div style={{marginBottom:6,position:"relative"}}>
                <Label T={T}>Password</Label>
                <div style={{position:"relative"}}>
                  <Inp T={T} value={password} onChange={setPassword} type={showPass?"text":"password"} placeholder="Enter password" s={{paddingRight:44}} onKeyDown={e=>e.key==="Enter"&&attempt()}/>
                  <button onClick={()=>setShowPass(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15,padding:2,lineHeight:1}}>{showPass?"🙈":"👁"}</button>
                </div>
              </div>
              <div style={{textAlign:"right",marginBottom:16}}>
                <button onClick={()=>{setShowForgot(true);setError("");}} style={{background:"none",border:"none",color:T.accent,cursor:"pointer",fontSize:11,fontFamily:MO,padding:0,textDecoration:"underline",opacity:0.8}}>Forgot password?</button>
              </div>
              {error&&<div style={{background:T.lowBg,border:`1px solid ${T.low}44`,borderRadius:8,padding:"10px 14px",fontSize:12,color:T.low,marginBottom:16,fontFamily:MO}}>⚠ {error}</div>}
              <Btn T={T} v="primary" onClick={attempt} s={{width:"100%",padding:"13px",fontSize:14,letterSpacing:"0.1em",fontFamily:SE,fontWeight:600}}>Sign In</Btn>
            </Card>


          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CAMERA SCANNER
// ══════════════════════════════════════════════════════════════════════════════
function CameraScanner({T,items,onSelect,onClose}){
  const [mode,setMode]=useState("barcode");
  const [camError,setCamError]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  const [aiResult,setAiResult]=useState(null);
  const [barcodeResult,setBarcodeResult]=useState(null);
  const [torchOn,setTorchOn]=useState(false);
  const [videoReady,setVideoReady]=useState(false);
  const [scanning,setScanning]=useState(false);
  const videoRef=useRef(null);
  const canvasRef=useRef(null);
  const streamRef=useRef(null);
  const scanTimerRef=useRef(null);
  const detectorRef=useRef(null);
  const activeRef=useRef(true);

  useEffect(()=>{
    activeRef.current=true;
    (async()=>{
      try{
        const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}}});
        if(!activeRef.current){s.getTracks().forEach(t=>t.stop());return;}
        streamRef.current=s;
        const vid=videoRef.current;
        if(vid){vid.srcObject=s;vid.oncanplay=()=>{if(!activeRef.current)return;vid.play().then(()=>{if(activeRef.current)setVideoReady(true);}).catch(()=>{});};}
      }catch(e){
        if(activeRef.current){
          if(e.name==="NotAllowedError"||e.name==="PermissionDeniedError") setCamError("Camera permission denied.");
          else if(e.name==="NotFoundError") setCamError("No camera found.");
          else setCamError("Could not start camera: "+e.message);
        }
      }
    })();
    return()=>{activeRef.current=false;cleanup();};
  },[]);

  const cleanup=()=>{clearInterval(scanTimerRef.current);if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop());streamRef.current=null;}};

  useEffect(()=>{
    clearInterval(scanTimerRef.current);
    if(mode!=="barcode"||!videoReady||barcodeResult) return;
    if(!("BarcodeDetector" in window)){setCamError("Barcode scanning requires Chrome on Android/desktop. Try AI Identify instead.");return;}
    if(!detectorRef.current){try{detectorRef.current=new window.BarcodeDetector({formats:["ean_13","ean_8","upc_a","upc_e","code_128","code_39","code_93","qr_code","data_matrix","itf","codabar"]});}catch(e){setCamError("BarcodeDetector failed: "+e.message);return;}}
    setScanning(true);
    scanTimerRef.current=setInterval(async()=>{
      const vid=videoRef.current;
      if(!vid||!activeRef.current) return;
      if(vid.readyState<2||vid.videoWidth===0||vid.videoHeight===0) return;
      try{
        const codes=await detectorRef.current.detect(vid);
        if(codes.length>0&&activeRef.current){
          clearInterval(scanTimerRef.current);setScanning(false);
          const raw=codes[0].rawValue.trim();
          const found=items.find(i=>i.barcode===raw||i.code===raw||i.code.toLowerCase()===raw.toLowerCase())||null;
          setBarcodeResult({code:raw,item:found});
        }
      }catch{}
    },400);
    return()=>{clearInterval(scanTimerRef.current);setScanning(false);};
  },[mode,videoReady,barcodeResult,items]);

  const switchMode=(m)=>{setBarcodeResult(null);setAiResult(null);setCamError("");setScanning(false);clearInterval(scanTimerRef.current);setMode(m);};
  const rescan=()=>{setBarcodeResult(null);setAiResult(null);setCamError("");setScanning(false);setVideoReady(false);setTimeout(()=>{if(activeRef.current)setVideoReady(true);},80);};
  const toggleTorch=async()=>{const track=streamRef.current?.getVideoTracks()[0];if(!track)return;const caps=track.getCapabilities?.()??{};if(!caps.torch){setCamError("Torch not available.");return;}try{await track.applyConstraints({advanced:[{torch:!torchOn}]});setTorchOn(p=>!p);}catch{}};

  const aiIdentify=async()=>{
    const vid=videoRef.current;const can=canvasRef.current;
    if(!vid||!can) return;
    setAiLoading(true);setAiResult(null);setCamError("");
    try{
      can.width=vid.videoWidth||640;can.height=vid.videoHeight||480;
      can.getContext("2d").drawImage(vid,0,0);
      const base64=can.toDataURL("image/jpeg",0.85).split(",")[1];
      const itemList=items.map(i=>`${i.code}: ${i.name} (${i.dept}, ${i.unit}${i.brand?", "+i.brand:""})`).join("\n");
      // Route through Vercel API to avoid CORS — api/ai-identify.js
      const res=await fetch("/api/ai-identify",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({imageBase64:base64,itemList}),
      });
      if(!activeRef.current) return;
      if(!res.ok){const d=await res.json().catch(()=>({}));throw new Error(d.error||"Server error "+res.status);}
      const data=await res.json();
      const item=data.found?items.find(i=>i.code===data.code)||null:null;
      if(activeRef.current) setAiResult({found:data.found,item,parsed:data});
    }catch(e){if(activeRef.current) setCamError("AI identification failed — "+e.message);}
    if(activeRef.current) setAiLoading(false);
  };

  const confirmItem=(item)=>{cleanup();onSelect(item);onClose();};

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:10,fontFamily:MO}}>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,width:"100%",maxWidth:480,maxHeight:"95vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 12px 48px rgba(0,0,0,0.7)"}}>
        <div style={{padding:"13px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10,background:T.card2,flexShrink:0}}>
          <span style={{fontSize:18}}>📷</span>
          <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:SE}}>Camera Scanner</div><div style={{fontSize:10,color:T.muted,marginTop:1}}>Point at barcode or product label</div></div>
          <button onClick={toggleTorch} style={{background:torchOn?T.warnBg:"transparent",border:`1px solid ${torchOn?T.warn:T.border}`,borderRadius:6,padding:"5px 8px",cursor:"pointer",fontSize:14,color:torchOn?T.warn:T.muted,lineHeight:1}}>🔦</button>
          <button onClick={()=>{cleanup();onClose();}} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 11px",cursor:"pointer",color:T.muted,fontFamily:MO,fontSize:12,fontWeight:700}}>✕</button>
        </div>
        <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0,background:T.bg}}>
          {[{key:"barcode",icon:"▦",label:"Scan Barcode"},{key:"ai",icon:"✦",label:"AI Identify"}].map(m=>(
            <button key={m.key} onClick={()=>switchMode(m.key)} style={{flex:1,padding:"10px 8px",border:"none",background:mode===m.key?T.accentDim:"transparent",color:mode===m.key?T.accent:T.muted,fontWeight:700,cursor:"pointer",fontFamily:MO,fontSize:12,borderBottom:mode===m.key?`2px solid ${T.accent}`:"2px solid transparent",transition:"all 0.15s"}}>{m.icon} {m.label}</button>
          ))}
        </div>
        <div style={{position:"relative",background:"#000",flexShrink:0,overflow:"hidden",height:220}}>
          <video ref={videoRef} autoPlay playsInline muted style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
          <canvas ref={canvasRef} style={{display:"none"}}/>
          {!videoReady&&!camError&&(<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,background:"#000"}}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><div style={{width:28,height:28,border:"2px solid #ffffff22",borderTopColor:"#ffffff88",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><div style={{fontSize:11,color:"#aaa",letterSpacing:"0.08em"}}>Starting camera…</div></div>)}
          {mode==="barcode"&&videoReady&&!barcodeResult&&(<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}><div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.42)"}}/><div style={{position:"relative",width:"72%",maxWidth:260,height:70,zIndex:2}}>{[{t:0,l:0,bt:"border-top",bl:"border-left"},{t:0,r:0,bt:"border-top",bl:"border-right"},{b:0,l:0,bt:"border-bottom",bl:"border-left"},{b:0,r:0,bt:"border-bottom",bl:"border-right"}].map((c,i)=>(<div key={i} style={{position:"absolute",top:c.t,left:c.l,right:c.r,bottom:c.b,width:18,height:18,borderTop:c.bt==="border-top"?`3px solid ${T.accent}`:"none",borderBottom:c.bt==="border-bottom"?`3px solid ${T.accent}`:"none",borderLeft:c.bl==="border-left"?`3px solid ${T.accent}`:"none",borderRight:c.bl==="border-right"?`3px solid ${T.accent}`:"none"}}/>))}{scanning&&(<><style>{`@keyframes scanbeam{0%{top:4px;opacity:1}45%{opacity:1}50%{top:calc(100% - 4px);opacity:1}51%{opacity:0}52%{top:4px;opacity:0}55%{opacity:1}100%{top:4px;opacity:1}}`}</style><div style={{position:"absolute",left:2,right:2,height:2,background:`linear-gradient(to right,transparent,${T.accent},${T.accent},transparent)`,animation:"scanbeam 1.8s ease-in-out infinite",boxShadow:`0 0 6px ${T.accent}`}}/></>)}</div><div style={{position:"absolute",bottom:8,left:0,right:0,textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.7)",letterSpacing:"0.1em",textTransform:"uppercase",zIndex:2}}>{scanning?"Scanning…":"Waiting for video…"}</div></div>)}
          {mode==="ai"&&videoReady&&!aiLoading&&!aiResult&&(<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}><div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.3)"}}/><div style={{position:"relative",width:140,height:140,border:`2px dashed ${T.accent}99`,borderRadius:12,zIndex:2}}/><div style={{position:"absolute",bottom:8,fontSize:10,color:"rgba(255,255,255,0.7)",letterSpacing:"0.1em",textTransform:"uppercase",zIndex:3}}>Frame the item</div></div>)}
          {aiLoading&&(<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}><div style={{width:32,height:32,border:`3px solid ${T.accent}33`,borderTopColor:T.accent,borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/><div style={{fontSize:11,color:T.accent,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>Identifying…</div></div>)}
        </div>
        <div style={{padding:14,overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:10}}>
          {camError&&(<div style={{background:T.lowBg,border:`1px solid ${T.low}44`,borderRadius:8,padding:"10px 13px",fontSize:12,color:T.low,lineHeight:1.5}}>⚠ {camError}</div>)}
          {mode==="barcode"&&barcodeResult&&(<div style={{display:"flex",flexDirection:"column",gap:10}}><div style={{background:T.accentDim,border:`1px solid ${T.accent}44`,borderRadius:8,padding:"9px 13px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:9,fontWeight:700,color:T.accent,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2}}>Barcode Detected</div><div style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:MO,letterSpacing:"0.04em"}}>{barcodeResult.code}</div></div><span style={{fontSize:18}}>✓</span></div>{barcodeResult.item?(<MatchedItemCard T={T} item={barcodeResult.item} label="Matched to inventory" onConfirm={()=>confirmItem(barcodeResult.item)}/>):(<div style={{background:T.warnBg,border:`1px solid ${T.warn}44`,borderRadius:8,padding:"10px 13px",fontSize:12,color:T.warn,lineHeight:1.5}}><strong>{barcodeResult.code}</strong> not in inventory.</div>)}<button onClick={rescan} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:8,padding:"9px",color:T.muted,cursor:"pointer",fontFamily:MO,fontSize:12,fontWeight:700}}>↺ Scan Again</button></div>)}
          {mode==="ai"&&aiResult&&(<div style={{display:"flex",flexDirection:"column",gap:10}}>{aiResult.found&&aiResult.item?(<><div style={{background:T.accentDim,border:`1px solid ${T.accent}33`,borderRadius:8,padding:"9px 13px",fontSize:12,color:T.muted,lineHeight:1.5}}><span style={{fontWeight:700,color:T.accent}}>✦ AI saw: </span>{aiResult.parsed.seen}{aiResult.parsed.confidence&&(<span style={{marginLeft:8,fontSize:10,fontWeight:700,color:aiResult.parsed.confidence==="high"?T.ok:T.warn,background:aiResult.parsed.confidence==="high"?T.okBg:T.warnBg,padding:"1px 6px",borderRadius:4,fontFamily:MO}}>{aiResult.parsed.confidence}</span>)}</div><MatchedItemCard T={T} item={aiResult.item} label="AI identified" onConfirm={()=>confirmItem(aiResult.item)}/></>):(<div style={{background:T.warnBg,border:`1px solid ${T.warn}44`,borderRadius:8,padding:"12px 13px",fontSize:12,color:T.warn,lineHeight:1.5}}><div style={{fontWeight:700,marginBottom:4}}>✦ Could not identify</div><div style={{color:T.muted}}>{aiResult.parsed.description}</div>{aiResult.parsed.suggestion&&<div style={{marginTop:5,color:T.text}}>Closest: <strong>{aiResult.parsed.suggestion}</strong></div>}</div>)}<button onClick={rescan} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:8,padding:"9px",color:T.muted,cursor:"pointer",fontFamily:MO,fontSize:12,fontWeight:700}}>↺ Try Again</button></div>)}
          {mode==="ai"&&!aiLoading&&!aiResult&&videoReady&&(<button onClick={aiIdentify} style={{background:T.btnPrimary,border:"none",borderRadius:10,padding:"13px",color:T.btnPrimaryText,cursor:"pointer",fontFamily:SE,fontWeight:600,fontSize:15,letterSpacing:"0.06em",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span>✦</span> Capture & Identify</button>)}
          {mode==="barcode"&&!barcodeResult&&!camError&&videoReady&&(<div style={{fontSize:10,color:T.muted,textAlign:"center",lineHeight:1.7,padding:"2px 0"}}>Keep barcode steady inside the frame.<br/>Supports EAN-13, EAN-8, UPC, Code-128, QR and more.<br/><span style={{color:T.accent}}>Tip: Add barcodes to items in Inventory → Edit.</span></div>)}
          {mode==="ai"&&!aiResult&&!aiLoading&&(<div style={{fontSize:10,color:T.muted,textAlign:"center",lineHeight:1.7}}>Frame the product label clearly, then tap Capture.<br/>Works best with visible brand name or label text.</div>)}
        </div>
      </div>
    </div>
  );
}

function MatchedItemCard({T,item,label,onConfirm}){
  return(
    <div style={{background:T.okBg,border:`1px solid ${T.ok}44`,borderRadius:10,padding:"14px 16px"}}>
      <div style={{fontSize:10,fontWeight:700,color:T.ok,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>{label}</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:12}}>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:600,color:T.text,fontFamily:SE,marginBottom:3}}>{item.name}</div>
          <div style={{fontSize:11,color:T.muted,fontFamily:MO,display:"flex",gap:8,flexWrap:"wrap"}}>
            <span style={{fontWeight:700,color:item.stock<=0?"#c0524a":item.stock<item.minQty?"#c9966b":"#5a9e72"}}>{item.stock} in stock</span>
            <span>·</span><span>{item.code}</span><span>·</span><span>{item.unit}</span>
          </div>
        </div>
        <div style={{flexShrink:0,fontSize:22,fontWeight:800,color:item.stock<=0?"#c0524a":item.stock<item.minQty?"#c9966b":"#5a9e72",fontFamily:MO}}>{item.stock}</div>
      </div>
      <button onClick={onConfirm} style={{width:"100%",background:"#5a9e72",border:"none",borderRadius:8,padding:"11px",color:"#fff",cursor:"pointer",fontFamily:MO,fontWeight:700,fontSize:14,letterSpacing:"0.06em"}}>✓ Use This Item</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STOCK MOVEMENT
// ══════════════════════════════════════════════════════════════════════════════
function MovementTab({T,type,items,movements,setMovements,setItems,currentUser}){
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState(null);
  const [qty,setQty]=useState("");
  const [note,setNote]=useState("");
  const [success,setSuccess]=useState(null);
  const [showCam,setShowCam]=useState(false);
  const [confirmOverdraw,setConfirmOverdraw]=useState(false);
  const [undoTimer,setUndoTimer]=useState(null);
  const [lastMov,setLastMov]=useState(null);
  const isMobile=useIsMobile();
  const isOut=type==="out";

  // Clean up undo timer on unmount
  useEffect(()=>()=>{if(undoTimer) clearTimeout(undoTimer);},[undoTimer]);

  const doPost=(forceNegative=false)=>{
    if(!selected||!qty||Number(qty)<=0) return;
    const n=Number(qty);
    const newStock=isOut?selected.stock-n:selected.stock+n;

    // Bug 1 fix: warn before going negative
    if(isOut && newStock<0 && !forceNegative){
      setConfirmOverdraw(true);
      return;
    }
    setConfirmOverdraw(false);

    const mov={id:uid(),type,timestamp:nowStr(),personName:currentUser.name,userId:currentUser.id,userRole:currentUser.role,dept:selected.dept,code:selected.code,itemName:selected.name,qty:n,prevStock:selected.stock,newStock,note:note.trim()||null};

    // Bug 3 fix: use functional updater to avoid stale closure race with poll
    setMovements(prev=>{
      // deduplicate — if poll already wrote this id, skip
      if(prev.find(m=>m.id===mov.id)) return prev;
      return [mov,...prev];
    });
    setItems(prev=>prev.map(i=>i.id===selected.id?{...i,stock:newStock}:i));

    setLastMov(mov);
    setSuccess({...mov});
    setSelected(null);setQty("");setSearch("");setNote("");

    // Undo window: 60 seconds
    if(undoTimer) clearTimeout(undoTimer);
    const t=setTimeout(()=>{setLastMov(null);setSuccess(null);},60000);
    setUndoTimer(t);
  };

  const doUndo=()=>{
    if(!lastMov) return;
    // Reverse the movement
    setItems(prev=>prev.map(i=>i.code===lastMov.code?{...i,stock:lastMov.prevStock}:i));
    setMovements(prev=>prev.filter(m=>m.id!==lastMov.id));
    setLastMov(null);setSuccess(null);
    if(undoTimer) clearTimeout(undoTimer);
  };

  const recent=movements.filter(m=>m.type===type).slice(0,30);

  return(
    <>
    {showCam&&<CameraScanner T={T} items={items} onSelect={i=>{setSelected(i);setSearch(i.name+" ("+i.code+")");}} onClose={()=>setShowCam(false)}/>}

    {/* Overdraw confirmation modal */}
    {confirmOverdraw&&selected&&(
      <div style={{position:"fixed",inset:0,background:"#000a",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <Card T={T} s={{padding:28,width:400,maxWidth:"100%"}}>
          <div style={{fontSize:18,fontWeight:600,fontFamily:SE,color:T.low,marginBottom:8}}>Stock will go negative</div>
          <div style={{fontSize:13,color:T.muted,lineHeight:1.7,marginBottom:20}}>
            <strong style={{color:T.text}}>{selected.name}</strong> only has <strong style={{color:T.low}}>{selected.stock}</strong> in stock but you're taking out <strong style={{color:T.low}}>{Number(qty)}</strong>. Stock will become <strong style={{color:T.low}}>{selected.stock-Number(qty)}</strong>.<br/><br/>Are you sure?
          </div>
          <div style={{display:"flex",gap:10}}>
            <Btn T={T} onClick={()=>setConfirmOverdraw(false)} s={{flex:1}}>Cancel</Btn>
            <button onClick={()=>doPost(true)} style={{flex:2,padding:"11px",borderRadius:8,background:T.low,border:"none",color:"#fff",fontFamily:MO,fontSize:13,fontWeight:700,cursor:"pointer"}}>Yes, Record Anyway</button>
          </div>
        </Card>
      </div>
    )}

    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16,alignItems:"start"}}>
      <Card T={T} s={{padding:22}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <div style={{width:28,height:28,borderRadius:7,background:isOut?T.lowBg:T.okBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:isOut?T.low:T.ok,fontFamily:MO}}>{isOut?"\u2191":"\u2193"}</div>
          <div style={{fontSize:13,fontWeight:700,color:isOut?T.low:T.ok,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:MO}}>{isOut?"Stock Out":"Stock In"}</div>
        </div>
        <div style={{fontSize:12,color:T.muted,marginBottom:18,fontFamily:MO}}>as <strong style={{color:T.accent}}>{currentUser.name}</strong></div>
        <div style={{display:"grid",gap:14}}>
          <div>
            <Label T={T}>Search Item</Label>
            <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
              <div style={{flex:1}}><ItemSearch T={T} items={items} value={search} onChange={v=>{setSearch(v);setSelected(null);}} onSelect={i=>{setSelected(i);setSearch(i.name+" ("+i.code+")");}} /></div>
              <button onClick={()=>setShowCam(true)} title="Scan barcode or use AI" style={{flexShrink:0,height:44,width:48,borderRadius:8,border:`1px solid ${T.accent}55`,background:T.accentDim,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1}}>
                <span style={{fontSize:18,lineHeight:1}}>📷</span>
                <span style={{fontSize:7,color:T.accent,fontWeight:700,letterSpacing:"0.04em",fontFamily:MO}}>SCAN</span>
              </button>
            </div>
          </div>
          {selected&&(
            <div style={{background:isOut?T.lowBg:T.okBg,border:`1px solid ${isOut?T.low:T.ok}33`,borderRadius:10,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontWeight:600,fontSize:14,color:T.text,fontFamily:SE}}>{selected.name}</div><div style={{fontSize:11,color:T.muted,marginTop:3,fontFamily:MO}}>{selected.code} · {selected.unit}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:20,fontWeight:800,color:selected.stock<=0?T.low:selected.stock<selected.minQty?T.warn:T.ok,fontFamily:MO}}>{selected.stock}</div><div style={{fontSize:10,color:T.muted}}>current</div></div>
            </div>
          )}
          <div>
            <Label T={T}>Quantity {isOut?"Taken":"Received"}</Label>
            <Inp T={T} type="number" value={qty} onChange={setQty} placeholder="0" s={{fontSize:28,fontWeight:700,textAlign:"center",fontFamily:MO}} onKeyDown={e=>e.key==="Enter"&&doPost()}/>
          </div>
          {selected&&qty&&Number(qty)>0&&(
            <div style={{background:isOut&&selected.stock-Number(qty)<0?T.lowBg:T.accentDim,border:`1px solid ${isOut&&selected.stock-Number(qty)<0?T.low:T.accent}33`,borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:T.muted}}>New stock will be</span>
              <span style={{fontSize:18,fontWeight:800,color:isOut&&selected.stock-Number(qty)<0?T.low:T.accent,fontFamily:MO}}>{isOut?selected.stock-Number(qty):selected.stock+Number(qty)}</span>
            </div>
          )}
          {/* Notes field */}
          <div>
            <Label T={T}>Note <span style={{fontWeight:400,textTransform:"none",letterSpacing:0,opacity:0.6}}>(optional)</span></Label>
            <Inp T={T} value={note} onChange={setNote} placeholder={isOut?"e.g. Used for catering order…":"e.g. Delivery from Sivasakthy…"} onKeyDown={e=>e.key==="Enter"&&doPost()}/>
          </div>
          <Btn T={T} v={isOut?"danger":"ok"} onClick={()=>doPost()} disabled={!selected||!qty||Number(qty)<=0} s={{width:"100%",padding:"13px",fontSize:14,letterSpacing:"0.06em"}}>{isOut?"\u2191 Record Stock Out":"\u2193 Record Stock In"}</Btn>
          {/* Success + undo */}
          {success&&(
            <div style={{background:T.okBg,border:`1px solid ${T.ok}44`,borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
              <div style={{fontSize:12,color:T.ok,fontFamily:MO}}>✓ {success.qty}× {success.itemName} — now: {success.newStock}{success.note&&<span style={{color:T.muted}}> · {success.note}</span>}</div>
              {lastMov&&<button onClick={doUndo} style={{flexShrink:0,padding:"4px 10px",borderRadius:6,border:`1px solid ${T.warn}55`,background:T.warnBg,color:T.warn,cursor:"pointer",fontFamily:MO,fontSize:11,fontWeight:700}}>↺ Undo</button>}
            </div>
          )}
        </div>
      </Card>
      <Card T={T} s={{padding:22}}>
        <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:14,fontFamily:MO}}>Recent {isOut?"Outs":"Ins"}</div>
        {recent.length===0&&<div style={{color:T.muted,fontSize:13,padding:"30px 0",textAlign:"center",fontStyle:"italic",fontFamily:SE}}>No activity yet</div>}
        <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:460,overflowY:"auto"}}>
          {recent.map(m=>(
            <div key={m.id} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 13px",display:"flex",gap:10,alignItems:"center"}}>
              <div style={{width:30,height:30,borderRadius:6,background:isOut?T.lowBg:T.okBg,display:"flex",alignItems:"center",justifyContent:"center",color:isOut?T.low:T.ok,fontWeight:900,flexShrink:0,fontFamily:MO,fontSize:13}}>{isOut?"\u2191":"\u2193"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:T.text,fontFamily:SE}}>{m.itemName}</div>
                <div style={{fontSize:10,color:T.muted,marginTop:2,fontFamily:MO}}>{m.personName} · {m.timestamp}</div>
                {m.note&&<div style={{fontSize:10,color:T.muted,marginTop:1,fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.note}</div>}
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontWeight:700,color:isOut?T.low:T.ok,fontFamily:MO,fontSize:14}}>{isOut?"-":"+"}{m.qty}</div>
                <div style={{fontSize:10,color:T.muted,fontFamily:MO}}>{m.prevStock}{"\u2192"}{m.newStock}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// INVENTORY
// ══════════════════════════════════════════════════════════════════════════════
function ItemModal({T,item,onClose,onSave}){
  const [f,setF]=useState(item||{code:"",dept:"Front",supplier:"",brand:"",name:"",unit:"Nos",stock:0,minQty:0,perUnit:"",barcode:""});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  return(
    <div style={{position:"fixed",inset:0,background:"#000a",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <Card T={T} s={{padding:28,width:520,maxWidth:"100%",maxHeight:"90vh",overflowY:"auto"}}>
        <h2 style={{margin:"0 0 20px",fontSize:22,fontFamily:SE,fontWeight:600,color:T.text}}>{item?"Edit Item":"Add New Item"}</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          <div><Label T={T}>Code</Label><Inp T={T} value={f.code} onChange={v=>set("code",v)} placeholder="e.g. F101"/></div>
          <div><Label T={T}>Department</Label><Sel T={T} value={f.dept} onChange={v=>set("dept",v)}><option>Front</option><option>Kitchen</option></Sel></div>
          <div style={{gridColumn:"1/-1"}}><Label T={T}>Item Name</Label><Inp T={T} value={f.name} onChange={v=>set("name",v)} placeholder="Full item name"/></div>
          <div><Label T={T}>Brand</Label><Inp T={T} value={f.brand} onChange={v=>set("brand",v)} placeholder="Brand"/></div>
          <div><Label T={T}>Supplier</Label><Inp T={T} value={f.supplier} onChange={v=>set("supplier",v)} placeholder="Supplier"/></div>
          <div style={{gridColumn:"1/-1"}}><Label T={T}>Barcode (optional)</Label><Inp T={T} value={f.barcode||""} onChange={v=>set("barcode",v)} placeholder="e.g. 8938475928374"/></div>
          <div><Label T={T}>Unit</Label><Sel T={T} value={f.unit} onChange={v=>set("unit",v)}>{["Nos","Grams (g)","Mililitres (ml)","Kilograms (kg)","Litres (l)"].map(u=><option key={u}>{u}</option>)}</Sel></div>
          <div><Label T={T}>Per Unit Price (Rs)</Label><Inp T={T} type="number" value={f.perUnit||""} onChange={v=>set("perUnit",v)} placeholder="0.00"/></div>
          <div><Label T={T}>Current Stock</Label><Inp T={T} type="number" value={f.stock} onChange={v=>set("stock",Number(v))}/></div>
          <div><Label T={T}>Min Qty</Label><Inp T={T} type="number" value={f.minQty} onChange={v=>set("minQty",Number(v))}/></div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn T={T} onClick={onClose}>Cancel</Btn>
          <Btn T={T} v="primary" onClick={()=>onSave(f)} disabled={!f.name||!f.code}>Save Item</Btn>
        </div>
      </Card>
    </div>
  );
}

function InventoryTab({T,items,setItems,canEdit}){
  const isMobile=useIsMobile();
  const [search,setSearch]=useState("");
  const [deptF,setDeptF]=useState("All");
  const [editItem,setEditItem]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [showReset,setShowReset]=useState(false);
  const filtered=useMemo(()=>{
    let r=items;
    if(deptF!=="All") r=r.filter(i=>i.dept===deptF);
    if(search) r=r.filter(i=>i.name.toLowerCase().includes(search.toLowerCase())||i.code.toLowerCase().includes(search.toLowerCase())||(i.supplier||"").toLowerCase().includes(search.toLowerCase()));
    return r.sort((a,b)=>a.code.localeCompare(b.code));
  },[items,search,deptF]);
  return(
    <div>
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <Inp T={T} value={search} onChange={setSearch} placeholder="Search name, code, supplier…" s={{flex:1,minWidth:140}}/>
        <Sel T={T} value={deptF} onChange={setDeptF} s={{minWidth:110}}><option>All</option><option>Front</option><option>Kitchen</option></Sel>
        {canEdit&&<Btn T={T} v="primary" onClick={()=>setShowAdd(true)}>+ Add Item</Btn>}
        {canEdit&&(<button onClick={()=>setShowReset(true)} style={{padding:"9px 14px",borderRadius:8,border:`1px solid ${T.low}44`,background:T.lowBg,color:T.low,cursor:"pointer",fontFamily:MO,fontSize:12,fontWeight:700}}>↺ Reset to Spreadsheet</button>)}
      </div>
      {showReset&&(
        <div style={{position:"fixed",inset:0,background:"#000a",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&setShowReset(false)}>
          <Card T={T} s={{padding:28,width:440,maxWidth:"100%"}}>
            <div style={{fontSize:20,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:10}}>Reset Inventory?</div>
            <div style={{fontSize:13,color:T.muted,lineHeight:1.7,marginBottom:20}}>This will delete all current items and reload the <strong style={{color:T.text}}>full spreadsheet</strong> ({DEFAULT_ITEMS.length} items). Stock counts, movements and count history are <strong style={{color:T.ok}}>not affected</strong>.</div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <Btn T={T} onClick={()=>setShowReset(false)}>Cancel</Btn>
              <button onClick={async()=>{await save("hz_items",DEFAULT_ITEMS);await save("hz_items_version",ITEMS_VERSION);setItems(DEFAULT_ITEMS);setShowReset(false);}} style={{padding:"9px 18px",borderRadius:8,background:T.low,border:"none",color:"#fff",fontFamily:MO,fontSize:13,fontWeight:700,cursor:"pointer"}}>Yes, Reset Items</button>
            </div>
          </Card>
        </div>
      )}
      <Card T={T} s={{overflow:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:isMobile?400:820}}>
          <thead><tr style={{borderBottom:`1px solid ${T.border}`,background:T.card2}}>
            {["Code","Item Name","Dept","Supplier","Brand","Unit","Stock","Min","±","Per Unit"].map(h=>(<th key={h} style={{padding:"11px 13px",textAlign:"left",fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",whiteSpace:"nowrap",fontFamily:MO}}>{h}</th>))}
            {canEdit&&<th style={{padding:"11px 13px"}}/>}
          </tr></thead>
          <tbody>
            {filtered.map((item,idx)=>(
              <tr key={item.id} style={{borderBottom:idx<filtered.length-1?`1px solid ${T.border}`:"none"}} onMouseEnter={e=>e.currentTarget.style.background=T.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{padding:"10px 13px",fontFamily:MO,fontSize:12,color:T.accent,fontWeight:700}}>{item.code}</td>
                <td style={{padding:"10px 13px",fontSize:13,fontWeight:600,minWidth:140,color:T.text,fontFamily:SE}}>{item.name}</td>
                <td style={{padding:"10px 13px"}}><DeptBadge T={T} dept={item.dept}/></td>
                <td style={{padding:"10px 13px",fontSize:12,color:T.muted,maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.supplier||"—"}</td>
                <td style={{padding:"10px 13px",fontSize:12,color:T.muted}}>{item.brand||"—"}</td>
                <td style={{padding:"10px 13px",fontSize:11,color:T.muted,whiteSpace:"nowrap",fontFamily:MO}}>{item.unit}</td>
                <td style={{padding:"10px 13px",fontWeight:800,fontSize:16,color:item.stock<=0?T.low:item.stock<item.minQty?T.warn:T.text,fontFamily:MO}}>{item.stock}</td>
                <td style={{padding:"10px 13px",fontSize:13,color:T.muted,fontFamily:MO}}>{item.minQty}</td>
                <td style={{padding:"10px 13px"}}><StockBadge T={T} surplus={item.stock-item.minQty}/></td>
                <td style={{padding:"10px 13px",fontSize:12,color:T.muted,whiteSpace:"nowrap",fontFamily:MO}}>{item.perUnit?fmtRs(item.perUnit):"—"}</td>
                {canEdit&&<td style={{padding:"10px 13px"}}><button onClick={()=>setEditItem(item)} style={{padding:"4px 9px",borderRadius:5,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontSize:11,fontFamily:MO}}>Edit</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length===0&&<div style={{padding:40,textAlign:"center",color:T.muted,fontStyle:"italic",fontFamily:SE}}>No items found</div>}
      </Card>
      {canEdit&&(editItem||showAdd)&&<ItemModal T={T} item={editItem} onClose={()=>{setEditItem(null);setShowAdd(false);}} onSave={form=>{if(form.id) setItems(prev=>prev.map(i=>i.id===form.id?form:i));else setItems(prev=>[...prev,{...form,id:form.code||uid()}]);setEditItem(null);setShowAdd(false);}}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MANUAL COUNT
// ══════════════════════════════════════════════════════════════════════════════
function ManualCountTab({T,items,setItems,countHistory,setCountHistory,currentUser}){
  const isMobile=useIsMobile();
  const [counts,setCounts]=useState({});
  const [deptF,setDeptF]=useState("All");
  const [search,setSearch]=useState("");
  const [submitted,setSubmitted]=useState(false);
  const filtered=useMemo(()=>{let r=items;if(deptF!=="All") r=r.filter(i=>i.dept===deptF);if(search) r=r.filter(i=>i.name.toLowerCase().includes(search.toLowerCase())||i.code.toLowerCase().includes(search.toLowerCase()));return r.sort((a,b)=>a.code.localeCompare(b.code));},[items,search,deptF]);
  const counted=Object.keys(counts).filter(k=>counts[k]!=="").length;
  const submit=()=>{
    const entries=items.map(i=>({code:i.code,name:i.name,dept:i.dept,unit:i.unit,systemStock:i.stock,physicalCount:counts[i.id]!=null&&counts[i.id]!==""?Number(counts[i.id]):null,variance:counts[i.id]!=null&&counts[i.id]!==""?Number(counts[i.id])-i.stock:null,perUnit:i.perUnit||null}));
    setCountHistory(prev=>[{id:uid(),date:nowStr(),countedBy:currentUser.name,userId:currentUser.id,userRole:currentUser.role,entries},...prev]);
    setItems(prev=>prev.map(i=>{if(counts[i.id]!=null&&counts[i.id]!=="") return{...i,stock:Number(counts[i.id])};return i;}));
    setCounts({});setSubmitted(true);setTimeout(()=>setSubmitted(false),3000);
  };
  return(
    <div>
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{flex:1}}><div style={{fontSize:22,fontWeight:600,fontFamily:SE,color:T.text}}>Manual Count</div><div style={{fontSize:12,color:T.muted,marginTop:2,fontFamily:MO}}>Counting as <strong style={{color:T.accent}}>{currentUser.name}</strong> · {counted}/{items.length} items entered</div></div>
        <Inp T={T} value={search} onChange={setSearch} placeholder="Search…" s={{width:160}}/>
        <Sel T={T} value={deptF} onChange={setDeptF} s={{minWidth:100}}><option>All</option><option>Front</option><option>Kitchen</option></Sel>
        <Btn T={T} v="primary" onClick={submit} disabled={counted===0}>Submit Count</Btn>
      </div>
      {submitted&&<div style={{background:T.okBg,border:`1px solid ${T.ok}44`,borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:T.ok,fontFamily:MO}}>✓ Count submitted — stock updated</div>}
      <Card T={T}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:isMobile?300:600}}>
          <thead><tr style={{borderBottom:`1px solid ${T.border}`,background:T.card2}}>
            {["Code","Item Name","Dept","Unit","System","Physical Count","Variance"].map(h=>(<th key={h} style={{padding:"10px 13px",textAlign:"left",fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",whiteSpace:"nowrap",fontFamily:MO}}>{h}</th>))}
          </tr></thead>
          <tbody>
            {filtered.map((item,idx)=>{
              const val=counts[item.id];const variance=val!=null&&val!==""?Number(val)-item.stock:null;
              return(<tr key={item.id} style={{borderBottom:idx<filtered.length-1?`1px solid ${T.border}`:"none",background:val!=null&&val!==""?T.accentDim:"transparent",transition:"background 0.15s"}}>
                <td style={{padding:"9px 13px",fontFamily:MO,fontSize:12,color:T.accent,fontWeight:700}}>{item.code}</td>
                <td style={{padding:"9px 13px",fontSize:13,fontWeight:500,color:T.text,fontFamily:SE}}>{item.name}</td>
                <td style={{padding:"9px 13px"}}><DeptBadge T={T} dept={item.dept}/></td>
                <td style={{padding:"9px 13px",fontSize:11,color:T.muted,fontFamily:MO}}>{item.unit}</td>
                <td style={{padding:"9px 13px",fontWeight:700,color:T.muted,fontFamily:MO}}>{item.stock}</td>
                <td style={{padding:"9px 13px"}}><input type="number" value={counts[item.id]||""} onChange={e=>setCounts(p=>({...p,[item.id]:e.target.value}))} placeholder="—" style={{background:T.bg,border:`1px solid ${val!=null&&val!==""?T.accent:T.border}`,borderRadius:6,color:T.text,fontSize:14,padding:"6px 10px",width:80,outline:"none",fontFamily:MO,fontWeight:700,textAlign:"center",transition:"border-color 0.2s"}}/></td>
                <td style={{padding:"9px 13px"}}>{variance!=null&&<span style={{fontWeight:700,color:variance>0?T.ok:variance<0?T.low:T.muted,fontFamily:MO}}>{variance>0?"+":""}{variance}</span>}</td>
              </tr>);
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VARIANCE
// ══════════════════════════════════════════════════════════════════════════════
function VarianceTab({T,countHistory}){
  const isMobile=useIsMobile();
  const [selId,setSelId]=useState(countHistory[0]?.id||null);
  const session=countHistory.find(c=>c.id===selId)||countHistory[0];
  if(!countHistory.length) return(<Card T={T} s={{padding:50,textAlign:"center"}}><div style={{fontSize:36,marginBottom:14}}>📊</div><div style={{color:T.muted,fontSize:15,fontFamily:SE,fontStyle:"italic"}}>No counts yet. Complete a Manual Count to see variance.</div></Card>);
  const entries=session?.entries||[];
  const withVar=entries.filter(e=>e.variance!=null&&e.variance!==0);
  const totalValue=withVar.reduce((s,e)=>s+(e.variance&&e.perUnit?e.variance*e.perUnit:0),0);
  return(
    <div>
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{flex:1}}><div style={{fontSize:22,fontWeight:600,fontFamily:SE,color:T.text}}>Variance Report</div>{session&&<div style={{fontSize:12,color:T.muted,marginTop:2,fontFamily:MO}}>By <strong style={{color:T.text}}>{session.countedBy}</strong> · {session.date}</div>}</div>
        <Sel T={T} value={selId||""} onChange={setSelId} s={{minWidth:240}}>{countHistory.map(c=><option key={c.id} value={c.id}>{c.date} — {c.countedBy}</option>)}</Sel>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:16}}>
        {[{l:"Counted",v:entries.filter(e=>e.physicalCount!=null).length,c:T.blue},{l:"With Variance",v:withVar.length,c:T.warn},{l:"Surplus",v:withVar.filter(e=>e.variance>0).length,c:T.ok},{l:"Deficit",v:withVar.filter(e=>e.variance<0).length,c:T.low}].map(s=>(<Card T={T} key={s.l} s={{padding:"16px 18px"}}><div style={{fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8,fontFamily:MO}}>{s.l}</div><div style={{fontSize:28,fontWeight:800,color:s.c,fontFamily:MO}}>{s.v}</div></Card>))}
      </div>
      {totalValue!==0&&<Card T={T} s={{padding:"14px 20px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:13,color:T.muted}}>Total variance value</span><span style={{fontSize:18,fontWeight:800,color:totalValue>0?T.ok:T.low,fontFamily:MO}}>{totalValue>0?"+":""}{fmtRs(totalValue)}</span></Card>}
      <Card T={T} s={{overflow:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:500}}>
          <thead><tr style={{borderBottom:`1px solid ${T.border}`,background:T.card2}}>{["Code","Item Name","Dept","System","Physical","Variance","Value"].map(h=>(<th key={h} style={{padding:"10px 13px",textAlign:"left",fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:MO}}>{h}</th>))}</tr></thead>
          <tbody>{entries.filter(e=>e.physicalCount!=null).sort((a,b)=>Math.abs(b.variance||0)-Math.abs(a.variance||0)).map((e,idx,arr)=>(<tr key={e.code} style={{borderBottom:idx<arr.length-1?`1px solid ${T.border}`:"none"}}><td style={{padding:"9px 13px",fontFamily:MO,fontSize:12,color:T.accent}}>{e.code}</td><td style={{padding:"9px 13px",fontSize:13,color:T.text,fontFamily:SE}}>{e.name}</td><td style={{padding:"9px 13px"}}><DeptBadge T={T} dept={e.dept}/></td><td style={{padding:"9px 13px",color:T.muted,fontFamily:MO}}>{e.systemStock}</td><td style={{padding:"9px 13px",fontWeight:700,fontFamily:MO,color:T.text}}>{e.physicalCount}</td><td style={{padding:"9px 13px"}}><span style={{fontWeight:700,color:e.variance>0?T.ok:e.variance<0?T.low:T.muted,fontFamily:MO}}>{e.variance>0?"+":""}{e.variance} {e.unit}</span></td><td style={{padding:"9px 13px",fontSize:12,color:e.variance&&e.perUnit?(e.variance>0?T.ok:T.low):T.muted,fontFamily:MO}}>{e.variance&&e.perUnit?`${e.variance>0?"+":""}${fmtRs(e.variance*e.perUnit)}`:"—"}</td></tr>))}</tbody>
        </table>
        {!entries.filter(e=>e.physicalCount!=null).length&&<div style={{padding:30,textAlign:"center",color:T.muted,fontStyle:"italic",fontFamily:SE}}>No items counted in this session</div>}
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PURCHASE ORDER
// ══════════════════════════════════════════════════════════════════════════════
function PurchaseOrderTab({T,items,alertSettings}){
  const isMobile=useIsMobile();
  const [overrides,setOverrides]=useState({});
  const [emailState,setEmailState]=useState("idle");
  const [groupBySupplier,setGroupBySupplier]=useState(false);
  const deficitItems=useMemo(()=>items.filter(i=>i.stock<i.minQty).sort((a,b)=>a.code.localeCompare(b.code)),[items]);
  const getQty=item=>overrides[item.id]!=null?Number(overrides[item.id]):Math.max(0,item.minQty-item.stock);
  const total=deficitItems.reduce((s,i)=>{const q=getQty(i);return s+(i.perUnit&&q?q*i.perUnit:0);},0);

  // Group by supplier
  const grouped=useMemo(()=>{
    if(!groupBySupplier) return [{supplier:null,items:deficitItems}];
    const map={};
    deficitItems.forEach(i=>{
      const s=i.supplier||"No Supplier";
      if(!map[s]) map[s]=[];
      map[s].push(i);
    });
    return Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0])).map(([supplier,items])=>({supplier,items}));
  },[deficitItems,groupBySupplier]);

  const printPO=()=>{
    const rows=deficitItems.map(i=>{
      const q=getQty(i);
      return`${i.code}\t${i.name}\t${i.dept}\t${i.supplier||"—"}\t${i.unit}\t${i.stock}\t${i.minQty}\t${q}\t${i.perUnit?fmtRs(i.perUnit):"—"}\t${i.perUnit&&q?fmtRs(q*i.perUnit):"—"}`;
    }).join("\n");
    const w=window.open("","_blank","width=960,height=720");
    if(!w){alert("Pop-up blocked — please allow pop-ups for this site to print.");return;}
    w.document.write(`<!DOCTYPE html><html><head><title>Purchase Order — ${new Date().toLocaleDateString("en-GB")}</title><style>body{font-family:monospace;font-size:12px;padding:28px;line-height:1.7;color:#222}pre{white-space:pre-wrap;word-break:break-word}@media print{body{padding:14px}}</style></head><body><pre>HAZEL CAFE &amp; CAKERY — PURCHASE ORDER\nDate: ${new Date().toLocaleDateString("en-GB")}\n${"─".repeat(80)}\nCode\tItem\tDept\tSupplier\tUnit\tCurrent\tMin\tOrder\tPer Unit\tTotal\n${rows}\n${"─".repeat(80)}\nGrand Total: ${fmtRs(total)}</pre></body></html>`);
    w.document.close();
    w.onload=()=>{ w.focus(); w.print(); };
  };

  const emailPO=async()=>{
    if(!alertSettings?.email){
      alert("No alert email configured. Set one in the 🔔 alert settings.");
      return;
    }
    setEmailState("sending");
    try{
      const lines=deficitItems.map(i=>{
        const q=getQty(i);
        const lineTotal=i.perUnit&&q?fmtRs(q*i.perUnit):"—";
        return`  ${i.code}  ${i.name}\n        Order: ${q} ${i.unit}  |  Current: ${i.stock}  |  Min: ${i.minQty}  |  Total: ${lineTotal}`;
      }).join("\n\n");
      const res=await fetch("/api/send-po",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          to:alertSettings.email,
          date:new Date().toLocaleDateString("en-GB"),
          count:deficitItems.length,
          lines,
          grandTotal:total>0?fmtRs(total):"—",
          timestamp:nowStr(),
        }),
      });
      if(!res.ok) throw new Error("Server error "+res.status);
      setEmailState("sent");
      setTimeout(()=>setEmailState("idle"),3000);
    }catch(e){
      setEmailState("error");
      setTimeout(()=>setEmailState("idle"),3000);
    }
  };

  return(
    <div>
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{flex:1}}>
          <div style={{fontSize:22,fontWeight:600,fontFamily:SE,color:T.text}}>Purchase Order</div>
          <div style={{fontSize:12,color:T.muted,marginTop:2,fontFamily:MO}}>{deficitItems.length} items below minimum stock</div>
        </div>
        <button onClick={()=>setGroupBySupplier(p=>!p)}
          style={{padding:"9px 14px",borderRadius:8,border:`1px solid ${groupBySupplier?T.accent:T.border}`,background:groupBySupplier?T.accentDim:"transparent",color:groupBySupplier?T.accent:T.muted,cursor:"pointer",fontFamily:MO,fontSize:12,fontWeight:700}}>
          {groupBySupplier?"✓ By Supplier":"Group by Supplier"}
        </button>
        <button onClick={emailPO} disabled={!deficitItems.length||emailState==="sending"}
          style={{padding:"9px 16px",borderRadius:8,border:`1px solid ${emailState==="sent"?T.ok:emailState==="error"?T.low:T.accent}55`,background:emailState==="sent"?T.okBg:emailState==="error"?T.lowBg:T.accentDim,color:emailState==="sent"?T.ok:emailState==="error"?T.low:T.accent,cursor:!deficitItems.length||emailState==="sending"?"not-allowed":"pointer",fontFamily:MO,fontSize:12,fontWeight:700,opacity:!deficitItems.length?0.4:1,transition:"all 0.2s"}}>
          {emailState==="sending"?"Sending…":emailState==="sent"?"✓ PO Sent!":emailState==="error"?"✗ Failed — retry":"📧 Email PO"}
        </button>
        <Btn T={T} v="primary" onClick={printPO} disabled={!deficitItems.length}>🖨 Print PO</Btn>
      </div>

      {/* Email recipient hint */}
      {alertSettings?.email&&deficitItems.length>0&&(
        <div style={{background:T.accentDim,border:`1px solid ${T.accent}33`,borderRadius:8,padding:"9px 14px",marginBottom:14,fontSize:12,color:T.muted,fontFamily:MO,display:"flex",alignItems:"center",gap:8}}>
          <span style={{color:T.accent}}>📧</span>
          PO will be sent to <strong style={{color:T.accent}}>{alertSettings.email}</strong> · change in 🔔 Alert Settings
        </div>
      )}
      {!alertSettings?.email&&deficitItems.length>0&&(
        <div style={{background:T.warnBg,border:`1px solid ${T.warn}44`,borderRadius:8,padding:"9px 14px",marginBottom:14,fontSize:12,color:T.warn,fontFamily:MO}}>
          ⚠ No email configured — set one in 🔔 Alert Settings to use Email PO
        </div>
      )}

      {total>0&&(
        <Card T={T} s={{padding:"15px 20px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:13,color:T.muted}}>Estimated total order value</span>
          <span style={{fontSize:22,fontWeight:800,color:T.accent,fontFamily:MO}}>{fmtRs(total)}</span>
        </Card>
      )}

      {!deficitItems.length?(
        <Card T={T} s={{padding:50,textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:12}}>✓</div>
          <div style={{color:T.ok,fontSize:16,fontWeight:600,fontFamily:SE}}>All items are at or above minimum stock</div>
        </Card>
      ):(
        <Card T={T} s={{overflow:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:isMobile?400:760}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${T.border}`,background:T.card2}}>
                {["Code","Item","Dept","Supplier","Unit","Current","Min","Deficit","Order Qty","Per Unit","Total"].map(h=>(
                  <th key={h} style={{padding:"10px 13px",textAlign:"left",fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",whiteSpace:"nowrap",fontFamily:MO}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grouped.map(({supplier,items:gItems})=>(
                <>
                  {groupBySupplier&&supplier&&(
                    <tr key={"s_"+supplier}>
                      <td colSpan={11} style={{padding:"10px 13px 4px",fontSize:11,fontWeight:700,color:T.accent,fontFamily:MO,letterSpacing:"0.06em",background:T.accentDim,borderTop:`1px solid ${T.border}`}}>
                        📦 {supplier} <span style={{fontWeight:400,color:T.muted,fontSize:10}}>({gItems.length} item{gItems.length!==1?"s":""})</span>
                      </td>
                    </tr>
                  )}
                  {gItems.map((item,idx)=>{
                    const deficit=item.minQty-item.stock;
                    const orderQty=getQty(item);
                    const lineTotal=item.perUnit&&orderQty?orderQty*item.perUnit:null;
                    return(
                      <tr key={item.id} style={{borderBottom:idx<gItems.length-1?`1px solid ${T.border}`:"none"}}>
                        <td style={{padding:"9px 13px",fontFamily:MO,fontSize:12,color:T.accent,fontWeight:700}}>{item.code}</td>
                        <td style={{padding:"9px 13px",fontSize:13,fontWeight:600,minWidth:120,color:T.text,fontFamily:SE}}>{item.name}</td>
                        <td style={{padding:"9px 13px"}}><DeptBadge T={T} dept={item.dept}/></td>
                        <td style={{padding:"9px 13px",fontSize:11,color:T.muted,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.supplier||"—"}</td>
                        <td style={{padding:"9px 13px",fontSize:11,color:T.muted,whiteSpace:"nowrap",fontFamily:MO}}>{item.unit}</td>
                        <td style={{padding:"9px 13px",fontWeight:700,color:T.low,fontFamily:MO}}>{item.stock}</td>
                        <td style={{padding:"9px 13px",color:T.muted,fontFamily:MO}}>{item.minQty}</td>
                        <td style={{padding:"9px 13px"}}><span style={{fontWeight:700,color:T.low,fontFamily:MO}}>-{deficit}</span></td>
                        <td style={{padding:"9px 13px"}}>
                          <input type="number" value={overrides[item.id]!=null?overrides[item.id]:deficit}
                            onChange={e=>setOverrides(p=>({...p,[item.id]:e.target.value}))}
                            style={{background:T.bg,border:`1px solid ${T.accent}44`,borderRadius:6,color:T.text,fontSize:13,padding:"5px 8px",width:70,outline:"none",fontFamily:MO,fontWeight:700,textAlign:"center"}}/>
                        </td>
                        <td style={{padding:"9px 13px",fontSize:12,color:T.muted,whiteSpace:"nowrap",fontFamily:MO}}>{item.perUnit?fmtRs(item.perUnit):"—"}</td>
                        <td style={{padding:"9px 13px",fontSize:13,fontWeight:700,color:lineTotal?T.accent:T.muted,whiteSpace:"nowrap",fontFamily:MO}}>{lineTotal?fmtRs(lineTotal):"—"}</td>
                      </tr>
                    );
                  })}
                </>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HISTORY
// ══════════════════════════════════════════════════════════════════════════════
function HistoryTab({T,movements}){
  const isMobile=useIsMobile();
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [page,setPage]=useState(0);
  const [dateFrom,setDateFrom]=useState("");
  const [dateTo,setDateTo]=useState("");
  const PAGE=50;

  // Parse dd/mm/yyyy string to Date
  const parseDate=(s)=>{if(!s||!/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return null;const[d,m,y]=s.split("/").map(Number);return new Date(y,m-1,d);}
  const parseTs=(ts)=>{if(!ts) return null;try{const[dp,tp]=ts.split(", ");const[d,mo,y]=dp.split("/");const[h,mi]=(tp||"00:00").split(":");return new Date(+y,+mo-1,+d,+h,+mi);}catch{return null;}}

  const filtered=useMemo(()=>{
    let r=movements;
    if(filter!=="all") r=r.filter(m=>m.type===filter);
    if(search) r=r.filter(m=>m.itemName.toLowerCase().includes(search.toLowerCase())||m.code.toLowerCase().includes(search.toLowerCase())||m.personName?.toLowerCase().includes(search.toLowerCase()));
    const from=parseDate(dateFrom);
    const to=parseDate(dateTo);
    if(from) r=r.filter(m=>{const d=parseTs(m.timestamp);return d&&d>=from;});
    if(to){const toEnd=new Date(to);toEnd.setHours(23,59,59);r=r.filter(m=>{const d=parseTs(m.timestamp);return d&&d<=toEnd;});}
    return r;
  },[movements,filter,search,dateFrom,dateTo]);

  const totalPages=Math.max(1,Math.ceil(filtered.length/PAGE));
  const safeP=Math.min(page,totalPages-1);
  const visible=filtered.slice(safeP*PAGE,(safeP+1)*PAGE);
  const clearDates=()=>{setDateFrom("");setDateTo("");setPage(0);};

  return(
    <div>
      <div style={{display:"flex",gap:10,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{fontSize:22,fontWeight:600,fontFamily:SE,flex:1,color:T.text}}>Movement History <span style={{fontSize:13,color:T.muted,fontWeight:400,fontFamily:MO}}>({movements.length})</span></div>
        <Inp T={T} value={search} onChange={v=>{setSearch(v);setPage(0);}} placeholder="Search…" s={{width:160}}/>
        {["all","out","in"].map(f=>(<button key={f} onClick={()=>{setFilter(f);setPage(0);}} style={{padding:"7px 14px",borderRadius:7,border:`1px solid ${filter===f?T.accent:T.border}`,background:filter===f?T.accentDim:"transparent",color:filter===f?T.accent:T.muted,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:MO,transition:"all 0.15s"}}>{f==="all"?"All":f==="out"?"Out":"In"}</button>))}
      </div>
      {/* Date range row */}
      <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:T.muted,fontFamily:MO,letterSpacing:"0.08em",textTransform:"uppercase"}}>Date</span>
        <input value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(0);}} placeholder="DD/MM/YYYY" maxLength={10}
          style={{...{background:T.inputBg,border:`1px solid ${dateFrom?T.accent:T.border}`,borderRadius:8,color:T.text,fontSize:13,padding:"7px 11px",outline:"none",fontFamily:MO,width:120,boxSizing:"border-box"}}}/>
        <span style={{color:T.muted,fontFamily:MO,fontSize:13}}>→</span>
        <input value={dateTo} onChange={e=>{setDateTo(e.target.value);setPage(0);}} placeholder="DD/MM/YYYY" maxLength={10}
          style={{...{background:T.inputBg,border:`1px solid ${dateTo?T.accent:T.border}`,borderRadius:8,color:T.text,fontSize:13,padding:"7px 11px",outline:"none",fontFamily:MO,width:120,boxSizing:"border-box"}}}/>
        {(dateFrom||dateTo)&&<button onClick={clearDates} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 11px",color:T.muted,cursor:"pointer",fontFamily:MO,fontSize:11,fontWeight:700}}>✕ Clear</button>}
        <span style={{fontSize:11,color:T.muted,fontFamily:MO,marginLeft:"auto"}}>{filtered.length} entries</span>
      </div>
      <Card T={T} s={{overflow:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:isMobile?300:660}}>
          <thead><tr style={{borderBottom:`1px solid ${T.border}`,background:T.card2}}>{["Timestamp","Type","Item","Code","Dept","Person","Role","Qty","Change"].map(h=>(<th key={h} style={{padding:"10px 13px",textAlign:"left",fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",whiteSpace:"nowrap",fontFamily:MO}}>{h}</th>))}</tr></thead>
          <tbody>{visible.map((m,idx)=>(<tr key={m.id} style={{borderBottom:idx<visible.length-1?`1px solid ${T.border}`:"none"}} onMouseEnter={e=>e.currentTarget.style.background=T.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><td style={{padding:"9px 13px",fontSize:11,color:T.muted,whiteSpace:"nowrap",fontFamily:MO}}>{m.timestamp}</td><td style={{padding:"9px 13px"}}><span style={{fontSize:10,fontWeight:700,color:m.type==="in"?T.ok:T.low,background:m.type==="in"?T.okBg:T.lowBg,padding:"2px 8px",borderRadius:4,fontFamily:MO}}>{m.type==="in"?"\u2193 IN":"\u2191 OUT"}</span></td><td style={{padding:"9px 13px",fontSize:13,fontWeight:500,color:T.text,fontFamily:SE}}>{m.itemName}</td><td style={{padding:"9px 13px",fontFamily:MO,fontSize:11,color:T.accent}}>{m.code}</td><td style={{padding:"9px 13px"}}><DeptBadge T={T} dept={m.dept}/></td><td style={{padding:"9px 13px",fontSize:13,color:T.text,fontWeight:500,fontFamily:SE}}>{m.personName||"—"}</td><td style={{padding:"9px 13px"}}>{m.userRole&&<RoleBadge T={T} role={m.userRole}/>}</td><td style={{padding:"9px 13px",fontWeight:700,color:m.type==="in"?T.ok:T.low,fontFamily:MO}}>{m.type==="in"?"+":"-"}{m.qty}</td><td style={{padding:"9px 13px",fontSize:12,color:T.muted,fontFamily:MO}}>{m.prevStock}{"\u2192"}<strong style={{color:T.text}}>{m.newStock}</strong></td></tr>))}</tbody>
        </table>
        {!visible.length&&<div style={{padding:40,textAlign:"center",color:T.muted,fontStyle:"italic",fontFamily:SE}}>No movements found</div>}
      </Card>
      {totalPages>1&&(<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:12}}><Btn T={T} onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={safeP===0}>{"\u2190"} Prev</Btn><span style={{fontSize:12,color:T.muted,fontFamily:MO}}>Page {safeP+1} of {totalPages}</span><Btn T={T} onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={safeP===totalPages-1}>Next {"\u2192"}</Btn></div>)}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════════════════════════════
function BarChart({T,data,maxVal,colorIn,colorOut,showBoth=false}){
  if(!data.length) return <div style={{padding:"20px 0",textAlign:"center",color:T.muted,fontStyle:"italic",fontFamily:SE,fontSize:13}}>No data for this period</div>;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {data.map((d,i)=>{
        const pctOut=maxVal>0?(d.out/maxVal)*100:0;
        const pctIn=maxVal>0?(d.in/maxVal)*100:0;
        return(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,minHeight:24}}>
            <div style={{width:120,fontSize:11,color:T.text,fontFamily:SE,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0,textAlign:"right"}}>{d.label}</div>
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:2}}>
              {(showBoth||d.out>0)&&(
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <div style={{height:10,borderRadius:3,background:colorOut||T.low,width:`${Math.max(pctOut,1)}%`,transition:"width 0.4s",minWidth:d.out>0?4:0}}/>
                  {d.out>0&&<span style={{fontSize:10,color:T.low,fontFamily:MO,flexShrink:0}}>{"\u2191"}{d.out}</span>}
                </div>
              )}
              {(showBoth||d.in>0)&&(
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <div style={{height:10,borderRadius:3,background:colorIn||T.ok,width:`${Math.max(pctIn,1)}%`,transition:"width 0.4s",minWidth:d.in>0?4:0}}/>
                  {d.in>0&&<span style={{fontSize:10,color:T.ok,fontFamily:MO,flexShrink:0}}>{"\u2193"}{d.in}</span>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
function parseTs(ts){if(!ts) return null;try{const[datePart,timePart]=ts.split(", ");const[d,mo,y]=datePart.split("/");const[h,mi]=(timePart||"00:00").split(":");return new Date(+y,+mo-1,+d,+h,+mi);}catch{return null;}}
function fmtDate(dt){return dt?`${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`:"?";}

function ReportsTab({T,movements,countHistory}){
  const isMobile=useIsMobile();
  const [preset,setPreset]=useState("7d");const [customFrom,setCustomFrom]=useState("");const [customTo,setCustomTo]=useState("");const [activeSection,setActiveSection]=useState("overview");
  const dateRange=useMemo(()=>{const now=new Date();if(preset==="today"){const s=new Date(now);s.setHours(0,0,0,0);return{from:s,to:now};}if(preset==="7d"){const s=new Date(now);s.setDate(s.getDate()-6);s.setHours(0,0,0,0);return{from:s,to:now};}if(preset==="30d"){const s=new Date(now);s.setDate(s.getDate()-29);s.setHours(0,0,0,0);return{from:s,to:now};}if(preset==="90d"){const s=new Date(now);s.setDate(s.getDate()-89);s.setHours(0,0,0,0);return{from:s,to:now};}if(preset==="custom"&&customFrom&&customTo){const[fd,fm,fy]=customFrom.split("/").map(Number);const[td,tm,ty]=customTo.split("/").map(Number);return{from:new Date(fy,fm-1,fd,0,0,0),to:new Date(ty,tm-1,td,23,59,59)};}return{from:null,to:null};},[preset,customFrom,customTo]);
  const filtered=useMemo(()=>{if(!dateRange.from) return movements;return movements.filter(m=>{const d=parseTs(m.timestamp);return d&&d>=dateRange.from&&d<=dateRange.to;});},[movements,dateRange]);
  const totalOut=filtered.filter(m=>m.type==="out").length;const totalIn=filtered.filter(m=>m.type==="in").length;
  const uniqueItems=new Set(filtered.map(m=>m.code)).size;const uniquePeople=new Set(filtered.map(m=>m.personName).filter(Boolean)).size;
  const topItems=useMemo(()=>{const map={};filtered.forEach(m=>{if(!map[m.code]) map[m.code]={code:m.code,name:m.itemName,dept:m.dept,out:0,in:0,totalQtyOut:0,totalQtyIn:0};if(m.type==="out"){map[m.code].out++;map[m.code].totalQtyOut+=m.qty;}else{map[m.code].in++;map[m.code].totalQtyIn+=m.qty;}});return Object.values(map).sort((a,b)=>(b.out+b.in)-(a.out+a.in)).slice(0,15);},[filtered]);
  const maxItemVal=topItems.reduce((mx,i)=>Math.max(mx,i.out,i.in),0);
  const dailyData=useMemo(()=>{if(!dateRange.from) return[];const days=[];const cur=new Date(dateRange.from);cur.setHours(0,0,0,0);const end=new Date(dateRange.to);end.setHours(23,59,59,0);while(cur<=end){const label=fmtDate(cur);const dayMovs=filtered.filter(m=>{const d=parseTs(m.timestamp);return d&&fmtDate(d)===label;});days.push({label,date:new Date(cur),out:dayMovs.filter(m=>m.type==="out").length,in:dayMovs.filter(m=>m.type==="in").length,total:dayMovs.length});cur.setDate(cur.getDate()+1);}return days.slice(-30);},[filtered,dateRange]);
  const maxDayVal=dailyData.reduce((mx,d)=>Math.max(mx,d.out,d.in),0);
  const personStats=useMemo(()=>{const map={};filtered.forEach(m=>{const k=m.personName||"Unknown";if(!map[k]) map[k]={name:k,role:m.userRole,ins:0,outs:0,total:0};if(m.type==="in") map[k].ins++;else map[k].outs++;map[k].total++;});return Object.values(map).sort((a,b)=>b.total-a.total);},[filtered]);
  const deptStats=useMemo(()=>{const front=filtered.filter(m=>m.dept==="Front");const kitchen=filtered.filter(m=>m.dept==="Kitchen");return{front:{out:front.filter(m=>m.type==="out").length,in:front.filter(m=>m.type==="in").length},kitchen:{out:kitchen.filter(m=>m.type==="out").length,in:kitchen.filter(m=>m.type==="in").length}};},[filtered]);
  const [logType,setLogType]=useState("all");const [logPerson,setLogPerson]=useState("all");const [logDept,setLogDept]=useState("all");const [logItem,setLogItem]=useState("");const [logPage,setLogPage]=useState(0);const LOG_PAGE=50;
  const allPeople=useMemo(()=>[...new Set(movements.map(m=>m.personName).filter(Boolean))].sort(),[movements]);
  const logFiltered=useMemo(()=>{let r=filtered;if(logType!=="all") r=r.filter(m=>m.type===logType);if(logPerson!=="all") r=r.filter(m=>m.personName===logPerson);if(logDept!=="all") r=r.filter(m=>m.dept===logDept);if(logItem.trim()) r=r.filter(m=>m.itemName.toLowerCase().includes(logItem.toLowerCase())||m.code.toLowerCase().includes(logItem.toLowerCase()));return r;},[filtered,logType,logPerson,logDept,logItem]);
  const logPages=Math.max(1,Math.ceil(logFiltered.length/LOG_PAGE));const logSafeP=Math.min(logPage,logPages-1);const logVisible=logFiltered.slice(logSafeP*LOG_PAGE,(logSafeP+1)*LOG_PAGE);
  const navBtn=(key,label,icon)=>{const active=activeSection===key;return(<button onClick={()=>setActiveSection(key)} style={{padding:"7px 14px",borderRadius:7,border:`1px solid ${active?T.accent:T.border}`,background:active?T.accentDim:"transparent",color:active?T.accent:T.muted,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:MO,whiteSpace:"nowrap",transition:"all 0.15s"}}>{icon} {label}</button>);};
  const SH=({children})=>(<div style={{fontSize:17,fontWeight:600,fontFamily:SE,color:T.accent,marginBottom:12}}>{children}</div>);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:10}}><div><div style={{fontSize:24,fontWeight:600,fontFamily:SE,color:T.text}}>Analytics &amp; Reports</div><div style={{fontSize:12,color:T.muted,fontFamily:MO,marginTop:3}}>{filtered.length} movements{dateRange.from&&` · ${fmtDate(dateRange.from)} – ${fmtDate(dateRange.to)}`}</div></div></div>
      <Card T={T} s={{padding:"14px 18px"}}><div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}><span style={{fontSize:10,fontWeight:700,color:T.muted,fontFamily:MO,letterSpacing:"0.08em",textTransform:"uppercase",marginRight:4}}>Period</span>{[{v:"today",l:"Today"},{v:"7d",l:"7 Days"},{v:"30d",l:"30 Days"},{v:"90d",l:"90 Days"},{v:"all",l:"All Time"},{v:"custom",l:"Custom"}].map(p=>(<button key={p.v} onClick={()=>setPreset(p.v)} style={{padding:"5px 12px",borderRadius:6,border:`1px solid ${preset===p.v?T.accent:T.border}`,background:preset===p.v?T.accentDim:"transparent",color:preset===p.v?T.accent:T.muted,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:MO,transition:"all 0.15s"}}>{p.l}</button>))}{preset==="custom"&&(<div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}><input type="text" value={customFrom} onChange={e=>setCustomFrom(e.target.value)} placeholder="DD/MM/YYYY" style={{...inp(T),width:110,fontSize:12,padding:"5px 10px"}}/><span style={{color:T.muted,fontFamily:MO,fontSize:12}}>→</span><input type="text" value={customTo} onChange={e=>setCustomTo(e.target.value)} placeholder="DD/MM/YYYY" style={{...inp(T),width:110,fontSize:12,padding:"5px 10px"}}/></div>)}</div></Card>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12}}>{[{l:"Total Movements",v:filtered.length,c:T.blue,sub:`${totalOut} out · ${totalIn} in`},{l:"Stock Outs",v:totalOut,c:T.low,sub:"items taken"},{l:"Stock Ins",v:totalIn,c:T.ok,sub:"items received"},{l:"Active Items",v:uniqueItems,c:T.accent,sub:`${uniquePeople} staff member${uniquePeople!==1?"s":""}`}].map(s=>(<Card T={T} key={s.l} s={{padding:"16px 18px"}}><div style={{fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8,fontFamily:MO}}>{s.l}</div><div style={{fontSize:32,fontWeight:800,color:s.c,fontFamily:MO,lineHeight:1}}>{s.v}</div><div style={{fontSize:10,color:T.muted,marginTop:5,fontFamily:MO}}>{s.sub}</div></Card>))}</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{navBtn("overview","Overview","📊")}{navBtn("items","Top Items","🔥")}{navBtn("daily","Daily Trend","📅")}{navBtn("people","By Person","👤")}{navBtn("log","Full Log","📋")}{navBtn("counts","Count Sessions","✏")}</div>
      {activeSection==="overview"&&(<div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}><Card T={T} s={{padding:20}}><SH>By Department</SH>{[{label:"Front",data:deptStats.front,c:T.front},{label:"Kitchen",data:deptStats.kitchen,c:T.kitchen}].map(d=>(<div key={d.label} style={{marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><DeptBadge T={T} dept={d.label}/><span style={{fontSize:11,color:T.muted,fontFamily:MO}}>{d.data.out+d.data.in} total</span></div><div style={{display:"flex",gap:4,height:10,borderRadius:4,overflow:"hidden",background:T.border}}>{d.data.out>0&&<div style={{flex:d.data.out,background:T.low,transition:"flex 0.4s"}}/>}{d.data.in>0&&<div style={{flex:d.data.in,background:T.ok,transition:"flex 0.4s"}}/>}</div><div style={{display:"flex",gap:12,marginTop:5,fontSize:11,fontFamily:MO}}><span style={{color:T.low}}>↑ {d.data.out} out</span><span style={{color:T.ok}}>↓ {d.data.in} in</span></div></div>))}</Card><Card T={T} s={{padding:20}}><SH>Top 5 Most Active Items</SH>{topItems.slice(0,5).map((item,i)=>(<div key={item.code} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><div style={{width:20,height:20,borderRadius:5,background:T.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:T.accent,fontFamily:MO,flexShrink:0}}>{i+1}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:SE,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div><div style={{display:"flex",gap:8,marginTop:2,fontSize:10,fontFamily:MO}}><span style={{color:T.low}}>↑{item.out}</span><span style={{color:T.ok}}>↓{item.in}</span><span style={{color:T.muted}}>{item.code}</span></div></div><div style={{flexShrink:0}}><div style={{width:60,height:6,borderRadius:3,background:T.border,overflow:"hidden"}}><div style={{height:"100%",background:T.accent,width:`${maxItemVal>0?((item.out+item.in)/maxItemVal)*100:0}%`,transition:"width 0.4s"}}/></div></div></div>))}{!topItems.length&&<div style={{color:T.muted,fontStyle:"italic",fontFamily:SE,fontSize:13}}>No movements in this period</div>}</Card><Card T={T} s={{padding:20,gridColumn:isMobile?"1":"1/-1"}}><SH>Activity by Person</SH><div style={{overflow:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr style={{borderBottom:`1px solid ${T.border}`}}>{["Person","Role","Dept Activity","Outs","Ins","Total","Share"].map(h=>(<th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:MO,whiteSpace:"nowrap"}}>{h}</th>))}</tr></thead><tbody>{personStats.map((p,idx)=>(<tr key={p.name} style={{borderBottom:idx<personStats.length-1?`1px solid ${T.border}`:"none"}} onMouseEnter={e=>e.currentTarget.style.background=T.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><td style={{padding:"10px 12px",fontSize:14,fontWeight:600,color:T.text,fontFamily:SE,whiteSpace:"nowrap"}}>{p.name}</td><td style={{padding:"10px 12px"}}>{p.role&&<RoleBadge T={T} role={p.role}/>}</td><td style={{padding:"10px 12px"}}><div style={{display:"flex",gap:4,width:80,height:8,borderRadius:3,overflow:"hidden",background:T.border}}>{p.outs>0&&<div style={{flex:p.outs,background:T.low}}/>}{p.ins>0&&<div style={{flex:p.ins,background:T.ok}}/>}</div></td><td style={{padding:"10px 12px",fontWeight:700,color:T.low,fontFamily:MO}}>{p.outs}</td><td style={{padding:"10px 12px",fontWeight:700,color:T.ok,fontFamily:MO}}>{p.ins}</td><td style={{padding:"10px 12px",fontWeight:800,color:T.text,fontFamily:MO}}>{p.total}</td><td style={{padding:"10px 12px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:60,height:5,borderRadius:3,background:T.border,overflow:"hidden"}}><div style={{height:"100%",background:T.accent,width:`${filtered.length>0?(p.total/filtered.length)*100:0}%`}}/></div><span style={{fontSize:10,color:T.muted,fontFamily:MO}}>{filtered.length>0?Math.round((p.total/filtered.length)*100):0}%</span></div></td></tr>))}{!personStats.length&&<tr><td colSpan={7} style={{padding:24,textAlign:"center",color:T.muted,fontStyle:"italic",fontFamily:SE}}>No activity in this period</td></tr>}</tbody></table></div></Card></div>)}
      {activeSection==="items"&&(<Card T={T} s={{padding:22}}><SH>Most Active Items — Top {topItems.length}</SH><div style={{marginBottom:10,display:"flex",gap:14,fontSize:11,fontFamily:MO}}><span style={{color:T.low}}>▬ Stock Out (↑ taken)</span><span style={{color:T.ok}}>▬ Stock In (↓ received)</span></div><BarChart T={T} data={topItems.map(i=>({label:i.name,out:i.out,in:i.in}))} maxVal={maxItemVal} showBoth={true}/><div style={{overflow:"auto",marginTop:20}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr style={{borderBottom:`1px solid ${T.border}`,background:T.card2}}>{["#","Code","Item Name","Dept","Times Out","Qty Out","Times In","Qty In","Net Movement"].map(h=>(<th key={h} style={{padding:"9px 12px",textAlign:"left",fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:MO,whiteSpace:"nowrap"}}>{h}</th>))}</tr></thead><tbody>{topItems.map((item,idx)=>{const net=item.totalQtyIn-item.totalQtyOut;return(<tr key={item.code} style={{borderBottom:idx<topItems.length-1?`1px solid ${T.border}`:"none"}} onMouseEnter={e=>e.currentTarget.style.background=T.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><td style={{padding:"9px 12px",fontSize:11,color:T.muted,fontFamily:MO}}>{idx+1}</td><td style={{padding:"9px 12px",fontFamily:MO,fontSize:12,color:T.accent,fontWeight:700}}>{item.code}</td><td style={{padding:"9px 12px",fontSize:13,fontWeight:600,color:T.text,fontFamily:SE,minWidth:140}}>{item.name}</td><td style={{padding:"9px 12px"}}><DeptBadge T={T} dept={item.dept}/></td><td style={{padding:"9px 12px",fontWeight:700,color:T.low,fontFamily:MO}}>{item.out}</td><td style={{padding:"9px 12px",fontFamily:MO,color:T.low}}>{item.totalQtyOut}</td><td style={{padding:"9px 12px",fontWeight:700,color:T.ok,fontFamily:MO}}>{item.in}</td><td style={{padding:"9px 12px",fontFamily:MO,color:T.ok}}>{item.totalQtyIn}</td><td style={{padding:"9px 12px"}}><span style={{fontWeight:700,fontFamily:MO,color:net>=0?T.ok:T.low}}>{net>=0?"+":""}{net}</span></td></tr>);})}  {!topItems.length&&<tr><td colSpan={9} style={{padding:30,textAlign:"center",color:T.muted,fontStyle:"italic",fontFamily:SE}}>No items moved in this period</td></tr>}</tbody></table></div></Card>)}
      {activeSection==="daily"&&(<Card T={T} s={{padding:22}}><SH>Daily Activity Trend</SH><div style={{marginBottom:14,display:"flex",gap:14,fontSize:11,fontFamily:MO}}><span style={{color:T.low}}>▬ Outs</span><span style={{color:T.ok}}>▬ Ins</span></div>{dailyData.length===0?(<div style={{color:T.muted,fontStyle:"italic",fontFamily:SE,fontSize:13,padding:"20px 0"}}>No data for selected period</div>):(<><div style={{display:"flex",alignItems:"flex-end",gap:4,height:120,marginBottom:8,padding:"0 4px",overflowX:"auto"}}>{dailyData.map((d,i)=>{const maxH=100;const hOut=maxDayVal>0?(d.out/maxDayVal)*maxH:0;const hIn=maxDayVal>0?(d.in/maxDayVal)*maxH:0;return(<div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,flex:1,minWidth:20,position:"relative",cursor:"default"}} title={`${d.label}: ↑${d.out} out, ↓${d.in} in`}><div style={{display:"flex",alignItems:"flex-end",gap:1,height:maxH}}><div style={{width:8,background:T.low,height:hOut,borderRadius:"2px 2px 0 0",minHeight:d.out>0?2:0,transition:"height 0.4s"}}/><div style={{width:8,background:T.ok,height:hIn,borderRadius:"2px 2px 0 0",minHeight:d.in>0?2:0,transition:"height 0.4s"}}/></div></div>);})}</div><div style={{display:"flex",gap:4,overflowX:"auto",marginBottom:16,padding:"0 4px"}}>{dailyData.map((d,i)=>{const nth=Math.max(1,Math.floor(dailyData.length/7));const show=i===0||i===dailyData.length-1||(i%nth===0);return <div key={i} style={{flex:1,minWidth:20,fontSize:8,color:show?T.muted:"transparent",fontFamily:MO,textAlign:"center",whiteSpace:"nowrap",overflow:"hidden"}}>{d.label.slice(0,5)}</div>;})}</div><div style={{overflow:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:340}}><thead><tr style={{borderBottom:`1px solid ${T.border}`,background:T.card2}}>{["Date","Stock Outs","Stock Ins","Total","Busiest Type"].map(h=>(<th key={h} style={{padding:"9px 12px",textAlign:"left",fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:MO}}>{h}</th>))}</tr></thead><tbody>{[...dailyData].reverse().filter(d=>d.total>0).map((d,idx,arr)=>(<tr key={d.label} style={{borderBottom:idx<arr.length-1?`1px solid ${T.border}`:"none"}} onMouseEnter={e=>e.currentTarget.style.background=T.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><td style={{padding:"9px 12px",fontFamily:MO,fontSize:12,color:T.text,fontWeight:600}}>{d.label}</td><td style={{padding:"9px 12px",fontWeight:700,color:T.low,fontFamily:MO}}>{d.out}</td><td style={{padding:"9px 12px",fontWeight:700,color:T.ok,fontFamily:MO}}>{d.in}</td><td style={{padding:"9px 12px",fontWeight:700,color:T.text,fontFamily:MO}}>{d.total}</td><td style={{padding:"9px 12px"}}>{d.out>d.in&&<span style={{fontSize:10,fontWeight:700,color:T.low,background:T.lowBg,padding:"2px 8px",borderRadius:4,fontFamily:MO}}>More Outs</span>}{d.in>d.out&&<span style={{fontSize:10,fontWeight:700,color:T.ok,background:T.okBg,padding:"2px 8px",borderRadius:4,fontFamily:MO}}>More Ins</span>}{d.in===d.out&&d.total>0&&<span style={{fontSize:10,color:T.muted,fontFamily:MO}}>Equal</span>}</td></tr>))}</tbody></table>{dailyData.every(d=>d.total===0)&&<div style={{padding:24,textAlign:"center",color:T.muted,fontStyle:"italic",fontFamily:SE}}>No activity in this period</div>}</div></>)}</Card>)}
      {activeSection==="people"&&(<Card T={T} s={{padding:20}}><SH>Staff Activity Breakdown</SH><div style={{overflow:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:500}}><thead><tr style={{borderBottom:`1px solid ${T.border}`,background:T.card2}}>{["Person","Role","Stock Outs","Stock Ins","Total Actions","Activity Share"].map(h=>(<th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:MO}}>{h}</th>))}</tr></thead><tbody>{personStats.map((p,idx)=>(<tr key={p.name} style={{borderBottom:idx<personStats.length-1?`1px solid ${T.border}`:"none"}} onMouseEnter={e=>e.currentTarget.style.background=T.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><td style={{padding:"12px 14px",fontSize:15,fontWeight:600,color:T.text,fontFamily:SE}}>{p.name}</td><td style={{padding:"12px 14px"}}>{p.role&&<RoleBadge T={T} role={p.role}/>}</td><td style={{padding:"12px 14px",fontWeight:700,color:T.low,fontFamily:MO,fontSize:15}}>{p.outs}</td><td style={{padding:"12px 14px",fontWeight:700,color:T.ok,fontFamily:MO,fontSize:15}}>{p.ins}</td><td style={{padding:"12px 14px",fontWeight:800,color:T.text,fontFamily:MO,fontSize:16}}>{p.total}</td><td style={{padding:"12px 14px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:100,height:8,borderRadius:4,background:T.border,overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,background:`linear-gradient(to right,${T.low},${T.accent})`,width:`${filtered.length>0?(p.total/filtered.length)*100:0}%`,transition:"width 0.4s"}}/></div><span style={{fontSize:11,color:T.muted,fontFamily:MO}}>{filtered.length>0?Math.round((p.total/filtered.length)*100):0}%</span></div></td></tr>))}{!personStats.length&&<tr><td colSpan={6} style={{padding:30,textAlign:"center",color:T.muted,fontStyle:"italic",fontFamily:SE}}>No staff activity in this period</td></tr>}</tbody></table></div></Card>)}
      {activeSection==="log"&&(<Card T={T} s={{padding:20}}><SH>Full Movement Log</SH><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}><Inp T={T} value={logItem} onChange={v=>{setLogItem(v);setLogPage(0);}} placeholder="Search item / code…" s={{flex:1,minWidth:140,fontSize:12}}/><Sel T={T} value={logType} onChange={v=>{setLogType(v);setLogPage(0);}} s={{minWidth:100}}><option value="all">All Types</option><option value="out">Stock Out</option><option value="in">Stock In</option></Sel><Sel T={T} value={logPerson} onChange={v=>{setLogPerson(v);setLogPage(0);}} s={{minWidth:130}}><option value="all">All Staff</option>{allPeople.map(p=><option key={p} value={p}>{p}</option>)}</Sel><Sel T={T} value={logDept} onChange={v=>{setLogDept(v);setLogPage(0);}} s={{minWidth:100}}><option value="all">All Depts</option><option value="Front">Front</option><option value="Kitchen">Kitchen</option></Sel><span style={{fontSize:11,color:T.muted,fontFamily:MO,alignSelf:"center"}}>{logFiltered.length} entries</span></div><div style={{overflow:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:580}}><thead><tr style={{borderBottom:`1px solid ${T.border}`,background:T.card2}}>{["Timestamp","Type","Item","Code","Dept","Person","Role","Qty","Before → After"].map(h=>(<th key={h} style={{padding:"9px 12px",textAlign:"left",fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",whiteSpace:"nowrap",fontFamily:MO}}>{h}</th>))}</tr></thead><tbody>{logVisible.map((m,idx)=>(<tr key={m.id} style={{borderBottom:idx<logVisible.length-1?`1px solid ${T.border}`:"none"}} onMouseEnter={e=>e.currentTarget.style.background=T.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><td style={{padding:"9px 12px",fontSize:11,color:T.muted,whiteSpace:"nowrap",fontFamily:MO}}>{m.timestamp}</td><td style={{padding:"9px 12px"}}><span style={{fontSize:10,fontWeight:700,color:m.type==="in"?T.ok:T.low,background:m.type==="in"?T.okBg:T.lowBg,padding:"2px 7px",borderRadius:4,fontFamily:MO}}>{m.type==="in"?"↓ IN":"↑ OUT"}</span></td><td style={{padding:"9px 12px",fontSize:13,fontWeight:500,color:T.text,fontFamily:SE,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.itemName}</td><td style={{padding:"9px 12px",fontFamily:MO,fontSize:11,color:T.accent}}>{m.code}</td><td style={{padding:"9px 12px"}}><DeptBadge T={T} dept={m.dept}/></td><td style={{padding:"9px 12px",fontSize:13,color:T.text,fontWeight:500,fontFamily:SE,whiteSpace:"nowrap"}}>{m.personName||"—"}</td><td style={{padding:"9px 12px"}}>{m.userRole&&<RoleBadge T={T} role={m.userRole}/>}</td><td style={{padding:"9px 12px",fontWeight:700,color:m.type==="in"?T.ok:T.low,fontFamily:MO}}>{m.type==="in"?"+":"-"}{m.qty}</td><td style={{padding:"9px 12px",fontSize:12,color:T.muted,fontFamily:MO,whiteSpace:"nowrap"}}>{m.prevStock} → <strong style={{color:T.text}}>{m.newStock}</strong></td></tr>))}</tbody></table>{!logVisible.length&&<div style={{padding:30,textAlign:"center",color:T.muted,fontStyle:"italic",fontFamily:SE}}>No movements match filters</div>}</div>{logPages>1&&(<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:12}}><Btn T={T} onClick={()=>setLogPage(p=>Math.max(0,p-1))} disabled={logSafeP===0}>← Prev</Btn><span style={{fontSize:12,color:T.muted,fontFamily:MO}}>Page {logSafeP+1} of {logPages} · {logFiltered.length} entries</span><Btn T={T} onClick={()=>setLogPage(p=>Math.min(logPages-1,p+1))} disabled={logSafeP===logPages-1}>Next →</Btn></div>)}</Card>)}
      {activeSection==="counts"&&(<Card T={T} s={{padding:20}}><SH>Count Sessions</SH><div style={{overflow:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr style={{borderBottom:`1px solid ${T.border}`,background:T.card2}}>{["Date","Counted By","Role","Items Counted","With Variance","Surplus","Deficit"].map(h=>(<th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:MO,whiteSpace:"nowrap"}}>{h}</th>))}</tr></thead><tbody>{countHistory.map((c,idx)=>(<tr key={c.id} style={{borderBottom:idx<countHistory.length-1?`1px solid ${T.border}`:"none"}} onMouseEnter={e=>e.currentTarget.style.background=T.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><td style={{padding:"11px 14px",fontSize:13,color:T.text,whiteSpace:"nowrap",fontFamily:MO,fontWeight:600}}>{c.date}</td><td style={{padding:"11px 14px",fontSize:14,fontWeight:600,color:T.text,fontFamily:SE}}>{c.countedBy||"Unknown"}</td><td style={{padding:"11px 14px"}}>{c.userRole&&<RoleBadge T={T} role={c.userRole}/>}</td><td style={{padding:"11px 14px",fontWeight:700,color:T.blue,fontFamily:MO}}>{c.entries.filter(e=>e.physicalCount!=null).length}</td><td style={{padding:"11px 14px",fontWeight:700,color:T.warn,fontFamily:MO}}>{c.entries.filter(e=>e.variance!=null&&e.variance!==0).length}</td><td style={{padding:"11px 14px",fontWeight:700,color:T.ok,fontFamily:MO}}>{c.entries.filter(e=>e.variance!=null&&e.variance>0).length}</td><td style={{padding:"11px 14px",fontWeight:700,color:T.low,fontFamily:MO}}>{c.entries.filter(e=>e.variance!=null&&e.variance<0).length}</td></tr>))}{!countHistory.length&&<tr><td colSpan={7} style={{padding:30,textAlign:"center",color:T.muted,fontStyle:"italic",fontFamily:SE}}>No count sessions yet</td></tr>}</tbody></table></div></Card>)}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════════════════════════════
function UserModal({T,user,onClose,onSave}){
  const [f,setF]=useState(user||{name:"",username:"",password:"",email:"",role:"staff",active:true});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  return(
    <div style={{position:"fixed",inset:0,background:"#000a",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <Card T={T} s={{padding:28,width:480,maxWidth:"100%",maxHeight:"92vh",overflowY:"auto"}}>
        <h2 style={{margin:"0 0 20px",fontSize:22,fontFamily:SE,fontWeight:600,color:T.text}}>{user?"Edit User":"New User"}</h2>
        <div style={{display:"grid",gap:12,marginBottom:20}}>
          <div><Label T={T}>Full Name</Label><Inp T={T} value={f.name} onChange={v=>set("name",v)} placeholder="Full name"/></div>
          <div><Label T={T}>Username</Label><Inp T={T} value={f.username} onChange={v=>set("username",v)} placeholder="Login username"/></div>
          <div><Label T={T}>Email Address</Label><Inp T={T} type="email" value={f.email||""} onChange={v=>set("email",v)} placeholder="user@hazelcafe.lk"/></div>
          <div><Label T={T}>Password {user&&<span style={{fontWeight:400,textTransform:"none",letterSpacing:0}}>(leave blank to keep current)</span>}</Label><Inp T={T} type="password" value={f.password} onChange={v=>set("password",v)} placeholder={user?"••••••••":"Set password"}/></div>
          <div><Label T={T}>Role</Label><Sel T={T} value={f.role} onChange={v=>set("role",v)}>{Object.entries(ROLES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</Sel></div>
          <div style={{background:roleBg(f.role,T),border:`1px solid ${roleColor(f.role,T)}33`,borderRadius:8,padding:"12px 14px"}}><div style={{fontSize:10,fontWeight:700,color:roleColor(f.role,T),marginBottom:6,textTransform:"uppercase",letterSpacing:"0.07em",fontFamily:MO}}>{ROLES[f.role]?.label} — Permissions</div><div style={{fontSize:12,color:T.muted,lineHeight:1.9,fontFamily:SE}}>{ROLES[f.role]?.canViewReports&&"✓ View reports  "}{ROLES[f.role]?.canEditItems&&"✓ Edit items  "}{ROLES[f.role]?.canEditUsers&&"✓ Manage users  "}{ROLES[f.role]?.canEditDevices&&"✓ Manage devices  "}{ROLES[f.role]?.tabs.includes("count")&&"✓ Stock count  "}{"✓ Stock in/out"}</div></div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn T={T} onClick={onClose}>Cancel</Btn><Btn T={T} v="primary" onClick={()=>onSave(f)} disabled={!f.name||!f.username||(!user&&!f.password)}>Save User</Btn></div>
      </Card>
    </div>
  );
}

function AdminResetModal({T,user,onClose,onSave}){
  const [newPw,setNewPw]=useState("");const [confirmPw,setConfirmPw]=useState("");const [show,setShow]=useState(false);const [error,setError]=useState("");
  const reset=()=>{if(newPw.length<6){setError("Password must be at least 6 characters.");return;}if(newPw!==confirmPw){setError("Passwords do not match.");return;}onSave(newPw);};
  return(
    <div style={{position:"fixed",inset:0,background:"#000a",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <Card T={T} s={{padding:26,width:400,maxWidth:"100%"}}>
        <h3 style={{margin:"0 0 4px",fontSize:18,fontFamily:SE,fontWeight:600,color:T.text}}>Reset Password</h3>
        <div style={{fontSize:12,color:T.muted,fontFamily:MO,marginBottom:18}}>User: <strong style={{color:T.accent}}>{user.name}</strong> ({user.username})</div>
        <div style={{display:"grid",gap:12,marginBottom:16}}>
          <div><Label T={T}>New Password</Label><div style={{position:"relative"}}><Inp T={T} type={show?"text":"password"} value={newPw} onChange={setNewPw} placeholder="At least 6 characters" s={{paddingRight:44}}/><button onClick={()=>setShow(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14,padding:2}}>{show?"🙈":"👁"}</button></div></div>
          <div><Label T={T}>Confirm Password</Label><Inp T={T} type="password" value={confirmPw} onChange={setConfirmPw} placeholder="Repeat password" onKeyDown={e=>e.key==="Enter"&&reset()}/></div>
        </div>
        {error&&<div style={{background:T.lowBg,border:`1px solid ${T.low}44`,borderRadius:8,padding:"9px 14px",fontSize:12,color:T.low,marginBottom:14,fontFamily:MO}}>⚠ {error}</div>}
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn T={T} onClick={onClose}>Cancel</Btn><Btn T={T} v="primary" onClick={reset} disabled={!newPw||!confirmPw}>Set Password</Btn></div>
      </Card>
    </div>
  );
}

function UsersTab({T,users,setUsers}){
  const [showModal,setShowModal]=useState(false);const [editUser,setEditUser]=useState(null);const [resetUser,setResetUser]=useState(null);const [search,setSearch]=useState("");const [resetSuccess,setResetSuccess]=useState(null);
  const filtered=useMemo(()=>{if(!search) return users;const q=search.toLowerCase();return users.filter(u=>u.name.toLowerCase().includes(q)||u.username.toLowerCase().includes(q)||u.email?.toLowerCase().includes(q));},[users,search]);
  return(
    <div>
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}><div style={{flex:1}}><div style={{fontSize:22,fontWeight:600,fontFamily:SE,color:T.text}}>User Management</div><div style={{fontSize:12,color:T.muted,marginTop:2,fontFamily:MO}}>{users.length} users registered</div></div><Inp T={T} value={search} onChange={setSearch} placeholder="Search name, username, email…" s={{width:220}}/><Btn T={T} v="primary" onClick={()=>{setEditUser(null);setShowModal(true);}}>+ New User</Btn></div>
      {resetSuccess&&<div style={{background:T.okBg,border:`1px solid ${T.ok}44`,borderRadius:8,padding:"10px 16px",marginBottom:14,fontSize:12,color:T.ok,fontFamily:MO}}>✓ Password reset for <strong>{resetSuccess}</strong></div>}
      <Card T={T} s={{overflow:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:680}}>
          <thead><tr style={{borderBottom:`1px solid ${T.border}`,background:T.card2}}>{["Name","Username","Email","Role","Status","Created","Actions"].map(h=>(<th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:MO,whiteSpace:"nowrap"}}>{h}</th>))}</tr></thead>
          <tbody>{filtered.map((u,idx)=>(<tr key={u.id} style={{borderBottom:idx<filtered.length-1?`1px solid ${T.border}`:"none"}} onMouseEnter={e=>e.currentTarget.style.background=T.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><td style={{padding:"12px 14px",fontSize:14,fontWeight:600,color:T.text,fontFamily:SE,whiteSpace:"nowrap"}}>{u.name}</td><td style={{padding:"12px 14px",fontFamily:MO,fontSize:12,color:T.accent}}>{u.username}</td><td style={{padding:"12px 14px",fontSize:12,color:T.muted,fontFamily:MO,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email||<span style={{opacity:0.4,fontStyle:"italic"}}>not set</span>}</td><td style={{padding:"12px 14px"}}><RoleBadge T={T} role={u.role}/></td><td style={{padding:"12px 14px"}}><span style={{fontSize:10,fontWeight:700,color:u.active?T.ok:T.muted,background:u.active?T.okBg:T.border+"55",padding:"2px 8px",borderRadius:4,fontFamily:MO}}>{u.active?"Active":"Inactive"}</span></td><td style={{padding:"12px 14px",fontSize:11,color:T.muted,fontFamily:MO,whiteSpace:"nowrap"}}>{u.createdAt}</td><td style={{padding:"12px 14px"}}><div style={{display:"flex",gap:5,flexWrap:"wrap"}}><button onClick={()=>{setEditUser(u);setShowModal(true);}} style={{padding:"4px 9px",borderRadius:5,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontSize:11,fontFamily:MO}}>Edit</button><button onClick={()=>setResetUser(u)} style={{padding:"4px 9px",borderRadius:5,border:`1px solid ${T.warn}44`,background:T.warnBg,color:T.warn,cursor:"pointer",fontSize:11,fontFamily:MO}}>Reset PW</button><button onClick={()=>setUsers(prev=>prev.map(p=>p.id===u.id?{...p,active:!p.active}:p))} style={{padding:"4px 9px",borderRadius:5,border:`1px solid ${u.active?T.low+"44":T.ok+"44"}`,background:"transparent",color:u.active?T.low:T.ok,cursor:"pointer",fontSize:11,fontFamily:MO}}>{u.active?"Disable":"Enable"}</button></div></td></tr>))}{!filtered.length&&<tr><td colSpan={7} style={{padding:30,textAlign:"center",color:T.muted,fontStyle:"italic",fontFamily:SE}}>No users found</td></tr>}</tbody>
        </table>
      </Card>
      {showModal&&<UserModal T={T} user={editUser} onClose={()=>setShowModal(false)} onSave={form=>{if(form.id) setUsers(prev=>prev.map(u=>u.id===form.id?form:u));else setUsers(prev=>[...prev,{...form,id:uid(),createdAt:nowStr(),active:true}]);setShowModal(false);}}/>}
      {resetUser&&<AdminResetModal T={T} user={resetUser} onClose={()=>setResetUser(null)} onSave={pw=>{setUsers(prev=>prev.map(u=>u.id===resetUser.id?{...u,password:pw,tempPw:undefined}:u));setResetSuccess(resetUser.name);setResetUser(null);setTimeout(()=>setResetSuccess(null),4000);}}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DEVICES
// ══════════════════════════════════════════════════════════════════════════════
// ── Device fingerprint — stable ID for this browser/device ───────────────────
function getDeviceFingerprint(){
  const nav=window.navigator;
  const raw=[nav.userAgent,nav.language,screen.width+"x"+screen.height,screen.colorDepth,nav.hardwareConcurrency||"",nav.platform||""].join("|");
  let h=0;for(let i=0;i<raw.length;i++){h=Math.imul(31,h)+raw.charCodeAt(i)|0;}
  return"dev_"+(h>>>0).toString(36);
}

function DeviceModal({T,device,onClose,onSave}){
  const [f,setF]=useState(device||{name:"",location:"Front"});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const isNew=!device?.registeredAt; // registeredAt = auto-registered, needs naming
  return(
    <div style={{position:"fixed",inset:0,background:"#000a",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <Card T={T} s={{padding:26,width:420,maxWidth:"100%"}}>
        <h2 style={{margin:"0 0 6px",fontSize:22,fontFamily:SE,fontWeight:600,color:T.text}}>
          {isNew?"Register This Device":"Edit Device"}
        </h2>
        {isNew&&(
          <div style={{fontSize:12,color:T.muted,marginBottom:18,lineHeight:1.6,fontFamily:MO}}>
            This device opened the app and was detected automatically. Give it a name and location so you can identify it in the list.
          </div>
        )}
        {!isNew&&<div style={{fontSize:12,color:T.muted,marginBottom:18,fontFamily:MO}}>Registered: {device.registeredAt}</div>}
        <div style={{display:"grid",gap:12,marginBottom:18}}>
          <div><Label T={T}>Device Name</Label><Inp T={T} value={f.name} onChange={v=>set("name",v)} placeholder="e.g. Front Counter iPad"/></div>
          <div><Label T={T}>Location</Label><Sel T={T} value={f.location} onChange={v=>set("location",v)}>{["Front","Kitchen","Office","Other"].map(l=><option key={l}>{l}</option>)}</Sel></div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn T={T} onClick={onClose}>Cancel</Btn>
          <Btn T={T} v="primary" onClick={()=>onSave(f)} disabled={!f.name.trim()}>Save Device</Btn>
        </div>
      </Card>
    </div>
  );
}

function DevicesTab({T,devices,setDevices}){
  const [editDev,setEditDev]=useState(null);
  const [showAddModal,setShowAddModal]=useState(false);

  // On mount: auto-register this device if not already in list
  useEffect(()=>{
    const fp=getDeviceFingerprint();
    const exists=devices.find(d=>d.fingerprint===fp);
    if(!exists){
      // Add as unnamed pending device — admin will see it and can name it
      setDevices(prev=>[...prev,{
        id:fp,fingerprint:fp,
        name:"New Device (tap Edit to name)",
        location:"Unknown",
        active:true,
        registeredAt:nowStr(),
        pending:true,
      }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const thisFingerprint=getDeviceFingerprint();

  return(
    <div>
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{flex:1}}>
          <div style={{fontSize:22,fontWeight:600,fontFamily:SE,color:T.text}}>Device Management</div>
          <div style={{fontSize:12,color:T.muted,marginTop:2,fontFamily:MO}}>
            {devices.filter(d=>d.active).length} active · devices appear here automatically when the app is opened on them
          </div>
        </div>
        <Btn T={T} v="ghost" onClick={()=>setShowAddModal(true)} s={{fontSize:12}}>+ Add Manually</Btn>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:14}}>
        {devices.map(d=>{
          const isThis=d.fingerprint===thisFingerprint;
          return(
            <Card T={T} key={d.id} s={{padding:20,border:`1px solid ${isThis?T.accent:d.pending?T.warn:T.border}`,position:"relative"}}>
              {isThis&&(
                <div style={{position:"absolute",top:10,right:10,fontSize:9,fontWeight:700,color:T.accent,background:T.accentDim,padding:"2px 8px",borderRadius:4,fontFamily:MO,letterSpacing:"0.06em"}}>THIS DEVICE</div>
              )}
              {d.pending&&!isThis&&(
                <div style={{position:"absolute",top:10,right:10,fontSize:9,fontWeight:700,color:T.warn,background:T.warnBg,padding:"2px 8px",borderRadius:4,fontFamily:MO,letterSpacing:"0.06em"}}>NEEDS NAME</div>
              )}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div style={{fontSize:26}}>{d.location==="Kitchen"?"🍳":d.location==="Office"?"💻":"🖥"}</div>
                <span style={{fontSize:10,fontWeight:700,color:d.active?T.ok:T.muted,background:d.active?T.okBg:T.border+"55",padding:"2px 9px",borderRadius:4,fontFamily:MO}}>{d.active?"Online":"Offline"}</span>
              </div>
              <div style={{fontWeight:600,fontSize:16,marginBottom:3,fontFamily:SE,color:d.pending?T.warn:T.text}}>{d.name}</div>
              <div style={{fontSize:11,color:T.muted,marginBottom:14,fontFamily:MO}}>
                {d.location} · {d.registeredAt||d.addedAt||"—"}
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <Btn T={T} v={d.pending?"primary":"ghost"} onClick={()=>setEditDev(d)} s={{fontSize:11,padding:"5px 12px"}}>{d.pending?"Name this device":"Edit"}</Btn>
                <button onClick={()=>setDevices(prev=>prev.map(p=>p.id===d.id?{...p,active:!p.active}:p))}
                  style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${d.active?T.low+"44":T.ok+"44"}`,background:"transparent",color:d.active?T.low:T.ok,cursor:"pointer",fontSize:11,fontFamily:MO,fontWeight:700}}>
                  {d.active?"Disable":"Enable"}
                </button>
                <button onClick={()=>setDevices(prev=>prev.filter(p=>p.id!==d.id))}
                  style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontSize:11,fontFamily:MO}}>
                  Remove
                </button>
              </div>
            </Card>
          );
        })}
        {!devices.length&&(
          <div style={{color:T.muted,padding:40,gridColumn:"1/-1",textAlign:"center",fontFamily:SE}}>
            <div style={{fontSize:32,marginBottom:10}}>🖥</div>
            <div style={{fontStyle:"italic",fontSize:15,marginBottom:6}}>No devices yet</div>
            <div style={{fontSize:12,color:T.muted}}>Open the app on any device and it will appear here automatically.</div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editDev&&(
        <DeviceModal T={T} device={editDev} onClose={()=>setEditDev(null)}
          onSave={form=>{
            setDevices(prev=>prev.map(d=>d.id===editDev.id?{...d,name:form.name,location:form.location,pending:false}:d));
            setEditDev(null);
          }}
        />
      )}

      {/* Manual add modal */}
      {showAddModal&&(
        <DeviceModal T={T} device={null} onClose={()=>setShowAddModal(false)}
          onSave={form=>{
            setDevices(prev=>[...prev,{...form,id:uid(),registeredAt:nowStr(),active:true,pending:false}]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

// ── CREATOR STAMP ─────────────────────────────────────────────────────────────
function CreatorStamp({T}){
  const isMobile=useIsMobile();
  return(
    <div style={{position:"fixed",bottom:isMobile?66:14,right:14,zIndex:78,pointerEvents:"none",display:"flex",alignItems:"center",gap:5,opacity:0.4}}>
      <div style={{width:1,height:18,background:T.accent}}/>
      <div style={{textAlign:"right"}}><div style={{fontSize:7,fontWeight:700,color:T.accent,letterSpacing:"0.18em",textTransform:"uppercase",fontFamily:MO,lineHeight:1.3}}>App created by</div><div style={{fontSize:10,fontWeight:600,color:T.accent,letterSpacing:"0.1em",fontFamily:SE,fontStyle:"italic",lineHeight:1.2}}>Pansilu</div></div>
    </div>
  );
}

// ── ALERT SETTINGS MODAL ──────────────────────────────────────────────────────
function AlertSettingsModal({T,settings,onClose,onSave}){
  const [email,setEmail]=useState(settings.email||"");const [enabled,setEnabled]=useState(settings.enabled!==false);const [threshold,setThreshold]=useState(settings.threshold||"atMin");const [testStatus,setTestStatus]=useState(null);
  const sendTest=()=>{if(!email.trim()){setTestStatus("noEmail");return;}const sub="[Hazel Inventory] Test Alert";const body=`This is a test from Hazel Cafe & Cakery Inventory.\n\nLow-stock alerts are working correctly.\nEmail: ${email}\nThreshold: ${threshold}\n\nSent: ${nowStr()}`;window.open(`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`);setTestStatus("sent");};
  return(
    <div style={{position:"fixed",inset:0,background:"#000a",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <Card T={T} s={{padding:26,width:480,maxWidth:"100%"}}>
        <h2 style={{margin:"0 0 18px",fontSize:20,fontFamily:SE,fontWeight:600,color:T.text}}>🔔 Low-Stock Alert Settings</h2>
        <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:T.card2,border:`1px solid ${T.border}`,borderRadius:9,padding:"12px 14px"}}><div><div style={{fontSize:13,fontWeight:600,color:T.text}}>Email alerts enabled</div><div style={{fontSize:11,color:T.muted,marginTop:2}}>Send email when items drop below threshold</div></div><button onClick={()=>setEnabled(p=>!p)} style={{width:46,height:26,borderRadius:13,border:"none",background:enabled?T.ok:T.border+"cc",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}><div style={{position:"absolute",top:4,left:enabled?22:4,width:18,height:18,borderRadius:9,background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px #0004"}}/></button></div>
          <div><Label T={T}>Alert Email Address</Label><Inp T={T} value={email} onChange={setEmail} placeholder="manager@hazelcafe.com" type="email"/><div style={{fontSize:10,color:T.muted,marginTop:4,fontFamily:MO}}>Opens your default email client pre-filled when alert fires.</div></div>
          <div><Label T={T}>Alert When Stock Is…</Label><Sel T={T} value={threshold} onChange={setThreshold}><option value="atMin">At or below minimum quantity</option><option value="empty">Completely empty (0)</option><option value="below50">Below 50% of minimum quantity</option></Sel></div>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}><button onClick={sendTest} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,padding:"8px 14px",color:T.muted,cursor:"pointer",fontFamily:MO,fontSize:12,fontWeight:700}}>📧 Send Test Email</button>{testStatus==="sent"&&<span style={{fontSize:11,color:T.ok,fontFamily:MO}}>✓ Email client opened</span>}{testStatus==="noEmail"&&<span style={{fontSize:11,color:T.low,fontFamily:MO}}>⚠ Enter an email first</span>}</div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn T={T} onClick={onClose}>Cancel</Btn><Btn T={T} v="primary" onClick={()=>onSave({email:email.trim(),enabled,threshold})}>Save Settings</Btn></div>
      </Card>
    </div>
  );
}

// ── LOW STOCK ALERT BANNER ────────────────────────────────────────────────────
function LowStockAlertBanner({T,alertItems,alertSettings,onDismiss,onConfigureEmail}){
  const [sending,setSending]=useState(false);
  const [sent,setSent]=useState(false);
  if(!alertItems.length) return null;

  const sendEmail=async()=>{
    if(!alertSettings.email||!alertSettings.enabled) return;
    setSending(true);
    try{
      const lines=alertItems.map(i=>`  • ${i.name} (${i.code}) — stock: ${i.stock}, min: ${i.minQty}`).join("\n");
      await fetch("/api/send-alert",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          to:alertSettings.email,
          count:alertItems.length,
          lines,
          timestamp:nowStr(),
        }),
      });
      setSent(true);
      setTimeout(()=>{setSent(false);onDismiss();},2000);
    }catch(e){
      alert("Failed to send alert email: "+e.message);
    }finally{
      setSending(false);
    }
  };
  return(
    <div style={{background:T.warnBg,border:`1px solid ${T.warn}55`,borderRadius:10,padding:"13px 16px",marginBottom:16,display:"flex",gap:12,alignItems:"flex-start"}}>
      <span style={{fontSize:22,flexShrink:0,lineHeight:1,marginTop:2}}>⚠</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:700,color:T.warn,marginBottom:8,fontFamily:SE}}>{alertItems.length} item{alertItems.length!==1?"s":""} below minimum stock</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>{alertItems.slice(0,8).map(i=>(<span key={i.id} style={{fontSize:11,fontWeight:700,color:T.warn,background:T.warn+"18",border:`1px solid ${T.warn}44`,padding:"3px 9px",borderRadius:5,fontFamily:MO}}>{i.name} <span style={{opacity:0.55}}>({i.stock}/{i.minQty})</span></span>))}{alertItems.length>8&&<span style={{fontSize:11,color:T.muted,fontFamily:MO,alignSelf:"center"}}>+{alertItems.length-8} more</span>}</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{alertSettings.email&&alertSettings.enabled?(<button onClick={sendEmail} disabled={sending||sent} style={{background:sent?T.ok:T.warn,border:"none",borderRadius:7,padding:"7px 14px",color:"#fff",cursor:sending||sent?"default":"pointer",fontFamily:MO,fontSize:12,fontWeight:700,opacity:sending?0.7:1}}>{sent?"✓ Alert sent!":sending?"Sending…":"📧 Email "+alertSettings.email}</button>):(<button onClick={onConfigureEmail} style={{background:"transparent",border:`1px solid ${T.warn}55`,borderRadius:7,padding:"6px 12px",color:T.warn,cursor:"pointer",fontFamily:MO,fontSize:11,fontWeight:700}}>⚙ Set up alert email</button>)}</div>
      </div>
      <button onClick={onDismiss} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:18,padding:0,flexShrink:0,lineHeight:1,marginTop:2}}>✕</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════════════════
const ALL_TABS=[{key:"out",label:"Stock Out",icon:"↑"},{key:"in",label:"Stock In",icon:"↓"},{key:"inv",label:"Inventory",icon:"📦"},{key:"count",label:"Count",icon:"✏"},{key:"var",label:"Variance",icon:"≠"},{key:"po",label:"Order",icon:"🛒"},{key:"hist",label:"History",icon:"📋"},{key:"reports",label:"Reports",icon:"📈"},{key:"users",label:"Users",icon:"👥"},{key:"devices",label:"Devices",icon:"🖥"}];
const tabColor=(k,T)=>({out:T.low,in:T.ok,inv:T.blue,count:T.warn,var:T.purple,po:T.accent,hist:T.muted,reports:T.blue,users:T.purple,devices:T.ok}[k]||T.muted);

export default function App(){
  const isMobile=useIsMobile();
  const [isDark,setIsDark]=useState(false);
  const T=isDark?DARK:LIGHT;
  const [currentUser,setCurrentUser]=useState(null);
  const [tab,setTab]=useState("out");
  const [items,setItems]=useState(DEFAULT_ITEMS);
  const [movements,setMovements]=useState([]);
  const [countHistory,setCountHistory]=useState([]);
  const [users,setUsers]=useState(DEFAULT_USERS);
  const [devices,setDevices]=useState(DEFAULT_DEVICES);
  const [ready,setReady]=useState(false);
  const [syncDot,setSyncDot]=useState(false);
  const [alertSettings,setAlertSettings]=useState({email:"",enabled:true,threshold:"atMin"});
  const [alertBanner,setAlertBanner]=useState([]);
  const [showAlertSettings,setShowAlertSettings]=useState(false);
  const alertedRef=useRef(new Set());

  useEffect(()=>{if(ready)save("hz_alert_settings",alertSettings);},[alertSettings,ready]);

  useEffect(()=>{
    async function boot(){
      const storedVer=await load("hz_items_version","");
      const[sm,sc,su,sd,th,as]=await Promise.all([loadMov(),load("hz_counts",[]),load("hz_users",DEFAULT_USERS),load("hz_devices",DEFAULT_DEVICES),load("hz_theme",false),load("hz_alert_settings",{email:"",enabled:true,threshold:"atMin"})]);
      if(storedVer!==ITEMS_VERSION){await save("hz_items",DEFAULT_ITEMS);await save("hz_items_version",ITEMS_VERSION);setItems(DEFAULT_ITEMS);}
      else{const si=await load("hz_items",DEFAULT_ITEMS);setItems(si);}
      setMovements(sm);setCountHistory(sc);setUsers(su);setDevices(sd);setIsDark(th);setAlertSettings(as);setReady(true);
    }
    boot();
  },[]);

  useEffect(()=>{if(ready)save("hz_items",items);},[items,ready]);
  useEffect(()=>{if(ready)saveMov(movements);},[movements,ready]);
  useEffect(()=>{if(ready)save("hz_counts",countHistory);},[countHistory,ready]);
  useEffect(()=>{if(ready)save("hz_users",users);},[users,ready]);
  useEffect(()=>{if(ready)save("hz_devices",devices);},[devices,ready]);
  useEffect(()=>{if(ready)save("hz_theme",isDark);},[isDark,ready]);

  useEffect(()=>{
    if(!ready||!currentUser) return;
    const isLow=(i)=>{if(alertSettings.threshold==="empty") return i.stock<=0;if(alertSettings.threshold==="below50") return i.stock<Math.ceil(i.minQty*0.5);return i.stock<i.minQty;};
    const newLow=items.filter(i=>isLow(i)&&!alertedRef.current.has(i.id));
    if(newLow.length>0){newLow.forEach(i=>alertedRef.current.add(i.id));setAlertBanner(prev=>{const ids=new Set(prev.map(x=>x.id));return[...prev,...newLow.filter(i=>!ids.has(i.id))];});}
    items.filter(i=>!isLow(i)).forEach(i=>alertedRef.current.delete(i.id));
    setAlertBanner(prev=>prev.filter(i=>{const cur=items.find(x=>x.id===i.id);return cur&&isLow(cur);}));
  },[items,ready,currentUser,alertSettings.threshold]);

  useEffect(()=>{
    if(!ready||!currentUser) return;
    const poll=async()=>{
      try{
        const[si,sm,sc,su,sd]=await Promise.all([load("hz_items",null),loadMov(),load("hz_counts",null),load("hz_users",null),load("hz_devices",null)]);
        if(si) setItems(p=>JSON.stringify(p)===JSON.stringify(si)?p:si);
        if(sm&&sm.length>0) setMovements(p=>JSON.stringify(p)===JSON.stringify(sm)?p:sm);
        if(sc) setCountHistory(p=>JSON.stringify(p)===JSON.stringify(sc)?p:sc);
        if(su) setUsers(p=>JSON.stringify(p)===JSON.stringify(su)?p:su);
        if(sd) setDevices(p=>JSON.stringify(p)===JSON.stringify(sd)?p:sd);
        setSyncDot(true);setTimeout(()=>setSyncDot(false),600);
      }catch{}
    };
    const id=setInterval(poll,8000);return()=>clearInterval(id);
  },[ready,currentUser]);

  const handleLogin=u=>{setCurrentUser(u);setTab(ROLES[u.role]?.tabs[0]||"out");};
  const handleLogout=()=>{setCurrentUser(null);setTab("out");setAlertBanner([]);alertedRef.current.clear();};

  if(!ready) return(<div style={{minHeight:"100vh",background:LIGHT.bg,display:"flex",alignItems:"center",justifyContent:"center",color:LIGHT.muted,fontFamily:SE}}><div style={{textAlign:"center"}}><HazelLogo T={LIGHT} size={50}/><div style={{marginTop:12,fontSize:16,letterSpacing:"0.12em",color:LIGHT.muted}}>Loading…</div></div></div>);
  if(!currentUser) return(<><LoginScreen T={T} isDark={isDark} onToggle={()=>setIsDark(p=>!p)} users={users} setUsers={setUsers} onLogin={handleLogin}/><CreatorStamp T={T}/></>);

  const role=ROLES[currentUser.role];const allowedTabs=ALL_TABS.filter(t=>role.tabs.includes(t.key));const safeTab=role.tabs.includes(tab)?tab:role.tabs[0];const deficit=items.filter(i=>i.stock<i.minQty).length;const empty=items.filter(i=>i.stock<=0).length;const isAdmin=currentUser.role==="admin";

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:MO,color:T.text,transition:"background 0.25s,color 0.25s"}}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>
      <div style={{background:T.navBg,borderBottom:`1px solid ${T.navBorder}`,position:"sticky",top:0,zIndex:90,transition:"background 0.25s",boxShadow:T.shadow}}>
        <div style={{maxWidth:1440,margin:"0 auto",padding:"0 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,height:50,borderBottom:isMobile?"none":`1px solid ${T.navBorder}44`}}>
            <div style={{display:"flex",alignItems:"center",gap:9,flexShrink:0}}><HazelLogo T={T} size={30}/><div><div style={{fontSize:14,fontWeight:600,color:T.accent,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:SE,lineHeight:1.1}}>Hazel</div><div style={{fontSize:8,color:T.muted,letterSpacing:"0.22em",textTransform:"uppercase",lineHeight:1,fontFamily:MO}}>Cafe &amp; Cakery</div></div></div>
            <div style={{marginLeft:"auto",display:"flex",gap:7,alignItems:"center",flexShrink:0}}>
              {deficit>0&&<span style={{fontSize:10,fontWeight:700,color:T.low,background:T.lowBg,padding:"3px 7px",borderRadius:5,fontFamily:MO}}>{deficit} low</span>}
              {empty>0&&<span style={{fontSize:10,fontWeight:700,color:T.warn,background:T.warnBg,padding:"3px 7px",borderRadius:5,fontFamily:MO}}>{empty} empty</span>}
              <span style={{width:6,height:6,borderRadius:"50%",background:syncDot?T.ok:T.border,transition:"background 0.3s",flexShrink:0}}/>
              {(isAdmin||currentUser.role==="supervisor")&&(<button onClick={()=>setShowAlertSettings(true)} title="Low-stock alert settings" style={{position:"relative",background:alertBanner.length>0?T.warnBg:"transparent",border:`1px solid ${alertBanner.length>0?T.warn:T.border}`,borderRadius:7,padding:"4px 9px",cursor:"pointer",color:alertBanner.length>0?T.warn:T.muted,fontSize:14,lineHeight:1}}>🔔{alertBanner.length>0&&(<span style={{position:"absolute",top:-4,right:-4,minWidth:16,height:16,borderRadius:8,background:T.low,border:`2px solid ${T.navBg}`,fontSize:8,fontWeight:800,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:MO,padding:"0 3px"}}>{alertBanner.length}</span>)}</button>)}
              <ThemeToggle T={T} isDark={isDark} onToggle={()=>setIsDark(p=>!p)}/>
              <div style={{display:"flex",alignItems:"center",gap:7,background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 10px"}}><RoleBadge T={T} role={currentUser.role}/><span style={{fontSize:12,color:T.text,fontWeight:600,fontFamily:SE}}>{currentUser.name}</span><button onClick={handleLogout} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:11,fontFamily:MO,padding:0,marginLeft:2,borderLeft:`1px solid ${T.border}`,paddingLeft:8}}>← Out</button></div>
            </div>
          </div>
          {!isMobile&&(<div style={{display:"flex",gap:0,overflowX:"auto",scrollbarWidth:"none"}}>{allowedTabs.map(t=>{const c=tabColor(t.key,T);const active=safeTab===t.key;return(<button key={t.key} onClick={()=>setTab(t.key)} style={{padding:"8px 13px",border:"none",borderBottom:active?`2px solid ${c}`:"2px solid transparent",background:active?c+"12":"transparent",color:active?c:T.muted,fontWeight:700,cursor:"pointer",fontSize:11,fontFamily:MO,whiteSpace:"nowrap",transition:"all 0.15s",flexShrink:0}}>{t.icon} {t.label}</button>);})}</div>)}
        </div>
      </div>
      <div style={{maxWidth:1440,margin:"0 auto",padding:isMobile?"12px 10px 80px":"24px 16px 60px"}}>
        {alertBanner.length>0&&(<LowStockAlertBanner T={T} alertItems={alertBanner} alertSettings={alertSettings} onDismiss={()=>setAlertBanner([])} onConfigureEmail={()=>setShowAlertSettings(true)}/>)}
        {safeTab==="out"    &&<MovementTab    T={T} type="out" items={items} movements={movements} setMovements={setMovements} setItems={setItems} currentUser={currentUser}/>}
        {safeTab==="in"     &&<MovementTab    T={T} type="in"  items={items} movements={movements} setMovements={setMovements} setItems={setItems} currentUser={currentUser}/>}
        {safeTab==="inv"    &&<InventoryTab   T={T} items={items} setItems={setItems} canEdit={role.canEditItems}/>}
        {safeTab==="count"  &&<ManualCountTab T={T} items={items} setItems={setItems} countHistory={countHistory} setCountHistory={setCountHistory} currentUser={currentUser}/>}
        {safeTab==="var"    &&<VarianceTab    T={T} countHistory={countHistory}/>}
        {safeTab==="po"     &&<PurchaseOrderTab T={T} items={items} alertSettings={alertSettings}/>}
        {safeTab==="hist"   &&<HistoryTab     T={T} movements={movements}/>}
        {safeTab==="reports"&&<ReportsTab     T={T} movements={movements} countHistory={countHistory}/>}
        {safeTab==="users"  &&<UsersTab       T={T} users={users} setUsers={setUsers}/>}
        {safeTab==="devices"&&<DevicesTab     T={T} devices={devices} setDevices={setDevices}/>}
      </div>
      {isMobile&&(<div style={{position:"fixed",bottom:0,left:0,right:0,background:T.navBg,borderTop:`1px solid ${T.navBorder}`,display:"flex",zIndex:100,overflowX:"auto"}}>{allowedTabs.map(t=>{const c=tabColor(t.key,T);return(<button key={t.key} onClick={()=>setTab(t.key)} style={{flex:1,minWidth:44,padding:"9px 2px 7px",border:"none",background:"transparent",color:safeTab===t.key?c:T.muted,cursor:"pointer",fontFamily:MO,display:"flex",flexDirection:"column",alignItems:"center",gap:2,borderTop:safeTab===t.key?`2px solid ${c}`:"2px solid transparent"}}><span style={{fontSize:15,lineHeight:1}}>{t.icon}</span><span style={{fontSize:7,fontWeight:700,letterSpacing:"0.02em",whiteSpace:"nowrap"}}>{t.label}</span></button>);})}</div>)}
      {showAlertSettings&&(<AlertSettingsModal T={T} settings={alertSettings} onClose={()=>setShowAlertSettings(false)} onSave={s=>{setAlertSettings(s);setShowAlertSettings(false);}}/>)}
      <CreatorStamp T={T}/>
    </div>
  );
}