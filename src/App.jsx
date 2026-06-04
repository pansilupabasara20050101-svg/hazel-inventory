import { useState, useMemo, useEffect, useRef } from "react";
import { db } from "./firebase";
import { doc, setDoc, getDoc, onSnapshot, collection } from "firebase/firestore";

function useIsMobile(bp=768){const[m,setM]=useState(()=>typeof window!=="undefined"&&window.innerWidth<bp);useEffect(()=>{const h=()=>setM(window.innerWidth<bp);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[bp]);return m;}

const uid=()=>Math.random().toString(36).slice(2,10);
const nowStr=()=>new Date().toLocaleString("en-GB",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
const fmtRs=n=>n==null||n===""?"—":`Rs${Number(n).toLocaleString("en-LK",{minimumFractionDigits:2,maximumFractionDigits:2})}`;

// ── Firebase helpers ──────────────────────────────────────────────────────────
async function fbSave(key, val) {
  try {
    await setDoc(doc(db, "hazel", key), { data: JSON.stringify(val) });
  } catch(e) { console.warn("fbSave error", key, e); }
}
async function fbLoad(key, fallback) {
  try {
    const snap = await getDoc(doc(db, "hazel", key));
    if (snap.exists()) return JSON.parse(snap.data().data);
    return fallback;
  } catch(e) { return fallback; }
}

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
const DEFAULT_DEVICES=[];
const DEFAULT_ITEMS=[
  {id:"F100",dept:"Front",location:"Stores",supplier:"Sivasakthy",brand:"Nestle",name:"Milo 400g",code:"F100",unit:"Grams (g)",stock:7,minQty:5,perUnit:865},
  {id:"F101",dept:"Front",location:"Stores",supplier:"Udula Distributors",brand:"Lakspray",name:"Milk Powder 1kg",code:"F101",unit:"Grams (g)",stock:2,minQty:3,perUnit:null},
  {id:"F102",dept:"Front",location:"Stores",supplier:"CBL Food Solution",brand:"Munchee",name:"Kalos 140g",code:"F102",unit:"Nos",stock:12,minQty:10,perUnit:263.23},
  {id:"F103",dept:"Front",location:"Stores",supplier:"Sivasakthy",brand:"Sivasakthy",name:"White Sugar 1kg",code:"F103",unit:"Grams (g)",stock:0,minQty:0,perUnit:220},
  {id:"F104",dept:"Front",location:"Stores",supplier:"Sivasakthy",brand:"Bulk",name:"Brown Sugar 1kg",code:"F104",unit:"Grams (g)",stock:8,minQty:3,perUnit:290},
  {id:"F133",dept:"Front",location:"Stores",supplier:"Damn Fine",brand:"Damn Fine",name:"Coffee Bean 1kg",code:"F133",unit:"Grams (g)",stock:7,minQty:10,perUnit:11505},
  {id:"F148",dept:"Front",location:"Stores",supplier:"Lanka Milk Foods",brand:"Ambewela",name:"Ambewela 1L",code:"F148",unit:"Mililitres (ml)",stock:91,minQty:60,perUnit:495},
  {id:"K100",dept:"Kitchen",location:"Stores",supplier:"Sivasakthy/Edinborough",brand:"Edinborough",name:"Edinborough Vinegar 4L",code:"K100",unit:"Mililitres (ml)",stock:6,minQty:3,perUnit:1065},
  {id:"K101",dept:"Kitchen",location:"Stores",supplier:"Sivasakthy",brand:"Kist",name:"Kist Tomato Sauce 4L",code:"K101",unit:"Mililitres (ml)",stock:4,minQty:2,perUnit:1850},
  {id:"K115",dept:"Kitchen",location:"Stores",supplier:"Sivasakthy",brand:"Sivashakthy",name:"White Sugar 1kg",code:"K115",unit:"Grams (g)",stock:17,minQty:10,perUnit:220},
];

const MO="'DM Mono','Courier New',monospace";
const SE="'Cormorant Garamond','Georgia',serif";

function inp(T){return{background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:14,padding:"10px 13px",outline:"none",fontFamily:MO,width:"100%",boxSizing:"border-box",transition:"border-color 0.2s"};}
function Inp({T,value,onChange,placeholder,type="text",s={},onKeyDown}){return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} onKeyDown={onKeyDown} style={{...inp(T),...s}}/>;}
function Sel({T,value,onChange,children,s={}}){return <select value={value} onChange={e=>onChange(e.target.value)} style={{...inp(T),...s}}>{children}</select>;}
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
    return items.filter(i=>i.name.toLowerCase().includes(q)||i.code.toLowerCase().includes(q)||i.dept.toLowerCase().includes(q)||(i.barcode&&i.barcode.toLowerCase().includes(q))||(i.brand&&i.brand.toLowerCase().includes(q))).slice(0,12);
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

// ── PIN UNLOCK SCREEN ────────────────────────────────────────────────────────
function PinUnlock({T,storedUser,onSuccess,onUsePassword}){
  const [pin,setPin]=useState("");
  const [error,setError]=useState("");
  const [shake,setShake]=useState(false);
  const savedPin=localStorage.getItem("pin_"+storedUser.id);

  const tryBiometric=async()=>{
    try{
      if(!window.PublicKeyCredential) return;
      const challenge=new Uint8Array(32);crypto.getRandomValues(challenge);
      await navigator.credentials.get({publicKey:{challenge,timeout:60000,userVerification:"required",rpId:window.location.hostname}});
      onSuccess(storedUser);
    }catch(e){setError("Biometric failed. Use PIN or password.");}
  };

  useEffect(()=>{
    if(window.PublicKeyCredential&&localStorage.getItem("bio_"+storedUser.id)==="1") tryBiometric();
  },[]);

  const tap=(d)=>{
    if(d==="del"){setPin(p=>p.slice(0,-1));setError("");return;}
    const next=pin+d;
    setPin(next);
    if(next.length===4){
      if(next===savedPin){setPin("");onSuccess(storedUser);}
      else{setError("Wrong PIN");setShake(true);setPin("");setTimeout(()=>setShake(false),500);}
    }
  };

  return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,fontFamily:SE}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:8}}><HazelLogo T={T} size={44}/></div>
        <div style={{fontSize:22,fontWeight:600,color:T.accent,letterSpacing:"0.14em",textTransform:"uppercase"}}>Welcome back</div>
        <div style={{fontSize:14,color:T.muted,marginTop:4,fontFamily:MO}}>{storedUser.name}</div>
      </div>
      <div style={{animation:shake?"shake 0.45s ease":"none",display:"flex",flexDirection:"column",alignItems:"center",gap:20,width:"100%",maxWidth:300}}>
        <div style={{display:"flex",gap:14,marginBottom:4}}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{width:16,height:16,borderRadius:"50%",background:pin.length>i?T.accent:T.border,transition:"background 0.15s"}}/>
          ))}
        </div>
        {error&&<div style={{fontSize:12,color:T.low,fontFamily:MO}}>{error}</div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,width:"100%"}}>
          {["1","2","3","4","5","6","7","8","9","","0","del"].map((d,i)=>(
            <button key={i} onClick={()=>d&&tap(d)} disabled={!d} style={{height:62,borderRadius:12,border:`1px solid ${T.border}`,background:d?T.card:"transparent",color:T.text,fontSize:d==="del"?18:22,fontWeight:600,cursor:d?"pointer":"default",fontFamily:MO,opacity:d?1:0,transition:"background 0.1s"}}
              onMouseDown={e=>e.currentTarget.style.background=T.card2} onMouseUp={e=>e.currentTarget.style.background=T.card}>
              {d==="del"?"⌫":d}
            </button>
          ))}
        </div>
        {localStorage.getItem("bio_"+storedUser.id)==="1"&&(
          <button onClick={tryBiometric} style={{background:T.accentDim,border:`1px solid ${T.accent}44`,borderRadius:10,padding:"10px 24px",color:T.accent,cursor:"pointer",fontFamily:MO,fontSize:13,fontWeight:700}}>🔬 Use Fingerprint / Face</button>
        )}
        <button onClick={onUsePassword} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontFamily:MO,fontSize:12,textDecoration:"underline",marginTop:4}}>Use password instead</button>
      </div>
    </div>
  );
}

// ── PIN SETUP MODAL ───────────────────────────────────────────────────────────
function PinSetupModal({T,user,onClose,onSave}){
  const [step,setStep]=useState(1);
  const [pin1,setPin1]=useState("");
  const [pin2,setPin2]=useState("");
  const [error,setError]=useState("");
  const [bioDone,setBioDone]=useState(false);
  const current=step===1?pin1:pin2;
  const setCurrentPin=step===1?setPin1:setPin2;

  const tap=(d)=>{
    if(d==="del"){setCurrentPin(p=>p.slice(0,-1));setError("");return;}
    const next=current+d;
    setCurrentPin(next);
    if(next.length===4){
      if(step===1){setTimeout(()=>setStep(2),200);}
      else{
        if(next===pin1){onSave(pin1);}
        else{setError("PINs don't match. Try again.");setPin1("");setPin2("");setStep(1);setTimeout(()=>setError(""),2000);}
      }
    }
  };

  const setupBiometric=async()=>{
    try{
      if(!window.PublicKeyCredential){setError("Biometrics not supported on this device.");return;}
      const challenge=new Uint8Array(32);crypto.getRandomValues(challenge);
      const userId=new TextEncoder().encode(user.id);
      await navigator.credentials.create({publicKey:{challenge,rp:{name:"Hazel Inventory",id:window.location.hostname},user:{id:userId,name:user.username,displayName:user.name},pubKeyCredParams:[{type:"public-key",alg:-7}],authenticatorSelection:{userVerification:"required",authenticatorAttachment:"platform"},timeout:60000}});
      localStorage.setItem("bio_"+user.id,"1");
      setBioDone(true);
    }catch(e){setError("Biometric setup failed: "+e.message);}
  };

  return(
    <div style={{position:"fixed",inset:0,background:"#000a",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <Card T={T} s={{padding:28,width:340,maxWidth:"100%"}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:18,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:4}}>{step===1?"Set PIN":"Confirm PIN"}</div>
          <div style={{fontSize:11,color:T.muted,fontFamily:MO}}>{step===1?"Enter a 4-digit PIN for quick unlock":"Enter the same PIN again"}</div>
        </div>
        <div style={{display:"flex",gap:14,justifyContent:"center",marginBottom:16}}>
          {[0,1,2,3].map(i=>(<div key={i} style={{width:14,height:14,borderRadius:"50%",background:current.length>i?T.accent:T.border,transition:"background 0.15s"}}/>))}
        </div>
        {error&&<div style={{fontSize:12,color:T.low,fontFamily:MO,textAlign:"center",marginBottom:10}}>{error}</div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
          {["1","2","3","4","5","6","7","8","9","","0","del"].map((d,i)=>(
            <button key={i} onClick={()=>d&&tap(d)} disabled={!d} style={{height:56,borderRadius:10,border:`1px solid ${T.border}`,background:d?T.card:"transparent",color:T.text,fontSize:d==="del"?16:20,fontWeight:600,cursor:d?"pointer":"default",fontFamily:MO,opacity:d?1:0}}
              onMouseDown={e=>e.currentTarget.style.background=T.card2} onMouseUp={e=>e.currentTarget.style.background=T.card}>
              {d==="del"?"⌫":d}
            </button>
          ))}
        </div>
        {window.PublicKeyCredential&&(
          <button onClick={setupBiometric} style={{width:"100%",background:bioDone?T.okBg:T.accentDim,border:`1px solid ${bioDone?T.ok:T.accent}44`,borderRadius:8,padding:"10px",color:bioDone?T.ok:T.accent,cursor:"pointer",fontFamily:MO,fontSize:12,fontWeight:700,marginBottom:10}}>
            {bioDone?"✓ Fingerprint/Face Registered":"🔬 Also set up Fingerprint / Face ID"}
          </button>
        )}
        <Btn T={T} onClick={onClose} s={{width:"100%"}}>Cancel — skip for now</Btn>
      </Card>
    </div>
  );
}

// ── LOGIN SCREEN (no default accounts shown) ──────────────────────────────────
function LoginScreen({T,isDark,onToggle,users,setUsers,onLogin}){
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [showPass,setShowPass]=useState(false);
  const [shake,setShake]=useState(false);
  const [showRecovery,setShowRecovery]=useState(false);
  const [newPw,setNewPw]=useState("");
  const [confirmPw,setConfirmPw]=useState("");
  const [recoveryDone,setRecoveryDone]=useState(false);
  const [showPinSetup,setShowPinSetup]=useState(null);
  const [pendingUser,setPendingUser]=useState(null);

  // Check if last user has PIN set — show PIN screen
  const savedUserId=localStorage.getItem("lastUserId");
  const savedUser=savedUserId?users.find(u=>u.id===savedUserId&&u.active):null;
  const savedPin=savedUser?localStorage.getItem("pin_"+savedUser.id):null;
  const [showPinUnlock,setShowPinUnlock]=useState(!!savedPin);

  const attempt=()=>{
    if(username.trim()==="Hazel no salary"){setShowRecovery(true);setError("");return;}
    const u=users.find(u=>u.username===username.trim()&&u.password===password&&u.active);
    if(u){
      setError("");
      localStorage.setItem("lastUserId",u.id);
      const hasPin=localStorage.getItem("pin_"+u.id);
      if(!hasPin){setPendingUser(u);setShowPinSetup(u);}
      else{onLogin(u);}
    }
    else{setError("Invalid username or password");setShake(true);setTimeout(()=>setShake(false),500);}
  };

  const doRecovery=()=>{
    if(newPw.length<6){setError("Password must be at least 6 characters.");return;}
    if(newPw!==confirmPw){setError("Passwords do not match.");return;}
    setUsers(prev=>prev.map(u=>u.role==="admin"?{...u,password:newPw}:u));
    setRecoveryDone(true);setError("");
    setTimeout(()=>{setShowRecovery(false);setRecoveryDone(false);setNewPw("");setConfirmPw("");setUsername("");},2000);
  };

  if(showPinUnlock&&savedUser){
    return <PinUnlock T={T} storedUser={savedUser} onSuccess={u=>{setShowPinUnlock(false);onLogin(u);}} onUsePassword={()=>setShowPinUnlock(false)}/>;
  }

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
        {showRecovery?(
          <Card T={T} s={{padding:32}}>
            <div style={{fontSize:18,fontWeight:600,fontFamily:SE,color:T.accent,marginBottom:6}}>🔐 Admin Recovery</div>
            <div style={{fontSize:12,color:T.muted,marginBottom:20,fontFamily:MO,lineHeight:1.6}}>Set a new password for the Admin account.</div>
            {recoveryDone?(
              <div style={{background:T.okBg,border:`1px solid ${T.ok}44`,borderRadius:8,padding:"14px",textAlign:"center",fontSize:13,color:T.ok,fontFamily:MO}}>✓ Admin password updated! Redirecting…</div>
            ):(
              <>
                <div style={{display:"grid",gap:12,marginBottom:16}}>
                  <div><Label T={T}>New Password</Label><Inp T={T} type="password" value={newPw} onChange={setNewPw} placeholder="At least 6 characters"/></div>
                  <div><Label T={T}>Confirm Password</Label><Inp T={T} type="password" value={confirmPw} onChange={setConfirmPw} placeholder="Repeat password" onKeyDown={e=>e.key==="Enter"&&doRecovery()}/></div>
                </div>
                {error&&<div style={{background:T.lowBg,border:`1px solid ${T.low}44`,borderRadius:8,padding:"10px 14px",fontSize:12,color:T.low,marginBottom:14,fontFamily:MO}}>⚠ {error}</div>}
                <div style={{display:"flex",gap:10}}>
                  <Btn T={T} onClick={()=>{setShowRecovery(false);setError("");setUsername("");}} s={{flex:1}}>Cancel</Btn>
                  <Btn T={T} v="primary" onClick={doRecovery} s={{flex:2,padding:"12px",fontFamily:SE,fontWeight:600}} disabled={!newPw||!confirmPw}>Reset Admin Password</Btn>
                </div>
              </>
            )}
          </Card>
        ):(
          <Card T={T} s={{padding:32,animation:shake?"shake 0.45s ease":"none"}}>
            <div style={{marginBottom:16}}>
              <Label T={T}>Username</Label>
              <Inp T={T} value={username} onChange={setUsername} placeholder="Enter username" onKeyDown={e=>e.key==="Enter"&&attempt()}/>
            </div>
            <div style={{marginBottom:20,position:"relative"}}>
              <Label T={T}>Password</Label>
              <div style={{position:"relative"}}>
                <Inp T={T} value={password} onChange={setPassword} type={showPass?"text":"password"} placeholder="Enter password" s={{paddingRight:44}} onKeyDown={e=>e.key==="Enter"&&attempt()}/>
                <button onClick={()=>setShowPass(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15,padding:2,lineHeight:1}}>{showPass?"🙈":"👁"}</button>
              </div>
            </div>
            {error&&<div style={{background:T.lowBg,border:`1px solid ${T.low}44`,borderRadius:8,padding:"10px 14px",fontSize:12,color:T.low,marginBottom:16,fontFamily:MO}}>⚠ {error}</div>}
            <Btn T={T} v="primary" onClick={attempt} s={{width:"100%",padding:"13px",fontSize:14,letterSpacing:"0.1em",fontFamily:SE,fontWeight:600}}>Sign In</Btn>
          </Card>
        )}
      </div>
      {showPinSetup&&<PinSetupModal T={T} user={showPinSetup} onClose={()=>{setShowPinSetup(null);onLogin(pendingUser);}} onSave={pin=>{localStorage.setItem("pin_"+showPinSetup.id,pin);setShowPinSetup(null);onLogin(pendingUser);}}/>}
    </div>
  );
}

// ── STOCK MOVEMENT ────────────────────────────────────────────────────────────
function MovementTab({T,type,items,movements,setMovements,setItems,currentUser}){
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState(null);
  const [qty,setQty]=useState("");
  const [note,setNote]=useState("");
  const [success,setSuccess]=useState(null);
  const [confirmOverdraw,setConfirmOverdraw]=useState(false);
  const [undoTimer,setUndoTimer]=useState(null);
  const [lastMov,setLastMov]=useState(null);
  const [showCam,setShowCam]=useState(false);
  const [showAI,setShowAI]=useState(false);
  const isMobile=useIsMobile();
  const isOut=type==="out";

  useEffect(()=>()=>{if(undoTimer) clearTimeout(undoTimer);},[undoTimer]);

  const doPost=(forceNegative=false)=>{
    if(!selected||!qty||Number(qty)<=0) return;
    const n=Number(qty);
    const newStock=isOut?selected.stock-n:selected.stock+n;
    if(isOut&&newStock<0&&!forceNegative){setConfirmOverdraw(true);return;}
    setConfirmOverdraw(false);
    const mov={id:uid(),type,timestamp:nowStr(),personName:currentUser.name,userId:currentUser.id,userRole:currentUser.role,dept:selected.dept,code:selected.code,itemName:selected.name,qty:n,prevStock:selected.stock,newStock,note:note.trim()||null};
    setMovements(prev=>{if(prev.find(m=>m.id===mov.id)) return prev;return [mov,...prev];});
    setItems(prev=>prev.map(i=>i.id===selected.id?{...i,stock:newStock}:i));
    setLastMov(mov);setSuccess({...mov});setSelected(null);setQty("");setSearch("");setNote("");
    if(undoTimer) clearTimeout(undoTimer);
    const t=setTimeout(()=>{setLastMov(null);setSuccess(null);},60000);setUndoTimer(t);
  };

  const doUndo=()=>{
    if(!lastMov) return;
    setItems(prev=>prev.map(i=>i.code===lastMov.code?{...i,stock:lastMov.prevStock}:i));
    setMovements(prev=>prev.filter(m=>m.id!==lastMov.id));
    setLastMov(null);setSuccess(null);if(undoTimer) clearTimeout(undoTimer);
  };

  const recent=movements.filter(m=>m.type===type).slice(0,30);

  return(
    <>
    {showCam&&<CameraScanner T={T} items={items} onSelect={i=>{setSelected(i);setSearch(i.name+" ("+i.code+")");}} onClose={()=>setShowCam(false)}/>}
    {showAI&&<AICameraScanner T={T} items={items} onSelect={i=>{setSelected(i);setSearch(i.name+" ("+i.code+")");}} onClose={()=>setShowAI(false)}/>}
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
          <div style={{width:28,height:28,borderRadius:7,background:isOut?T.lowBg:T.okBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:isOut?T.low:T.ok,fontFamily:MO}}>{isOut?"↑":"↓"}</div>
          <div style={{fontSize:13,fontWeight:700,color:isOut?T.low:T.ok,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:MO}}>{isOut?"Stock Out":"Stock In"}</div>
        </div>
        <div style={{fontSize:12,color:T.muted,marginBottom:18,fontFamily:MO}}>as <strong style={{color:T.accent}}>{currentUser.name}</strong></div>
        <div style={{display:"grid",gap:14}}>
          <div>
            <Label T={T}>Search Item</Label>
            <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
              <div style={{flex:1}}><ItemSearch T={T} items={items} value={search} onChange={v=>{setSearch(v);setSelected(null);}} onSelect={i=>{setSelected(i);setSearch(i.name+" ("+i.code+")");}}/></div>
              <button onClick={()=>setShowCam(true)} title="Scan barcode" style={{flexShrink:0,height:44,width:48,borderRadius:8,border:`1px solid ${T.accent}55`,background:T.accentDim,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1}}><span style={{fontSize:18,lineHeight:1}}>📷</span><span style={{fontSize:7,color:T.accent,fontWeight:700,fontFamily:MO}}>SCAN</span></button>
              <button onClick={()=>setShowAI(true)} title="AI identify item" style={{flexShrink:0,height:44,width:48,borderRadius:8,border:`1px solid ${T.purple}55`,background:T.purpleBg,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1}}>
                <span style={{fontSize:16,lineHeight:1}}>✦</span>
                <span style={{fontSize:7,color:T.purple,fontWeight:700,fontFamily:MO}}>AI</span>
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
          <div>
            <Label T={T}>Note <span style={{fontWeight:400,textTransform:"none",letterSpacing:0,opacity:0.6}}>(optional)</span></Label>
            <Inp T={T} value={note} onChange={setNote} placeholder={isOut?"e.g. Used for catering order…":"e.g. Delivery from Sivasakthy…"} onKeyDown={e=>e.key==="Enter"&&doPost()}/>
          </div>
          <Btn T={T} v={isOut?"danger":"ok"} onClick={()=>doPost()} disabled={!selected||!qty||Number(qty)<=0} s={{width:"100%",padding:"13px",fontSize:14,letterSpacing:"0.06em"}}>{isOut?"↑ Record Stock Out":"↓ Record Stock In"}</Btn>
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
              <div style={{width:30,height:30,borderRadius:6,background:isOut?T.lowBg:T.okBg,display:"flex",alignItems:"center",justifyContent:"center",color:isOut?T.low:T.ok,fontWeight:900,flexShrink:0,fontFamily:MO,fontSize:13}}>{isOut?"↑":"↓"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:T.text,fontFamily:SE}}>{m.itemName}</div>
                <div style={{fontSize:10,color:T.muted,marginTop:2,fontFamily:MO}}>{m.personName} · {m.timestamp}</div>
                {m.note&&<div style={{fontSize:10,color:T.muted,marginTop:1,fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.note}</div>}
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontWeight:700,color:isOut?T.low:T.ok,fontFamily:MO,fontSize:14}}>{isOut?"-":"+"}{m.qty}</div>
                <div style={{fontSize:10,color:T.muted,fontFamily:MO}}>{m.prevStock}→{m.newStock}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
    </>
  );
}

// ── INVENTORY ─────────────────────────────────────────────────────────────────
function ItemModal({T,item,onClose,onSave}){
  const [f,setF]=useState(item||{code:"",dept:"Front",supplier:"",brand:"",name:"",unit:"Nos",stock:0,minQty:0,perUnit:"",barcode:"",location:"Stores",qtySize:""});
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
          <div><Label T={T}>Unit</Label><Sel T={T} value={f.unit} onChange={v=>set("unit",v)}>{["Nos","Grams (g)","Mililitres (ml)","Kilograms (kg)","Litres (l)"].map(u=><option key={u}>{u}</option>)}</Sel></div>
          <div><Label T={T}>Per Unit Price (Rs)</Label><Inp T={T} type="number" value={f.perUnit||""} onChange={v=>set("perUnit",v)} placeholder="0.00"/></div>
          <div><Label T={T}>Current Stock</Label><Inp T={T} type="number" value={f.stock} onChange={v=>set("stock",Number(v))}/></div>
          <div><Label T={T}>Min Qty</Label><Inp T={T} type="number" value={f.minQty} onChange={v=>set("minQty",Number(v))}/></div>
          <div><Label T={T}>Qty Size (e.g. 1kg, 400g)</Label><Inp T={T} value={f.qtySize||""} onChange={v=>set("qtySize",v)} placeholder="e.g. 1kg"/></div>
          <div><Label T={T}>Location</Label><Inp T={T} value={f.location||""} onChange={v=>set("location",v)} placeholder="e.g. Stores"/></div>
          <div style={{gridColumn:"1/-1"}}><Label T={T}>Barcode</Label><Inp T={T} value={f.barcode||""} onChange={v=>set("barcode",v)} placeholder="Scan or type barcode number"/></div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn T={T} v="danger" onClick={()=>{if(window.confirm("Delete "+f.name+"? This cannot be undone.")) onSave({...f,_delete:true});}} s={{marginRight:"auto"}}>Delete</Btn>
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
      </div>
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
                <td style={{padding:"10px 13px",fontSize:12,color:T.muted}}>{item.supplier||"—"}</td>
                <td style={{padding:"10px 13px",fontSize:12,color:T.muted}}>{item.brand||"—"}</td>
                <td style={{padding:"10px 13px",fontSize:11,color:T.muted,fontFamily:MO}}>{item.unit}</td>
                <td style={{padding:"10px 13px",fontWeight:800,fontSize:16,color:item.stock<=0?T.low:item.stock<item.minQty?T.warn:T.text,fontFamily:MO}}>{item.stock}</td>
                <td style={{padding:"10px 13px",fontSize:13,color:T.muted,fontFamily:MO}}>{item.minQty}</td>
                <td style={{padding:"10px 13px"}}><StockBadge T={T} surplus={item.stock-item.minQty}/></td>
                <td style={{padding:"10px 13px",fontSize:12,color:T.muted,fontFamily:MO}}>{item.perUnit?fmtRs(item.perUnit):"—"}</td>
                {canEdit&&<td style={{padding:"10px 13px"}}><button onClick={()=>setEditItem(item)} style={{padding:"4px 9px",borderRadius:5,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontSize:11,fontFamily:MO}}>Edit</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length===0&&<div style={{padding:40,textAlign:"center",color:T.muted,fontStyle:"italic",fontFamily:SE}}>No items found</div>}
      </Card>
      {canEdit&&(editItem||showAdd)&&<ItemModal T={T} item={editItem} onClose={()=>{setEditItem(null);setShowAdd(false);}} onSave={form=>{if(form._delete){setItems(prev=>prev.filter(i=>i.id!==form.id));}else if(form.id){setItems(prev=>prev.map(i=>i.id===form.id?form:i));}else{setItems(prev=>[...prev,{...form,id:form.code||uid()}]);}setEditItem(null);setShowAdd(false);}}/>}
    </div>
  );
}

// ── MANUAL COUNT ──────────────────────────────────────────────────────────────
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
        <Inp T={T} value={search} onChange={setSearch} placeholder="Search…" s={{width:isMobile?"100%":160}}/>
        <Sel T={T} value={deptF} onChange={setDeptF} s={{minWidth:100}}><option>All</option><option>Front</option><option>Kitchen</option></Sel>
      </div>
      {submitted&&<div style={{background:T.okBg,border:`1px solid ${T.ok}44`,borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:T.ok,fontFamily:MO}}>✓ Count submitted — stock updated</div>}
      {isMobile?(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {filtered.map(item=>{
            const val=counts[item.id];
            const variance=val!=null&&val!==""?Number(val)-item.stock:null;
            return(
              <Card T={T} key={item.id} s={{padding:"12px 14px",background:val!=null&&val!==""?T.accentDim:T.card}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:SE}}>{item.name}</div>
                    <div style={{display:"flex",gap:6,marginTop:3,alignItems:"center"}}>
                      <span style={{fontSize:10,fontWeight:700,color:T.accent,fontFamily:MO}}>{item.code}</span>
                      <DeptBadge T={T} dept={item.dept}/>
                      <span style={{fontSize:10,color:T.muted,fontFamily:MO}}>{item.unit}</span>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:10,color:T.muted,fontFamily:MO}}>SYSTEM</div>
                    <div style={{fontSize:20,fontWeight:800,color:T.muted,fontFamily:MO}}>{item.stock}</div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:10,color:T.muted,fontFamily:MO,marginBottom:4}}>PHYSICAL COUNT</div>
                    <input type="number" value={counts[item.id]||""} onChange={e=>setCounts(p=>({...p,[item.id]:e.target.value}))} placeholder="Enter count…" style={{background:T.bg,border:`1px solid ${val!=null&&val!==""?T.accent:T.border}`,borderRadius:8,color:T.text,fontSize:18,padding:"10px 14px",width:"100%",outline:"none",fontFamily:MO,fontWeight:700,boxSizing:"border-box"}}/>
                  </div>
                  {variance!=null&&(
                    <div style={{textAlign:"center",minWidth:50}}>
                      <div style={{fontSize:10,color:T.muted,fontFamily:MO,marginBottom:4}}>VAR</div>
                      <div style={{fontSize:18,fontWeight:800,color:variance>0?T.ok:variance<0?T.low:T.muted,fontFamily:MO}}>{variance>0?"+":""}{variance}</div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
          <Btn T={T} v="primary" onClick={submit} disabled={counted===0} s={{width:"100%",padding:"14px",fontSize:15,marginTop:8}}>✓ Submit Count ({counted} items)</Btn>
        </div>
      ):(
        <Card T={T}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{borderBottom:`1px solid ${T.border}`,background:T.card2}}>{["Code","Item Name","Dept","Unit","System","Physical Count","Variance"].map(h=>(<th key={h} style={{padding:"10px 13px",textAlign:"left",fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",whiteSpace:"nowrap",fontFamily:MO}}>{h}</th>))}</tr></thead>
            <tbody>{filtered.map((item,idx)=>{const val=counts[item.id];const variance=val!=null&&val!==""?Number(val)-item.stock:null;return(<tr key={item.id} style={{borderBottom:idx<filtered.length-1?`1px solid ${T.border}`:"none",background:val!=null&&val!==""?T.accentDim:"transparent"}}><td style={{padding:"9px 13px",fontFamily:MO,fontSize:12,color:T.accent,fontWeight:700}}>{item.code}</td><td style={{padding:"9px 13px",fontSize:13,fontWeight:500,color:T.text,fontFamily:SE}}>{item.name}</td><td style={{padding:"9px 13px"}}><DeptBadge T={T} dept={item.dept}/></td><td style={{padding:"9px 13px",fontSize:11,color:T.muted,fontFamily:MO}}>{item.unit}</td><td style={{padding:"9px 13px",fontWeight:700,color:T.muted,fontFamily:MO}}>{item.stock}</td><td style={{padding:"9px 13px"}}><input type="number" value={counts[item.id]||""} onChange={e=>setCounts(p=>({...p,[item.id]:e.target.value}))} placeholder="—" style={{background:T.bg,border:`1px solid ${val!=null&&val!==""?T.accent:T.border}`,borderRadius:6,color:T.text,fontSize:14,padding:"6px 10px",width:80,outline:"none",fontFamily:MO,fontWeight:700,textAlign:"center"}}/></td><td style={{padding:"9px 13px"}}>{variance!=null&&<span style={{fontWeight:700,color:variance>0?T.ok:variance<0?T.low:T.muted,fontFamily:MO}}>{variance>0?"+":""}{variance}</span>}</td></tr>);})}
            </tbody>
          </table>
          <div style={{padding:"14px 16px",borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"flex-end"}}>
            <Btn T={T} v="primary" onClick={submit} disabled={counted===0}>Submit Count ({counted} items)</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── VARIANCE ──────────────────────────────────────────────────────────────────
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
      <Card T={T} s={{overflow:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:500}}><thead><tr style={{borderBottom:`1px solid ${T.border}`,background:T.card2}}>{["Code","Item Name","Dept","System","Physical","Variance","Value"].map(h=>(<th key={h} style={{padding:"10px 13px",textAlign:"left",fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:MO}}>{h}</th>))}</tr></thead><tbody>{entries.filter(e=>e.physicalCount!=null).sort((a,b)=>Math.abs(b.variance||0)-Math.abs(a.variance||0)).map((e,idx,arr)=>(<tr key={e.code} style={{borderBottom:idx<arr.length-1?`1px solid ${T.border}`:"none"}}><td style={{padding:"9px 13px",fontFamily:MO,fontSize:12,color:T.accent}}>{e.code}</td><td style={{padding:"9px 13px",fontSize:13,color:T.text,fontFamily:SE}}>{e.name}</td><td style={{padding:"9px 13px"}}><DeptBadge T={T} dept={e.dept}/></td><td style={{padding:"9px 13px",color:T.muted,fontFamily:MO}}>{e.systemStock}</td><td style={{padding:"9px 13px",fontWeight:700,fontFamily:MO,color:T.text}}>{e.physicalCount}</td><td style={{padding:"9px 13px"}}><span style={{fontWeight:700,color:e.variance>0?T.ok:e.variance<0?T.low:T.muted,fontFamily:MO}}>{e.variance>0?"+":""}{e.variance} {e.unit}</span></td><td style={{padding:"9px 13px",fontSize:12,color:e.variance&&e.perUnit?(e.variance>0?T.ok:T.low):T.muted,fontFamily:MO}}>{e.variance&&e.perUnit?`${e.variance>0?"+":""}${fmtRs(e.variance*e.perUnit)}`:"—"}</td></tr>))}</tbody></table></Card>
    </div>
  );
}

// ── HISTORY ───────────────────────────────────────────────────────────────────
function HistoryTab({T,movements}){
  const isMobile=useIsMobile();
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [page,setPage]=useState(0);
  const PAGE=50;
  const filtered=useMemo(()=>{let r=movements;if(filter!=="all") r=r.filter(m=>m.type===filter);if(search) r=r.filter(m=>m.itemName.toLowerCase().includes(search.toLowerCase())||m.code.toLowerCase().includes(search.toLowerCase())||m.personName?.toLowerCase().includes(search.toLowerCase()));return r;},[movements,filter,search]);
  const totalPages=Math.max(1,Math.ceil(filtered.length/PAGE));
  const safeP=Math.min(page,totalPages-1);
  const visible=filtered.slice(safeP*PAGE,(safeP+1)*PAGE);
  return(
    <div>
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{fontSize:22,fontWeight:600,fontFamily:SE,flex:1,color:T.text}}>Movement History <span style={{fontSize:13,color:T.muted,fontWeight:400,fontFamily:MO}}>({movements.length})</span></div>
        <Inp T={T} value={search} onChange={v=>{setSearch(v);setPage(0);}} placeholder="Search…" s={{width:160}}/>
        {["all","out","in"].map(f=>(<button key={f} onClick={()=>{setFilter(f);setPage(0);}} style={{padding:"7px 14px",borderRadius:7,border:`1px solid ${filter===f?T.accent:T.border}`,background:filter===f?T.accentDim:"transparent",color:filter===f?T.accent:T.muted,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:MO}}>{f==="all"?"All":f==="out"?"Out":"In"}</button>))}
      </div>
      <Card T={T} s={{overflow:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:isMobile?300:660}}><thead><tr style={{borderBottom:`1px solid ${T.border}`,background:T.card2}}>{["Timestamp","Type","Item","Code","Person","Qty","Change"].map(h=>(<th key={h} style={{padding:"10px 13px",textAlign:"left",fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",whiteSpace:"nowrap",fontFamily:MO}}>{h}</th>))}</tr></thead><tbody>{visible.map((m,idx)=>(<tr key={m.id} style={{borderBottom:idx<visible.length-1?`1px solid ${T.border}`:"none"}}><td style={{padding:"9px 13px",fontSize:11,color:T.muted,whiteSpace:"nowrap",fontFamily:MO}}>{m.timestamp}</td><td style={{padding:"9px 13px"}}><span style={{fontSize:10,fontWeight:700,color:m.type==="in"?T.ok:T.low,background:m.type==="in"?T.okBg:T.lowBg,padding:"2px 8px",borderRadius:4,fontFamily:MO}}>{m.type==="in"?"↓ IN":"↑ OUT"}</span></td><td style={{padding:"9px 13px",fontSize:13,fontWeight:500,color:T.text,fontFamily:SE}}>{m.itemName}</td><td style={{padding:"9px 13px",fontFamily:MO,fontSize:11,color:T.accent}}>{m.code}</td><td style={{padding:"9px 13px",fontSize:13,color:T.text,fontFamily:SE}}>{m.personName||"—"}</td><td style={{padding:"9px 13px",fontWeight:700,color:m.type==="in"?T.ok:T.low,fontFamily:MO}}>{m.type==="in"?"+":"-"}{m.qty}</td><td style={{padding:"9px 13px",fontSize:12,color:T.muted,fontFamily:MO}}>{m.prevStock}→<strong style={{color:T.text}}>{m.newStock}</strong></td></tr>))}</tbody></table>{!visible.length&&<div style={{padding:40,textAlign:"center",color:T.muted,fontStyle:"italic",fontFamily:SE}}>No movements found</div>}</Card>
      {totalPages>1&&(<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:12}}><Btn T={T} onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={safeP===0}>← Prev</Btn><span style={{fontSize:12,color:T.muted,fontFamily:MO}}>Page {safeP+1} of {totalPages}</span><Btn T={T} onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={safeP===totalPages-1}>Next →</Btn></div>)}
    </div>
  );
}

// ── USERS ─────────────────────────────────────────────────────────────────────
function UserModal({T,user,onClose,onSave}){
  const [f,setF]=useState(user||{name:"",username:"",password:"",email:"",role:"staff",active:true});
  const [newPw,setNewPw]=useState("");
  const [showPwReset,setShowPwReset]=useState(false);
  const [pwDone,setPwDone]=useState(false);
  const set=(k,v)=>setF(p=>({...p,[k]:v}));

  const resetPin=()=>{
    localStorage.removeItem("pin_"+f.id);
    localStorage.removeItem("bio_"+f.id);
    setPwDone(true);setTimeout(()=>setPwDone(false),2000);
  };

  const doSave=()=>{
    const out={...f};
    if(user&&!newPw){delete out.password;}// keep existing if blank
    else if(newPw) out.password=newPw;
    onSave(out);
  };

  return(
    <div style={{position:"fixed",inset:0,background:"#000a",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <Card T={T} s={{padding:28,width:480,maxWidth:"100%",maxHeight:"92vh",overflowY:"auto"}}>
        <h2 style={{margin:"0 0 20px",fontSize:22,fontFamily:SE,fontWeight:600,color:T.text}}>{user?"Edit User":"New User"}</h2>
        <div style={{display:"grid",gap:12,marginBottom:20}}>
          <div><Label T={T}>Full Name</Label><Inp T={T} value={f.name} onChange={v=>set("name",v)} placeholder="Full name"/></div>
          <div><Label T={T}>Username</Label><Inp T={T} value={f.username} onChange={v=>set("username",v)} placeholder="Login username"/></div>
          <div><Label T={T}>Email Address</Label><Inp T={T} type="email" value={f.email||""} onChange={v=>set("email",v)} placeholder="user@hazelcafe.lk"/></div>
          <div><Label T={T}>Role</Label><Sel T={T} value={f.role} onChange={v=>set("role",v)}>{Object.entries(ROLES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</Sel></div>
          <div>
            <Label T={T}>{user?"New Password (leave blank to keep current)":"Password"}</Label>
            <Inp T={T} type="password" value={newPw} onChange={setNewPw} placeholder={user?"Enter new password to change…":"Set password"}/>
          </div>
          {user&&(
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button onClick={resetPin} style={{flex:1,padding:"8px 12px",borderRadius:7,border:`1px solid ${T.warn}55`,background:T.warnBg,color:T.warn,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:MO}}>
                🔑 Reset PIN &amp; Biometrics
              </button>
              {pwDone&&<span style={{fontSize:11,color:T.ok,fontFamily:MO,alignSelf:"center"}}>✓ PIN cleared!</span>}
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn T={T} onClick={onClose}>Cancel</Btn>
          <Btn T={T} v="primary" onClick={doSave} disabled={!f.name||!f.username||(!user&&!newPw)}>Save User</Btn>
        </div>
      </Card>
    </div>
  );
}

function UsersTab({T,users,setUsers}){
  const [showModal,setShowModal]=useState(false);const [editUser,setEditUser]=useState(null);const [search,setSearch]=useState("");
  const filtered=useMemo(()=>{if(!search) return users;const q=search.toLowerCase();return users.filter(u=>u.name.toLowerCase().includes(q)||u.username.toLowerCase().includes(q));},[users,search]);
  return(
    <div>
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}><div style={{flex:1}}><div style={{fontSize:22,fontWeight:600,fontFamily:SE,color:T.text}}>User Management</div></div><Inp T={T} value={search} onChange={setSearch} placeholder="Search…" s={{width:200}}/><Btn T={T} v="primary" onClick={()=>{setEditUser(null);setShowModal(true);}}>+ New User</Btn></div>
      <Card T={T} s={{overflow:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:600}}><thead><tr style={{borderBottom:`1px solid ${T.border}`,background:T.card2}}>{["Name","Username","Email","Role","Status","Actions"].map(h=>(<th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:MO}}>{h}</th>))}</tr></thead><tbody>{filtered.map((u,idx)=>(<tr key={u.id} style={{borderBottom:idx<filtered.length-1?`1px solid ${T.border}`:"none"}} onMouseEnter={e=>e.currentTarget.style.background=T.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><td style={{padding:"12px 14px",fontSize:14,fontWeight:600,color:T.text,fontFamily:SE}}>{u.name}</td><td style={{padding:"12px 14px",fontFamily:MO,fontSize:12,color:T.accent}}>{u.username}</td><td style={{padding:"12px 14px",fontSize:12,color:T.muted}}>{u.email||"—"}</td><td style={{padding:"12px 14px"}}><RoleBadge T={T} role={u.role}/></td><td style={{padding:"12px 14px"}}><span style={{fontSize:10,fontWeight:700,color:u.active?T.ok:T.muted,background:u.active?T.okBg:T.border+"55",padding:"2px 8px",borderRadius:4,fontFamily:MO}}>{u.active?"Active":"Inactive"}</span></td><td style={{padding:"12px 14px"}}><div style={{display:"flex",gap:5}}><button onClick={()=>{setEditUser(u);setShowModal(true);}} style={{padding:"4px 9px",borderRadius:5,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontSize:11,fontFamily:MO}}>Edit</button><button onClick={()=>setUsers(prev=>prev.map(p=>p.id===u.id?{...p,active:!p.active}:p))} style={{padding:"4px 9px",borderRadius:5,border:`1px solid ${u.active?T.low+"44":T.ok+"44"}`,background:"transparent",color:u.active?T.low:T.ok,cursor:"pointer",fontSize:11,fontFamily:MO}}>{u.active?"Disable":"Enable"}</button></div></td></tr>))}</tbody></table></Card>
      {showModal&&<UserModal T={T} user={editUser} onClose={()=>setShowModal(false)} onSave={form=>{if(form.id) setUsers(prev=>prev.map(u=>u.id===form.id?form:u));else setUsers(prev=>[...prev,{...form,id:uid(),createdAt:nowStr(),active:true}]);setShowModal(false);}}/>}
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

// ── PURCHASE ORDER ────────────────────────────────────────────────────────────
function PurchaseOrderTab({T,items,alertSettings}){
  const isMobile=useIsMobile();
  const [overrides,setOverrides]=useState({});
  const [groupBySupplier,setGroupBySupplier]=useState(false);
  const [emailSending,setEmailSending]=useState(false);
  const [emailSent,setEmailSent]=useState(false);
  const [emailError,setEmailError]=useState("");
  const deficitItems=useMemo(()=>items.filter(i=>i.stock<i.minQty).sort((a,b)=>a.code.localeCompare(b.code)),[items]);
  const getQty=item=>overrides[item.id]!=null?Number(overrides[item.id]):Math.max(0,item.minQty-item.stock);
  const total=deficitItems.reduce((s,i)=>{const q=getQty(i);return s+(i.perUnit&&q?q*i.perUnit:0);},0);

  const grouped=useMemo(()=>{
    if(!groupBySupplier) return [{supplier:null,items:deficitItems}];
    const map={};
    deficitItems.forEach(i=>{const s=i.supplier||"No Supplier";if(!map[s]) map[s]=[];map[s].push(i);});
    return Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0])).map(([supplier,items])=>({supplier,items}));
  },[deficitItems,groupBySupplier]);

  const emailPO=async()=>{
    if(!alertSettings?.email1){alert("Please set up alert emails first (click the 🔔 bell icon).");return;}
    setEmailSending(true);setEmailError("");
    try{
      const lines=deficitItems.map(i=>{const q=getQty(i);return`  • ${i.name} (${i.code}) — need: ${q} ${i.unit}, supplier: ${i.supplier||"—"}`;}).join("\n");
      const res=await fetch("/api/send-alert",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({to1:alertSettings.email1,to2:alertSettings.email2,count:deficitItems.length,lines,timestamp:nowStr()}),
      });
      if(!res.ok) throw new Error("Server error "+res.status);
      setEmailSent(true);setTimeout(()=>setEmailSent(false),3000);
    }catch(e){setEmailError("Failed: "+e.message);}
    setEmailSending(false);
  };

  const printPO=()=>{
    const rows=deficitItems.map(i=>{const q=getQty(i);return`${i.code}\t${i.name}\t${i.dept}\t${i.supplier||"—"}\t${i.unit}\t${i.stock}\t${i.minQty}\t${q}\t${i.perUnit?fmtRs(i.perUnit):"—"}\t${i.perUnit&&q?fmtRs(q*i.perUnit):"—"}`;}).join("\n");
    const w=window.open("","_blank","width=960,height=720");
    if(!w){alert("Pop-up blocked — please allow pop-ups.");return;}
    w.document.write(`<!DOCTYPE html><html><head><title>Purchase Order — ${new Date().toLocaleDateString("en-GB")}</title><style>body{font-family:monospace;font-size:12px;padding:28px;line-height:1.7}pre{white-space:pre-wrap}@media print{body{padding:14px}}</style></head><body><pre>HAZEL CAFE & CAKERY — PURCHASE ORDER\nDate: ${new Date().toLocaleDateString("en-GB")}\n${"─".repeat(80)}\nCode\tItem\tDept\tSupplier\tUnit\tCurrent\tMin\tOrder\tPer Unit\tTotal\n${rows}\n${"─".repeat(80)}\nGrand Total: ${fmtRs(total)}</pre></body></html>`);
    w.document.close();w.onload=()=>{w.focus();w.print();};
  };

  return(
    <div>
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{flex:1}}>
          <div style={{fontSize:22,fontWeight:600,fontFamily:SE,color:T.text}}>Purchase Order</div>
          <div style={{fontSize:12,color:T.muted,marginTop:2,fontFamily:MO}}>{deficitItems.length} items below minimum stock</div>
        </div>
        <button onClick={()=>setGroupBySupplier(p=>!p)} style={{padding:"9px 14px",borderRadius:8,border:`1px solid ${groupBySupplier?T.accent:T.border}`,background:groupBySupplier?T.accentDim:"transparent",color:groupBySupplier?T.accent:T.muted,cursor:"pointer",fontFamily:MO,fontSize:12,fontWeight:700}}>
          {groupBySupplier?"✓ By Supplier":"Group by Supplier"}
        </button>
        <Btn T={T} v="primary" onClick={printPO} disabled={!deficitItems.length}>🖨 Print PO</Btn>
        <button onClick={emailPO} disabled={emailSending||emailSent||!deficitItems.length} style={{padding:"9px 14px",borderRadius:8,border:"none",background:emailSent?T.ok:T.accent,color:"#fff",cursor:(!deficitItems.length||emailSending||emailSent)?"not-allowed":"pointer",fontFamily:MO,fontSize:12,fontWeight:700,opacity:!deficitItems.length?0.4:1}}>
          {emailSent?"✓ Sent!":emailSending?"Sending…":"📧 Email PO"}
        </button>
        {emailError&&<span style={{fontSize:11,color:T.low,fontFamily:MO}}>{emailError}</span>}
      </div>
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
                <>{groupBySupplier&&supplier&&(
                  <tr key={"s_"+supplier}>
                    <td colSpan={11} style={{padding:"10px 13px 4px",fontSize:11,fontWeight:700,color:T.accent,fontFamily:MO,background:T.accentDim,borderTop:`1px solid ${T.border}`}}>
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
                })}</>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}


// ── REPORTS ───────────────────────────────────────────────────────────────────
function parseTs(ts){if(!ts) return null;try{const[datePart,timePart]=ts.split(", ");const[d,mo,y]=datePart.split("/");const[h,mi]=(timePart||"00:00").split(":");return new Date(+y,+mo-1,+d,+h,+mi);}catch{return null;}}
function fmtDate(dt){return dt?`${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`:"?";}

function BarChart({T,data,maxVal}){
  if(!data.length) return <div style={{padding:"20px 0",textAlign:"center",color:T.muted,fontStyle:"italic",fontFamily:SE,fontSize:13}}>No data for this period</div>;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {data.map((d,i)=>{
        const pctOut=maxVal>0?(d.out/maxVal)*100:0;
        const pctIn=maxVal>0?(d.in/maxVal)*100:0;
        return(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,minHeight:24}}>
            <div style={{width:130,fontSize:11,color:T.text,fontFamily:SE,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0,textAlign:"right"}}>{d.label}</div>
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:2}}>
              {d.out>0&&(<div style={{display:"flex",alignItems:"center",gap:4}}><div style={{height:10,borderRadius:3,background:T.low,width:`${Math.max(pctOut,1)}%`,minWidth:d.out>0?4:0}}/><span style={{fontSize:10,color:T.low,fontFamily:MO}}>↑{d.out}</span></div>)}
              {d.in>0&&(<div style={{display:"flex",alignItems:"center",gap:4}}><div style={{height:10,borderRadius:3,background:T.ok,width:`${Math.max(pctIn,1)}%`,minWidth:d.in>0?4:0}}/><span style={{fontSize:10,color:T.ok,fontFamily:MO}}>↓{d.in}</span></div>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReportsTab({T,movements,countHistory}){
  const isMobile=useIsMobile();
  const [preset,setPreset]=useState("7d");
  const [activeSection,setActiveSection]=useState("overview");

  const dateRange=useMemo(()=>{
    const now=new Date();
    if(preset==="today"){const s=new Date(now);s.setHours(0,0,0,0);return{from:s,to:now};}
    if(preset==="7d"){const s=new Date(now);s.setDate(s.getDate()-6);s.setHours(0,0,0,0);return{from:s,to:now};}
    if(preset==="30d"){const s=new Date(now);s.setDate(s.getDate()-29);s.setHours(0,0,0,0);return{from:s,to:now};}
    if(preset==="90d"){const s=new Date(now);s.setDate(s.getDate()-89);s.setHours(0,0,0,0);return{from:s,to:now};}
    return{from:null,to:null};
  },[preset]);

  const filtered=useMemo(()=>{
    if(!dateRange.from) return movements;
    return movements.filter(m=>{const d=parseTs(m.timestamp);return d&&d>=dateRange.from&&d<=dateRange.to;});
  },[movements,dateRange]);

  const totalOut=filtered.filter(m=>m.type==="out").length;
  const totalIn=filtered.filter(m=>m.type==="in").length;
  const uniqueItems=new Set(filtered.map(m=>m.code)).size;
  const uniquePeople=new Set(filtered.map(m=>m.personName).filter(Boolean)).size;

  const topItems=useMemo(()=>{
    const map={};
    filtered.forEach(m=>{if(!map[m.code]) map[m.code]={code:m.code,name:m.itemName,dept:m.dept,out:0,in:0,outQty:0,inQty:0};if(m.type==="out"){map[m.code].out++;map[m.code].outQty+=Number(m.qty)||1;}else{map[m.code].in++;map[m.code].inQty+=Number(m.qty)||1;}});
    return Object.values(map).map(i=>({...i,netQty:i.inQty-i.outQty})).sort((a,b)=>Math.abs(b.outQty+b.inQty)-Math.abs(a.outQty+a.inQty)).slice(0,15);
  },[filtered]);
  const maxItemVal=topItems.reduce((mx,i)=>Math.max(mx,i.out,i.in),0);

  const personStats=useMemo(()=>{
    const map={};
    filtered.forEach(m=>{const k=m.personName||"Unknown";if(!map[k]) map[k]={name:k,role:m.userRole,ins:0,outs:0,total:0,inQty:0,outQty:0};if(m.type==="in"){map[k].ins++;map[k].inQty+=Number(m.qty)||1;}else{map[k].outs++;map[k].outQty+=Number(m.qty)||1;}map[k].total++;});
    return Object.values(map).map(p=>({...p,netQty:p.inQty-p.outQty})).sort((a,b)=>b.total-a.total);
  },[filtered]);

  const deptStats=useMemo(()=>{
    const front=filtered.filter(m=>m.dept==="Front");
    const kitchen=filtered.filter(m=>m.dept==="Kitchen");
    return{front:{out:front.filter(m=>m.type==="out").length,in:front.filter(m=>m.type==="in").length},kitchen:{out:kitchen.filter(m=>m.type==="out").length,in:kitchen.filter(m=>m.type==="in").length}};
  },[filtered]);

  const navBtn=(key,label,icon)=>{const active=activeSection===key;return(<button onClick={()=>setActiveSection(key)} style={{padding:"7px 14px",borderRadius:7,border:`1px solid ${active?T.accent:T.border}`,background:active?T.accentDim:"transparent",color:active?T.accent:T.muted,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:MO,whiteSpace:"nowrap"}}>{icon} {label}</button>);};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div style={{fontSize:24,fontWeight:600,fontFamily:SE,color:T.text}}>Analytics &amp; Reports</div>

      {/* Period selector */}
      <Card T={T} s={{padding:"14px 18px"}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:10,fontWeight:700,color:T.muted,fontFamily:MO,letterSpacing:"0.08em",textTransform:"uppercase",marginRight:4}}>Period</span>
          {[{v:"today",l:"Today"},{v:"7d",l:"7 Days"},{v:"30d",l:"30 Days"},{v:"90d",l:"90 Days"},{v:"all",l:"All Time"}].map(p=>(
            <button key={p.v} onClick={()=>setPreset(p.v)} style={{padding:"5px 12px",borderRadius:6,border:`1px solid ${preset===p.v?T.accent:T.border}`,background:preset===p.v?T.accentDim:"transparent",color:preset===p.v?T.accent:T.muted,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:MO}}>{p.l}</button>
          ))}
          <span style={{fontSize:11,color:T.muted,fontFamily:MO,marginLeft:"auto"}}>{filtered.length} movements</span>
        </div>
      </Card>

      {/* Summary cards */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12}}>
        {[{l:"Total Movements",v:filtered.length,c:T.blue},{l:"Stock Outs",v:totalOut,c:T.low},{l:"Stock Ins",v:totalIn,c:T.ok},{l:"Active Items",v:uniqueItems,c:T.accent}].map(s=>(
          <Card T={T} key={s.l} s={{padding:"16px 18px"}}>
            <div style={{fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8,fontFamily:MO}}>{s.l}</div>
            <div style={{fontSize:32,fontWeight:800,color:s.c,fontFamily:MO,lineHeight:1}}>{s.v}</div>
          </Card>
        ))}
      </div>

      {/* Section nav */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {navBtn("overview","Overview","📊")}
        {navBtn("items","Top Items","🔥")}
        {navBtn("people","By Person","👤")}
        {navBtn("counts","Count Sessions","✏")}
      </div>

      {activeSection==="overview"&&(
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
          <Card T={T} s={{padding:20}}>
            <div style={{fontSize:17,fontWeight:600,fontFamily:SE,color:T.accent,marginBottom:12}}>By Department</div>
            {[{label:"Front",data:deptStats.front,c:T.front},{label:"Kitchen",data:deptStats.kitchen,c:T.kitchen}].map(d=>(
              <div key={d.label} style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><DeptBadge T={T} dept={d.label}/><span style={{fontSize:11,color:T.muted,fontFamily:MO}}>{d.data.out+d.data.in} total</span></div>
                <div style={{display:"flex",gap:4,height:10,borderRadius:4,overflow:"hidden",background:T.border}}>
                  {d.data.out>0&&<div style={{flex:d.data.out,background:T.low}}/>}
                  {d.data.in>0&&<div style={{flex:d.data.in,background:T.ok}}/>}
                </div>
                <div style={{display:"flex",gap:12,marginTop:5,fontSize:11,fontFamily:MO}}><span style={{color:T.low}}>↑ {d.data.out} out</span><span style={{color:T.ok}}>↓ {d.data.in} in</span></div>
              </div>
            ))}
          </Card>
          <Card T={T} s={{padding:20}}>
            <div style={{fontSize:17,fontWeight:600,fontFamily:SE,color:T.accent,marginBottom:12}}>Top 5 Most Active Items</div>
            {topItems.slice(0,5).map((item,i)=>(
              <div key={item.code} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <div style={{width:20,height:20,borderRadius:5,background:T.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:T.accent,fontFamily:MO,flexShrink:0}}>{i+1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:SE,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                  <div style={{display:"flex",gap:8,marginTop:2,fontSize:10,fontFamily:MO}}><span style={{color:item.netQty>=0?T.ok:T.low,fontWeight:700}}>{item.netQty>=0?"+":""}{item.netQty}</span><span style={{color:T.muted}}>{item.code}</span></div>
                </div>
              </div>
            ))}
            {!topItems.length&&<div style={{color:T.muted,fontStyle:"italic",fontFamily:SE,fontSize:13}}>No movements in this period</div>}
          </Card>
        </div>
      )}

      {activeSection==="items"&&(
        <Card T={T} s={{padding:22}}>
          <div style={{fontSize:17,fontWeight:600,fontFamily:SE,color:T.accent,marginBottom:12}}>Most Active Items</div>
          <BarChart T={T} data={topItems.map(i=>({label:i.name,out:i.out,in:i.in}))} maxVal={maxItemVal}/>
          <div style={{overflow:"auto",marginTop:20}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{borderBottom:`1px solid ${T.border}`,background:T.card2}}>{["#","Code","Item","Dept","Transactions","QTY"].map(h=>(<th key={h} style={{padding:"9px 12px",textAlign:"left",fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:MO}}>{h}</th>))}</tr></thead>
              <tbody>{topItems.map((item,idx)=>(<tr key={item.code} style={{borderBottom:idx<topItems.length-1?`1px solid ${T.border}`:"none"}} onMouseEnter={e=>e.currentTarget.style.background=T.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><td style={{padding:"9px 12px",fontSize:11,color:T.muted,fontFamily:MO}}>{idx+1}</td><td style={{padding:"9px 12px",fontFamily:MO,fontSize:12,color:T.accent,fontWeight:700}}>{item.code}</td><td style={{padding:"9px 12px",fontSize:13,fontWeight:600,color:T.text,fontFamily:SE,minWidth:140}}>{item.name}</td><td style={{padding:"9px 12px"}}><DeptBadge T={T} dept={item.dept}/></td><td style={{padding:"9px 12px",fontFamily:MO,fontSize:12,color:T.muted}}><span style={{color:T.low}}>↑{item.out}</span> <span style={{color:T.ok}}>↓{item.in}</span></td><td style={{padding:"9px 12px",fontWeight:800,fontSize:15,fontFamily:MO,color:item.netQty>=0?T.ok:T.low}}>{item.netQty>=0?"+":""}{item.netQty}</td></tr>))}</tbody>
            </table>
          </div>
        </Card>
      )}

      {activeSection==="people"&&(
        <Card T={T} s={{padding:20}}>
          <div style={{fontSize:17,fontWeight:600,fontFamily:SE,color:T.accent,marginBottom:12}}>Staff Activity</div>
          <div style={{overflow:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{borderBottom:`1px solid ${T.border}`,background:T.card2}}>{["Person","Role","Transactions","QTY","Share"].map(h=>(<th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:MO}}>{h}</th>))}</tr></thead>
              <tbody>{personStats.map((p,idx)=>(<tr key={p.name} style={{borderBottom:idx<personStats.length-1?`1px solid ${T.border}`:"none"}} onMouseEnter={e=>e.currentTarget.style.background=T.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><td style={{padding:"12px 14px",fontSize:15,fontWeight:600,color:T.text,fontFamily:SE}}>{p.name}</td><td style={{padding:"12px 14px"}}>{p.role&&<RoleBadge T={T} role={p.role}/>}</td><td style={{padding:"12px 14px",fontFamily:MO,fontSize:12,color:T.muted}}><span style={{color:T.low}}>↑{p.outs}</span> <span style={{color:T.ok}}>↓{p.ins}</span></td><td style={{padding:"12px 14px",fontWeight:800,fontSize:16,fontFamily:MO,color:p.netQty>=0?T.ok:T.low}}>{p.netQty>=0?"+":""}{p.netQty}</td><td style={{padding:"12px 14px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:80,height:6,borderRadius:3,background:T.border,overflow:"hidden"}}><div style={{height:"100%",background:T.accent,width:`${filtered.length>0?(p.total/filtered.length)*100:0}%`}}/></div><span style={{fontSize:10,color:T.muted,fontFamily:MO}}>{filtered.length>0?Math.round((p.total/filtered.length)*100):0}%</span></div></td></tr>))}{!personStats.length&&<tr><td colSpan={5} style={{padding:30,textAlign:"center",color:T.muted,fontStyle:"italic",fontFamily:SE}}>No activity in this period</td></tr>}</tbody>
            </table>
          </div>
        </Card>
      )}

      {activeSection==="counts"&&(
        <Card T={T} s={{padding:20}}>
          <div style={{fontSize:17,fontWeight:600,fontFamily:SE,color:T.accent,marginBottom:12}}>Count Sessions</div>
          <div style={{overflow:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{borderBottom:`1px solid ${T.border}`,background:T.card2}}>{["Date","Counted By","Role","Items Counted","With Variance","Surplus","Deficit"].map(h=>(<th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:MO,whiteSpace:"nowrap"}}>{h}</th>))}</tr></thead>
              <tbody>{countHistory.map((c,idx)=>(<tr key={c.id} style={{borderBottom:idx<countHistory.length-1?`1px solid ${T.border}`:"none"}} onMouseEnter={e=>e.currentTarget.style.background=T.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><td style={{padding:"11px 14px",fontSize:13,color:T.text,fontFamily:MO,fontWeight:600}}>{c.date}</td><td style={{padding:"11px 14px",fontSize:14,fontWeight:600,color:T.text,fontFamily:SE}}>{c.countedBy||"Unknown"}</td><td style={{padding:"11px 14px"}}>{c.userRole&&<RoleBadge T={T} role={c.userRole}/>}</td><td style={{padding:"11px 14px",fontWeight:700,color:T.blue,fontFamily:MO}}>{c.entries.filter(e=>e.physicalCount!=null).length}</td><td style={{padding:"11px 14px",fontWeight:700,color:T.warn,fontFamily:MO}}>{c.entries.filter(e=>e.variance!=null&&e.variance!==0).length}</td><td style={{padding:"11px 14px",fontWeight:700,color:T.ok,fontFamily:MO}}>{c.entries.filter(e=>e.variance!=null&&e.variance>0).length}</td><td style={{padding:"11px 14px",fontWeight:700,color:T.low,fontFamily:MO}}>{c.entries.filter(e=>e.variance!=null&&e.variance<0).length}</td></tr>))}{!countHistory.length&&<tr><td colSpan={7} style={{padding:30,textAlign:"center",color:T.muted,fontStyle:"italic",fontFamily:SE}}>No count sessions yet</td></tr>}</tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}




// ── ALERT SETTINGS MODAL ──────────────────────────────────────────────────────
function AlertSettingsModal({T,settings,onClose,onSave}){
  const [email1,setEmail1]=useState(settings.email1||"");
  const [email2,setEmail2]=useState(settings.email2||"");
  const [enabled,setEnabled]=useState(settings.enabled!==false);
  const [threshold,setThreshold]=useState(settings.threshold||"atMin");
  return(
    <div style={{position:"fixed",inset:0,background:"#000a",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <Card T={T} s={{padding:26,width:480,maxWidth:"100%"}}>
        <h2 style={{margin:"0 0 18px",fontSize:20,fontFamily:SE,fontWeight:600,color:T.text}}>🔔 Low-Stock Alert Settings</h2>
        <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:T.card2,border:`1px solid ${T.border}`,borderRadius:9,padding:"12px 14px"}}>
            <div><div style={{fontSize:13,fontWeight:600,color:T.text}}>Email alerts enabled</div><div style={{fontSize:11,color:T.muted,marginTop:2}}>Send email when items drop below threshold</div></div>
            <button onClick={()=>setEnabled(p=>!p)} style={{width:46,height:26,borderRadius:13,border:"none",background:enabled?T.ok:T.border+"cc",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
              <div style={{position:"absolute",top:4,left:enabled?22:4,width:18,height:18,borderRadius:9,background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px #0004"}}/>
            </button>
          </div>
          <div>
            <Label T={T}>Alert Email 1</Label>
            <Inp T={T} value={email1} onChange={setEmail1} placeholder="manager@hazelcafe.lk" type="email"/>
          </div>
          <div>
            <Label T={T}>Alert Email 2 <span style={{fontWeight:400,textTransform:"none",letterSpacing:0,opacity:0.6}}>(optional)</span></Label>
            <Inp T={T} value={email2} onChange={setEmail2} placeholder="owner@hazelcafe.lk" type="email"/>
          </div>
          <div>
            <Label T={T}>Alert When Stock Is…</Label>
            <Sel T={T} value={threshold} onChange={setThreshold}>
              <option value="atMin">At or below minimum quantity</option>
              <option value="empty">Completely empty (0)</option>
              <option value="below50">Below 50% of minimum quantity</option>
            </Sel>
          </div>
          <div style={{background:T.accentDim,border:`1px solid ${T.accent}33`,borderRadius:8,padding:"10px 14px",fontSize:12,color:T.muted,fontFamily:MO,lineHeight:1.6}}>
            <span style={{color:T.accent,fontWeight:700}}>ℹ Note:</span> Email sending works after deployment on Vercel. You can save these settings now and they'll be ready when deployed.
          </div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn T={T} onClick={onClose}>Cancel</Btn>
          <Btn T={T} v="primary" onClick={()=>onSave({email1:email1.trim(),email2:email2.trim(),enabled,threshold})}>Save Settings</Btn>
        </div>
      </Card>
    </div>
  );
}

// ── LOW STOCK BANNER ──────────────────────────────────────────────────────────
function LowStockAlertBanner({T,alertItems,alertSettings,onDismiss,onConfigure}){
  const [sending,setSending]=useState(false);
  const [sent,setSent]=useState(false);
  const [error,setError]=useState("");
  if(!alertItems.length) return null;

  const sendEmail=async()=>{
    if(!alertSettings?.email1&&!alertSettings?.email2){onConfigure();return;}
    setSending(true);setError("");
    try{
      const lines=alertItems.map(i=>`  • ${i.name} (${i.code}) — stock: ${i.stock}, min: ${i.minQty}`).join("\n");
      const res=await fetch("/api/send-alert",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({to1:alertSettings.email1,to2:alertSettings.email2,count:alertItems.length,lines,timestamp:nowStr()}),
      });
      if(!res.ok) throw new Error("Server error "+res.status);
      setSent(true);setTimeout(()=>{setSent(false);onDismiss();},3000);
    }catch(e){setError("Failed: "+e.message);}
    setSending(false);
  };

  return(
    <div style={{background:T.warnBg,border:`1px solid ${T.warn}55`,borderRadius:10,padding:"13px 16px",marginBottom:16,display:"flex",gap:12,alignItems:"flex-start"}}>
      <span style={{fontSize:22,flexShrink:0,lineHeight:1,marginTop:2}}>⚠</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:700,color:T.warn,marginBottom:8,fontFamily:SE}}>{alertItems.length} item{alertItems.length!==1?"s":""} below minimum stock</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
          {alertItems.slice(0,8).map(i=>(
            <span key={i.id} style={{fontSize:11,fontWeight:700,color:T.warn,background:T.warn+"18",border:`1px solid ${T.warn}44`,padding:"3px 9px",borderRadius:5,fontFamily:MO}}>
              {i.name} <span style={{opacity:0.55}}>({i.stock}/{i.minQty})</span>
            </span>
          ))}
          {alertItems.length>8&&<span style={{fontSize:11,color:T.muted,fontFamily:MO,alignSelf:"center"}}>+{alertItems.length-8} more</span>}
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          {(alertSettings?.email1||alertSettings?.email2)&&alertSettings?.enabled?(
            <button onClick={sendEmail} disabled={sending||sent} style={{background:sent?T.ok:T.warn,border:"none",borderRadius:7,padding:"7px 14px",color:"#fff",cursor:sending||sent?"default":"pointer",fontFamily:MO,fontSize:12,fontWeight:700}}>
              {sent?"✓ Alert sent!":sending?"Sending…":"📧 Send Alert Email"}
            </button>
          ):null}
          <button onClick={onConfigure} style={{background:"transparent",border:`1px solid ${T.warn}55`,borderRadius:7,padding:"6px 12px",color:T.warn,cursor:"pointer",fontFamily:MO,fontSize:11,fontWeight:700}}>
            ⚙ {alertSettings?.email1?"Change emails":"Set up alert emails"}
          </button>
          {error&&<span style={{fontSize:11,color:T.low,fontFamily:MO}}>{error}</span>}
        </div>
      </div>
      <button onClick={onDismiss} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:18,padding:0,flexShrink:0,lineHeight:1,marginTop:2}}>✕</button>
    </div>
  );
}

// ── AI CAMERA IDENTIFY ────────────────────────────────────────────────────────
function AICameraScanner({T,items,onSelect,onClose}){
  const [camError,setCamError]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  const [aiResult,setAiResult]=useState(null);
  const [videoReady,setVideoReady]=useState(false);
  const videoRef=useRef(null);
  const canvasRef=useRef(null);
  const streamRef=useRef(null);
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
        if(activeRef.current) setCamError("Could not start camera: "+e.message);
      }
    })();
    return()=>{activeRef.current=false;if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop());streamRef.current=null;}};
  },[]);

  const identify=async()=>{
  const vid=videoRef.current;const can=canvasRef.current;
  if(!vid||!can) return;
  setAiLoading(true);setAiResult(null);setCamError("");
  try{
    can.width=vid.videoWidth||640;can.height=vid.videoHeight||480;
    can.getContext("2d").drawImage(vid,0,0);
    const base64=can.toDataURL("image/jpeg",0.85).split(",")[1];
    const itemList=items.map(i=>`${i.code}: ${i.name} (${i.dept}${i.brand?", "+i.brand:""})`).join("\n");
    const resp=await fetch("/api/identify",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({image:base64,items:itemList}),
    });
    const data=await resp.json();
    const code=data.result?.trim();
    const matched=items.find(i=>i.code===code||i.barcode===code);
    setAiResult({code,matched});
  }catch(e){
    setCamError("AI error: "+e.message);
  }
  setAiLoading(false);
};

  const confirmItem=(item)=>{if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop());}onSelect(item);onClose();};

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:10,fontFamily:MO}}>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,width:"100%",maxWidth:480,maxHeight:"95vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 12px 48px rgba(0,0,0,0.7)"}}>
        <div style={{padding:"13px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10,background:T.card2,flexShrink:0}}>
          <span style={{fontSize:18}}>✦</span>
          <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:SE}}>AI Item Identifier</div><div style={{fontSize:10,color:T.muted,marginTop:1}}>Frame the item and tap Capture</div></div>
          <button onClick={()=>{if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop());}onClose();}} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 11px",cursor:"pointer",color:T.muted,fontFamily:MO,fontSize:12,fontWeight:700}}>✕</button>
        </div>
        <div style={{position:"relative",background:"#000",flexShrink:0,overflow:"hidden",height:240}}>
          <video ref={videoRef} autoPlay playsInline muted style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
          <canvas ref={canvasRef} style={{display:"none"}}/>
          {!videoReady&&!camError&&(<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,background:"#000"}}><style>{`@keyframes spin2{to{transform:rotate(360deg)}}`}</style><div style={{width:28,height:28,border:"2px solid #ffffff22",borderTopColor:"#ffffff88",borderRadius:"50%",animation:"spin2 0.8s linear infinite"}}/><div style={{fontSize:11,color:"#aaa"}}>Starting camera…</div></div>)}
          {videoReady&&!aiLoading&&!aiResult&&(<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}><div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.3)"}}/><div style={{position:"relative",width:140,height:140,border:`2px dashed ${T.accent}99`,borderRadius:12,zIndex:2}}/><div style={{position:"absolute",bottom:8,fontSize:10,color:"rgba(255,255,255,0.7)",letterSpacing:"0.1em",textTransform:"uppercase",zIndex:3}}>Frame the item</div></div>)}
          {aiLoading&&(<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}><div style={{width:32,height:32,border:`3px solid ${T.accent}33`,borderTopColor:T.accent,borderRadius:"50%",animation:"spin2 0.7s linear infinite"}}/><div style={{fontSize:11,color:T.accent,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>Identifying…</div></div>)}
        </div>
        <div style={{padding:14,overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:10}}>
          {camError&&<div style={{background:T.lowBg,border:`1px solid ${T.low}44`,borderRadius:8,padding:"10px 13px",fontSize:12,color:T.low}}>{camError}</div>}
          {aiResult&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {aiResult.matched?(
                <div style={{background:T.okBg,border:`1px solid ${T.ok}44`,borderRadius:10,padding:"14px 16px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.ok,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>AI Identified</div>
                  <div style={{fontSize:15,fontWeight:600,color:T.text,fontFamily:SE,marginBottom:6}}>{aiResult.matched.name}</div>
                  <div style={{fontSize:11,color:T.muted,fontFamily:MO,marginBottom:12}}>{aiResult.matched.code} · {aiResult.matched.unit} · Stock: {aiResult.matched.stock}</div>
                  <button onClick={()=>confirmItem(aiResult.matched)} style={{width:"100%",background:"#5a9e72",border:"none",borderRadius:8,padding:"11px",color:"#fff",cursor:"pointer",fontFamily:MO,fontWeight:700,fontSize:14}}>✓ Use This Item</button>
                </div>
              ):(
                <div style={{background:T.warnBg,border:`1px solid ${T.warn}44`,borderRadius:8,padding:"12px 13px",fontSize:12,color:T.warn}}>
                  <div style={{fontWeight:700,marginBottom:4}}>✦ Could not identify</div>
                  <div style={{color:T.muted,fontSize:11}}>No matching item found. Try again with better lighting.</div>
                </div>
              )}
              <button onClick={()=>{setAiResult(null);setCamError("");}} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:8,padding:"9px",color:T.muted,cursor:"pointer",fontFamily:MO,fontSize:12,fontWeight:700}}>↺ Try Again</button>
            </div>
          )}
          {!aiLoading&&!aiResult&&videoReady&&(
            <button onClick={identify} style={{background:T.btnPrimary,border:"none",borderRadius:10,padding:"13px",color:T.btnPrimaryText,cursor:"pointer",fontFamily:SE,fontWeight:600,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <span>✦</span> Capture &amp; Identify
            </button>
          )}
          <div style={{fontSize:10,color:T.muted,textAlign:"center",lineHeight:1.7}}>Frame the product label clearly, then tap Capture.<br/>Works best with visible brand name or packaging.</div>
        </div>
      </div>
    </div>
  );
}

// ── CAMERA SCANNER ────────────────────────────────────────────────────────────
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
      <button onClick={onConfirm} style={{width:"100%",background:"#5a9e72",border:"none",borderRadius:8,padding:"11px",color:"#fff",cursor:"pointer",fontFamily:MO,fontWeight:700,fontSize:14}}>✓ Use This Item</button>
    </div>
  );
}

function CameraScanner({T,items,onSelect,onClose}){
  const [mode,setMode]=useState("barcode");
  const [camError,setCamError]=useState("");
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
          if(e.name==="NotAllowedError"||e.name==="PermissionDeniedError") setCamError("Camera permission denied. Please allow camera access.");
          else if(e.name==="NotFoundError") setCamError("No camera found on this device.");
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
    if(!("BarcodeDetector" in window)){setCamError("Barcode scanning not supported on this browser. Try Chrome on Android or desktop.");return;}
    if(!detectorRef.current){try{detectorRef.current=new window.BarcodeDetector({formats:["ean_13","ean_8","upc_a","upc_e","code_128","code_39","qr_code"]});}catch(e){setCamError("BarcodeDetector error: "+e.message);return;}}
    setScanning(true);
    scanTimerRef.current=setInterval(async()=>{
      const vid=videoRef.current;
      if(!vid||!activeRef.current||vid.readyState<2||vid.videoWidth===0) return;
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

  const rescan=()=>{setBarcodeResult(null);setCamError("");setScanning(false);setVideoReady(false);setTimeout(()=>{if(activeRef.current)setVideoReady(true);},80);};
  const toggleTorch=async()=>{const track=streamRef.current?.getVideoTracks()[0];if(!track)return;const caps=track.getCapabilities?.()??{};if(!caps.torch){setCamError("Torch not available on this device.");return;}try{await track.applyConstraints({advanced:[{torch:!torchOn}]});setTorchOn(p=>!p);}catch{}};
  const confirmItem=(item)=>{cleanup();onSelect(item);onClose();};

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:10,fontFamily:MO}}>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,width:"100%",maxWidth:480,maxHeight:"95vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 12px 48px rgba(0,0,0,0.7)"}}>
        <div style={{padding:"13px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10,background:T.card2,flexShrink:0}}>
          <span style={{fontSize:18}}>📷</span>
          <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:SE}}>Camera Scanner</div><div style={{fontSize:10,color:T.muted,marginTop:1}}>Point at barcode or item label</div></div>
          <button onClick={toggleTorch} style={{background:torchOn?T.warnBg:"transparent",border:`1px solid ${torchOn?T.warn:T.border}`,borderRadius:6,padding:"5px 8px",cursor:"pointer",fontSize:14,color:torchOn?T.warn:T.muted,lineHeight:1}}>🔦</button>
          <button onClick={()=>{cleanup();onClose();}} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 11px",cursor:"pointer",color:T.muted,fontFamily:MO,fontSize:12,fontWeight:700}}>✕</button>
        </div>
        <div style={{position:"relative",background:"#000",flexShrink:0,overflow:"hidden",height:240}}>
          <video ref={videoRef} autoPlay playsInline muted style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
          <canvas ref={canvasRef} style={{display:"none"}}/>
          {!videoReady&&!camError&&(<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,background:"#000"}}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><div style={{width:28,height:28,border:"2px solid #ffffff22",borderTopColor:"#ffffff88",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><div style={{fontSize:11,color:"#aaa"}}>Starting camera…</div></div>)}
          {videoReady&&!barcodeResult&&(
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
              <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.4)"}}/>
              <div style={{position:"relative",width:"72%",maxWidth:260,height:80,zIndex:2}}>
                {[{t:0,l:0,bt:true,bl:true},{t:0,r:0,bt:true,br:true},{b:0,l:0,bb:true,bl:true},{b:0,r:0,bb:true,br:true}].map((c,i)=>(
                  <div key={i} style={{position:"absolute",top:c.t,left:c.l,right:c.r,bottom:c.b,width:18,height:18,borderTop:c.bt?`3px solid ${T.accent}`:"none",borderBottom:c.bb?`3px solid ${T.accent}`:"none",borderLeft:c.bl?`3px solid ${T.accent}`:"none",borderRight:c.br?`3px solid ${T.accent}`:"none"}}/>
                ))}
                {scanning&&(<><style>{`@keyframes scanbeam{0%{top:4px}50%{top:calc(100% - 4px)}100%{top:4px}}`}</style><div style={{position:"absolute",left:2,right:2,height:2,background:`linear-gradient(to right,transparent,${T.accent},transparent)`,animation:"scanbeam 1.8s ease-in-out infinite",boxShadow:`0 0 6px ${T.accent}`}}/></>)}
              </div>
              <div style={{position:"absolute",bottom:8,fontSize:10,color:"rgba(255,255,255,0.7)",letterSpacing:"0.1em",textTransform:"uppercase",zIndex:2}}>{scanning?"Scanning…":"Waiting…"}</div>
            </div>
          )}
        </div>
        <div style={{padding:14,overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:10}}>
          {camError&&(<div style={{background:T.lowBg,border:`1px solid ${T.low}44`,borderRadius:8,padding:"10px 13px",fontSize:12,color:T.low,lineHeight:1.5}}>⚠ {camError}</div>)}
          {barcodeResult&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{background:T.accentDim,border:`1px solid ${T.accent}44`,borderRadius:8,padding:"9px 13px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:9,fontWeight:700,color:T.accent,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2}}>Barcode Detected</div><div style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:MO}}>{barcodeResult.code}</div></div>
                <span style={{fontSize:18}}>✓</span>
              </div>
              {barcodeResult.item?(
                <MatchedItemCard T={T} item={barcodeResult.item} label="Matched to inventory" onConfirm={()=>confirmItem(barcodeResult.item)}/>
              ):(
                <div style={{background:T.warnBg,border:`1px solid ${T.warn}44`,borderRadius:8,padding:"10px 13px",fontSize:12,color:T.warn}}>
                  <strong>{barcodeResult.code}</strong> not found in inventory. Add a barcode to an item in Inventory → Edit.
                </div>
              )}
              <button onClick={rescan} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:8,padding:"9px",color:T.muted,cursor:"pointer",fontFamily:MO,fontSize:12,fontWeight:700}}>↺ Scan Again</button>
            </div>
          )}
          {!barcodeResult&&!camError&&videoReady&&(
            <div style={{fontSize:10,color:T.muted,textAlign:"center",lineHeight:1.7,padding:"4px 0"}}>
              Keep barcode steady inside the frame.<br/>
              Supports EAN-13, EAN-8, UPC, Code-128, QR and more.<br/>
              <span style={{color:T.accent}}>Tip: Add barcodes to items in Inventory → Edit.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── DEVICES ───────────────────────────────────────────────────────────────────
function getDeviceFingerprint(){
  const nav=window.navigator;
  const raw=[nav.userAgent,nav.language,screen.width+"x"+screen.height,screen.colorDepth,nav.hardwareConcurrency||"",nav.platform||""].join("|");
  let h=0;for(let i=0;i<raw.length;i++){h=Math.imul(31,h)+raw.charCodeAt(i)|0;}
  return"dev_"+(h>>>0).toString(36);
}

function DeviceModal({T,device,onClose,onSave}){
  const [f,setF]=useState(device||{name:"",location:"Front"});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  return(
    <div style={{position:"fixed",inset:0,background:"#000a",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <Card T={T} s={{padding:26,width:420,maxWidth:"100%"}}>
        <h2 style={{margin:"0 0 6px",fontSize:22,fontFamily:SE,fontWeight:600,color:T.text}}>{device?.registeredAt?"Edit Device":"Register This Device"}</h2>
        <div style={{fontSize:12,color:T.muted,marginBottom:18,lineHeight:1.6,fontFamily:MO}}>
          {device?.registeredAt?`Registered: ${device.registeredAt}`:"Give this device a name so you can identify it in the list."}
        </div>
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

function DevicesTab({T,devices,setDevices,loginHistory}){
  const [editDev,setEditDev]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [selectedDev,setSelectedDev]=useState(null);
  const isMobile=useIsMobile();

  useEffect(()=>{
    const fp=getDeviceFingerprint();
    const exists=devices.find(d=>d.fingerprint===fp);
    if(!exists){
      setDevices(prev=>[...prev,{
        id:fp,fingerprint:fp,
        name:"New Device (tap Edit to name)",
        location:"Unknown",
        active:true,
        registeredAt:nowStr(),
        pending:true,
      }]);
    }
  },[]);

  const thisFingerprint=getDeviceFingerprint();
  const devHistory=selectedDev?loginHistory.filter(h=>h.deviceFingerprint===selectedDev.fingerprint):[];

  return(
    <div>
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{flex:1}}>
          <div style={{fontSize:22,fontWeight:600,fontFamily:SE,color:T.text}}>Device Management</div>
          <div style={{fontSize:12,color:T.muted,marginTop:2,fontFamily:MO}}>
            {devices.filter(d=>d.active).length} active · {loginHistory.length} total login events
          </div>
        </div>
        <Btn T={T} v="ghost" onClick={()=>setShowAdd(true)} s={{fontSize:12}}>+ Add Manually</Btn>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:14,marginBottom:20}}>
        {devices.map(d=>{
          const isThis=d.fingerprint===thisFingerprint;
          const devLogs=loginHistory.filter(h=>h.deviceFingerprint===d.fingerprint);
          const lastLogin=devLogs[0];
          return(
            <Card T={T} key={d.id} s={{padding:20,border:`1px solid ${isThis?T.accent:d.pending?T.warn:T.border}`,position:"relative",cursor:"pointer"}} onClick={()=>setSelectedDev(selectedDev?.id===d.id?null:d)}>
              {isThis&&(<div style={{position:"absolute",top:10,right:10,fontSize:9,fontWeight:700,color:T.accent,background:T.accentDim,padding:"2px 8px",borderRadius:4,fontFamily:MO,letterSpacing:"0.06em"}}>THIS DEVICE</div>)}
              {d.pending&&!isThis&&(<div style={{position:"absolute",top:10,right:10,fontSize:9,fontWeight:700,color:T.warn,background:T.warnBg,padding:"2px 8px",borderRadius:4,fontFamily:MO,letterSpacing:"0.06em"}}>NEEDS NAME</div>)}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{fontSize:26}}>{d.location==="Kitchen"?"🍳":d.location==="Office"?"💻":"📱"}</div>
                <span style={{fontSize:10,fontWeight:700,color:d.active?T.ok:T.muted,background:d.active?T.okBg:T.border+"55",padding:"2px 9px",borderRadius:4,fontFamily:MO}}>{d.active?"Active":"Offline"}</span>
              </div>
              <div style={{fontWeight:600,fontSize:16,marginBottom:2,fontFamily:SE,color:d.pending?T.warn:T.text}}>{d.name}</div>
              <div style={{fontSize:11,color:T.muted,marginBottom:6,fontFamily:MO}}>{d.location} · First seen: {d.registeredAt||"—"}</div>
              {lastLogin&&<div style={{fontSize:10,color:T.muted,fontFamily:MO,marginBottom:10}}>Last login: <span style={{color:T.text,fontWeight:600}}>{lastLogin.userName}</span> · {lastLogin.loginTime}</div>}
              <div style={{fontSize:10,color:T.accent,fontFamily:MO,marginBottom:10}}>{devLogs.length} login event{devLogs.length!==1?"s":""} · tap to view history</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}} onClick={e=>e.stopPropagation()}>
                <Btn T={T} v={d.pending?"primary":"ghost"} onClick={()=>setEditDev(d)} s={{fontSize:11,padding:"5px 12px"}}>{d.pending?"Name this device":"Edit"}</Btn>
                <button onClick={()=>setDevices(prev=>prev.map(p=>p.id===d.id?{...p,active:!p.active}:p))}
                  style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${d.active?T.low+"44":T.ok+"44"}`,background:"transparent",color:d.active?T.low:T.ok,cursor:"pointer",fontSize:11,fontFamily:MO,fontWeight:700}}>
                  {d.active?"Disable":"Enable"}
                </button>
                <button onClick={()=>{if(window.confirm("Remove "+d.name+"?")) setDevices(prev=>prev.filter(p=>p.id!==d.id));}}
                  style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontSize:11,fontFamily:MO}}>
                  Remove
                </button>
              </div>
            </Card>
          );
        })}
        {!devices.length&&(
          <div style={{color:T.muted,padding:40,gridColumn:"1/-1",textAlign:"center",fontFamily:SE}}>
            <div style={{fontSize:32,marginBottom:10}}>📱</div>
            <div style={{fontStyle:"italic",fontSize:15,marginBottom:6}}>No devices yet</div>
            <div style={{fontSize:12}}>Open the app on any device and it will appear here automatically.</div>
          </div>
        )}
      </div>

      {selectedDev&&(
        <Card T={T} s={{padding:20,marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div>
              <div style={{fontSize:16,fontWeight:600,fontFamily:SE,color:T.text}}>Login History — {selectedDev.name}</div>
              <div style={{fontSize:11,color:T.muted,fontFamily:MO,marginTop:2}}>{devHistory.length} events</div>
            </div>
            <button onClick={()=>setSelectedDev(null)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:18}}>✕</button>
          </div>
          {devHistory.length===0?(
            <div style={{color:T.muted,fontFamily:MO,fontSize:13,textAlign:"center",padding:20}}>No login history for this device yet.</div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:1}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,padding:"6px 10px",background:T.card2,borderRadius:6,marginBottom:4}}>
                {["User","Role","Login Time","Logout Time"].map(h=>(
                  <div key={h} style={{fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:MO}}>{h}</div>
                ))}
              </div>
              {devHistory.map((h,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,padding:"10px",background:i%2===0?T.card:T.card2,borderRadius:6,alignItems:"center"}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:SE}}>{h.userName}</div>
                  <div><RoleBadge T={T} role={h.userRole}/></div>
                  <div style={{fontSize:11,color:T.ok,fontFamily:MO,fontWeight:600}}>{h.loginTime}</div>
                  <div style={{fontSize:11,color:h.logoutTime?T.low:T.muted,fontFamily:MO,fontWeight:h.logoutTime?600:400}}>{h.logoutTime||"Still active"}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card T={T} s={{padding:20}}>
        <div style={{fontSize:16,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:14}}>All Login Events</div>
        {loginHistory.length===0?(
          <div style={{color:T.muted,fontFamily:MO,fontSize:13,textAlign:"center",padding:20}}>No login history yet.</div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:1}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,padding:"6px 10px",background:T.card2,borderRadius:6,marginBottom:4}}>
              {["User","Device","Login","Logout"].map(h=>(
                <div key={h} style={{fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:MO}}>{h}</div>
              ))}
            </div>
            {loginHistory.slice(0,50).map((h,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,padding:"10px",background:i%2===0?T.card:T.card2,borderRadius:6,alignItems:"center"}}>
                <div style={{fontSize:12,fontWeight:600,color:T.text,fontFamily:SE}}>{h.userName}</div>
                <div style={{fontSize:11,color:T.muted,fontFamily:MO}}>{h.deviceName||"Unknown"}</div>
                <div style={{fontSize:11,color:T.ok,fontFamily:MO,fontWeight:600}}>{h.loginTime}</div>
                <div style={{fontSize:11,color:h.logoutTime?T.low:T.muted,fontFamily:MO}}>{h.logoutTime||"Active"}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {editDev&&(
        <DeviceModal T={T} device={editDev} onClose={()=>setEditDev(null)}
          onSave={form=>{setDevices(prev=>prev.map(d=>d.id===editDev.id?{...d,name:form.name,location:form.location,pending:false}:d));setEditDev(null);}}
        />
      )}
      {showAdd&&(
        <DeviceModal T={T} device={null} onClose={()=>setShowAdd(false)}
          onSave={form=>{setDevices(prev=>[...prev,{...form,id:uid(),registeredAt:nowStr(),active:true,pending:false}]);setShowAdd(false);}}
        />
      )}
    </div>
  );
}

// ── ROOT APP ──────────────────────────────────────────────────────────────────
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
  const [devices,setDevices]=useState([]);
  const [loginHistory,setLoginHistory]=useState([]);
  const loginSessionRef=useRef(null);
  const [alertSettings,setAlertSettings]=useState({email1:"",email2:"",enabled:true,threshold:"atMin"});
  const [alertBanner,setAlertBanner]=useState([]);
  const [showAlertSettings,setShowAlertSettings]=useState(false);
  const alertedRef=useRef(new Set(JSON.parse(localStorage.getItem("alertedIds")||"[]")));
  const [ready,setReady]=useState(false);
  const [syncDot,setSyncDot]=useState(false);
  const [sheetsSyncing,setSheetsSyncing]=useState(false);
  const [sheetsLastSync,setSheetsLastSync]=useState(null);
  const [sheetsError,setSheetsError]=useState(null);
  const syncTimeoutRef=useRef(null);

  // ── Boot: load from Firebase ──────────────────────────────────────────────
  useEffect(()=>{
    async function boot(){
      const [si,sm,sc,su,sd,as,th,lh]=await Promise.all([
        fbLoad("items", DEFAULT_ITEMS),
        fbLoad("movements", []),
        fbLoad("counts", []),
        fbLoad("users", DEFAULT_USERS),
        fbLoad("devices", []),
        fbLoad("alertSettings", {email1:"",email2:"",enabled:true,threshold:"atMin"}),
        fbLoad("theme", false),
        fbLoad("loginHistory", []),
      ]);
      setItems(si); setMovements(sm); setCountHistory(sc); setUsers(su); setDevices(sd); setAlertSettings(as); setIsDark(th); setLoginHistory(lh); setIsDark(th);
      setReady(true);
    }
    boot();
  },[]);

  // ── Save to Firebase on change ────────────────────────────────────────────
  useEffect(()=>{if(ready){fbSave("items",items);triggerSheetsSync({items});}},[items,ready]);
  useEffect(()=>{if(ready){fbSave("movements",movements);triggerSheetsSync({movements});}},[movements,ready]);
  useEffect(()=>{if(ready){fbSave("counts",countHistory);triggerSheetsSync({countHistory});}},[countHistory,ready]);
  useEffect(()=>{if(ready) fbSave("users", users);},[users,ready]);
  useEffect(()=>{if(ready) fbSave("devices", devices);},[devices,ready]);
  useEffect(()=>{if(ready) fbSave("loginHistory", loginHistory);},[loginHistory,ready]);
  useEffect(()=>{if(ready) fbSave("alertSettings", alertSettings);},[alertSettings,ready]);
  useEffect(()=>{if(ready) fbSave("theme", isDark);},[isDark,ready]);

  // ── Real-time sync via Firestore onSnapshot ───────────────────────────────
  useEffect(()=>{
    if(!ready||!currentUser) return;
    const unsubs=["items","movements","counts","users","devices"].map(key=>
      onSnapshot(doc(db,"hazel",key), snap=>{
        if(!snap.exists()) return;
        try{
          const val=JSON.parse(snap.data().data);
          if(key==="items") setItems(p=>JSON.stringify(p)===JSON.stringify(val)?p:val);
          if(key==="movements") setMovements(p=>JSON.stringify(p)===JSON.stringify(val)?p:val);
          if(key==="counts") setCountHistory(p=>JSON.stringify(p)===JSON.stringify(val)?p:val);
          if(key==="users") setUsers(p=>JSON.stringify(p)===JSON.stringify(val)?p:val);
          if(key==="devices") setDevices(p=>JSON.stringify(p)===JSON.stringify(val)?p:val);
          if(key==="loginHistory") setLoginHistory(p=>JSON.stringify(p)===JSON.stringify(val)?p:val);
          setSyncDot(true); setTimeout(()=>setSyncDot(false),600);
        }catch{}
      })
    );
    return()=>unsubs.forEach(u=>u());
  },[ready,currentUser]);


  // ── Low stock detection ───────────────────────────────────────────────────
  useEffect(()=>{
    if(!ready||!currentUser) return;
    const isLow=(i)=>{
      if(alertSettings.threshold==="empty") return i.stock<=0;
      if(alertSettings.threshold==="below50") return i.stock<Math.ceil(i.minQty*0.5);
      return i.stock<i.minQty;
    };
    const newLow=items.filter(i=>isLow(i)&&!alertedRef.current.has(i.id));
    if(newLow.length>0){newLow.forEach(i=>{alertedRef.current.add(i.id);localStorage.setItem("alertedIds",JSON.stringify([...alertedRef.current]));});setAlertBanner(prev=>{const ids=new Set(prev.map(x=>x.id));return[...prev,...newLow.filter(i=>!ids.has(i.id))];});}
    items.filter(i=>!isLow(i)).forEach(i=>alertedRef.current.delete(i.id));
    setAlertBanner(prev=>prev.filter(i=>{const cur=items.find(x=>x.id===i.id);return cur&&isLow(cur);}));
  },[items,ready,currentUser,alertSettings.threshold]);

  const handleLogin=u=>{
    setCurrentUser(u);
    setTab(ROLES[u.role]?.tabs[0]||"out");
    const fp=getDeviceFingerprint();
    const devName=devices.find(d=>d.fingerprint===fp)?.name||"Unknown Device";
    const sessionId=uid();
    loginSessionRef.current=sessionId;
    const entry={id:sessionId,userId:u.id,userName:u.name,userRole:u.role,deviceFingerprint:fp,deviceName:devName,loginTime:nowStr(),logoutTime:null};
    setLoginHistory(prev=>[entry,...prev].slice(0,500));
  };
  const syncToSheets=async(data)=>{
    setSheetsSyncing(true);setSheetsError(null);
    try{
      const resp=await fetch("/api/sync-sheets",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(data)
      });
      const result=await resp.json();
      if(result.success){setSheetsLastSync(nowStr());setSheetsError(null);}
      else setSheetsError(result.error||"Sync failed");
    }catch(e){setSheetsError(e.message);}
    setSheetsSyncing(false);
  };

  const triggerSheetsSync=(overrides={})=>{
    if(syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current=setTimeout(()=>{
      syncToSheets({
        items:overrides.items||items,
        movements:overrides.movements||movements,
        countHistory:overrides.countHistory||countHistory,
        purchaseOrders:overrides.purchaseOrders||[],
        ...overrides
      });
    },3000);// debounce 3s
  };

  const handleLogout=()=>{
    if(loginSessionRef.current){
      setLoginHistory(prev=>prev.map(h=>h.id===loginSessionRef.current?{...h,logoutTime:nowStr()}:h));
      loginSessionRef.current=null;
    }
    setCurrentUser(null);setTab("out");setAlertBanner([]);alertedRef.current.clear();
  };

  if(!ready) return(<div style={{minHeight:"100vh",background:LIGHT.bg,display:"flex",alignItems:"center",justifyContent:"center",color:LIGHT.muted,fontFamily:SE}}><div style={{textAlign:"center"}}><HazelLogo T={LIGHT} size={50}/><div style={{marginTop:12,fontSize:16,letterSpacing:"0.12em",color:LIGHT.muted}}>Loading…</div></div></div>);
  if(!currentUser) return(<><LoginScreen T={T} isDark={isDark} onToggle={()=>setIsDark(p=>!p)} users={users} setUsers={setUsers} onLogin={handleLogin}/><CreatorStamp T={T}/></>);

  const role=ROLES[currentUser.role];
  const allowedTabs=ALL_TABS.filter(t=>role.tabs.includes(t.key));
  const safeTab=role.tabs.includes(tab)?tab:role.tabs[0];
  const deficit=items.filter(i=>i.stock<i.minQty).length;
  const empty=items.filter(i=>i.stock<=0).length;

  return(
    <div style={{minHeight:"100vh",width:"100%",maxWidth:"100vw",overflowX:"hidden",background:T.bg,fontFamily:MO,color:T.text,transition:"background 0.25s,color 0.25s"}}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>
      <div style={{background:T.navBg,borderBottom:`1px solid ${T.navBorder}`,position:"sticky",top:0,zIndex:90,boxShadow:T.shadow}}>
        <div style={{maxWidth:1440,margin:"0 auto",padding:"0 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,height:50}}>
            <div style={{display:"flex",alignItems:"center",gap:9,flexShrink:0}}><HazelLogo T={T} size={30}/><div><div style={{fontSize:14,fontWeight:600,color:T.accent,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:SE,lineHeight:1.1}}>Hazel</div><div style={{fontSize:8,color:T.muted,letterSpacing:"0.22em",textTransform:"uppercase",lineHeight:1,fontFamily:MO}}>Cafe &amp; Cakery</div></div></div>
            <div style={{marginLeft:"auto",display:"flex",gap:7,alignItems:"center",flexShrink:0}}>
              {deficit>0&&<span style={{fontSize:10,fontWeight:700,color:T.low,background:T.lowBg,padding:"3px 7px",borderRadius:5,fontFamily:MO}}>{deficit} low</span>}
              {empty>0&&<span style={{fontSize:10,fontWeight:700,color:T.warn,background:T.warnBg,padding:"3px 7px",borderRadius:5,fontFamily:MO}}>{empty} empty</span>}
              <span style={{width:6,height:6,borderRadius:"50%",background:syncDot?T.ok:T.border,transition:"background 0.3s",flexShrink:0}} title="Firebase sync"/>
              <button onClick={()=>syncToSheets({items,movements,countHistory})} title={sheetsLastSync?"Last synced: "+sheetsLastSync:"Sync to Google Sheets"} style={{background:sheetsError?T.lowBg:sheetsLastSync?T.okBg:T.card,border:`1px solid ${sheetsError?T.low:sheetsLastSync?T.ok:T.border}`,borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11,color:sheetsError?T.low:sheetsLastSync?T.ok:T.muted,fontFamily:MO,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
                {sheetsSyncing?"⟳":"📊"}{!isMobile&&(sheetsSyncing?" Syncing…":sheetsError?" Error":sheetsLastSync?" Synced":"Sheets")}
              </button>
              <button onClick={()=>setShowAlertSettings(true)} title="Alert settings" style={{position:"relative",background:alertBanner.length>0?T.warnBg:"transparent",border:`1px solid ${alertBanner.length>0?T.warn:T.border}`,borderRadius:7,padding:"4px 9px",cursor:"pointer",color:alertBanner.length>0?T.warn:T.muted,fontSize:14,lineHeight:1}}>🔔{alertBanner.length>0&&(<span style={{position:"absolute",top:-4,right:-4,minWidth:16,height:16,borderRadius:8,background:T.low,border:`2px solid ${T.navBg}`,fontSize:8,fontWeight:800,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:MO,padding:"0 3px"}}>{alertBanner.length}</span>)}</button>
              <ThemeToggle T={T} isDark={isDark} onToggle={()=>setIsDark(p=>!p)}/>
              {isMobile?(
                <button onClick={handleLogout} style={{background:T.lowBg,border:`1px solid ${T.low}44`,borderRadius:8,padding:"6px 12px",cursor:"pointer",color:T.low,fontSize:12,fontWeight:700,fontFamily:MO}}>⏻ Out</button>
              ):(
                <div style={{display:"flex",alignItems:"center",gap:7,background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 10px"}}><RoleBadge T={T} role={currentUser.role}/><span style={{fontSize:12,color:T.text,fontWeight:600,fontFamily:SE}}>{currentUser.name}</span><button onClick={handleLogout} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:11,fontFamily:MO,padding:0,marginLeft:2,borderLeft:`1px solid ${T.border}`,paddingLeft:8}}>← Out</button></div>
              )}
            </div>
          </div>
          {!isMobile&&(<div style={{display:"flex",gap:0,overflowX:"auto",scrollbarWidth:"none"}}>{allowedTabs.map(t=>{const c=tabColor(t.key,T);const active=safeTab===t.key;return(<button key={t.key} onClick={()=>setTab(t.key)} style={{padding:"8px 13px",border:"none",borderBottom:active?`2px solid ${c}`:"2px solid transparent",background:active?c+"12":"transparent",color:active?c:T.muted,fontWeight:700,cursor:"pointer",fontSize:11,fontFamily:MO,whiteSpace:"nowrap",transition:"all 0.15s",flexShrink:0}}>{t.icon} {t.label}</button>);})}</div>)}
        </div>
      </div>
      <div style={{maxWidth:1440,margin:"0 auto",padding:isMobile?"12px 10px 80px":"24px 16px 60px"}}>
        {alertBanner.length>0&&<LowStockAlertBanner T={T} alertItems={alertBanner} alertSettings={alertSettings} onDismiss={()=>setAlertBanner([])} onConfigure={()=>setShowAlertSettings(true)}/>}
        {safeTab==="out"  &&<MovementTab T={T} type="out" items={items} movements={movements} setMovements={setMovements} setItems={setItems} currentUser={currentUser}/>}
        {safeTab==="in"   &&<MovementTab T={T} type="in"  items={items} movements={movements} setMovements={setMovements} setItems={setItems} currentUser={currentUser}/>}
        {safeTab==="inv"  &&<InventoryTab T={T} items={items} setItems={setItems} canEdit={role.canEditItems}/>}
        {safeTab==="count"&&<ManualCountTab T={T} items={items} setItems={setItems} countHistory={countHistory} setCountHistory={setCountHistory} currentUser={currentUser}/>}
        {safeTab==="var"  &&<VarianceTab T={T} countHistory={countHistory}/>}
        {safeTab==="po"   &&<PurchaseOrderTab T={T} items={items} alertSettings={alertSettings}/>}
        {safeTab==="hist" &&<HistoryTab T={T} movements={movements}/>}
        {safeTab==="reports"&&<ReportsTab T={T} movements={movements} countHistory={countHistory}/>}
        {safeTab==="users"&&<UsersTab T={T} users={users} setUsers={setUsers}/>}
        {safeTab==="devices"&&<DevicesTab T={T} devices={devices} setDevices={setDevices} loginHistory={loginHistory}/>}
      </div>
      {isMobile&&(<div style={{position:"fixed",bottom:0,left:0,right:0,background:T.navBg,borderTop:`1px solid ${T.navBorder}`,display:"flex",zIndex:100,overflowX:"auto"}}>{allowedTabs.map(t=>{const c=tabColor(t.key,T);return(<button key={t.key} onClick={()=>setTab(t.key)} style={{flex:1,minWidth:44,padding:"9px 2px 7px",border:"none",background:"transparent",color:safeTab===t.key?c:T.muted,cursor:"pointer",fontFamily:MO,display:"flex",flexDirection:"column",alignItems:"center",gap:2,borderTop:safeTab===t.key?`2px solid ${c}`:"2px solid transparent"}}><span style={{fontSize:15,lineHeight:1}}>{t.icon}</span><span style={{fontSize:7,fontWeight:700,whiteSpace:"nowrap"}}>{t.label}</span></button>);})}</div>)}
      {showAlertSettings&&<AlertSettingsModal T={T} settings={alertSettings} onClose={()=>setShowAlertSettings(false)} onSave={s=>{setAlertSettings(s);setShowAlertSettings(false);}}/> }
      <CreatorStamp T={T}/>
    </div>
  );
}