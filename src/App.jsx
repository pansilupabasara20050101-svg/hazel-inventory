import { useState, useMemo, useEffect, useRef, useCallback, useContext, createContext, memo } from "react";
import { db } from "./firebase";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

// ── HOOKS ─────────────────────────────────────────────────────────────────────
function useIsMobile(bp=768){
  const[m,setM]=useState(()=>typeof window!=="undefined"&&window.innerWidth<bp);
  useEffect(()=>{
    const h=()=>setM(window.innerWidth<bp);
    window.addEventListener("resize",h);
    return()=>window.removeEventListener("resize",h);
  },[bp]);
  return m;
}

// Crypto-based uid — no Math.random collision risk
const uid=()=>{
  if(typeof crypto!=="undefined"&&crypto.randomUUID) return crypto.randomUUID().replace(/-/g,"").slice(0,10);
  return Date.now().toString(36)+Math.random().toString(36).slice(2,6);
};
const nowStr=()=>new Date().toLocaleString("en-GB",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
const fmtRs=n=>n==null||n===""?"—":`Rs${Number(n).toLocaleString("en-LK",{minimumFractionDigits:2,maximumFractionDigits:2})}`;

// ── THEME CONTEXT — eliminates T prop drilling through 57 components ──────────
const ThemeContext=createContext(null);
const useT=()=>useContext(ThemeContext);

// ── FIREBASE PERSIST HOOK — replaces 9 duplicate useEffect save patterns ──────
// extraSync is stored in a ref so it always sees the latest closure values
// without being listed as a dep (avoids infinite loop from inline arrow fns)
function useFirebasePersist(key,value,ready,extraSync=null){
  const debounceRef=useRef(null);
  const extraSyncRef=useRef(extraSync);
  // Keep ref current on every render so the debounce callback always
  // closes over the freshest extraSync (which itself closes over fresh state)
  useEffect(()=>{extraSyncRef.current=extraSync;},[extraSync]);

  useEffect(()=>{
    if(!ready) return;
    if(debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current=setTimeout(()=>{
      fbSave(key,value);
      if(extraSyncRef.current) extraSyncRef.current(value).catch(()=>{});
    },500);
    return()=>{if(debounceRef.current) clearTimeout(debounceRef.current);};
  },[value,ready,key]);
}

// ── MODULE HEADER — replaces 4 copy-pasted module headers ───────────────────
function ModuleHeader({title,subtitle,isDark,onToggle,currentUser,onBack,onLogout,children}){
  const T=useT();
  const isMobile=useIsMobile();
  return(
    <div style={{background:T.navBg,borderBottom:`1px solid ${T.navBorder}`,position:"sticky",top:0,zIndex:100}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px"}}>
        <button onClick={onBack}
          style={{display:"flex",alignItems:"center",gap:4,background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 10px",cursor:"pointer",color:T.muted,fontFamily:MO,fontSize:11,fontWeight:700,flexShrink:0}}
          onMouseEnter={e=>{e.currentTarget.style.background=T.accentDim;e.currentTarget.style.color=T.accent;}}
          onMouseLeave={e=>{e.currentTarget.style.background=T.card;e.currentTarget.style.color=T.muted;}}>
          <span style={{fontSize:14,fontWeight:800}}>‹</span>{!isMobile&&" Modules"}
        </button>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,color:T.accent,fontFamily:SE}}>{title}</div>
          {subtitle&&<div style={{fontSize:10,color:T.muted,fontFamily:MO}}>{subtitle}</div>}
        </div>
        <ThemeToggle T={T} isDark={isDark} onToggle={onToggle}/>
        <UserMenu T={T} user={currentUser} onLogout={onLogout||onBack} isMobile={isMobile}/>
      </div>
      {children}
    </div>
  );
}

// ── MODULE SHELL — replaces 3 copy-pasted module loading/layout patterns ─────
function ModuleShell({title,subtitle,isDark,onToggle,currentUser,onBack,onLogout,tabs,activeTab,onTabChange,ready,children}){
  const T=useT();
  const isMobile=useIsMobile();
  if(!ready) return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",color:T.muted,fontFamily:SE}}>
      Loading…
    </div>
  );
  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:SE}}>
      <ModuleHeader title={title} subtitle={subtitle} isDark={isDark} onToggle={onToggle} currentUser={currentUser} onBack={onBack} onLogout={onLogout}>
        <div style={{display:"flex",overflowX:"auto",scrollbarWidth:"none",borderTop:`1px solid ${T.navBorder}`}}>
          {tabs.map(t=>{
            const active=activeTab===t.key;
            return(
              <button key={t.key} onClick={()=>onTabChange(t.key)}
                style={{flexShrink:0,padding:"8px 14px",border:"none",borderBottom:active?`2px solid ${T.accent}`:"2px solid transparent",background:active?T.accentDim:"transparent",color:active?T.accent:T.muted,fontWeight:700,cursor:"pointer",fontSize:11,fontFamily:MO,whiteSpace:"nowrap",transition:"all 0.15s"}}>
                {t.icon} {t.label}
              </button>
            );
          })}
        </div>
      </ModuleHeader>
      <div style={{padding:isMobile?"12px":"20px",maxWidth:1100,margin:"0 auto"}}>
        {children}
      </div>
    </div>
  );
}

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
  admin:{label:"Admin",tabs:["out","in","inv","count","var","po","hist","reports","audit","value","users","devices"],canEditItems:true,canEditUsers:true,canEditDevices:true,canViewReports:true},
  supervisor:{label:"Supervisor",tabs:["out","in","inv","count","var","po","hist","reports","audit","value"],canEditItems:true,canViewReports:true},
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
  // Store callbacks in refs so useEffect(,[]) can safely call them
  // without going stale — onSuccess identity changes every render of parent
  const onSuccessRef=useRef(onSuccess);
  useEffect(()=>{onSuccessRef.current=onSuccess;},[onSuccess]);

  useEffect(()=>{
    if(!window.PublicKeyCredential) return;
    if(localStorage.getItem("bio_"+storedUser.id)!=="1") return;
    let cancelled=false;
    (async()=>{
      try{
        const challenge=new Uint8Array(32);crypto.getRandomValues(challenge);
        await navigator.credentials.get({publicKey:{challenge,timeout:60000,userVerification:"required",rpId:window.location.hostname}});
        if(!cancelled) onSuccessRef.current(storedUser);
      }catch(e){
        if(!cancelled) setError("Biometric failed. Use PIN or password.");
      }
    })();
    return()=>{cancelled=true;};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[storedUser.id]);// only re-run if the user changes, not on every render

  const tryBiometric=async()=>{
    setError("");
    try{
      if(!window.PublicKeyCredential) return;
      const challenge=new Uint8Array(32);crypto.getRandomValues(challenge);
      await navigator.credentials.get({publicKey:{challenge,timeout:60000,userVerification:"required",rpId:window.location.hostname}});
      onSuccessRef.current(storedUser);
    }catch(e){setError("Biometric failed. Use PIN or password.");}
  };

  const tap=(d)=>{
    if(d==="del"){setPin(p=>p.slice(0,-1));setError("");return;}
    const next=pin+d;
    setPin(next);
    if(next.length===4){
      if(next===savedPin){setPin("");onSuccess(storedUser);}
      else{setError("Wrong PIN");setShake(true);setPin("");setTimeout(()=>setShake(false),500);}
    }
  };

  useEffect(()=>{
    const handler=(e)=>{
      if(e.key>="0"&&e.key<="9") tap(e.key);
      else if(e.key==="Backspace") tap("del");
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[pin]);

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

  // Single keyboard handler — dep array covers all state that tap() reads
  useEffect(()=>{
    const handler=(e)=>{
      if(e.key>="0"&&e.key<="9") tap(e.key);
      else if(e.key==="Backspace") tap("del");
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[step,pin1,pin2]);

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
  // useRef not useState — timer ID never needs to trigger a re-render
  const undoTimerRef=useRef(null);
  const [lastMov,setLastMov]=useState(null);
  const [showCam,setShowCam]=useState(false);
  const [showAI,setShowAI]=useState(false);
  const isMobile=useIsMobile();
  const isOut=type==="out";

  useEffect(()=>()=>{if(undoTimerRef.current) clearTimeout(undoTimerRef.current);},[]);

  const doPost=(forceNegative=false)=>{
    if(!selected||!qty||Number(qty)<=0) return;
    const n=Number(qty);
    const newStock=isOut?selected.stock-n:selected.stock+n;
    if(isOut&&newStock<0&&!forceNegative){setConfirmOverdraw(true);return;}
    setConfirmOverdraw(false);
    const mov={id:uid(),type,timestamp:nowStr(),personName:currentUser.name,userId:currentUser.id,userRole:currentUser.role,dept:selected.dept,code:selected.code,itemName:selected.name,qty:n,prevStock:selected.stock,newStock,note:note.trim()||null};
    setMovements(prev=>[mov,...prev]);
    setItems(prev=>prev.map(i=>i.id===selected.id?{...i,stock:newStock}:i));
    setLastMov(mov);setSuccess({...mov});setSelected(null);setQty("");setSearch("");setNote("");
    if(undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current=setTimeout(()=>{setLastMov(null);setSuccess(null);},60000);
  };

  const doUndo=()=>{
    if(!lastMov) return;
    setItems(prev=>prev.map(i=>i.code===lastMov.code?{...i,stock:lastMov.prevStock}:i));
    setMovements(prev=>prev.filter(m=>m.id!==lastMov.id));
    setLastMov(null);setSuccess(null);if(undoTimerRef.current) clearTimeout(undoTimerRef.current);
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
          <Btn T={T} v="danger" onClick={()=>{if(f._confirmDelete){onSave({...f,_delete:true});}else{setF(p=>({...p,_confirmDelete:true}));setTimeout(()=>setF(p=>({...p,_confirmDelete:false})),3000);}}} s={{marginRight:"auto"}}>{f._confirmDelete?"Confirm Delete?":"Delete"}</Btn>
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
      {canEdit&&(editItem||showAdd)&&<ItemModal T={T} item={editItem} onClose={()=>{setEditItem(null);setShowAdd(false);}} onSave={form=>{if(form._delete){recordAudit(setAuditLog,"delete","fb",form.name,currentUser,form,null);setItems(prev=>prev.filter(i=>i.id!==form.id));}else if(form.id){const old=items.find(i=>i.id===form.id);recordAudit(setAuditLog,"update","fb",form.name,currentUser,old,form);setItems(prev=>prev.map(i=>i.id===form.id?form:i));}else{recordAudit(setAuditLog,"create","fb",form.name,currentUser,null,form);setItems(prev=>[...prev,{...form,id:form.code||uid()}]);}setEditItem(null);setShowAdd(false);}}/>}
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
    if(!alertSettings?.email1){onConfigure();return;}
    setEmailSending(true);setEmailError("");
    try{
      const lines=deficitItems.map(i=>{const q=getQty(i);return`  • ${i.name} (${i.code}) — need: ${q} ${i.unit}, supplier: ${i.supplier||"—"}`;}).join("\n");
      const res=await fetch("/api/send-alert",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({to1:alertSettings.email1,to2:alertSettings.email2,count:deficitItems.length,lines,timestamp:nowStr(),items:deficitItems.map(i=>({name:i.name,code:i.code,unit:i.unit,qtySize:i.qtySize||'',stock:i.stock,minQty:i.minQty,supplier:i.supplier||''}))}),
      });
      if(!res.ok) throw new Error("Server error "+res.status);
      setEmailSent(true);setTimeout(()=>setEmailSent(false),3000);
    }catch(e){setEmailError("Failed: "+e.message);}
    setEmailSending(false);
  };

  const printPO=()=>{
    const rows=deficitItems.map(i=>{const q=getQty(i);return`${i.code}\t${i.name}\t${i.dept}\t${i.supplier||"—"}\t${i.unit}\t${i.stock}\t${i.minQty}\t${q}\t${i.perUnit?fmtRs(i.perUnit):"—"}\t${i.perUnit&&q?fmtRs(q*i.perUnit):"—"}`;}).join("\n");
    const w=window.open("","_blank","width=960,height=720");
    if(!w){console.warn("Pop-up blocked — please allow pop-ups for printing.");return;}
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

function StockValueTab({T,items,isMobile}){
  const totalValue=items.reduce((s,i)=>s+(Number(i.stock||0)*Number(i.perUnit||0)),0);
  const byDept={};
  items.forEach(i=>{const d=i.dept||"Other";if(!byDept[d]) byDept[d]={count:0,value:0,lowCount:0};byDept[d].count++;byDept[d].value+=Number(i.stock||0)*Number(i.perUnit||0);if(i.stock<i.minQty) byDept[d].lowCount++;});
  const sorted=[...items].sort((a,b)=>(Number(b.stock||0)*Number(b.perUnit||0))-(Number(a.stock||0)*Number(a.perUnit||0)));
  return(
    <div>
      <div style={{fontSize:20,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:14}}>Stock Value</div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:12,marginBottom:16}}>
        <Card T={T} s={{padding:16,textAlign:"center",gridColumn:isMobile?"auto":"1/-1"}}>
          <div style={{fontSize:11,color:T.muted,fontFamily:MO,marginBottom:4}}>TOTAL INVENTORY VALUE</div>
          <div style={{fontSize:32,fontWeight:800,color:T.ok,fontFamily:MO}}>Rs {totalValue.toLocaleString()}</div>
        </Card>
        {Object.entries(byDept).map(([dept,data])=>(
          <Card T={T} key={dept} s={{padding:16,textAlign:"center"}}>
            <DeptBadge T={T} dept={dept}/>
            <div style={{fontSize:22,fontWeight:800,color:T.accent,fontFamily:MO,marginTop:8}}>Rs {Math.round(data.value).toLocaleString()}</div>
            <div style={{fontSize:10,color:T.muted,fontFamily:MO,marginTop:4}}>{data.count} items · {data.lowCount} low</div>
          </Card>
        ))}
      </div>
      <Card T={T} s={{padding:16}}>
        <div style={{fontSize:14,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:12}}>Items by Value</div>
        {sorted.filter(i=>i.perUnit).slice(0,20).map((item,idx)=>{
          const val=Number(item.stock||0)*Number(item.perUnit||0);
          const pct=totalValue>0?(val/totalValue)*100:0;
          return(
            <div key={item.id} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <div>
                  <span style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:SE}}>{item.name}</span>
                  <span style={{fontSize:10,color:T.muted,fontFamily:MO,marginLeft:8}}>{item.stock} × Rs {item.perUnit}</span>
                </div>
                <span style={{fontSize:13,fontWeight:700,color:T.accent,fontFamily:MO}}>Rs {val.toLocaleString()}</span>
              </div>
              <div style={{height:4,background:T.border,borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",background:T.accent,width:`${pct}%`,borderRadius:2}}/>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function ReportsTab({T,movements,countHistory}){
  const isMobile=useIsMobile();
  const {filtered:filteredMov,startDate,endDate,setStartDate,setEndDate,clear}=useDateFilter(movements);
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
    filteredMov.forEach(m=>{if(!map[m.code]) map[m.code]={code:m.code,name:m.itemName,dept:m.dept,out:0,in:0,outQty:0,inQty:0};if(m.type==="out"){map[m.code].out++;map[m.code].outQty+=Number(m.qty)||1;}else{map[m.code].in++;map[m.code].inQty+=Number(m.qty)||1;}});
    return Object.values(map).map(i=>({...i,netQty:i.inQty-i.outQty})).sort((a,b)=>Math.abs(b.outQty+b.inQty)-Math.abs(a.outQty+a.inQty)).slice(0,15);
  },[filteredMov]);
  const maxItemVal=topItems.reduce((mx,i)=>Math.max(mx,i.out,i.in),0);

  const personStats=useMemo(()=>{
    const map={};
    filteredMov.forEach(m=>{const k=m.personName||"Unknown";if(!map[k]) map[k]={name:k,role:m.userRole,ins:0,outs:0,total:0,inQty:0,outQty:0};if(m.type==="in"){map[k].ins++;map[k].inQty+=Number(m.qty)||1;}else{map[k].outs++;map[k].outQty+=Number(m.qty)||1;}map[k].total++;});
    return Object.values(map).map(p=>({...p,netQty:p.inQty-p.outQty})).sort((a,b)=>b.total-a.total);
  },[filteredMov]);

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
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        {navBtn("overview","Overview","📊")}
        {navBtn("items","Top Items","🔥")}
        {navBtn("people","By Person","👤")}
        {navBtn("counts","Count Sessions","✏")}
      </div>
      <div style={{background:T.card2,borderRadius:8,padding:"10px 14px",marginBottom:16,border:`1px solid ${T.border}`}}>
        <div style={{fontSize:10,fontWeight:700,color:T.muted,fontFamily:MO,marginBottom:8,letterSpacing:"0.08em"}}>FILTER BY DATE</div>
        <DateRangePicker T={T} startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} onClear={clear}/>
        {(startDate||endDate)&&<div style={{fontSize:11,color:T.accent,fontFamily:MO,marginTop:6}}>Showing {filteredMov.length} of {movements.length} movements</div>}
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
                <button onClick={()=>{if(d._confirmRemove){setDevices(prev=>prev.filter(p=>p.id!==d.id));}else{setDevices(prev=>prev.map(p=>p.id===d.id?{...p,_confirmRemove:true}:p));setTimeout(()=>setDevices(prev=>prev.map(p=>p.id===d.id?{...p,_confirmRemove:false}:p)),3000);}}}
                  style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",color:d._confirmRemove?T.low:T.muted,cursor:"pointer",fontSize:11,fontFamily:MO}}>
                  {d._confirmRemove?"Confirm?":"Remove"}
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
                  <div style={{fontSize:11,color:h.logoutTime?(h.logoutTime.startsWith("Timed")?T.warn:T.low):T.ok,fontFamily:MO,fontWeight:h.logoutTime?600:400}}>{h.logoutTime||(
  <span style={{color:T.ok,fontWeight:700}}>● Active</span>
)}</div>
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
                <div style={{fontSize:11,color:h.logoutTime?(h.logoutTime.startsWith("Timed")?T.warn:T.low):T.ok,fontFamily:MO,fontWeight:600}}>{h.logoutTime||"● Active"}</div>
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
const ALL_TABS=[{key:"out",label:"Stock Out",icon:"↑"},{key:"in",label:"Stock In",icon:"↓"},{key:"inv",label:"Inventory",icon:"📦"},{key:"count",label:"Count",icon:"✏"},{key:"var",label:"Variance",icon:"≠"},{key:"po",label:"Order",icon:"🛒"},{key:"hist",label:"History",icon:"📋"},{key:"reports",label:"Reports",icon:"📈"},{key:"audit",label:"Audit",icon:"🔍"},{key:"value",label:"Stock Value",icon:"💰"},{key:"users",label:"Users",icon:"👥"},{key:"devices",label:"Devices",icon:"🖥"}];
const tabColor=(k,T)=>({out:T.low,in:T.ok,inv:T.blue,count:T.warn,var:T.purple,po:T.accent,hist:T.muted,audit:T.purple,reports:T.blue,users:T.purple,devices:T.ok}[k]||T.muted);

// ── QR CODE COMPONENTS ───────────────────────────────────────────────────────
function useQRCode(text, size=120){
  const [dataUrl,setDataUrl]=useState(null);
  useEffect(()=>{
    if(!text) return;
    const script=document.createElement("script");
    script.src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    script.onload=()=>{
      try{
        const div=document.createElement("div");
        new window.QRCode(div,{text,width:size,height:size,colorDark:"#3d2b1f",colorLight:"#ffffff"});
        setTimeout(()=>{
          const img=div.querySelector("img")||div.querySelector("canvas");
          if(img) setDataUrl(img.src||img.toDataURL());
        },100);
      }catch(e){}
    };
    if(!window.QRCode) document.head.appendChild(script);
    else{
      try{
        const div=document.createElement("div");
        new window.QRCode(div,{text,width:size,height:size,colorDark:"#3d2b1f",colorLight:"#ffffff"});
        setTimeout(()=>{
          const img=div.querySelector("img")||div.querySelector("canvas");
          if(img) setDataUrl(img.src||img.toDataURL());
        },100);
      }catch(e){}
    }
  },[text,size]);
  return dataUrl;
}

function QRLabel({T,item,onClose}){
  const qr=useQRCode(item.shortCode,160);
  const print=()=>{
    const w=window.open("","_blank");
    w.document.write(`<html><head><title>QR Label - ${item.shortCode}</title><style>
      body{font-family:Georgia,serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fff;}
      .label{border:2px solid #5c3d2e;border-radius:12px;padding:16px 20px;text-align:center;width:200px;}
      .code{font-size:11px;font-family:monospace;color:#8c6e5a;letter-spacing:0.1em;margin-bottom:4px;}
      .name{font-size:14px;font-weight:600;color:#3d2b1f;margin-bottom:8px;}
      .short{font-size:20px;font-weight:800;color:#5c3d2e;font-family:monospace;margin-top:8px;}
      .dept{font-size:10px;background:#fdf6f0;border:1px solid #e8ddd5;border-radius:4px;padding:2px 8px;color:#8c6e5a;margin-top:4px;display:inline-block;}
      @media print{body{-webkit-print-color-adjust:exact;}}
    </style></head><body>
      <div class="label">
        <div class="code">${item.fullCode||item.shortCode}</div>
        <div class="name">${item.name}</div>
        ${qr?`<img src="${qr}" width="160" height="160"/>`:""}
        <div class="short">${item.shortCode}</div>
        ${item.dept?`<div class="dept">${item.dept}</div>`:""}
        ${item.usage?`<div class="code" style="margin-top:4px;">For: ${item.usage}</div>`:""}
      </div>
      <script>window.onload=()=>window.print();<\/script>
    </body></html>`);
    w.document.close();
  };

  return(
    <div style={{position:"fixed",inset:0,background:"#000a",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <Card T={T} s={{padding:28,width:320,maxWidth:"100%",textAlign:"center"}}>
        <div style={{fontSize:16,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:4}}>QR Label</div>
        <div style={{fontSize:11,color:T.muted,fontFamily:MO,marginBottom:20}}>{item.name}</div>
        <div style={{border:`2px solid ${T.accent}`,borderRadius:12,padding:16,display:"inline-block",marginBottom:16,background:"#fff"}}>
          {qr?<img src={qr} width={160} height={160} alt="QR Code"/>:<div style={{width:160,height:160,display:"flex",alignItems:"center",justifyContent:"center",color:T.muted,fontFamily:MO,fontSize:11}}>Generating…</div>}
          <div style={{fontSize:18,fontWeight:800,color:"#5c3d2e",fontFamily:"monospace",marginTop:8}}>{item.shortCode}</div>
          <div style={{fontSize:12,color:"#8c6e5a",fontFamily:"Georgia,serif",marginTop:2}}>{item.name}</div>
          {item.dept&&<div style={{fontSize:10,color:"#8c6e5a",fontFamily:"monospace",marginTop:4}}>{item.dept}</div>}
        </div>
        <div style={{fontSize:10,color:T.muted,fontFamily:MO,marginBottom:16}}>Scan to quickly record breakage or issue</div>
        <div style={{display:"flex",gap:8}}>
          <Btn T={T} onClick={onClose} s={{flex:1}}>Close</Btn>
          <Btn T={T} v="primary" onClick={print} s={{flex:2}}>🖨 Print Label</Btn>
        </div>
      </Card>
    </div>
  );
}

function QRScanner({T,items,onFound,onClose}){
  const videoRef=useRef(null);
  const [error,setError]=useState("");
  const [scanning,setScanning]=useState(true);

  useEffect(()=>{
    let stream=null;
    let interval=null;
    async function start(){
      try{
        stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
        if(videoRef.current){videoRef.current.srcObject=stream;videoRef.current.play();}
        // Use BarcodeDetector if available
        if(window.BarcodeDetector){
          const detector=new window.BarcodeDetector({formats:["qr_code"]});
          interval=setInterval(async()=>{
            if(!videoRef.current||!scanning) return;
            try{
              const barcodes=await detector.detect(videoRef.current);
              if(barcodes.length>0){
                const code=barcodes[0].rawValue;
                const item=items.find(i=>i.shortCode===code||i.fullCode===code);
                clearInterval(interval);
                stream.getTracks().forEach(t=>t.stop());
                onFound(item,code);
              }
            }catch(e){}
          },500);
        }else{
          setError("QR scanning not supported on this browser. Try Chrome on Android.");
        }
      }catch(e){setError("Camera access denied.");}
    }
    start();
    return()=>{if(stream) stream.getTracks().forEach(t=>t.stop());if(interval) clearInterval(interval);};
  },[]);

  return(
    <div style={{position:"fixed",inset:0,background:"#000",zIndex:400,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <div style={{position:"absolute",top:16,right:16,zIndex:10}}>
        <button onClick={onClose} style={{background:"#fff2",border:"none",borderRadius:8,padding:"8px 14px",color:"#fff",cursor:"pointer",fontSize:14,fontFamily:"monospace"}}>✕ Close</button>
      </div>
      <div style={{fontSize:13,color:"#fff",fontFamily:"monospace",marginBottom:16,letterSpacing:"0.1em"}}>SCAN QR LABEL</div>
      {error?<div style={{color:"#ff6b6b",fontFamily:"monospace",fontSize:12,padding:20,textAlign:"center"}}>{error}</div>:(
        <div style={{position:"relative",width:280,height:280,borderRadius:12,overflow:"hidden",border:"3px solid #fff4"}}>
          <video ref={videoRef} style={{width:"100%",height:"100%",objectFit:"cover"}} muted playsInline/>
          <div style={{position:"absolute",inset:0,border:"3px solid #d4a97a",borderRadius:10,pointerEvents:"none"}}/>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:140,height:140,border:"2px solid #d4a97a",borderRadius:4,pointerEvents:"none"}}/>
        </div>
      )}
      <div style={{fontSize:11,color:"#ffffff88",fontFamily:"monospace",marginTop:16}}>Point at a Hazel inventory QR label</div>
    </div>
  );
}

// ── GLASSWARE & UTENSILS MODULE ──────────────────────────────────────────────

const DEFAULT_GLASS_ITEMS = [];

function GlassItemModal({T,item,onClose,onSave,canDelete,isMobile}){
  const [f,setF]=useState(item||{shortCode:"",fullCode:"",name:"",dept:"FOH",category:"",usage:"",kitchenQty:0,frontQty:0,minQty:0,photoUrl:"",notes:""});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const total=(f.kitchenQty||0)+(f.frontQty||0);
  return(
    <div style={{position:"fixed",inset:0,background:"#000a",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <Card T={T} s={{padding:24,width:500,maxWidth:"100%",maxHeight:"92vh",overflowY:"auto"}}>
        <h2 style={{margin:"0 0 18px",fontSize:20,fontFamily:SE,fontWeight:600,color:T.text}}>{item?"Edit Item":"New Item"}</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div><Label T={T}>Short Code</Label><Inp T={T} value={f.shortCode} onChange={v=>set("shortCode",v)} placeholder="e.g. BOH12"/></div>
          <div><Label T={T}>Department</Label><Sel T={T} value={f.dept} onChange={v=>set("dept",v)}><option value="FOH">FOH (Front)</option><option value="BOH">BOH (Kitchen)</option><option value="Both">Both</option></Sel></div>
          <div style={{gridColumn:"1/-1"}}><Label T={T}>Full Code</Label><Inp T={T} value={f.fullCode} onChange={v=>set("fullCode",v)} placeholder="e.g. BOH/P/BW/GREEN/15/6/001"/></div>
          <div style={{gridColumn:"1/-1"}}><Label T={T}>Item Name</Label><Inp T={T} value={f.name} onChange={v=>set("name",v)} placeholder="e.g. Arabiata Bowl"/></div>
          <div><Label T={T}>Category</Label><Inp T={T} value={f.category} onChange={v=>set("category",v)} placeholder="e.g. Pasta, Add ons"/></div>
          <div><Label T={T}>Primary Usage / Drink</Label><Inp T={T} value={f.usage} onChange={v=>set("usage",v)} placeholder="e.g. Arabiata, Latte"/></div>
          <div><Label T={T}>Kitchen Qty</Label><Inp T={T} type="number" value={f.kitchenQty} onChange={v=>set("kitchenQty",Number(v))}/></div>
          <div><Label T={T}>Front Qty</Label><Inp T={T} type="number" value={f.frontQty} onChange={v=>set("frontQty",Number(v))}/></div>
          <div><Label T={T}>Min Qty (alert below)</Label><Inp T={T} type="number" value={f.minQty} onChange={v=>set("minQty",Number(v))}/></div>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:total<f.minQty?T.lowBg:T.okBg,borderRadius:8,border:`1px solid ${total<f.minQty?T.low:T.ok}44`}}>
            <div><div style={{fontSize:9,fontFamily:MO,fontWeight:700,color:T.muted,letterSpacing:"0.08em"}}>TOTAL STOCK</div><div style={{fontSize:22,fontWeight:800,color:total<f.minQty?T.low:T.ok,fontFamily:MO}}>{total}</div></div>
          </div>
          <div style={{gridColumn:"1/-1"}}><Label T={T}>Photo URL (Google Drive link)</Label><Inp T={T} value={f.photoUrl||""} onChange={v=>set("photoUrl",v)} placeholder="https://drive.google.com/..."/></div>
          <div style={{gridColumn:"1/-1"}}><Label T={T}>Notes</Label><Inp T={T} value={f.notes||""} onChange={v=>set("notes",v)} placeholder="Optional notes"/></div>
        </div>
        {f.photoUrl&&<div style={{marginBottom:16,textAlign:"center"}}><img src={f.photoUrl.replace("open?id=","uc?id=").replace("/view","")} alt="Item" style={{maxWidth:"100%",maxHeight:160,borderRadius:8,objectFit:"cover",border:`1px solid ${T.border}`}} onError={e=>e.target.style.display="none"}/></div>}
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          {canDelete&&item&&<Btn T={T} v="danger" onClick={()=>{if(f._confirmDelete){onSave({...f,_delete:true});}else{setF(p=>({...p,_confirmDelete:true}));setTimeout(()=>setF(p=>({...p,_confirmDelete:false})),3000);}}} s={{marginRight:"auto"}}>{f._confirmDelete?"Confirm Delete?":"Delete"}</Btn>}
          <Btn T={T} onClick={onClose}>Cancel</Btn>
          <Btn T={T} v="primary" onClick={()=>onSave(f)} disabled={!f.name||!f.shortCode}>Save Item</Btn>
        </div>
      </Card>
    </div>
  );
}

function GlassBreakageModal({T,items,onClose,onSave,currentUser}){
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState(null);
  const [qty,setQty]=useState(1);
  const [location,setLocation]=useState("kitchen");
  const [note,setNote]=useState("");
  const filtered=useMemo(()=>{
    if(!search) return [];
    const q=search.toLowerCase();
    return items.filter(i=>i.name.toLowerCase().includes(q)||i.shortCode.toLowerCase().includes(q)||(i.usage&&i.usage.toLowerCase().includes(q))||(i.category&&i.category.toLowerCase().includes(q))).slice(0,6);
  },[items,search]);
  return(
    <div style={{position:"fixed",inset:0,background:"#000a",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <Card T={T} s={{padding:24,width:460,maxWidth:"100%"}}>
        <h2 style={{margin:"0 0 16px",fontSize:18,fontFamily:SE,fontWeight:600,color:T.low}}>🔴 Record Breakage</h2>
        <div style={{marginBottom:12}}>
          <Label T={T}>Search Item</Label>
          <Inp T={T} value={search} onChange={v=>{setSearch(v);setSelected(null);}} placeholder="Name, short code, or drink…"/>
          {filtered.length>0&&!selected&&(
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,marginTop:4,overflow:"hidden"}}>
              {filtered.map(i=>(
                <div key={i.id} onClick={()=>{setSelected(i);setSearch(i.name);}} style={{padding:"10px 14px",cursor:"pointer",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:SE}}>{i.name}</div>
                    <div style={{fontSize:10,color:T.muted,fontFamily:MO}}>{i.shortCode} · {i.category}</div>
                  </div>
                  <div style={{textAlign:"right",fontSize:11,fontFamily:MO}}>
                    <div style={{color:T.muted}}>K:{i.kitchenQty} F:{i.frontQty}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {selected&&(
          <>
            <div style={{display:"flex",gap:12,marginBottom:12}}>
              <div style={{flex:1}}><Label T={T}>Location</Label>
                <Sel T={T} value={location} onChange={setLocation}>
                  <option value="kitchen">Kitchen (current: {selected.kitchenQty})</option>
                  <option value="front">Front (current: {selected.frontQty})</option>
                </Sel>
              </div>
              <div style={{flex:1}}><Label T={T}>Qty Broken</Label><Inp T={T} type="number" value={qty} onChange={v=>setQty(Math.max(1,Number(v)))}/></div>
            </div>
            <div style={{marginBottom:16}}><Label T={T}>Note (optional)</Label><Inp T={T} value={note} onChange={setNote} placeholder="e.g. Dropped during service"/></div>
            <div style={{background:T.lowBg,border:`1px solid ${T.low}44`,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12,fontFamily:MO,color:T.low}}>
              {selected.name} · {location==="kitchen"?"Kitchen":"Front"} {location==="kitchen"?selected.kitchenQty:selected.frontQty} → {Math.max(0,(location==="kitchen"?selected.kitchenQty:selected.frontQty)-qty)}
            </div>
          </>
        )}
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <Btn T={T} onClick={onClose}>Cancel</Btn>
          <Btn T={T} v="danger" onClick={()=>{if(selected) onSave(selected,qty,location,note);}} disabled={!selected||qty<1}>Record Breakage</Btn>
        </div>
      </Card>
    </div>
  );
}

function GlassIssueModal({T,items,onClose,onSave}){
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState(null);
  const [qty,setQty]=useState(1);
  const [location,setLocation]=useState("kitchen");
  const [note,setNote]=useState("");
  const filtered=useMemo(()=>{
    if(!search) return [];
    const q=search.toLowerCase();
    return items.filter(i=>i.name.toLowerCase().includes(q)||i.shortCode.toLowerCase().includes(q)||(i.usage&&i.usage.toLowerCase().includes(q))).slice(0,6);
  },[items,search]);
  return(
    <div style={{position:"fixed",inset:0,background:"#000a",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <Card T={T} s={{padding:24,width:460,maxWidth:"100%"}}>
        <h2 style={{margin:"0 0 16px",fontSize:18,fontFamily:SE,fontWeight:600,color:T.ok}}>📥 Issue Items</h2>
        <div style={{marginBottom:12}}>
          <Label T={T}>Search Item</Label>
          <Inp T={T} value={search} onChange={v=>{setSearch(v);setSelected(null);}} placeholder="Name, short code, or drink…"/>
          {filtered.length>0&&!selected&&(
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,marginTop:4,overflow:"hidden"}}>
              {filtered.map(i=>(
                <div key={i.id} onClick={()=>{setSelected(i);setSearch(i.name);}} style={{padding:"10px 14px",cursor:"pointer",borderBottom:`1px solid ${T.border}`}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:SE}}>{i.name}</div>
                  <div style={{fontSize:10,color:T.muted,fontFamily:MO}}>{i.shortCode} · K:{i.kitchenQty} F:{i.frontQty}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        {selected&&(
          <>
            <div style={{display:"flex",gap:12,marginBottom:12}}>
              <div style={{flex:1}}><Label T={T}>Issue To</Label>
                <Sel T={T} value={location} onChange={setLocation}>
                  <option value="kitchen">Kitchen</option>
                  <option value="front">Front</option>
                </Sel>
              </div>
              <div style={{flex:1}}><Label T={T}>Qty Issued</Label><Inp T={T} type="number" value={qty} onChange={v=>setQty(Math.max(1,Number(v)))}/></div>
            </div>
            <div style={{marginBottom:16}}><Label T={T}>Note (optional)</Label><Inp T={T} value={note} onChange={setNote} placeholder="e.g. Replacement for breakage"/></div>
            <div style={{background:T.okBg,border:`1px solid ${T.ok}44`,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12,fontFamily:MO,color:T.ok}}>
              {selected.name} · {location==="kitchen"?"Kitchen":"Front"} {location==="kitchen"?selected.kitchenQty:selected.frontQty} → {(location==="kitchen"?selected.kitchenQty:selected.frontQty)+qty}
            </div>
          </>
        )}
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <Btn T={T} onClick={onClose}>Cancel</Btn>
          <Btn T={T} v="primary" onClick={()=>{if(selected) onSave(selected,qty,location,note);}} disabled={!selected||qty<1}>Confirm Issue</Btn>
        </div>
      </Card>
    </div>
  );
}

function GlassTransferModal({T,items,onClose,onSave}){
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState(null);
  const [qty,setQty]=useState(1);
  const [direction,setDirection]=useState("ktof");
  const [note,setNote]=useState("");
  const filtered=useMemo(()=>{
    if(!search) return [];
    const q=search.toLowerCase();
    return items.filter(i=>i.name.toLowerCase().includes(q)||i.shortCode.toLowerCase().includes(q)).slice(0,6);
  },[items,search]);
  return(
    <div style={{position:"fixed",inset:0,background:"#000a",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <Card T={T} s={{padding:24,width:460,maxWidth:"100%"}}>
        <h2 style={{margin:"0 0 16px",fontSize:18,fontFamily:SE,fontWeight:600,color:T.accent}}>🔄 Transfer Items</h2>
        <div style={{marginBottom:12}}>
          <Label T={T}>Search Item</Label>
          <Inp T={T} value={search} onChange={v=>{setSearch(v);setSelected(null);}} placeholder="Name or short code…"/>
          {filtered.length>0&&!selected&&(
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,marginTop:4,overflow:"hidden"}}>
              {filtered.map(i=>(
                <div key={i.id} onClick={()=>{setSelected(i);setSearch(i.name);}} style={{padding:"10px 14px",cursor:"pointer",borderBottom:`1px solid ${T.border}`}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:SE}}>{i.name}</div>
                  <div style={{fontSize:10,color:T.muted,fontFamily:MO}}>{i.shortCode} · K:{i.kitchenQty} F:{i.frontQty}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        {selected&&(
          <>
            <div style={{display:"flex",gap:12,marginBottom:12}}>
              <div style={{flex:2}}><Label T={T}>Direction</Label>
                <Sel T={T} value={direction} onChange={setDirection}>
                  <option value="ktof">Kitchen → Front</option>
                  <option value="ftok">Front → Kitchen</option>
                </Sel>
              </div>
              <div style={{flex:1}}><Label T={T}>Qty</Label><Inp T={T} type="number" value={qty} onChange={v=>setQty(Math.max(1,Number(v)))}/></div>
            </div>
            <div style={{marginBottom:16}}><Label T={T}>Note (optional)</Label><Inp T={T} value={note} onChange={setNote} placeholder="Reason for transfer"/></div>
            <div style={{background:T.accentDim,border:`1px solid ${T.accent}44`,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12,fontFamily:MO,color:T.accent}}>
              {direction==="ktof"?`Kitchen ${selected.kitchenQty}→${selected.kitchenQty-qty} · Front ${selected.frontQty}→${selected.frontQty+qty}`:`Front ${selected.frontQty}→${selected.frontQty-qty} · Kitchen ${selected.kitchenQty}→${selected.kitchenQty+qty}`}
            </div>
          </>
        )}
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <Btn T={T} onClick={onClose}>Cancel</Btn>
          <Btn T={T} v="primary" onClick={()=>{if(selected) onSave(selected,qty,direction,note);}} disabled={!selected||qty<1}>Confirm Transfer</Btn>
        </div>
      </Card>
    </div>
  );
}

function GlasswareModule({T,isDark,onToggle,currentUser,onBack,onLogout,setAuditLog=()=>{},auditLog=[]}){
  const isMobile=useIsMobile();
  const [items,setItems]=useState([]);
  const [movements,setMovements]=useState([]);
  const [tab,setTab]=useState("inventory");
  const [ready,setReady]=useState(false);
  const [showAdd,setShowAdd]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [showBreakage,setShowBreakage]=useState(false);
  const [showIssue,setShowIssue]=useState(false);
  const [showTransfer,setShowTransfer]=useState(false);
  const [showQR,setShowQR]=useState(null);
  const [showQRScanner,setShowQRScanner]=useState(false);
  const [search,setSearch]=useState("");
  const [deptFilter,setDeptFilter]=useState("All");
  const [catFilter,setCatFilter]=useState("All");

  const canEdit=currentUser.role==="admin"||currentUser.role==="supervisor";
  const canDelete=currentUser.role==="admin";

  // Boot: load glassware data from Firebase
  useEffect(()=>{
    async function boot(){
      const [gi,gm]=await Promise.all([fbLoad("glassItems",[]),fbLoad("glassMov",[])]);
      setItems(gi);setMovements(gm);setReady(true);
    }
    boot();
  },[]);

  // Firebase persistence — debounced, no double-fire
  useFirebasePersist("glassItems",items,ready);
  useFirebasePersist("glassMov",movements,ready);

  // Single debounced sheet sync when either items OR movements change
  const glassSyncRef=useRef(null);
  useEffect(()=>{
    if(!ready) return;
    if(glassSyncRef.current) clearTimeout(glassSyncRef.current);
    glassSyncRef.current=setTimeout(()=>{
      fetch("/api/sync-glassware",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items,movements})}).catch(()=>{});
    },1500);
    return()=>{if(glassSyncRef.current) clearTimeout(glassSyncRef.current);};
  },[items,movements,ready]);

  const logMove=(type,item,qty,location,note)=>{
    setMovements(prev=>[{id:uid(),date:nowStr(),type,itemName:item.name,shortCode:item.shortCode,qty,location,personName:currentUser.name,userRole:currentUser.role,note:note||""},...prev].slice(0,500));
  };

  const handleBreakage=(item,qty,location,note)=>{
    setItems(prev=>prev.map(i=>{
      if(i.id!==item.id) return i;
      return location==="kitchen"?{...i,kitchenQty:Math.max(0,i.kitchenQty-qty)}:{...i,frontQty:Math.max(0,i.frontQty-qty)};
    }));
    logMove("breakage",item,qty,location,note);
    setShowBreakage(false);
  };

  const handleIssue=(item,qty,location,note)=>{
    setItems(prev=>prev.map(i=>{
      if(i.id!==item.id) return i;
      return location==="kitchen"?{...i,kitchenQty:i.kitchenQty+qty}:{...i,frontQty:i.frontQty+qty};
    }));
    logMove("issue",item,qty,location,note);
    setShowIssue(false);
  };

  const handleTransfer=(item,qty,direction,note)=>{
    setItems(prev=>prev.map(i=>{
      if(i.id!==item.id) return i;
      if(direction==="ktof") return{...i,kitchenQty:Math.max(0,i.kitchenQty-qty),frontQty:i.frontQty+qty};
      return{...i,frontQty:Math.max(0,i.frontQty-qty),kitchenQty:i.kitchenQty+qty};
    }));
    logMove("transfer",item,qty,direction,note);
    setShowTransfer(false);
  };

  const filtered=useMemo(()=>{
    let r=items;
    if(deptFilter!=="All") r=r.filter(i=>i.dept===deptFilter||i.dept==="Both");
    if(catFilter!=="All") r=r.filter(i=>i.category===catFilter);
    if(search){const q=search.toLowerCase();r=r.filter(i=>i.name.toLowerCase().includes(q)||i.shortCode.toLowerCase().includes(q)||(i.usage&&i.usage.toLowerCase().includes(q))||(i.category&&i.category.toLowerCase().includes(q)));}
    return r.sort((a,b)=>a.shortCode.localeCompare(b.shortCode));
  },[items,search,deptFilter,catFilter]);

  const categories=["All",...new Set(items.map(i=>i.category).filter(Boolean))];
  const lowItems=items.filter(i=>(i.kitchenQty+i.frontQty)<i.minQty&&i.minQty>0);

  const TABS=[
    {key:"inventory",label:"Inventory",icon:"📋"},
    {key:"breakage",label:"Breakage",icon:"🔴"},
    {key:"issue",label:"Issue",icon:"📥"},
    {key:"transfer",label:"Transfer",icon:"🔄"},
    {key:"count",label:"Count",icon:"🔢"},
    {key:"history",label:"History",icon:"📖"},
    {key:"reports",label:"Reports",icon:"📊"},
    {key:"audit",label:"Audit",icon:"🔍"},
  ].filter(t=>{
    if(currentUser.role==="staff") return ["breakage","issue"].includes(t.key);
    if(currentUser.role==="counter") return ["breakage","issue","count","history"].includes(t.key);
    if(currentUser.role==="supervisor") return ["inventory","breakage","issue","transfer","count","history","reports","audit"].includes(t.key);
    return true;// admin
  });

  if(!ready) return(<div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",color:T.muted,fontFamily:SE}}>Loading…</div>);

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:SE}}>
      {/* Header */}
      <div style={{background:T.navBg,borderBottom:`1px solid ${T.navBorder}`,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px"}}>
          <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:4,background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 10px",cursor:"pointer",color:T.muted,fontFamily:MO,fontSize:11,fontWeight:700,flexShrink:0}}
            onMouseEnter={e=>{e.currentTarget.style.background=T.accentDim;e.currentTarget.style.color=T.accent;}}
            onMouseLeave={e=>{e.currentTarget.style.background=T.card;e.currentTarget.style.color=T.muted;}}>
            <span style={{fontSize:14,fontWeight:800}}>‹</span>{!isMobile&&" Modules"}
          </button>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:T.accent,fontFamily:SE}}>🥤 Glassware & Utensils</div>
            {lowItems.length>0&&<div style={{fontSize:10,color:T.low,fontFamily:MO,fontWeight:700}}>⚠ {lowItems.length} low stock</div>}
          </div>
          <ThemeToggle T={T} isDark={isDark} onToggle={onToggle}/>
          <UserMenu T={T} user={currentUser} onLogout={onLogout||onBack} isMobile={isMobile}/>
        </div>
        {/* Tabs */}
        <div style={{display:"flex",overflowX:"auto",scrollbarWidth:"none",borderTop:`1px solid ${T.navBorder}`}}>
          {TABS.map(t=>{
            const active=tab===t.key;
            return(<button key={t.key} onClick={()=>setTab(t.key)} style={{flexShrink:0,padding:"8px 14px",border:"none",borderBottom:active?`2px solid ${T.accent}`:"2px solid transparent",background:active?T.accentDim:"transparent",color:active?T.accent:T.muted,fontWeight:700,cursor:"pointer",fontSize:11,fontFamily:MO,whiteSpace:"nowrap",transition:"all 0.15s"}}>{t.icon} {t.label}</button>);
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{padding:isMobile?"12px":"20px",maxWidth:1100,margin:"0 auto"}}>

        {/* INVENTORY TAB */}
        {tab==="inventory"&&(
          <div>
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
              <div style={{flex:1}}><div style={{fontSize:20,fontWeight:600,fontFamily:SE,color:T.text}}>Inventory</div><div style={{fontSize:11,color:T.muted,fontFamily:MO}}>{items.length} items · {lowItems.length} low</div></div>
              <Inp T={T} value={search} onChange={setSearch} placeholder="Search name, code, drink…" s={{width:isMobile?"100%":180}}/>
              <Sel T={T} value={deptFilter} onChange={setDeptFilter} s={{minWidth:90}}><option>All</option><option value="FOH">FOH</option><option value="BOH">BOH</option></Sel>
              <Sel T={T} value={catFilter} onChange={setCatFilter} s={{minWidth:100}}>{categories.map(c=><option key={c}>{c}</option>)}</Sel>
              {canEdit&&<Btn T={T} v="primary" onClick={()=>setShowAdd(true)} s={{flexShrink:0}}>+ Add Item</Btn>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
              {filtered.map(item=>{
                const total=item.kitchenQty+item.frontQty;
                const isLow=item.minQty>0&&total<item.minQty;
                return(
                  <Card T={T} key={item.id} s={{padding:0,overflow:"hidden",border:`1px solid ${isLow?T.low:T.border}`}}>
                    {item.photoUrl&&<img src={item.photoUrl.replace("open?id=","uc?id=").replace("/view","")} alt={item.name} style={{width:"100%",height:120,objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>}
                    <div style={{padding:"12px 14px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                        <div>
                          <div style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:SE}}>{item.name}</div>
                          <div style={{fontSize:10,color:T.accent,fontFamily:MO,fontWeight:700}}>{item.shortCode}</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:22,fontWeight:800,color:isLow?T.low:T.ok,fontFamily:MO}}>{total}</div>
                          <div style={{fontSize:9,color:T.muted,fontFamily:MO}}>TOTAL</div>
                        </div>
                      </div>
                      {item.usage&&<div style={{fontSize:11,color:T.muted,fontFamily:MO,marginBottom:8}}>Used for: {item.usage}</div>}
                      <div style={{display:"flex",gap:6,marginBottom:10}}>
                        <div style={{flex:1,background:T.card2,borderRadius:6,padding:"6px 8px",textAlign:"center"}}>
                          <div style={{fontSize:9,color:T.muted,fontFamily:MO}}>KITCHEN</div>
                          <div style={{fontSize:16,fontWeight:700,color:T.text,fontFamily:MO}}>{item.kitchenQty}</div>
                        </div>
                        <div style={{flex:1,background:T.card2,borderRadius:6,padding:"6px 8px",textAlign:"center"}}>
                          <div style={{fontSize:9,color:T.muted,fontFamily:MO}}>FRONT</div>
                          <div style={{fontSize:16,fontWeight:700,color:T.text,fontFamily:MO}}>{item.frontQty}</div>
                        </div>
                        {item.minQty>0&&<div style={{flex:1,background:isLow?T.lowBg:T.card2,borderRadius:6,padding:"6px 8px",textAlign:"center"}}>
                          <div style={{fontSize:9,color:T.muted,fontFamily:MO}}>MIN</div>
                          <div style={{fontSize:16,fontWeight:700,color:isLow?T.low:T.muted,fontFamily:MO}}>{item.minQty}</div>
                        </div>}
                      </div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        <Btn T={T} v="danger" onClick={()=>{setShowBreakage(item);}} s={{fontSize:11,padding:"5px 10px",flex:1}}>🔴 Breakage</Btn>
                        <Btn T={T} v="primary" onClick={()=>{setShowIssue(item);}} s={{fontSize:11,padding:"5px 10px",flex:1}}>📥 Issue</Btn>
                        {canEdit&&<Btn T={T} v="ghost" onClick={()=>setEditItem(item)} s={{fontSize:11,padding:"5px 10px"}}>Edit</Btn>}
                        <Btn T={T} v="ghost" onClick={()=>setShowQR(item)} s={{fontSize:11,padding:"5px 10px"}}>QR</Btn>
                      </div>
                    </div>
                  </Card>
                );
              })}
              {!filtered.length&&<div style={{color:T.muted,padding:40,textAlign:"center",fontFamily:SE,gridColumn:"1/-1"}}><div style={{fontSize:32,marginBottom:8}}>🥤</div>No items found</div>}
            </div>
          </div>
        )}

        {/* BREAKAGE TAB */}
        {tab==="breakage"&&(
          <div>
            <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{flex:1}}><div style={{fontSize:20,fontWeight:600,fontFamily:SE,color:T.text}}>Breakage</div><div style={{fontSize:11,color:T.muted,fontFamily:MO}}>Record broken or lost items</div></div>
              <Btn T={T} v="ghost" onClick={()=>setShowQRScanner(true)} s={{fontSize:12}}>📷 Scan QR</Btn>
              <Btn T={T} v="danger" onClick={()=>setShowBreakage(true)}>+ Record Breakage</Btn>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {movements.filter(m=>m.type==="breakage").slice(0,30).map((m,i)=>(
                <Card T={T} key={i} s={{padding:"12px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontSize:14,fontWeight:600,color:T.text,fontFamily:SE}}>{m.itemName}</div><div style={{fontSize:11,color:T.muted,fontFamily:MO}}>{m.personName} · {m.location} · {m.date}</div>{m.note&&<div style={{fontSize:11,color:T.muted,fontFamily:MO,marginTop:2}}>"{m.note}"</div>}</div>
                    <div style={{fontSize:20,fontWeight:800,color:T.low,fontFamily:MO}}>-{m.qty}</div>
                  </div>
                </Card>
              ))}
              {!movements.filter(m=>m.type==="breakage").length&&<div style={{color:T.muted,padding:40,textAlign:"center",fontFamily:SE}}>No breakage recorded yet</div>}
            </div>
          </div>
        )}

        {/* ISSUE TAB */}
        {tab==="issue"&&(
          <div>
            <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{flex:1}}><div style={{fontSize:20,fontWeight:600,fontFamily:SE,color:T.text}}>Issue</div><div style={{fontSize:11,color:T.muted,fontFamily:MO}}>Record newly issued items to Kitchen or Front</div></div>
              <Btn T={T} v="ghost" onClick={()=>setShowQRScanner(true)} s={{fontSize:12}}>📷 Scan QR</Btn>
              <Btn T={T} v="primary" onClick={()=>setShowIssue(true)}>+ Issue Items</Btn>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {movements.filter(m=>m.type==="issue").slice(0,30).map((m,i)=>(
                <Card T={T} key={i} s={{padding:"12px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontSize:14,fontWeight:600,color:T.text,fontFamily:SE}}>{m.itemName}</div><div style={{fontSize:11,color:T.muted,fontFamily:MO}}>{m.personName} · {m.location} · {m.date}</div>{m.note&&<div style={{fontSize:11,color:T.muted,fontFamily:MO,marginTop:2}}>"{m.note}"</div>}</div>
                    <div style={{fontSize:20,fontWeight:800,color:T.ok,fontFamily:MO}}>+{m.qty}</div>
                  </div>
                </Card>
              ))}
              {!movements.filter(m=>m.type==="issue").length&&<div style={{color:T.muted,padding:40,textAlign:"center",fontFamily:SE}}>No issues recorded yet</div>}
            </div>
          </div>
        )}

        {/* TRANSFER TAB */}
        {tab==="transfer"&&(
          <div>
            <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{flex:1}}><div style={{fontSize:20,fontWeight:600,fontFamily:SE,color:T.text}}>Transfer</div><div style={{fontSize:11,color:T.muted,fontFamily:MO}}>Move items between Kitchen and Front</div></div>
              <Btn T={T} v="ghost" onClick={()=>setShowQRScanner(true)} s={{fontSize:12}}>📷 Scan QR</Btn>
              <Btn T={T} v="primary" onClick={()=>setShowTransfer(true)}>+ Transfer</Btn>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {movements.filter(m=>m.type==="transfer").slice(0,30).map((m,i)=>(
                <Card T={T} key={i} s={{padding:"12px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontSize:14,fontWeight:600,color:T.text,fontFamily:SE}}>{m.itemName}</div><div style={{fontSize:11,color:T.muted,fontFamily:MO}}>{m.personName} · {m.location==="ktof"?"Kitchen → Front":"Front → Kitchen"} · {m.date}</div>{m.note&&<div style={{fontSize:11,color:T.muted,fontFamily:MO,marginTop:2}}>"{m.note}"</div>}</div>
                    <div style={{fontSize:20,fontWeight:800,color:T.accent,fontFamily:MO}}>⇄{m.qty}</div>
                  </div>
                </Card>
              ))}
              {!movements.filter(m=>m.type==="transfer").length&&<div style={{color:T.muted,padding:40,textAlign:"center",fontFamily:SE}}>No transfers recorded yet</div>}
            </div>
          </div>
        )}

        {/* COUNT TAB */}
        {tab==="count"&&(
          <GlassCountTab T={T} items={items} setItems={setItems} currentUser={currentUser} isMobile={isMobile}/>
        )}

        {/* HISTORY TAB */}
        {tab==="history"&&(
          <div>
            <div style={{fontSize:20,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:14}}>History ({movements.length})</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {movements.slice(0,50).map((m,i)=>(
                <Card T={T} key={i} s={{padding:"10px 14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <span style={{fontSize:11,fontWeight:700,fontFamily:MO,color:m.type==="breakage"?T.low:m.type==="issue"?T.ok:T.accent,background:m.type==="breakage"?T.lowBg:m.type==="issue"?T.okBg:T.accentDim,padding:"2px 7px",borderRadius:4,marginRight:8}}>{m.type.toUpperCase()}</span>
                      <span style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:SE}}>{m.itemName}</span>
                      <div style={{fontSize:11,color:T.muted,fontFamily:MO,marginTop:3}}>{m.personName} · {m.date}</div>
                    </div>
                    <div style={{fontSize:18,fontWeight:800,fontFamily:MO,color:m.type==="breakage"?T.low:m.type==="issue"?T.ok:T.accent}}>{m.type==="breakage"?"-":m.type==="issue"?"+":"⇄"}{m.qty}</div>
                  </div>
                </Card>
              ))}
              {!movements.length&&<div style={{color:T.muted,padding:40,textAlign:"center",fontFamily:SE}}>No history yet</div>}
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {tab==="reports"&&(
          <GlassReportsTab T={T} items={items} movements={movements} isMobile={isMobile}/>
        )}
        {/* AUDIT TAB */}
        {tab==="audit"&&(currentUser.role==="admin"||currentUser.role==="supervisor")&&(
          <AuditLogTab T={T} auditLog={auditLog.filter(e=>e.module==="glass")} isMobile={isMobile}/>
        )}
      </div>

      {/* Modals */}
      {showBreakage&&<GlassBreakageModal T={T} items={typeof showBreakage==="object"?[showBreakage,...items.filter(i=>i.id!==showBreakage.id)]:items} onClose={()=>setShowBreakage(false)} onSave={handleBreakage} currentUser={currentUser}/>}
      {showIssue&&<GlassIssueModal T={T} items={typeof showIssue==="object"?[showIssue,...items.filter(i=>i.id!==showIssue.id)]:items} onClose={()=>setShowIssue(false)} onSave={handleIssue}/>}
      {showTransfer&&<GlassTransferModal T={T} items={items} onClose={()=>setShowTransfer(false)} onSave={handleTransfer}/>}
      {(showAdd||editItem)&&canEdit&&<GlassItemModal T={T} item={editItem} canDelete={canDelete} onClose={()=>{setShowAdd(false);setEditItem(null);}} onSave={form=>{if(form._delete){recordAudit(setAuditLog,"delete","glass",form.name,currentUser,form,null);setItems(prev=>prev.filter(i=>i.id!==form.id));}else if(form.id){const prev2=items.find(i=>i.id===form.id);recordAudit(setAuditLog,"update","glass",form.name,currentUser,prev2,form);setItems(prev=>prev.map(i=>i.id===form.id?form:i));}else{recordAudit(setAuditLog,"create","glass",form.name,currentUser,null,form);setItems(prev=>[...prev,{...form,id:uid()}]);}setShowAdd(false);setEditItem(null);}}/> }
      {showQR&&<QRLabel T={T} item={showQR} onClose={()=>setShowQR(null)}/>}
      {showQRScanner&&<QRScanner T={T} items={items} onClose={()=>setShowQRScanner(false)} onFound={(item,code)=>{setShowQRScanner(false);if(item){if(tab==="issue") setShowIssue(item);else if(tab==="transfer") setShowTransfer(item);else setShowBreakage(item);}else console.warn("QR code not in inventory:",code);}}/>}
    </div>
  );
}

function GlassCountTab({T,items,setItems,currentUser,isMobile}){
  const [counts,setCounts]=useState({kitchen:{},front:{}});
  const [submitted,setSubmitted]=useState(false);
  const [search,setSearch]=useState("");
  const filtered=useMemo(()=>{
    if(!search) return items;
    const q=search.toLowerCase();
    return items.filter(i=>i.name.toLowerCase().includes(q)||i.shortCode.toLowerCase().includes(q));
  },[items,search]);
  const totalCounted=Object.keys(counts.kitchen).filter(k=>counts.kitchen[k]!=="").length+Object.keys(counts.front).filter(k=>counts.front[k]!=="").length;
  const submit=()=>{
    setItems(prev=>prev.map(i=>{
      const k=counts.kitchen[i.id];const f=counts.front[i.id];
      return{...i,kitchenQty:k!=null&&k!==""?Number(k):i.kitchenQty,frontQty:f!=null&&f!==""?Number(f):i.frontQty};
    }));
    setCounts({kitchen:{},front:{}});setSubmitted(true);setTimeout(()=>setSubmitted(false),3000);
  };
  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{flex:1}}><div style={{fontSize:20,fontWeight:600,fontFamily:SE,color:T.text}}>Count</div><div style={{fontSize:11,color:T.muted,fontFamily:MO}}>as {currentUser.name} · {totalCounted} entered</div></div>
        <Inp T={T} value={search} onChange={setSearch} placeholder="Search…" s={{width:160}}/>
      </div>
      {submitted&&<div style={{background:T.okBg,border:`1px solid ${T.ok}44`,borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:T.ok,fontFamily:MO}}>✓ Count submitted</div>}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtered.map(item=>(
          <Card T={T} key={item.id} s={{padding:"12px 14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div><div style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:SE}}>{item.name}</div><div style={{fontSize:10,color:T.accent,fontFamily:MO}}>{item.shortCode}</div></div>
              <div style={{fontSize:11,color:T.muted,fontFamily:MO}}>Total: <strong>{item.kitchenQty+item.frontQty}</strong></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div>
                <div style={{fontSize:9,color:T.muted,fontFamily:MO,marginBottom:4}}>KITCHEN (was {item.kitchenQty})</div>
                <input type="number" value={counts.kitchen[item.id]||""} onChange={e=>setCounts(p=>({...p,kitchen:{...p.kitchen,[item.id]:e.target.value}}))} placeholder="Enter count" style={{background:T.bg,border:`1px solid ${counts.kitchen[item.id]!=null&&counts.kitchen[item.id]!==""?T.accent:T.border}`,borderRadius:8,color:T.text,fontSize:16,padding:"8px 12px",width:"100%",outline:"none",fontFamily:MO,fontWeight:700,boxSizing:"border-box"}}/>
              </div>
              <div>
                <div style={{fontSize:9,color:T.muted,fontFamily:MO,marginBottom:4}}>FRONT (was {item.frontQty})</div>
                <input type="number" value={counts.front[item.id]||""} onChange={e=>setCounts(p=>({...p,front:{...p.front,[item.id]:e.target.value}}))} placeholder="Enter count" style={{background:T.bg,border:`1px solid ${counts.front[item.id]!=null&&counts.front[item.id]!==""?T.accent:T.border}`,borderRadius:8,color:T.text,fontSize:16,padding:"8px 12px",width:"100%",outline:"none",fontFamily:MO,fontWeight:700,boxSizing:"border-box"}}/>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Btn T={T} v="primary" onClick={submit} disabled={totalCounted===0} s={{width:"100%",padding:"14px",fontSize:15,marginTop:12}}>✓ Submit Count ({totalCounted} entries)</Btn>
    </div>
  );
}

function GlassReportsTab({T,items,movements,isMobile}){
  const {filtered:filteredMov,startDate,endDate,setStartDate,setEndDate,clear}=useDateFilter(movements);
  const totalItems=items.length;
  const lowItems=items.filter(i=>i.minQty>0&&(i.kitchenQty+i.frontQty)<i.minQty).length;
  const totalBreakage=movements.filter(m=>m.type==="breakage").reduce((s,m)=>s+(m.qty||0),0);
  const totalIssued=movements.filter(m=>m.type==="issue").reduce((s,m)=>s+(m.qty||0),0);
  const breakageByItem={};
  filteredMov.filter(m=>m.type==="breakage").forEach(m=>{breakageByItem[m.itemName]=(breakageByItem[m.itemName]||0)+m.qty;});
  const topBreakage=Object.entries(breakageByItem).sort((a,b)=>b[1]-a[1]).slice(0,5);
  return(
    <div>
      <div style={{fontSize:20,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:12}}>Reports</div>
      <div style={{background:T.card2,borderRadius:8,padding:"10px 14px",marginBottom:14,border:`1px solid ${T.border}`}}>
        <div style={{fontSize:10,fontWeight:700,color:T.muted,fontFamily:MO,marginBottom:8,letterSpacing:"0.08em"}}>FILTER BY DATE</div>
        <DateRangePicker T={T} startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} onClear={clear}/>
        {(startDate||endDate)&&<div style={{fontSize:11,color:T.accent,fontFamily:MO,marginTop:6}}>Filtered: {filteredMov.length} of {movements.length} movements</div>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:16}}>
        {[["Total Items",totalItems,T.accent],["Low Stock",lowItems,T.low],["Total Broken",totalBreakage,T.warn],["Total Issued",totalIssued,T.ok]].map(([label,val,color])=>(
          <Card T={T} key={label} s={{padding:"16px",textAlign:"center"}}>
            <div style={{fontSize:26,fontWeight:800,color,fontFamily:MO}}>{val}</div>
            <div style={{fontSize:10,color:T.muted,fontFamily:MO,marginTop:4,textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</div>
          </Card>
        ))}
      </div>
      {topBreakage.length>0&&(
        <Card T={T} s={{padding:16,marginBottom:12}}>
          <div style={{fontSize:14,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:12}}>Top Breakage Items</div>
          {topBreakage.map(([name,qty],i)=>(
            <div key={name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<topBreakage.length-1?`1px solid ${T.border}`:"none"}}>
              <div style={{fontSize:13,color:T.text,fontFamily:SE}}>{name}</div>
              <div style={{fontSize:15,fontWeight:800,color:T.low,fontFamily:MO}}>{qty} broken</div>
            </div>
          ))}
        </Card>
      )}
      <Card T={T} s={{padding:16}}>
        <div style={{fontSize:14,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:12}}>Stock Levels</div>
        {items.sort((a,b)=>(a.kitchenQty+a.frontQty)-(b.kitchenQty+b.frontQty)).slice(0,10).map((item,i)=>{
          const total=item.kitchenQty+item.frontQty;
          const isLow=item.minQty>0&&total<item.minQty;
          return(
            <div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<9?`1px solid ${T.border}`:"none"}}>
              <div><div style={{fontSize:13,color:T.text,fontFamily:SE}}>{item.name}</div><div style={{fontSize:10,color:T.muted,fontFamily:MO}}>K:{item.kitchenQty} F:{item.frontQty}</div></div>
              <div style={{fontSize:16,fontWeight:800,color:isLow?T.low:T.ok,fontFamily:MO}}>{total}</div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ── WASTAGE MODULE ───────────────────────────────────────────────────────────
function WastageModule({T,isDark,onToggle,currentUser,onBack,onLogout,fbItems,glassItems,setFbItems,setGlassItems}){
  const isMobile=useIsMobile();
  const [wastageLog,setWastageLog]=useState([]);
  const [ready,setReady]=useState(false);
  const [tab,setTab]=useState("record");
  const [showForm,setShowForm]=useState(false);

  const canViewHistory=["admin","supervisor","counter"].includes(currentUser.role);
  const canViewReports=["admin","supervisor"].includes(currentUser.role);

  useEffect(()=>{
    let mounted=true;
    fbLoad("wastageLog",[]).then(w=>{
      if(mounted){setWastageLog(w);setReady(true);}
    });
    return()=>{mounted=false;};
  },[]);
  useEffect(()=>{
    if(!ready) return;
    fbSave("wastageLog",wastageLog);
    const t=setTimeout(()=>{
      fetch("/api/sync-wastage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({wastageLog})}).catch(()=>{});
    },1000);
    return()=>clearTimeout(t);
  },[wastageLog,ready]);

  const TABS=[
    {key:"record",label:"Record",icon:"📝"},
    ...(canViewHistory?[{key:"history",label:"History",icon:"📖"}]:[]),
    ...(canViewReports?[{key:"reports",label:"Reports",icon:"📊"}]:[]),
  ];

  const handleRecord=(entry)=>{
    // Deduct from appropriate inventory
    if(entry.sourceType==="fb"){
      setFbItems(prev=>prev.map(i=>i.id===entry.itemId?{...i,stock:Math.max(0,i.stock-entry.qty)}:i));
    } else if(entry.sourceType==="glass"){
      setGlassItems(prev=>prev.map(i=>{
        if(i.id!==entry.itemId) return i;
        return entry.location==="kitchen"?{...i,kitchenQty:Math.max(0,i.kitchenQty-entry.qty)}:{...i,frontQty:Math.max(0,i.frontQty-entry.qty)};
      }));
    }
    setWastageLog(prev=>[entry,...prev].slice(0,500));
    setShowForm(false);
  };

  if(!ready) return(<div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",color:T.muted,fontFamily:SE}}>Loading…</div>);

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:SE}}>
      {/* Header */}
      <div style={{background:T.navBg,borderBottom:`1px solid ${T.navBorder}`,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px"}}>
          <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:4,background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 10px",cursor:"pointer",color:T.muted,fontFamily:MO,fontSize:11,fontWeight:700,flexShrink:0}}
            onMouseEnter={e=>{e.currentTarget.style.background=T.accentDim;e.currentTarget.style.color=T.accent;}}
            onMouseLeave={e=>{e.currentTarget.style.background=T.card;e.currentTarget.style.color=T.muted;}}>
            <span style={{fontSize:14,fontWeight:800}}>‹</span>{!isMobile&&" Modules"}
          </button>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:T.accent,fontFamily:SE}}>🗑️ Wastage</div>
            <div style={{fontSize:10,color:T.muted,fontFamily:MO}}>{wastageLog.length} records</div>
          </div>
          <ThemeToggle T={T} isDark={isDark} onToggle={onToggle}/>
          <UserMenu T={T} user={currentUser} onLogout={onLogout||onBack} isMobile={isMobile}/>
        </div>
        <div style={{display:"flex",overflowX:"auto",scrollbarWidth:"none",borderTop:`1px solid ${T.navBorder}`}}>
          {TABS.map(t=>{
            const active=tab===t.key;
            return(<button key={t.key} onClick={()=>setTab(t.key)} style={{flexShrink:0,padding:"8px 14px",border:"none",borderBottom:active?`2px solid ${T.accent}`:"2px solid transparent",background:active?T.accentDim:"transparent",color:active?T.accent:T.muted,fontWeight:700,cursor:"pointer",fontSize:11,fontFamily:MO,whiteSpace:"nowrap"}}>{t.icon} {t.label}</button>);
          })}
        </div>
      </div>

      <div style={{padding:isMobile?"12px":"20px",maxWidth:900,margin:"0 auto"}}>

        {/* RECORD TAB */}
        {tab==="record"&&(
          <div>
            <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:20,fontWeight:600,fontFamily:SE,color:T.text}}>Record Wastage</div>
                <div style={{fontSize:11,color:T.muted,fontFamily:MO}}>Food spoilage or glassware breakage</div>
              </div>
              <Btn T={T} v="danger" onClick={()=>setShowForm(true)} s={{flexShrink:0}}>+ Record</Btn>
            </div>
            {/* Recent records */}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {wastageLog.slice(0,10).map((w,i)=>(
                <WastageCard T={T} key={i} entry={w}/>
              ))}
              {!wastageLog.length&&(
                <div style={{textAlign:"center",padding:48,color:T.muted,fontFamily:SE}}>
                  <div style={{fontSize:36,marginBottom:12}}>🗑️</div>
                  <div style={{fontSize:15,fontStyle:"italic"}}>No wastage recorded yet</div>
                  <div style={{fontSize:12,marginTop:6}}>Tap "+ Record" to log wastage</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {tab==="history"&&canViewHistory&&(
          <WastageHistory T={T} wastageLog={wastageLog} isMobile={isMobile}/>
        )}

        {/* REPORTS TAB */}
        {tab==="reports"&&canViewReports&&(
          <WastageReports T={T} wastageLog={wastageLog} isMobile={isMobile}/>
        )}
      </div>

      {showForm&&(
        <WastageForm T={T} currentUser={currentUser} fbItems={fbItems} glassItems={glassItems}
          onClose={()=>setShowForm(false)} onSave={handleRecord} isMobile={isMobile}/>
      )}
    </div>
  );
}

function WastageCard({T,entry}){
  const [showImg,setShowImg]=useState(false);
  return(
    <Card T={T} s={{padding:"14px 16px"}}>
      <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
        {entry.photoUrl&&(
          <img src={entry.photoUrl} alt="wastage" onClick={()=>setShowImg(true)}
            style={{width:56,height:56,objectFit:"cover",borderRadius:8,cursor:"pointer",flexShrink:0,border:`1px solid ${T.border}`}}/>
        )}
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
            <div>
              <span style={{fontSize:11,fontWeight:700,fontFamily:MO,padding:"2px 8px",borderRadius:4,marginRight:6,
                background:entry.sourceType==="fb"?"#fff3cd":"#ffd6d6",
                color:entry.sourceType==="fb"?"#856404":"#c0392b"}}>
                {entry.sourceType==="fb"?"F&B":"GLASS"}
              </span>
              <span style={{fontSize:11,fontWeight:700,fontFamily:MO,padding:"2px 8px",borderRadius:4,
                background:T.lowBg,color:T.low}}>
                {entry.wastageType}
              </span>
            </div>
            <div style={{fontSize:13,fontWeight:800,color:T.low,fontFamily:MO,flexShrink:0}}>-{entry.qty} {entry.unit||""}</div>
          </div>
          <div style={{fontSize:14,fontWeight:600,color:T.text,fontFamily:SE,marginBottom:2}}>{entry.itemName}</div>
          <div style={{fontSize:11,color:T.muted,fontFamily:MO,marginBottom:4}}>{entry.staffName} · {entry.date}</div>
          {entry.explanation&&<div style={{fontSize:12,color:T.text,fontFamily:SE,fontStyle:"italic",marginBottom:4}}>"{entry.explanation}"</div>}
          {entry.loss>0&&<div style={{fontSize:12,fontWeight:700,color:T.warn,fontFamily:MO}}>Est. loss: Rs {entry.loss.toLocaleString()}</div>}
        </div>
      </div>
      {showImg&&(
        <div style={{position:"fixed",inset:0,background:"#000c",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowImg(false)}>
          <img src={entry.photoUrl} alt="wastage" style={{maxWidth:"90vw",maxHeight:"90vh",borderRadius:12}}/>
        </div>
      )}
    </Card>
  );
}

function WastageForm({T,currentUser,fbItems,glassItems,onClose,onSave,isMobile}){
  const [sourceType,setSourceType]=useState("fb");
  const [entryMode,setEntryMode]=useState("inventory");// "inventory" or "free"
  const [freeItemName,setFreeItemName]=useState("");
  const [freeUnit,setFreeUnit]=useState("Nos");
  const [freeLoss,setFreeLoss]=useState(0);
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState(null);
  const [qty,setQty]=useState(1);
  const [location,setLocation]=useState("kitchen");
  const [wastageType,setWastageType]=useState("Expired");
  const [explanation,setExplanation]=useState("");
  const [photoUrl,setPhotoUrl]=useState("");
  const [capturing,setCapturing]=useState(false);
  const videoRef=useRef(null);
  const streamRef=useRef(null);

  const items=sourceType==="fb"?fbItems:glassItems;
  const filtered=useMemo(()=>{
    if(!search) return [];
    const q=search.toLowerCase();
    return items.filter(i=>i.name.toLowerCase().includes(q)||i.code?.toLowerCase().includes(q)||i.shortCode?.toLowerCase().includes(q)).slice(0,6);
  },[items,search,sourceType]);

  const loss=selected?(qty*(Number(selected.perUnit)||0)):0;

  const startCamera=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
      streamRef.current=stream;
      if(videoRef.current){videoRef.current.srcObject=stream;videoRef.current.play();}
      setCapturing(true);
    }catch(e){setCamError("Camera access denied: "+e.message);}
  };

  const capturePhoto=()=>{
    if(!videoRef.current) return;
    const canvas=document.createElement("canvas");
    canvas.width=videoRef.current.videoWidth;
    canvas.height=videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current,0,0);
    setPhotoUrl(canvas.toDataURL("image/jpeg",0.7));
    streamRef.current?.getTracks().forEach(t=>t.stop());
    setCapturing(false);
  };

  const uploadPhoto=(e)=>{
    const file=e.target.files[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>setPhotoUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  const submit=()=>{
    if(entryMode==="free"){
      if(!freeItemName||!explanation) return;
      onSave({id:uid(),date:nowStr(),sourceType:"free",itemId:null,itemName:freeItemName,unit:freeUnit,qty,location:null,wastageType,explanation,photoUrl,staffName:currentUser.name,userRole:currentUser.role,loss:freeLoss,perUnit:0});
    } else {
      onSave({id:uid(),date:nowStr(),sourceType,itemId:selected.id,itemName:selected.name,unit:selected.unit||"",qty,location:sourceType==="glass"?location:null,wastageType,explanation,photoUrl,staffName:currentUser.name,userRole:currentUser.role,loss,perUnit:selected.perUnit||0});
    }
  };

  const FB_TYPES=["Expired","Spoiled","Overcooked","Burnt","Damaged","Prep Waste","Leftover","Other"];
  const GLASS_TYPES=["Broken","Chipped","Lost","Cracked","Other"];
  const types=sourceType==="fb"?FB_TYPES:GLASS_TYPES;

  return(
    <div style={{position:"fixed",inset:0,background:"#000a",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <Card T={T} s={{padding:24,width:500,maxWidth:"100%",maxHeight:"95vh",overflowY:"auto"}}>
        <h2 style={{margin:"0 0 16px",fontSize:18,fontFamily:SE,fontWeight:600,color:T.low}}>🗑️ Record Wastage</h2>

        {/* Entry mode toggle */}
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          {[["inventory","📦 From Inventory"],["free","✏️ Free Entry"]].map(([val,label])=>(
            <button key={val} onClick={()=>{setEntryMode(val);setSelected(null);setSearch("");setFreeItemName("");}}
              style={{flex:1,padding:"8px",borderRadius:8,border:`2px solid ${entryMode===val?T.accent:T.border}`,background:entryMode===val?T.accentDim:T.card,color:entryMode===val?T.accent:T.muted,cursor:"pointer",fontFamily:MO,fontSize:12,fontWeight:700}}>
              {label}
            </button>
          ))}
        </div>

        {/* Source type toggle - only for inventory mode */}
        {entryMode==="inventory"&&<div style={{display:"flex",gap:8,marginBottom:16}}>
          {[["fb","🥛 F&B Food"],["glass","🥤 Glassware"]].map(([val,label])=>(
            <button key={val} onClick={()=>{setSourceType(val);setSelected(null);setSearch("");setWastageType(val==="fb"?"Expired":"Broken");}}
              style={{flex:1,padding:"10px",borderRadius:8,border:`2px solid ${sourceType===val?T.accent:T.border}`,background:sourceType===val?T.accentDim:T.card,color:sourceType===val?T.accent:T.muted,cursor:"pointer",fontFamily:MO,fontSize:12,fontWeight:700}}>
              {label}
            </button>
          ))}
        </div>}

        {entryMode==="free"&&<div style={{background:T.warnBg,border:`1px solid ${T.warn}44`,borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:12,color:T.warn,fontFamily:MO,lineHeight:1.5}}>⚠️ <strong>Free Entry Mode</strong> — Use this for food prepared in the kitchen that is not tracked in the inventory system (e.g. leftover rice, prep trimmings, burnt dishes). This will NOT deduct from any inventory.</div>}

        {/* Free entry fields */}
        {entryMode==="free"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div style={{gridColumn:"1/-1"}}><Label T={T}>Item / Food Name</Label><Inp T={T} value={freeItemName} onChange={setFreeItemName} placeholder="e.g. Leftover Arabiata, Burnt Toast…"/></div>
            <div><Label T={T}>Wastage Type</Label><Sel T={T} value={wastageType} onChange={setWastageType}><option>Expired</option><option>Spoiled</option><option>Overcooked</option><option>Leftover</option><option>Burnt</option><option>Damaged</option><option>Other</option></Sel></div>
            <div><Label T={T}>Quantity</Label><Inp T={T} type="number" value={qty} onChange={v=>setQty(Math.max(1,Number(v)))}/></div>
            <div><Label T={T}>Unit</Label><Inp T={T} value={freeUnit} onChange={setFreeUnit} placeholder="e.g. kg, portions, plates"/></div>
            <div><Label T={T}>Est. Loss (Rs)</Label><Inp T={T} type="number" value={freeLoss} onChange={v=>setFreeLoss(Number(v))} placeholder="0"/></div>
          </div>
        )}

        {/* Item search - only in inventory mode */}
        {entryMode==="inventory"&&<div style={{marginBottom:12}}>
          <Label T={T}>Search Item</Label>
          <Inp T={T} value={search} onChange={v=>{setSearch(v);setSelected(null);}} placeholder="Name or code…"/>
          {filtered.length>0&&!selected&&(
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,marginTop:4,overflow:"hidden"}}>
              {filtered.map(i=>(
                <div key={i.id} onClick={()=>{setSelected(i);setSearch(i.name);}}
                  style={{padding:"10px 14px",cursor:"pointer",borderBottom:`1px solid ${T.border}`}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.card2}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:SE}}>{i.name}</div>
                  <div style={{fontSize:10,color:T.muted,fontFamily:MO}}>
                    {sourceType==="fb"?`${i.code} · Stock: ${i.stock}`:`${i.shortCode} · K:${i.kitchenQty} F:${i.frontQty}`}
                    {i.perUnit?` · Rs ${i.perUnit}/unit`:""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>}

        {selected&&(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div>
                <Label T={T}>Wastage Type</Label>
                <Sel T={T} value={wastageType} onChange={setWastageType}>
                  {types.map(t=><option key={t}>{t}</option>)}
                </Sel>
              </div>
              <div>
                <Label T={T}>Quantity</Label>
                <Inp T={T} type="number" value={qty} onChange={v=>setQty(Math.max(1,Number(v)))}/>
              </div>
              {sourceType==="glass"&&(
                <div style={{gridColumn:"1/-1"}}>
                  <Label T={T}>Location</Label>
                  <Sel T={T} value={location} onChange={setLocation}>
                    <option value="kitchen">Kitchen (current: {selected.kitchenQty})</option>
                    <option value="front">Front (current: {selected.frontQty})</option>
                  </Sel>
                </div>
              )}
            </div>

            {/* Loss estimate */}
            {loss>0&&(
              <div style={{background:T.lowBg,border:`1px solid ${T.low}44`,borderRadius:8,padding:"10px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:12,color:T.muted,fontFamily:MO}}>Estimated loss</span>
                <span style={{fontSize:16,fontWeight:800,color:T.low,fontFamily:MO}}>Rs {loss.toLocaleString()}</span>
              </div>
            )}

            {/* Explanation */}
            <div style={{marginBottom:12}}>
              <Label T={T}>Explanation <span style={{color:T.low,fontSize:10,fontFamily:MO}}>* required</span></Label>
              <textarea value={explanation} onChange={e=>setExplanation(e.target.value)}
                placeholder="What happened? e.g. Milk left out overnight, glass dropped during service…"
                style={{width:"100%",minHeight:72,padding:"10px 12px",background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:13,fontFamily:SE,resize:"vertical",outline:"none",boxSizing:"border-box",lineHeight:1.5}}/>
            </div>

            {/* Photo */}
            <div style={{marginBottom:16}}>
              <Label T={T}>Photo Evidence</Label>
              {capturing?(
                <div style={{position:"relative",borderRadius:10,overflow:"hidden",marginBottom:8}}>
                  <video ref={videoRef} style={{width:"100%",maxHeight:200,objectFit:"cover",display:"block"}} muted playsInline/>
                  <button onClick={capturePhoto} style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",background:"#fff",border:"none",borderRadius:20,padding:"8px 20px",cursor:"pointer",fontFamily:MO,fontSize:13,fontWeight:700,color:"#c0392b"}}>📸 Capture</button>
                </div>
              ):photoUrl?(
                <div style={{position:"relative",marginBottom:8}}>
                  <img src={photoUrl} alt="wastage" style={{width:"100%",maxHeight:160,objectFit:"cover",borderRadius:8,border:`1px solid ${T.border}`}}/>
                  <button onClick={()=>setPhotoUrl("")} style={{position:"absolute",top:6,right:6,background:"#000a",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",color:"#fff",fontSize:11}}>✕ Remove</button>
                </div>
              ):(
                <div style={{display:"flex",gap:8}}>
                  <button onClick={startCamera} style={{flex:1,padding:"10px",border:`1px dashed ${T.border}`,borderRadius:8,background:T.card,color:T.muted,cursor:"pointer",fontFamily:MO,fontSize:12,fontWeight:700}}>📷 Take Photo</button>
                  <label style={{flex:1,padding:"10px",border:`1px dashed ${T.border}`,borderRadius:8,background:T.card,color:T.muted,cursor:"pointer",fontFamily:MO,fontSize:12,fontWeight:700,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                    🖼 Gallery<input type="file" accept="image/*" onChange={uploadPhoto} style={{display:"none"}}/>
                  </label>
                </div>
              )}
            </div>
          </>
        )}

        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <Btn T={T} onClick={onClose}>Cancel</Btn>
          <Btn T={T} v="danger" onClick={submit} disabled={(entryMode==="inventory"&&!selected)||qty<1||!explanation||(entryMode==="free"&&!freeItemName)}>Submit Wastage</Btn>
        </div>
      </Card>
    </div>
  );
}

function WastageHistory({T,wastageLog,isMobile}){
  const [filter,setFilter]=useState("all");
  const filtered=filter==="all"?wastageLog:wastageLog.filter(w=>w.sourceType===filter);
  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{flex:1}}><div style={{fontSize:20,fontWeight:600,fontFamily:SE,color:T.text}}>History</div><div style={{fontSize:11,color:T.muted,fontFamily:MO}}>{filtered.length} records</div></div>
        <div style={{display:"flex",gap:6}}>
          {[["all","All"],["fb","F&B"],["glass","Glass"]].map(([val,label])=>(
            <button key={val} onClick={()=>setFilter(val)} style={{padding:"5px 12px",borderRadius:6,border:`1px solid ${filter===val?T.accent:T.border}`,background:filter===val?T.accentDim:"transparent",color:filter===val?T.accent:T.muted,cursor:"pointer",fontFamily:MO,fontSize:11,fontWeight:700}}>{label}</button>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtered.map((w,i)=><WastageCard T={T} key={i} entry={w}/>)}
        {!filtered.length&&<div style={{color:T.muted,padding:40,textAlign:"center",fontFamily:SE}}>No records found</div>}
      </div>
    </div>
  );
}

function WastageReports({T,wastageLog,isMobile}){
  const {filtered:filteredLog,startDate,endDate,setStartDate,setEndDate,clear}=useDateFilter(wastageLog);
  const totalRecords=filteredLog.length;
  const totalLoss=filteredLog.reduce((s,w)=>s+(w.loss||0),0);
  const fbCount=filteredLog.filter(w=>w.sourceType==="fb").length;
  const glassCount=filteredLog.filter(w=>w.sourceType==="glass").length;

  const byType={};
  filteredLog.forEach(w=>{byType[w.wastageType]=(byType[w.wastageType]||0)+1;});

  const byPerson={};
  filteredLog.forEach(w=>{
    if(!byPerson[w.staffName]) byPerson[w.staffName]={count:0,loss:0};
    byPerson[w.staffName].count++;
    byPerson[w.staffName].loss+=(w.loss||0);
  });

  const byItem={};
  filteredLog.forEach(w=>{
    if(!byItem[w.itemName]) byItem[w.itemName]={count:0,loss:0,qty:0};
    byItem[w.itemName].count++;
    byItem[w.itemName].loss+=(w.loss||0);
    byItem[w.itemName].qty+=(w.qty||0);
  });

  return(
    <div>
      <div style={{fontSize:20,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:12}}>Reports</div>
      <div style={{background:T.card2,borderRadius:8,padding:"10px 14px",marginBottom:14,border:`1px solid ${T.border}`}}>
        <div style={{fontSize:10,fontWeight:700,color:T.muted,fontFamily:MO,marginBottom:8,letterSpacing:"0.08em"}}>FILTER BY DATE</div>
        <DateRangePicker T={T} startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} onClear={clear}/>
        {(startDate||endDate)&&<div style={{fontSize:11,color:T.accent,fontFamily:MO,marginTop:6}}>Filtered: {filteredLog.length} of {wastageLog.length} records</div>}
      </div>

      {/* Summary cards */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:16}}>
        {[["Total Records",totalRecords,T.accent],["F&B Wastage",fbCount,T.warn],["Glass Breakage",glassCount,T.low],["Total Loss",`Rs ${totalLoss.toLocaleString()}`,T.low]].map(([label,val,color])=>(
          <Card T={T} key={label} s={{padding:"16px",textAlign:"center"}}>
            <div style={{fontSize:val.toString().length>6?16:24,fontWeight:800,color,fontFamily:MO}}>{val}</div>
            <div style={{fontSize:10,color:T.muted,fontFamily:MO,marginTop:4,textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</div>
          </Card>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:12}}>
        {/* By type */}
        <Card T={T} s={{padding:16}}>
          <div style={{fontSize:14,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:12}}>By Wastage Type</div>
          {Object.entries(byType).sort((a,b)=>b[1]-a[1]).map(([type,count],i,arr)=>(
            <div key={type} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none"}}>
              <span style={{fontSize:13,color:T.text,fontFamily:SE}}>{type}</span>
              <span style={{fontSize:13,fontWeight:700,color:T.low,fontFamily:MO}}>{count}</span>
            </div>
          ))}
          {!Object.keys(byType).length&&<div style={{color:T.muted,fontFamily:MO,fontSize:12}}>No data yet</div>}
        </Card>

        {/* By person */}
        <Card T={T} s={{padding:16}}>
          <div style={{fontSize:14,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:12}}>By Staff Member</div>
          {Object.entries(byPerson).sort((a,b)=>b[1].count-a[1].count).map(([name,data],i,arr)=>(
            <div key={name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none"}}>
              <span style={{fontSize:13,color:T.text,fontFamily:SE}}>{name}</span>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:13,fontWeight:700,color:T.low,fontFamily:MO}}>{data.count} records</div>
                {data.loss>0&&<div style={{fontSize:11,color:T.warn,fontFamily:MO}}>Rs {data.loss.toLocaleString()}</div>}
              </div>
            </div>
          ))}
          {!Object.keys(byPerson).length&&<div style={{color:T.muted,fontFamily:MO,fontSize:12}}>No data yet</div>}
        </Card>
      </div>

      {/* By item */}
      <Card T={T} s={{padding:16}}>
        <div style={{fontSize:14,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:12}}>Most Wasted Items</div>
        {Object.entries(byItem).sort((a,b)=>b[1].qty-a[1].qty).slice(0,10).map(([name,data],i,arr)=>(
          <div key={name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none"}}>
            <div>
              <div style={{fontSize:13,color:T.text,fontFamily:SE}}>{name}</div>
              <div style={{fontSize:10,color:T.muted,fontFamily:MO}}>{data.count} records · {data.qty} units</div>
            </div>
            {data.loss>0&&<div style={{fontSize:13,fontWeight:700,color:T.low,fontFamily:MO}}>Rs {data.loss.toLocaleString()}</div>}
          </div>
        ))}
        {!Object.keys(byItem).length&&<div style={{color:T.muted,fontFamily:MO,fontSize:12}}>No data yet</div>}
      </Card>
    </div>
  );
}

// ── USER MENU (avatar + dropdown) ────────────────────────────────────────────
function UserMenu({T,user,onLogout,isMobile}){
  const [open,setOpen]=useState(false);
  const ref=useRef(null);
  const initials=user.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
  const roleColor=ROLES[user.role]?.color||T.accent;

  useEffect(()=>{
    const handler=e=>{if(ref.current&&!ref.current.contains(e.target)) setOpen(false);};
    document.addEventListener("mousedown",handler);
    document.addEventListener("touchstart",handler);
    return()=>{document.removeEventListener("mousedown",handler);document.removeEventListener("touchstart",handler);};
  },[]);

  return(
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={()=>setOpen(p=>!p)} style={{display:"flex",alignItems:"center",gap:7,background:T.card,border:`1px solid ${open?T.accent:T.border}`,borderRadius:20,padding:"4px 10px 4px 4px",cursor:"pointer",transition:"all 0.15s"}}>
        {/* Avatar circle */}
        <div style={{width:28,height:28,borderRadius:"50%",background:roleColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",fontFamily:MO,flexShrink:0}}>{initials}</div>
        {/* Name — hidden on very small screens */}
        <span style={{fontSize:12,color:T.text,fontWeight:600,fontFamily:SE,maxWidth:isMobile?70:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</span>
        <span style={{fontSize:9,color:T.muted,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▼</span>
      </button>

      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,background:T.card,border:`1px solid ${T.border}`,borderRadius:12,boxShadow:`0 8px 24px ${T.border}88`,zIndex:999,minWidth:180,overflow:"hidden",animation:"fadeUp 0.15s ease"}}>
          {/* User info */}
          <div style={{padding:"14px 16px",borderBottom:`1px solid ${T.border}`,background:T.card2}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:roleColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#fff",fontFamily:MO}}>{initials}</div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:SE}}>{user.name}</div>
                <div style={{marginTop:2}}><RoleBadge T={T} role={user.role}/></div>
              </div>
            </div>
          </div>
          {/* Logout */}
          <button onClick={()=>{setOpen(false);onLogout();}} style={{width:"100%",padding:"12px 16px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:8,color:T.low,fontFamily:MO,fontSize:12,fontWeight:700,textAlign:"left"}}
            onMouseEnter={e=>e.currentTarget.style.background=T.lowBg}
            onMouseLeave={e=>e.currentTarget.style.background="none"}>
            <span style={{fontSize:16}}>⏻</span> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

// ── GRN MODULE ───────────────────────────────────────────────────────────────
const SUPPLIERS = ["Sivasakthy","Udula Distributors","Lanka Milk Foods","CBL Food Solutions","Damn Fine","Edinborough","Kist","Ambewela","Nestle","Bulk","Other"];
const PAID_BY = ["Petty Cash","Float","Not Paid from Cafe"];

function GRNModule({T,isDark,onToggle,currentUser,onBack,onLogout,fbItems,setFbItems,glassItems,setGlassItems}){
  const isMobile=useIsMobile();
  const [grnLog,setGrnLog]=useState([]);
  const [ready,setReady]=useState(false);
  const [tab,setTab]=useState("new");
  const [viewGRN,setViewGRN]=useState(null);

  const canViewHistory=["admin","supervisor","counter"].includes(currentUser.role);
  const canViewReports=["admin","supervisor"].includes(currentUser.role);

  useEffect(()=>{
    let mounted=true;
    fbLoad("grnLog",[]).then(g=>{
      if(mounted){setGrnLog(g);setReady(true);}
    });
    return()=>{mounted=false;};
  },[]);
  useEffect(()=>{
    if(!ready) return;
    fbSave("grnLog",grnLog);
    const t=setTimeout(()=>{
      fetch("/api/sync-grn",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({grnLog})}).catch(()=>{});
    },1000);
    return()=>clearTimeout(t);
  },[grnLog,ready]);

  const TABS=[
    {key:"new",label:"New GRN",icon:"📋"},
    ...(canViewHistory?[{key:"history",label:"History",icon:"📖"}]:[]),
    ...(canViewReports?[{key:"reports",label:"Reports",icon:"📊"}]:[]),
  ];

  const handleSave=(grns)=>{
    // grns is an array of GRN records (one per item)
    // Update stock in respective inventories and record movements
    grns.forEach(grn=>{
      if(grn.inventoryType==="fb"&&grn.itemId){
        setFbItems(prev=>prev.map(i=>{
          if(i.id!==grn.itemId) return i;
          const updated={...i,stock:i.stock+Number(grn.qty||0)};
          if(grn.priceChanged&&grn.newPrice) updated.perUnit=grn.newPrice;
          return updated;
        }));
      } else if(grn.inventoryType==="glass"&&grn.itemId){
        setGlassItems(prev=>prev.map(i=>{
          if(i.id!==grn.itemId) return i;
          return{...i,kitchenQty:i.kitchenQty+Number(grn.qty||0)};
        }));
      }
    });
    setGrnLog(prev=>[...grns,...prev].slice(0,1000));
  };

  if(!ready) return(<div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",color:T.muted,fontFamily:SE}}>Loading…</div>);

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:SE}}>
      <div style={{background:T.navBg,borderBottom:`1px solid ${T.navBorder}`,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px"}}>
          <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:4,background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 10px",cursor:"pointer",color:T.muted,fontFamily:MO,fontSize:11,fontWeight:700,flexShrink:0}}
            onMouseEnter={e=>{e.currentTarget.style.background=T.accentDim;e.currentTarget.style.color=T.accent;}}
            onMouseLeave={e=>{e.currentTarget.style.background=T.card;e.currentTarget.style.color=T.muted;}}>
            <span style={{fontSize:14,fontWeight:800}}>‹</span>{!isMobile&&" Modules"}
          </button>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:T.accent,fontFamily:SE}}>📋 GRN</div>
            <div style={{fontSize:10,color:T.muted,fontFamily:MO}}>{grnLog.length} records</div>
          </div>
          <ThemeToggle T={T} isDark={isDark} onToggle={onToggle}/>
          <UserMenu T={T} user={currentUser} onLogout={onLogout||onBack} isMobile={isMobile}/>
        </div>
        <div style={{display:"flex",overflowX:"auto",scrollbarWidth:"none",borderTop:`1px solid ${T.navBorder}`}}>
          {TABS.map(t=>{const active=tab===t.key;return(<button key={t.key} onClick={()=>setTab(t.key)} style={{flexShrink:0,padding:"8px 14px",border:"none",borderBottom:active?`2px solid ${T.accent}`:"2px solid transparent",background:active?T.accentDim:"transparent",color:active?T.accent:T.muted,fontWeight:700,cursor:"pointer",fontSize:11,fontFamily:MO,whiteSpace:"nowrap"}}>{t.icon} {t.label}</button>);})}
        </div>
      </div>

      <div style={{padding:isMobile?"12px":"20px",maxWidth:900,margin:"0 auto"}}>
        {tab==="new"&&<GRNForm T={T} currentUser={currentUser} fbItems={fbItems} glassItems={glassItems||[]} onSave={handleSave} isMobile={isMobile}/>}
        {tab==="history"&&canViewHistory&&<GRNHistory T={T} grnLog={grnLog} isMobile={isMobile} onView={setViewGRN}/>}
        {tab==="reports"&&canViewReports&&<GRNReports T={T} grnLog={grnLog} isMobile={isMobile}/>}
      </div>
      {viewGRN&&<GRNViewModal T={T} grn={viewGRN} onClose={()=>setViewGRN(null)}/>}
    </div>
  );
}

function GRNForm({T,currentUser,fbItems,glassItems,onSave,isMobile}){
  const [step,setStep]=useState(1);
  const [scanning,setScanning]=useState(false);
  const [aiProcessing,setAiProcessing]=useState(false);
  const videoRef=useRef(null);
  const streamRef=useRef(null);

  // Header - shared across all GRNs
  const [supplier,setSupplier]=useState("");
  const [customSupplier,setCustomSupplier]=useState("");
  const [invoiceNo,setInvoiceNo]=useState("");
  const [invoiceAmount,setInvoiceAmount]=useState("");
  const [paidBy,setPaidBy]=useState("Petty Cash");
  const [billPhoto,setBillPhoto]=useState(null);

  // Items - one card per item, each becomes separate GRN
  const [items,setItems]=useState([{id:uid(),name:"",qty:"",price:"",itemId:null,inventoryType:null,currentPrice:0,priceChanged:false,newPrice:null,itemPhoto:null,search:"",searchResults:[],capturing:false}]);

  const [submitted,setSubmitted]=useState(false);
  const [submitSummary,setSubmitSummary]=useState(null);

  const allFbItems=fbItems||[];
  const allGlassItems=glassItems||[];

  const searchInventory=(q)=>{
    if(!q) return[];
    const query=q.toLowerCase();
    const fb=allFbItems.filter(i=>i.name.toLowerCase().includes(query)||i.code?.toLowerCase().includes(query)).map(i=>({...i,_type:"fb"}));
    const glass=allGlassItems.filter(i=>i.name.toLowerCase().includes(query)||i.shortCode?.toLowerCase().includes(query)).map(i=>({...i,_type:"glass"}));
    return[...fb,...glass].slice(0,8);
  };

  const updateItem=(id,field,value)=>{
    setItems(prev=>prev.map(item=>{
      if(item.id!==id) return item;
      const updated={...item,[field]:value};
      if(field==="search"){
        updated.searchResults=searchInventory(value);
        if(!value){updated.itemId=null;updated.inventoryType=null;updated.currentPrice=0;updated.priceChanged=false;}
      }
      if(field==="price"&&item.itemId){
        updated.priceChanged=Number(value)!==Number(item.currentPrice)&&Number(value)>0;
        updated.newPrice=Number(value);
      }
      return updated;
    }));
  };

  const selectInventoryItem=(id,inv)=>{
    setItems(prev=>prev.map(item=>{
      if(item.id!==id) return item;
      return{...item,name:inv.name,itemId:inv.id,inventoryType:inv._type,currentPrice:Number(inv.perUnit||0),price:String(inv.perUnit||""),search:inv.name,searchResults:[],priceChanged:false,newPrice:null};
    }));
  };

  const addItem=()=>setItems(prev=>[...prev,{id:uid(),name:"",qty:"",price:"",itemId:null,inventoryType:null,currentPrice:0,priceChanged:false,newPrice:null,itemPhoto:null,search:"",searchResults:[],capturing:false}]);
  const removeItem=(id)=>setItems(prev=>prev.filter(i=>i.id!==id));

  // Camera for bill
  const startBillCamera=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}}});
      streamRef.current=stream;
      if(videoRef.current){videoRef.current.srcObject=stream;videoRef.current.play().catch(()=>{});}
      setScanning("camera");
    }catch(e){setCamError("Camera access denied: "+e.message);}
  };

  const captureBill=async()=>{
    if(!videoRef.current) return;
    const canvas=document.createElement("canvas");
    canvas.width=videoRef.current.videoWidth||640;canvas.height=videoRef.current.videoHeight||480;
    canvas.getContext("2d").drawImage(videoRef.current,0,0);
    const dataUrl=canvas.toDataURL("image/jpeg",0.8);
    streamRef.current?.getTracks().forEach(t=>t.stop());
    streamRef.current=null;
    setScanning(false);setBillPhoto(dataUrl);
    await scanBillAI(dataUrl);
  };

  const scanBillAI=async(photoData)=>{
    setAiProcessing(true);
    try{
      // photoData may be a full data URL or already base64 — handle both
      const base64=photoData.includes(",")?photoData.split(",")[1]:photoData;
      const resp=await fetch("/api/scan-grn",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({image:base64})});
      if(!resp.ok) throw new Error("Server error "+resp.status);
      const data=await resp.json();
      if(data.error) throw new Error(data.error);
      if(data.supplier){const found=SUPPLIERS.find(s=>s.toLowerCase()===data.supplier?.toLowerCase());setSupplier(found||"Other");if(!found) setCustomSupplier(data.supplier);}
      if(data.invoiceNo) setInvoiceNo(String(data.invoiceNo));
      if(data.invoiceAmount) setInvoiceAmount(String(data.invoiceAmount));
      if(data.items?.length>0){
        setItems(data.items.map(ai=>{
          const aiName=(ai.name||"").toLowerCase();
          const fbMatch=allFbItems.find(f=>f.name.toLowerCase().includes(aiName)||aiName.includes(f.name.toLowerCase()));
          const glMatch=!fbMatch&&allGlassItems.find(g=>g.name.toLowerCase().includes(aiName));
          const matched=fbMatch||glMatch;
          return{id:uid(),name:ai.name||"",qty:String(ai.qty||""),price:String(ai.price||matched?.perUnit||""),itemId:matched?.id||null,inventoryType:fbMatch?"fb":glMatch?"glass":null,currentPrice:Number(matched?.perUnit||0),priceChanged:!!(ai.price&&matched&&Number(ai.price)!==Number(matched?.perUnit)),newPrice:ai.price?Number(ai.price):null,itemPhoto:null,search:ai.name||"",searchResults:[],capturing:false};
        }));
      }
    }catch(e){
      console.error("scan-grn error:",e);
      // Don't alert — just move to step 2 with whatever was pre-filled
    }
    setAiProcessing(false);
    setStep(2);
  };

  // Item photo capture
  const itemVideoRefs=useRef({});
  const itemStreamRefs=useRef({});

  const startItemCamera=async(id)=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}}});
      itemStreamRefs.current[id]=stream;
      setItems(prev=>prev.map(i=>i.id===id?{...i,capturing:true}:i));
    }catch(e){setCamError("Camera access denied: "+e.message);}
  };

  const captureItemPhoto=(id)=>{
    const vid=itemVideoRefs.current[id];
    if(!vid) return;
    const canvas=document.createElement("canvas");
    canvas.width=vid.videoWidth||640;canvas.height=vid.videoHeight||480;
    canvas.getContext("2d").drawImage(vid,0,0);
    const dataUrl=canvas.toDataURL("image/jpeg",0.7);
    itemStreamRefs.current[id]?.getTracks().forEach(t=>t.stop());
    delete itemStreamRefs.current[id];
    setItems(prev=>prev.map(i=>i.id===id?{...i,itemPhoto:dataUrl,capturing:false}:i));
  };

  const submit=()=>{
    const baseHeader={date:nowStr(),staffName:currentUser.name,userRole:currentUser.role,supplier:supplier==="Other"?customSupplier:supplier,invoiceNo,invoiceAmount:Number(invoiceAmount)||0,paidBy,billPhoto};
    const grns=items.map(item=>({...baseHeader,id:uid(),itemName:item.name,qty:Number(item.qty||0),price:Number(item.price||0),total:Number(item.qty||0)*Number(item.price||0),itemId:item.itemId,inventoryType:item.inventoryType,currentPrice:item.currentPrice,priceChanged:item.priceChanged,newPrice:item.newPrice,itemPhoto:item.itemPhoto}));
    
    // Build summary
    const summary=grns.map(g=>({name:g.itemName,inventoryType:g.inventoryType,qty:g.qty,total:g.total,priceChanged:g.priceChanged,newPrice:g.newPrice,currentPrice:g.currentPrice}));
    
    onSave(grns);
    setSubmitSummary(summary);
    setSubmitted(true);
  };

  if(submitted&&submitSummary){
    const fbAdded=submitSummary.filter(s=>s.inventoryType==="fb");
    const glAdded=submitSummary.filter(s=>s.inventoryType==="glass");
    const notAdded=submitSummary.filter(s=>!s.inventoryType);
    return(
      <Card T={T} s={{padding:24}}>
        <div style={{fontSize:18,fontWeight:600,fontFamily:SE,color:T.ok,marginBottom:6}}>✅ GRN Submitted!</div>
        <div style={{fontSize:12,color:T.muted,fontFamily:MO,marginBottom:20}}>{submitSummary.length} item{submitSummary.length!==1?"s":""} recorded · {new Date().toLocaleString()}</div>
        
        {fbAdded.length>0&&(<div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:T.ok,fontFamily:MO,marginBottom:8}}>✅ ADDED TO F&B STORES</div>
          {fbAdded.map((s,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:T.okBg,borderRadius:7,marginBottom:6}}>
              <div><div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:SE}}>{s.name}</div><div style={{fontSize:10,color:T.muted,fontFamily:MO}}>+{s.qty} units{s.priceChanged?` · Price updated: Rs ${s.currentPrice}→${s.newPrice}`:""}</div></div>
              <div style={{fontSize:14,fontWeight:700,color:T.ok,fontFamily:MO}}>Rs {s.total.toLocaleString()}</div>
            </div>
          ))}
        </div>)}

        {glAdded.length>0&&(<div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:T.accent,fontFamily:MO,marginBottom:8}}>✅ ADDED TO GLASSWARE</div>
          {glAdded.map((s,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:T.accentDim,borderRadius:7,marginBottom:6}}>
              <div><div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:SE}}>{s.name}</div><div style={{fontSize:10,color:T.muted,fontFamily:MO}}>+{s.qty} units</div></div>
              <div style={{fontSize:14,fontWeight:700,color:T.accent,fontFamily:MO}}>Rs {s.total.toLocaleString()}</div>
            </div>
          ))}
        </div>)}

        {notAdded.length>0&&(<div style={{marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:700,color:T.warn,fontFamily:MO,marginBottom:8}}>⚠ NOT IN ANY INVENTORY — RECORDED ONLY</div>
          {notAdded.map((s,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:T.warnBg,borderRadius:7,marginBottom:6}}>
              <div><div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:SE}}>{s.name}</div><div style={{fontSize:10,color:T.muted,fontFamily:MO}}>{s.qty} units · no stock update</div></div>
              <div style={{fontSize:14,fontWeight:700,color:T.warn,fontFamily:MO}}>Rs {s.total.toLocaleString()}</div>
            </div>
          ))}
        </div>)}

        <Btn T={T} v="primary" onClick={()=>{setSubmitted(false);setSubmitSummary(null);setStep(1);setSupplier("");setCustomSupplier("");setInvoiceNo("");setInvoiceAmount("");setPaidBy("Petty Cash");setBillPhoto(null);setItems([{id:uid(),name:"",qty:"",price:"",itemId:null,inventoryType:null,currentPrice:0,priceChanged:false,newPrice:null,itemPhoto:null,search:"",searchResults:[],capturing:false}]);}} s={{width:"100%",padding:"13px",fontSize:14}}>
          + New GRN
        </Btn>
      </Card>
    );
  }

  return(
    <div>
      {/* Step indicator */}
      <div style={{display:"flex",gap:0,marginBottom:20,background:T.card,borderRadius:10,overflow:"hidden",border:`1px solid ${T.border}`}}>
        {["1. Scan Bill","2. Items & Photos","3. Review"].map((s,i)=>(
          <button key={i} onClick={()=>i<step-1&&setStep(i+1)}
            style={{flex:1,padding:"11px 4px",border:"none",background:step===i+1?T.accent:step>i+1?T.accentDim:"transparent",color:step===i+1?"#fff":step>i+1?T.accent:T.muted,cursor:i<step-1?"pointer":"default",fontFamily:MO,fontSize:10,fontWeight:700,textAlign:"center",borderRight:i<2?`1px solid ${T.border}`:"none"}}>
            {step>i+1?"✓ ":""}{s}
          </button>
        ))}
      </div>

      {/* STEP 1 — SCAN BILL */}
      {step===1&&(
        <Card T={T} s={{padding:20}}>
          <div style={{fontSize:16,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:16}}>📋 Scan or Enter Bill Details</div>

          {!billPhoto&&(
            <>
              <button onClick={()=>startBillCamera()}
                style={{width:"100%",padding:"16px",borderRadius:10,border:`2px dashed ${T.accent}`,background:T.accentDim,color:T.accent,cursor:"pointer",fontFamily:SE,fontSize:15,fontWeight:600,marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                📸 Scan Bill with Camera
              </button>
              <label style={{width:"100%",padding:"13px",borderRadius:10,border:`1px dashed ${T.border}`,background:T.card,color:T.muted,cursor:"pointer",fontFamily:MO,fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:16,boxSizing:"border-box"}}>
                🖼 Upload from Gallery<input type="file" accept="image/*" onChange={async e=>{const file=e.target.files[0];if(!file) return;const reader=new FileReader();reader.onload=async ev=>{setBillPhoto(ev.target.result);await scanBillAI(ev.target.result);};reader.readAsDataURL(file);}} style={{display:"none"}}/>
              </label>
            </>
          )}

          {scanning==="camera"&&(
            <div style={{position:"relative",borderRadius:10,overflow:"hidden",marginBottom:16}}>
              <video ref={videoRef} style={{width:"100%",maxHeight:240,objectFit:"cover",display:"block"}} muted playsInline/>
              {aiProcessing?(
                <div style={{position:"absolute",inset:0,background:"#000b",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontFamily:MO,fontSize:14,fontWeight:700}}>🤖 Reading bill…</div>
              ):(
                <>
                  <button onClick={captureBill} style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",background:T.accent,border:"none",borderRadius:20,padding:"10px 28px",cursor:"pointer",fontFamily:MO,fontSize:14,fontWeight:700,color:"#fff"}}>📸 Capture</button>
                  <button onClick={()=>{streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null;setScanning(false);}} style={{position:"absolute",top:8,right:8,background:"#000a",border:"none",borderRadius:6,padding:"6px 10px",cursor:"pointer",color:"#fff",fontSize:12}}>✕</button>
                </>
              )}
            </div>
          )}

          {aiProcessing&&<div style={{background:T.accentDim,border:`1px solid ${T.accent}44`,borderRadius:8,padding:"12px",marginBottom:16,textAlign:"center",fontFamily:MO,fontSize:13,color:T.accent}}>🤖 AI is reading your bill… please wait</div>}

          {billPhoto&&(
            <div style={{position:"relative",marginBottom:16}}>
              <img src={billPhoto} alt="bill" style={{width:"100%",maxHeight:180,objectFit:"cover",borderRadius:8,border:`1px solid ${T.border}`}}/>
              <button onClick={()=>{setBillPhoto(null);setScanning(false);}} style={{position:"absolute",top:6,right:6,background:"#000a",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",color:"#fff",fontSize:11}}>✕ Rescan</button>
            </div>
          )}

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{gridColumn:"1/-1"}}>
              <Label T={T}>Supplier *</Label>
              <Sel T={T} value={supplier} onChange={setSupplier}>
                <option value="">Select supplier…</option>
                {SUPPLIERS.map(s=><option key={s}>{s}</option>)}
              </Sel>
              {supplier==="Other"&&<Inp T={T} value={customSupplier} onChange={setCustomSupplier} placeholder="Type supplier name…" s={{marginTop:8}}/>}
            </div>
            <div><Label T={T}>Invoice No. *</Label><Inp T={T} value={invoiceNo} onChange={setInvoiceNo} placeholder="e.g. 20106"/></div>
            <div><Label T={T}>Invoice Amount (Rs)</Label><Inp T={T} type="number" value={invoiceAmount} onChange={setInvoiceAmount} placeholder="Total on bill"/></div>
            <div style={{gridColumn:"1/-1"}}>
              <Label T={T}>Paid By * <span style={{fontSize:10,color:T.muted,fontFamily:MO}}>(manual — not on bill)</span></Label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {PAID_BY.map(p=>(
                  <button key={p} onClick={()=>setPaidBy(p)}
                    style={{flex:1,padding:"9px 4px",borderRadius:8,border:`2px solid ${paidBy===p?T.accent:T.border}`,background:paidBy===p?T.accentDim:T.card,color:paidBy===p?T.accent:T.muted,cursor:"pointer",fontFamily:MO,fontSize:10,fontWeight:700,textAlign:"center",minWidth:80}}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{marginTop:16,display:"flex",justifyContent:"flex-end"}}>
            <Btn T={T} v="primary" onClick={()=>setStep(2)} disabled={!supplier||!invoiceNo} s={{padding:"12px 28px"}}>Next → Items</Btn>
          </div>
        </Card>
      )}

      {/* STEP 2 — ITEMS & PHOTOS */}
      {step===2&&(
        <div>
          <div style={{fontSize:16,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:4}}>📦 Items — one card per item</div>
          <div style={{fontSize:11,color:T.muted,fontFamily:MO,marginBottom:14}}>Each item will be saved as a separate GRN record</div>

          {items.map((item,idx)=>(
            <Card T={T} key={item.id} s={{padding:16,marginBottom:12,border:`1px solid ${item.inventoryType==="fb"?T.ok:item.inventoryType==="glass"?T.accent:item.name?T.warn:T.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:MO}}>Item {idx+1}</div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  {item.inventoryType==="fb"&&<span style={{fontSize:9,background:T.okBg,color:T.ok,fontFamily:MO,fontWeight:700,padding:"2px 7px",borderRadius:3}}>✅ F&B</span>}
                  {item.inventoryType==="glass"&&<span style={{fontSize:9,background:T.accentDim,color:T.accent,fontFamily:MO,fontWeight:700,padding:"2px 7px",borderRadius:3}}>✅ GLASS</span>}
                  {item.name&&!item.inventoryType&&<span style={{fontSize:9,background:T.warnBg,color:T.warn,fontFamily:MO,fontWeight:700,padding:"2px 7px",borderRadius:3}}>⚠ NOT IN SYSTEM</span>}
                  {items.length>1&&<button onClick={()=>removeItem(item.id)} style={{background:"none",border:"none",color:T.low,cursor:"pointer",fontSize:16,padding:"0 4px"}}>✕</button>}
                </div>
              </div>

              {/* Item search */}
              <div style={{position:"relative",marginBottom:10}}>
                <Label T={T}>Item Name</Label>
                <Inp T={T} value={item.search} onChange={v=>updateItem(item.id,"search",v)} placeholder="Search inventory or type item name…"/>
                {item.searchResults?.length>0&&(
                  <div style={{position:"absolute",top:"100%",left:0,right:0,background:T.card,border:`1px solid ${T.border}`,borderRadius:8,zIndex:50,overflow:"hidden",boxShadow:"0 4px 12px #0002"}}>
                    {item.searchResults.map(inv=>(
                      <div key={inv.id} onClick={()=>selectInventoryItem(item.id,inv)} style={{padding:"9px 14px",cursor:"pointer",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between"}}
                        onMouseEnter={e=>e.currentTarget.style.background=T.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <div>
                          <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:SE}}>{inv.name}</div>
                          <div style={{fontSize:10,color:T.muted,fontFamily:MO}}>{inv._type==="fb"?`F&B · ${inv.code} · Stock: ${inv.stock}`:`Glass · ${inv.shortCode}`} · Rs {inv.perUnit||"—"}</div>
                        </div>
                        <span style={{fontSize:10,color:inv._type==="fb"?T.ok:T.accent,fontFamily:MO,fontWeight:700,alignSelf:"center"}}>{inv._type==="fb"?"F&B":"Glass"}</span>
                      </div>
                    ))}
                    <div onClick={()=>{setItems(prev=>prev.map(i=>i.id===item.id?{...i,name:item.search,search:item.search,searchResults:[],itemId:null,inventoryType:null}:i));}} style={{padding:"9px 14px",cursor:"pointer",color:T.warn,fontFamily:MO,fontSize:12,fontWeight:700,background:T.warnBg}}>
                      + Use "{item.search}" — not in inventory
                    </div>
                  </div>
                )}
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
                <div>
                  <div style={{fontSize:9,color:T.muted,fontFamily:MO,marginBottom:3}}>QTY</div>
                  <input type="number" value={item.qty} onChange={e=>updateItem(item.id,"qty",e.target.value)} placeholder="0"
                    style={{width:"100%",padding:"10px",background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:18,fontWeight:800,fontFamily:MO,outline:"none",boxSizing:"border-box",textAlign:"center"}}/>
                </div>
                <div>
                  <div style={{fontSize:9,color:T.muted,fontFamily:MO,marginBottom:3}}>PRICE/UNIT (Rs){item.inventoryType&&item.currentPrice?<span style={{color:T.muted}}> was {item.currentPrice}</span>:""}</div>
                  <input type="number" value={item.price} onChange={e=>updateItem(item.id,"price",e.target.value)} placeholder="0"
                    style={{width:"100%",padding:"10px",background:T.bg,border:`1px solid ${item.priceChanged?T.warn:T.border}`,borderRadius:8,color:item.priceChanged?T.warn:T.text,fontSize:18,fontWeight:800,fontFamily:MO,outline:"none",boxSizing:"border-box",textAlign:"center"}}/>
                </div>
                <div>
                  <div style={{fontSize:9,color:T.muted,fontFamily:MO,marginBottom:3}}>TOTAL</div>
                  <div style={{padding:"10px",background:T.accentDim,borderRadius:8,fontSize:16,fontWeight:800,color:T.accent,fontFamily:MO,textAlign:"center"}}>
                    Rs {((Number(item.qty)||0)*(Number(item.price)||0)).toLocaleString()}
                  </div>
                </div>
              </div>

              {item.priceChanged&&<div style={{fontSize:11,color:T.warn,fontFamily:MO,background:T.warnBg,padding:"6px 10px",borderRadius:6,marginBottom:10}}>⚠ Price will update in inventory: Rs {item.currentPrice} → Rs {item.newPrice}</div>}

              {/* Item photo */}
              <div>
                <div style={{fontSize:10,color:T.muted,fontFamily:MO,marginBottom:6}}>ITEM PHOTO <span style={{color:T.low}}>* required</span></div>
                {item.capturing?(
                  <div style={{position:"relative",borderRadius:8,overflow:"hidden"}}>
                    <video ref={el=>{if(el){itemVideoRefs.current[item.id]=el;const stream=itemStreamRefs.current[item.id];if(stream&&el.srcObject!==stream){el.srcObject=stream;el.play().catch(()=>{});}}}} style={{width:"100%",maxHeight:180,objectFit:"cover",display:"block"}} muted playsInline/>
                    <button onClick={()=>captureItemPhoto(item.id)} style={{position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",background:T.accent,border:"none",borderRadius:20,padding:"8px 20px",cursor:"pointer",fontFamily:MO,fontSize:13,fontWeight:700,color:"#fff"}}>📸 Capture</button>
                    <button onClick={()=>{itemStreamRefs.current[item.id]?.getTracks().forEach(t=>t.stop());delete itemStreamRefs.current[item.id];setItems(prev=>prev.map(i=>i.id===item.id?{...i,capturing:false}:i));}} style={{position:"absolute",top:6,right:6,background:"#000a",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",color:"#fff",fontSize:11}}>✕</button>
                  </div>
                ):item.itemPhoto?(
                  <div style={{position:"relative",display:"inline-block"}}>
                    <img src={item.itemPhoto} alt="item" style={{width:100,height:100,objectFit:"cover",borderRadius:8,border:`1px solid ${T.border}`}}/>
                    <button onClick={()=>setItems(prev=>prev.map(i=>i.id===item.id?{...i,itemPhoto:null}:i))} style={{position:"absolute",top:-4,right:-4,background:T.low,border:"none",borderRadius:"50%",width:18,height:18,cursor:"pointer",color:"#fff",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                  </div>
                ):(
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>startItemCamera(item.id)} style={{flex:1,padding:"10px",border:`1px dashed ${T.border}`,borderRadius:8,background:T.card,color:T.muted,cursor:"pointer",fontFamily:MO,fontSize:12,fontWeight:700}}>📷 Camera</button>
                    <label style={{flex:1,padding:"10px",border:`1px dashed ${T.border}`,borderRadius:8,background:T.card,color:T.muted,cursor:"pointer",fontFamily:MO,fontSize:12,fontWeight:700,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      🖼 Gallery<input type="file" accept="image/*" onChange={e=>{const file=e.target.files[0];if(!file) return;const reader=new FileReader();reader.onload=ev=>setItems(prev=>prev.map(i=>i.id===item.id?{...i,itemPhoto:ev.target.result}:i));reader.readAsDataURL(file);}} style={{display:"none"}}/>
                    </label>
                  </div>
                )}
              </div>
            </Card>
          ))}

          <button onClick={addItem} style={{width:"100%",padding:"12px",borderRadius:10,border:`1px dashed ${T.accent}`,background:T.accentDim,color:T.accent,cursor:"pointer",fontFamily:MO,fontSize:13,fontWeight:700,marginBottom:16}}>+ Add Another Item</button>

          <div style={{display:"flex",gap:8,justifyContent:"space-between"}}>
            <Btn T={T} onClick={()=>setStep(1)}>← Back</Btn>
            <Btn T={T} v="primary" onClick={()=>setStep(3)} disabled={items.some(i=>!i.name||!i.qty||!i.price)} s={{padding:"12px 28px"}}>Next → Review</Btn>
          </div>
        </div>
      )}

      {/* STEP 3 — REVIEW */}
      {step===3&&(
        <div>
          <Card T={T} s={{padding:20,marginBottom:12}}>
            <div style={{fontSize:16,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:14}}>✅ Review & Submit</div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
              {[["Supplier",supplier==="Other"?customSupplier:supplier],["Invoice No.",invoiceNo],["Paid By",paidBy],["Staff",currentUser.name],["Date & Time",nowStr()],["Total GRNs",items.length+" records"]].map(([l,v])=>(
                <div key={l} style={{background:T.card2,borderRadius:8,padding:"10px 12px"}}>
                  <div style={{fontSize:9,color:T.muted,fontFamily:MO,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2}}>{l}</div>
                  <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:SE}}>{v||"—"}</div>
                </div>
              ))}
            </div>

            {billPhoto&&<img src={billPhoto} alt="bill" style={{width:"100%",maxHeight:120,objectFit:"cover",borderRadius:8,border:`1px solid ${T.border}`,marginBottom:14}}/>}

            {items.map((item,i)=>(
              <div key={item.id} style={{display:"flex",gap:10,alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
                {item.itemPhoto&&<img src={item.itemPhoto} alt="" style={{width:48,height:48,objectFit:"cover",borderRadius:6,flexShrink:0}}/>}
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:SE}}>{item.name}</div>
                  <div style={{fontSize:10,color:T.muted,fontFamily:MO}}>×{item.qty} @ Rs {item.price}</div>
                  {item.inventoryType==="fb"&&<div style={{fontSize:10,color:T.ok,fontFamily:MO}}>→ F&B Stores stock in</div>}
                  {item.inventoryType==="glass"&&<div style={{fontSize:10,color:T.accent,fontFamily:MO}}>→ Glassware stock in</div>}
                  {!item.inventoryType&&<div style={{fontSize:10,color:T.warn,fontFamily:MO}}>⚠ Not in inventory — record only</div>}
                  {item.priceChanged&&<div style={{fontSize:10,color:T.warn,fontFamily:MO}}>⚠ Price update: Rs {item.currentPrice}→{item.newPrice}</div>}
                </div>
                <div style={{fontSize:15,fontWeight:800,color:T.accent,fontFamily:MO,flexShrink:0}}>Rs {((Number(item.qty)||0)*(Number(item.price)||0)).toLocaleString()}</div>
              </div>
            ))}

            <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0",marginTop:4}}>
              <span style={{fontSize:15,fontWeight:700,fontFamily:SE,color:T.text}}>Grand Total</span>
              <span style={{fontSize:20,fontWeight:800,color:T.accent,fontFamily:MO}}>Rs {items.reduce((s,i)=>s+(Number(i.qty||0)*Number(i.price||0)),0).toLocaleString()}</span>
            </div>
          </Card>

          <div style={{display:"flex",gap:8,justifyContent:"space-between"}}>
            <Btn T={T} onClick={()=>setStep(2)}>← Back</Btn>
            <Btn T={T} v="primary" onClick={submit} s={{padding:"13px 32px",fontSize:14}}>✅ Submit {items.length} GRN{items.length!==1?"s":""}</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function GRNViewModal({T,grn,onClose}){
  return(
    <div style={{position:"fixed",inset:0,background:"#000a",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <Card T={T} s={{padding:24,width:480,maxWidth:"100%",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:18,fontWeight:600,fontFamily:SE,color:T.text}}>GRN Details</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:20}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          {[["Supplier",grn.supplier],["Invoice No.",grn.invoiceNo],["Date",grn.date],["Staff",grn.staffName],["Paid By",grn.paidBy],["Total",`Rs ${(grn.total||0).toLocaleString()}`]].map(([l,v])=>(
            <div key={l} style={{background:T.card2,borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:9,color:T.muted,fontFamily:MO,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>{l}</div>
              <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:SE}}>{v||"—"}</div>
            </div>
          ))}
        </div>
        <div style={{background:T.card2,borderRadius:8,padding:"12px 14px",marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:SE,marginBottom:4}}>{grn.itemName}</div>
          <div style={{fontSize:11,color:T.muted,fontFamily:MO}}>×{grn.qty} @ Rs {grn.price}</div>
          {grn.inventoryType==="fb"&&<div style={{fontSize:11,color:T.ok,fontFamily:MO,marginTop:2}}>✅ Added to F&B Stores</div>}
          {grn.inventoryType==="glass"&&<div style={{fontSize:11,color:T.accent,fontFamily:MO,marginTop:2}}>✅ Added to Glassware</div>}
          {!grn.inventoryType&&<div style={{fontSize:11,color:T.warn,fontFamily:MO,marginTop:2}}>⚠ Not in inventory</div>}
          {grn.priceChanged&&<div style={{fontSize:11,color:T.warn,fontFamily:MO,marginTop:2}}>Price updated: Rs {grn.currentPrice}→{grn.newPrice}</div>}
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {grn.billPhoto&&<img src={grn.billPhoto} alt="bill" style={{flex:1,minWidth:120,maxHeight:120,objectFit:"cover",borderRadius:8,border:`1px solid ${T.border}`,cursor:"pointer"}} onClick={()=>window.open(grn.billPhoto,"_blank")}/>}
          {grn.itemPhoto&&<img src={grn.itemPhoto} alt="item" style={{flex:1,minWidth:120,maxHeight:120,objectFit:"cover",borderRadius:8,border:`1px solid ${T.border}`,cursor:"pointer"}} onClick={()=>window.open(grn.itemPhoto,"_blank")}/>}
        </div>
      </Card>
    </div>
  );
}

function GRNHistory({T,grnLog,isMobile,onView}){
  const {filtered,startDate,endDate,setStartDate,setEndDate,clear}=useDateFilter(grnLog);
  const [supplierFilter,setSupplierFilter]=useState("all");
  const suppliers=["all",...new Set(grnLog.map(g=>g.supplier).filter(Boolean))];
  const displayed=supplierFilter==="all"?filtered:filtered.filter(g=>g.supplier===supplierFilter);
  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{flex:1}}><div style={{fontSize:20,fontWeight:600,fontFamily:SE,color:T.text}}>GRN History</div><div style={{fontSize:11,color:T.muted,fontFamily:MO}}>{displayed.length} records</div></div>
      </div>
      <div style={{background:T.card2,borderRadius:8,padding:"10px 14px",marginBottom:14,border:`1px solid ${T.border}`}}>
        <DateRangePicker T={T} startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} onClear={clear}/>
        <div style={{marginTop:8}}><Sel T={T} value={supplierFilter} onChange={setSupplierFilter} s={{minWidth:140}}>{suppliers.map(s=><option key={s} value={s}>{s==="all"?"All Suppliers":s}</option>)}</Sel></div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {displayed.map((grn,i)=>(
          <Card T={T} key={grn.id||i} s={{padding:"14px 16px",cursor:"pointer"}} onClick={()=>onView(grn)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:SE}}>{grn.itemName}</div>
                <div style={{fontSize:11,color:T.muted,fontFamily:MO}}>{grn.supplier} · #{grn.invoiceNo}</div>
                <div style={{fontSize:11,color:T.muted,fontFamily:MO}}>{grn.staffName} · {grn.date}</div>
                {grn.inventoryType==="fb"&&<div style={{fontSize:10,color:T.ok,fontFamily:MO,marginTop:2}}>✅ F&B Stores</div>}
                {grn.inventoryType==="glass"&&<div style={{fontSize:10,color:T.accent,fontFamily:MO,marginTop:2}}>✅ Glassware</div>}
                {!grn.inventoryType&&<div style={{fontSize:10,color:T.warn,fontFamily:MO,marginTop:2}}>⚠ Not in inventory</div>}
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:18,fontWeight:800,color:T.accent,fontFamily:MO}}>Rs {(grn.total||0).toLocaleString()}</div>
                <div style={{fontSize:10,color:T.muted,fontFamily:MO}}>×{grn.qty} @ Rs {grn.price}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:6}}>
              {grn.billPhoto&&<img src={grn.billPhoto} alt="bill" style={{width:44,height:44,objectFit:"cover",borderRadius:6,border:`1px solid ${T.border}`}}/>}
              {grn.itemPhoto&&<img src={grn.itemPhoto} alt="item" style={{width:44,height:44,objectFit:"cover",borderRadius:6,border:`1px solid ${T.border}`}}/>}
            </div>
          </Card>
        ))}
        {!displayed.length&&<div style={{textAlign:"center",padding:48,color:T.muted,fontFamily:SE}}><div style={{fontSize:32,marginBottom:8}}>📋</div>No GRN records found</div>}
      </div>
    </div>
  );
}

function GRNReports({T,grnLog,isMobile}){
  const {filtered,startDate,endDate,setStartDate,setEndDate,clear}=useDateFilter(grnLog);
  const totalSpend=filtered.reduce((s,g)=>s+(g.total||0),0);
  const totalGRNs=filtered.length;
  const bySupplier={};
  filtered.forEach(g=>{const s=g.supplier||"Unknown";if(!bySupplier[s]) bySupplier[s]={count:0,total:0};bySupplier[s].count++;bySupplier[s].total+=(g.total||0);});
  const byPayment={};
  filtered.forEach(g=>{const p=g.paidBy||"Unknown";if(!byPayment[p]) byPayment[p]={count:0,total:0};byPayment[p].count++;byPayment[p].total+=(g.total||0);});
  const byItem={};
  filtered.forEach(g=>{const n=g.itemName||"Unknown";if(!byItem[n]) byItem[n]={qty:0,total:0,count:0};byItem[n].qty+=Number(g.qty||0);byItem[n].total+=(g.total||0);byItem[n].count++;});
  return(
    <div>
      <div style={{fontSize:20,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:12}}>Reports</div>
      <div style={{background:T.card2,borderRadius:8,padding:"10px 14px",marginBottom:14,border:`1px solid ${T.border}`}}>
        <DateRangePicker T={T} startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} onClear={clear}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(3,1fr)",gap:12,marginBottom:14}}>
        {[["Total GRNs",totalGRNs,T.accent],["Total Spend",`Rs ${totalSpend.toLocaleString()}`,T.low],["Avg per GRN",`Rs ${totalGRNs?Math.round(totalSpend/totalGRNs).toLocaleString():0}`,T.ok]].map(([l,v,c])=>(
          <Card T={T} key={l} s={{padding:"16px",textAlign:"center"}}>
            <div style={{fontSize:v.toString().length>8?14:22,fontWeight:800,color:c,fontFamily:MO}}>{v}</div>
            <div style={{fontSize:10,color:T.muted,fontFamily:MO,marginTop:4,textTransform:"uppercase",letterSpacing:"0.08em"}}>{l}</div>
          </Card>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:12}}>
        <Card T={T} s={{padding:16}}>
          <div style={{fontSize:14,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:12}}>By Supplier</div>
          {Object.entries(bySupplier).sort((a,b)=>b[1].total-a[1].total).map(([name,data],i,arr)=>(
            <div key={name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none"}}>
              <div><div style={{fontSize:13,color:T.text,fontFamily:SE}}>{name}</div><div style={{fontSize:10,color:T.muted,fontFamily:MO}}>{data.count} records</div></div>
              <div style={{fontSize:14,fontWeight:700,color:T.accent,fontFamily:MO}}>Rs {data.total.toLocaleString()}</div>
            </div>
          ))}
          {!Object.keys(bySupplier).length&&<div style={{color:T.muted,fontFamily:MO,fontSize:12}}>No data</div>}
        </Card>
        <Card T={T} s={{padding:16}}>
          <div style={{fontSize:14,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:12}}>By Payment</div>
          {Object.entries(byPayment).sort((a,b)=>b[1].total-a[1].total).map(([name,data],i,arr)=>(
            <div key={name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none"}}>
              <div><div style={{fontSize:13,color:T.text,fontFamily:SE}}>{name}</div><div style={{fontSize:10,color:T.muted,fontFamily:MO}}>{data.count} records</div></div>
              <div style={{fontSize:14,fontWeight:700,color:T.ok,fontFamily:MO}}>Rs {data.total.toLocaleString()}</div>
            </div>
          ))}
        </Card>
      </div>
      <Card T={T} s={{padding:16}}>
        <div style={{fontSize:14,fontWeight:600,fontFamily:SE,color:T.text,marginBottom:12}}>Most Purchased Items</div>
        {Object.entries(byItem).sort((a,b)=>b[1].total-a[1].total).slice(0,10).map(([name,data],i,arr)=>(
          <div key={name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none"}}>
            <div><div style={{fontSize:13,color:T.text,fontFamily:SE}}>{name}</div><div style={{fontSize:10,color:T.muted,fontFamily:MO}}>Total qty: {data.qty} · {data.count} records</div></div>
            <div style={{fontSize:14,fontWeight:700,color:T.accent,fontFamily:MO}}>Rs {data.total.toLocaleString()}</div>
          </div>
        ))}
        {!Object.keys(byItem).length&&<div style={{color:T.muted,fontFamily:MO,fontSize:12}}>No data</div>}
      </Card>
    </div>
  );
}

// ── AUDIT LOG ────────────────────────────────────────────────────────────────
function recordAudit(setAuditLog, action, module, itemName, user, before, after){
  // Only track non-admin actions
  if(user.role==="admin") return;
  const changes=[];
  if(before&&after){
    const keys=new Set([...Object.keys(before||{}), ...Object.keys(after||{})]);
    const skip=new Set(["id","_delete"]);
    keys.forEach(k=>{
      if(skip.has(k)) return;
      const bv=before[k]; const av=after[k];
      if(JSON.stringify(bv)!==JSON.stringify(av)){
        changes.push({field:k,before:bv,after:av});
      }
    });
  }
  setAuditLog(prev=>[{
    id:uid(),
    date:nowStr(),
    action,// "create","update","delete"
    module,// "fb","glass","wastage"
    itemName,
    userName:user.name,
    userRole:user.role,
    changes,
  },...prev].slice(0,1000));
}

function AuditLogTab({T,auditLog,isMobile}){
  const {filtered,startDate,endDate,setStartDate,setEndDate,clear}=useDateFilter(auditLog);
  const [moduleFilter,setModuleFilter]=useState("all");
  const [actionFilter,setActionFilter]=useState("all");
  const [search,setSearch]=useState("");

  const displayed=useMemo(()=>{
    let r=filtered;
    if(moduleFilter!=="all") r=r.filter(e=>e.module===moduleFilter);
    if(actionFilter!=="all") r=r.filter(e=>e.action===actionFilter);
    if(search){const q=search.toLowerCase();r=r.filter(e=>e.itemName?.toLowerCase().includes(q)||e.userName?.toLowerCase().includes(q));}
    return r;
  },[filtered,moduleFilter,actionFilter,search]);

  const actionColor=(a)=>a==="create"?T.ok:a==="delete"?T.low:T.accent;
  const actionBg=(a)=>a==="create"?T.okBg:a==="delete"?T.lowBg:T.accentDim;
  const moduleLabel=(m)=>m==="fb"?"📦 F&B":m==="glass"?"🥤 Glass":m==="wastage"?"🗑️ Wastage":"—";

  const fieldLabel=(f)=>{
    const map={name:"Name",perUnit:"Unit Price",minQty:"Min Qty",stock:"Stock",dept:"Department",
      supplier:"Supplier",brand:"Brand",unit:"Unit",barcode:"Barcode",location:"Location",
      qtySize:"Qty Size",kitchenQty:"Kitchen Qty",frontQty:"Front Qty",category:"Category",
      usage:"Usage/Drink",shortCode:"Short Code",fullCode:"Full Code",notes:"Notes",photoUrl:"Photo"};
    return map[f]||f;
  };

  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{flex:1}}>
          <div style={{fontSize:20,fontWeight:600,fontFamily:SE,color:T.text}}>Audit Log</div>
          <div style={{fontSize:11,color:T.muted,fontFamily:MO}}>{displayed.length} of {auditLog.length} entries</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{background:T.card2,borderRadius:8,padding:"12px 14px",marginBottom:14,border:`1px solid ${T.border}`}}>
        <div style={{fontSize:10,fontWeight:700,color:T.muted,fontFamily:MO,marginBottom:8,letterSpacing:"0.08em"}}>FILTER</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
          <DateRangePicker T={T} startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} onClear={clear}/>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <Inp T={T} value={search} onChange={setSearch} placeholder="Search item or user…" s={{width:160}}/>
          <Sel T={T} value={moduleFilter} onChange={setModuleFilter} s={{minWidth:100}}>
            <option value="all">All Modules</option>
            <option value="fb">F&B Stores</option>
            <option value="glass">Glassware</option>
            <option value="wastage">Wastage</option>
          </Sel>
          <Sel T={T} value={actionFilter} onChange={setActionFilter} s={{minWidth:100}}>
            <option value="all">All Actions</option>
            <option value="create">Created</option>
            <option value="update">Updated</option>
            <option value="delete">Deleted</option>
          </Sel>
        </div>
      </div>

      {/* Log entries */}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {displayed.map((entry,i)=>(
          <Card T={T} key={entry.id||i} s={{padding:"14px 16px"}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:entry.changes?.length>0?10:0}}>
              <div style={{flexShrink:0}}>
                <span style={{fontSize:10,fontWeight:700,fontFamily:MO,padding:"3px 8px",borderRadius:4,background:actionBg(entry.action),color:actionColor(entry.action)}}>
                  {entry.action?.toUpperCase()}
                </span>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:4}}>
                  <div>
                    <span style={{fontSize:14,fontWeight:600,color:T.text,fontFamily:SE}}>{entry.itemName||"—"}</span>
                    <span style={{fontSize:11,color:T.muted,fontFamily:MO,marginLeft:8}}>{moduleLabel(entry.module)}</span>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:11,color:T.muted,fontFamily:MO}}>{entry.date}</div>
                    <div style={{fontSize:11,fontWeight:600,color:T.accent,fontFamily:MO}}>{entry.userName}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Changes */}
            {entry.changes?.length>0&&(
              <div style={{background:T.bg,borderRadius:6,padding:"8px 10px",border:`1px solid ${T.border}`}}>
                {entry.changes.map((c,j)=>(
                  <div key={j} style={{display:"flex",gap:8,alignItems:"center",padding:"4px 0",borderBottom:j<entry.changes.length-1?`1px solid ${T.border}`:"none",flexWrap:"wrap"}}>
                    <span style={{fontSize:10,fontWeight:700,color:T.muted,fontFamily:MO,minWidth:80}}>{fieldLabel(c.field)}</span>
                    <span style={{fontSize:12,color:T.low,fontFamily:MO,textDecoration:"line-through",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{String(c.before??"")||"—"}</span>
                    <span style={{fontSize:12,color:T.muted,fontFamily:MO}}>→</span>
                    <span style={{fontSize:12,color:T.ok,fontFamily:MO,fontWeight:700,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{String(c.after??"")||"—"}</span>
                  </div>
                ))}
              </div>
            )}
            {entry.action==="create"&&(!entry.changes||entry.changes.length===0)&&(
              <div style={{fontSize:11,color:T.ok,fontFamily:MO}}>New item added to inventory</div>
            )}
            {entry.action==="delete"&&(
              <div style={{fontSize:11,color:T.low,fontFamily:MO}}>Item permanently deleted</div>
            )}
          </Card>
        ))}
        {!displayed.length&&(
          <div style={{textAlign:"center",padding:48,color:T.muted,fontFamily:SE}}>
            <div style={{fontSize:32,marginBottom:8}}>📋</div>
            <div style={{fontStyle:"italic"}}>No audit entries found</div>
            <div style={{fontSize:12,marginTop:4}}>Changes to items will appear here</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── DATE RANGE PICKER ────────────────────────────────────────────────────────
function DateRangePicker({T,startDate,endDate,onStartChange,onEndChange,onClear}){
  const presets=[
    {label:"Today",days:0},
    {label:"7 days",days:7},
    {label:"30 days",days:30},
    {label:"90 days",days:90},
  ];
  const applyPreset=(days)=>{
    const end=new Date();
    const start=new Date();
    if(days===0){
      start.setHours(0,0,0,0);
    } else {
      start.setDate(start.getDate()-days);
    }
    onStartChange(start.toISOString().split("T")[0]);
    onEndChange(end.toISOString().split("T")[0]);
  };
  return(
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
      {presets.map(p=>(
        <button key={p.label} onClick={()=>applyPreset(p.days)}
          style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${T.border}`,background:T.card,color:T.muted,cursor:"pointer",fontFamily:MO,fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}
          onMouseEnter={e=>{e.currentTarget.style.background=T.accentDim;e.currentTarget.style.color=T.accent;e.currentTarget.style.borderColor=T.accent;}}
          onMouseLeave={e=>{e.currentTarget.style.background=T.card;e.currentTarget.style.color=T.muted;e.currentTarget.style.borderColor=T.border;}}>
          {p.label}
        </button>
      ))}
      <input type="date" value={startDate} onChange={e=>onStartChange(e.target.value)}
        style={{padding:"5px 8px",borderRadius:6,border:`1px solid ${T.border}`,background:T.card,color:T.text,fontFamily:MO,fontSize:11,outline:"none",cursor:"pointer"}}/>
      <span style={{color:T.muted,fontFamily:MO,fontSize:11}}>to</span>
      <input type="date" value={endDate} onChange={e=>onEndChange(e.target.value)}
        style={{padding:"5px 8px",borderRadius:6,border:`1px solid ${T.border}`,background:T.card,color:T.text,fontFamily:MO,fontSize:11,outline:"none",cursor:"pointer"}}/>
      {(startDate||endDate)&&(
        <button onClick={onClear} style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${T.low}44`,background:T.lowBg,color:T.low,cursor:"pointer",fontFamily:MO,fontSize:11,fontWeight:700}}>✕ Clear</button>
      )}
      {startDate&&endDate&&(
        <span style={{fontSize:10,color:T.muted,fontFamily:MO}}>{startDate} → {endDate}</span>
      )}
    </div>
  );
}

function useDateFilter(data,dateKey="date"){
  const [startDate,setStartDate]=useState("");
  const [endDate,setEndDate]=useState("");
  const filtered=useMemo(()=>{
    if(!startDate&&!endDate) return data;
    return data.filter(item=>{
      const itemDate=item[dateKey]?.split(",")[0]?.trim();// handle "DD/MM/YYYY, HH:MM" format
      if(!itemDate) return true;
      // Parse DD/MM/YYYY
      const parts=itemDate.split("/");
      if(parts.length!==3) return true;
      const d=new Date(parts[2],parts[1]-1,parts[0]);
      if(startDate){
        const s=new Date(startDate);s.setHours(0,0,0,0);
        if(d<s) return false;
      }
      if(endDate){
        const e=new Date(endDate);e.setHours(23,59,59,999);
        if(d>e) return false;
      }
      return true;
    });
  },[data,startDate,endDate,dateKey]);
  return{filtered,startDate,endDate,setStartDate,setEndDate,clear:()=>{setStartDate("");setEndDate("");}};
}

// ── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({T,isMobile,items,movements,grnLog,wastageLog,glassItems,countHistory}){
  const today=new Date();
  const todayStr=today.toLocaleDateString("en-GB");

  const lowStock=items.filter(i=>i.stock>0&&i.stock<i.minQty).length;
  const emptyStock=items.filter(i=>i.stock<=0).length;
  const totalValue=items.reduce((s,i)=>s+(Number(i.stock||0)*Number(i.perUnit||0)),0);

  const todayMov=movements.filter(m=>m.date?.startsWith(todayStr));
  const todayOut=todayMov.filter(m=>m.type==="out").length;
  const todayIn=todayMov.filter(m=>m.type==="in").length;

  const weekAgo=new Date(today);weekAgo.setDate(weekAgo.getDate()-7);
  const recentWastage=(wastageLog||[]).filter(w=>{
    const parts=w.date?.split("/")||[];
    if(parts.length<3) return false;
    const d=new Date(parts[2].split(",")[0],parts[1]-1,parts[0]);
    return d>=weekAgo;
  });
  const weeklyLoss=recentWastage.reduce((s,w)=>s+(w.loss||0),0);

  const recentGRNs=(grnLog||[]).filter(g=>{
    const parts=g.date?.split("/")||[];
    if(parts.length<3) return false;
    const d=new Date(parts[2].split(",")[0],parts[1]-1,parts[0]);
    return d>=weekAgo;
  });
  const weeklySpend=recentGRNs.reduce((s,g)=>s+(g.total||0),0);

  const glassLow=(glassItems||[]).filter(i=>i.minQty>0&&(i.kitchenQty+i.frontQty)<i.minQty).length;
  const recentBreakage=recentWastage.filter(w=>w.sourceType==="glass").length;

  const lastCount=countHistory?.[0];

  return(
    <div style={{marginBottom:24}}>
      <div style={{fontSize:13,fontWeight:700,color:T.muted,fontFamily:MO,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>Today's Overview</div>

      {/* Stock alerts row */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:10,marginBottom:12}}>
        {[
          ["Low Stock",lowStock,T.warn,T.warnBg,"⚠️"],
          ["Empty",emptyStock,T.low,T.lowBg,"🔴"],
          ["Glass Low",glassLow,T.accent,T.accentDim,"🥤"],
          ["Stock Value",`Rs ${Math.round(totalValue/1000)}k`,T.ok,T.okBg,"💰"],
        ].map(([label,val,color,bg,icon])=>(
          <div key={label} style={{background:bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${color}22`}}>
            <div style={{fontSize:18,marginBottom:4}}>{icon}</div>
            <div style={{fontSize:isMobile?20:24,fontWeight:800,color,fontFamily:MO,lineHeight:1}}>{val}</div>
            <div style={{fontSize:10,color,fontFamily:MO,marginTop:4,opacity:0.8,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Today's activity */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:10,marginBottom:12}}>
        {[
          ["Today Out",todayOut,T.low,"↑"],
          ["Today In",todayIn,T.ok,"↓"],
          ["Week Wastage",`Rs ${weeklyLoss.toLocaleString()}`,T.warn,"🗑"],
          ["Week GRN Spend",`Rs ${weeklySpend.toLocaleString()}`,T.accent,"📋"],
        ].map(([label,val,color,icon])=>(
          <div key={label} style={{background:T.card,borderRadius:10,padding:"12px 14px",border:`1px solid ${T.border}`}}>
            <div style={{fontSize:16,marginBottom:4}}>{icon}</div>
            <div style={{fontSize:isMobile?18:22,fontWeight:800,color,fontFamily:MO,lineHeight:1}}>{val}</div>
            <div style={{fontSize:10,color:T.muted,fontFamily:MO,marginTop:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      {(movements.length>0||recentGRNs.length>0)&&(
        <div style={{background:T.card,borderRadius:10,padding:"14px 16px",border:`1px solid ${T.border}`}}>
          <div style={{fontSize:11,fontWeight:700,color:T.muted,fontFamily:MO,letterSpacing:"0.08em",marginBottom:10}}>RECENT ACTIVITY</div>
          {movements.slice(0,3).map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<2?`1px solid ${T.border}`:"none"}}>
              <div>
                <span style={{fontSize:11,fontWeight:700,fontFamily:MO,color:m.type==="out"?T.low:T.ok,marginRight:6}}>{m.type==="out"?"↑":"↓"}</span>
                <span style={{fontSize:12,color:T.text,fontFamily:SE}}>{m.itemName}</span>
              </div>
              <div style={{fontSize:11,color:T.muted,fontFamily:MO}}>{m.personName} · {m.date?.split(",")[1]||""}</div>
            </div>
          ))}
          {lastCount&&(
            <div style={{marginTop:8,padding:"6px 0",fontSize:11,color:T.muted,fontFamily:MO}}>
              Last count: <span style={{color:T.text,fontWeight:600}}>{lastCount.date}</span> by {lastCount.countedBy}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── MODULE SELECTOR ──────────────────────────────────────────────────────────
function ModuleSelector({T,isDark,onToggle,currentUser,onSelect,onLogout,items,movements,grnLog,wastageLog,glassItems,countHistory}){
  const isMobile=useIsMobile();
  const modules=[
    {id:"stores",icon:"🏪",title:"F&B Stores",desc:"Food & beverage inventory, stock in/out, orders and reports",color:"#5c3d2e",light:"#fdf6f0",
      shortcuts:[{label:"Stock Out",icon:"↑",tab:"out"},{label:"Stock In",icon:"↓",tab:"in"},{label:"Inventory",icon:"📦",tab:"inv"}]},
    {id:"glassware",icon:"🥤",title:"Glassware & Utensils",desc:"Track cups, plates, bowls, cutlery and breakage",color:"#1a5276",light:"#eaf4fb",
      shortcuts:[{label:"Breakage",icon:"🔴",tab:"breakage"},{label:"Issue",icon:"📥",tab:"issue"},{label:"Count",icon:"🔢",tab:"count"}]},
    {id:"wastage",icon:"🗑️",title:"Wastage",desc:"Record food wastage, expired and spoiled items",color:"#922b21",light:"#fdedec",
      shortcuts:[{label:"Record",icon:"📝",tab:"record"}]},
    {id:"grn",icon:"📋",title:"GRN Scanner",desc:"Scan supplier invoices to automatically receive stock",color:"#1e8449",light:"#eafaf1",
      shortcuts:[{label:"New GRN",icon:"📋",tab:"new"}]},
  ];
  const [hovered,setHovered]=useState(null);
  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:SE,transition:"background 0.25s"}}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{position:"absolute",inset:0,backgroundImage:`radial-gradient(${T.border} 1px,transparent 0)`,backgroundSize:"28px 28px",opacity:0.4,pointerEvents:"none"}}/>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",borderBottom:`1px solid ${T.border}`,background:T.navBg,position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <HazelLogo T={T} size={28}/>
          <div>
            <div style={{fontSize:14,fontWeight:600,color:T.accent,letterSpacing:"0.12em",textTransform:"uppercase",lineHeight:1}}>Hazel</div>
            <div style={{fontSize:8,color:T.muted,letterSpacing:"0.2em",textTransform:"uppercase"}}>Cafe & Cakery</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <ThemeToggle T={T} isDark={isDark} onToggle={onToggle}/>
          <UserMenu T={T} user={currentUser} onLogout={onLogout} isMobile={isMobile}/>
        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth:960,margin:"0 auto",padding:isMobile?"16px":"24px 24px",position:"relative",zIndex:1}}>

        {/* Dashboard */}
        <Dashboard T={T} isMobile={isMobile} items={items||[]} movements={movements||[]} grnLog={grnLog||[]} wastageLog={wastageLog||[]} glassItems={glassItems||[]} countHistory={countHistory||[]}/>

        <div style={{fontSize:13,fontWeight:700,color:T.muted,fontFamily:MO,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>Modules</div>

        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
          {modules.map((m,i)=>(
            <div key={m.id} style={{background:T.card,border:`1px solid ${hovered===m.id?m.color:T.border}`,borderRadius:14,overflow:"hidden",transition:"all 0.2s",transform:hovered===m.id?"translateY(-2px)":"none",boxShadow:hovered===m.id?`0 6px 20px ${m.color}18`:"none",animation:`fadeUp ${0.3+i*0.07}s ease`}}
              onMouseEnter={()=>setHovered(m.id)} onMouseLeave={()=>setHovered(null)}>
              {/* Main card - opens module */}
              <div onClick={()=>onSelect(m.id)} style={{padding:"18px 20px",cursor:"pointer",borderBottom:`1px solid ${T.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                  <span style={{fontSize:26}}>{m.icon}</span>
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:hovered===m.id?m.color:T.text,fontFamily:SE}}>{m.title}</div>
                    <div style={{fontSize:11,color:T.muted,fontFamily:MO,marginTop:1}}>{m.desc}</div>
                  </div>
                  <span style={{marginLeft:"auto",fontSize:16,color:T.muted}}>→</span>
                </div>
              </div>
              {/* Quick action shortcuts */}
              <div style={{display:"flex",gap:0,background:T.card2}}>
                {m.shortcuts.map((s,j)=>(
                  <button key={j} onClick={()=>onSelect(m.id,s.tab)}
                    style={{flex:1,padding:"8px 4px",border:"none",borderRight:j<m.shortcuts.length-1?`1px solid ${T.border}`:"none",background:"transparent",color:T.muted,cursor:"pointer",fontFamily:MO,fontSize:10,fontWeight:700,textAlign:"center",transition:"all 0.15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.background=m.light;e.currentTarget.style.color=m.color;}}
                    onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.muted;}}>
                    <div style={{fontSize:14,marginBottom:2}}>{s.icon}</div>
                    <div>{s.label}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <CreatorStamp T={T}/>
    </div>
  );
}

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
  const [auditLog,setAuditLog]=useState([]);
  const loginSessionRef=useRef(null);
  const lastActivityRef=useRef(Date.now());
  const SESSION_TIMEOUT_MS=2*60*60*1000;// 2 hours
  const [alertSettings,setAlertSettings]=useState({email1:"",email2:"",enabled:true,threshold:"atMin"});
  const [alertBanner,setAlertBanner]=useState([]);
  const [showAlertSettings,setShowAlertSettings]=useState(false);
  const alertedRef=useRef(new Set(JSON.parse(localStorage.getItem("alertedIds")||"[]")));
  const [ready,setReady]=useState(false);
  const [syncDot,setSyncDot]=useState(false);
  const [activeModule,setActiveModule]=useState(null);
  const [initialTab,setInitialTab]=useState(null);

  // Browser back button support
  const activeModuleRef=useRef(null);
  useEffect(()=>{activeModuleRef.current=activeModule;},[activeModule]);
  useEffect(()=>{
    const handlePopState=(e)=>{
      if(activeModuleRef.current){setActiveModule(null);}
      else if(currentUser){setCurrentUser(null);setTab("out");setAlertBanner([]);alertedRef.current.clear();}
    };
    window.addEventListener("popstate",handlePopState);
    return()=>window.removeEventListener("popstate",handlePopState);
  },[]);
  const [sheetsSyncing,setSheetsSyncing]=useState(false);
  const [sheetsLastSync,setSheetsLastSync]=useState(null);
  const [sheetsError,setSheetsError]=useState(null);

  // ── Boot: load from Firebase ──────────────────────────────────────────────
  useEffect(()=>{
    async function boot(){
      const [si,sm,sc,su,sd,as,th,lh,al]=await Promise.all([
        fbLoad("items", DEFAULT_ITEMS),
        fbLoad("movements", []),
        fbLoad("counts", []),
        fbLoad("users", DEFAULT_USERS),
        fbLoad("devices", []),
        fbLoad("alertSettings", {email1:"",email2:"",enabled:true,threshold:"atMin"}),
        fbLoad("theme", false),
        fbLoad("loginHistory", []),
        fbLoad("auditLog", []),
      ]);
      setItems(si); setMovements(sm); setCountHistory(sc); setUsers(su); setDevices(sd); setAlertSettings(as); setIsDark(th); setLoginHistory(lh); setAuditLog(al); setIsDark(th);
      setReady(true);
    }
    boot();
  },[]);

  // ── Persist to Firebase (debounced via useFirebasePersist hook) ─────────────
  useFirebasePersist("items",items,ready,v=>fetch("/api/sync-sheets",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:v,movements,countHistory})}));
  useFirebasePersist("movements",movements,ready,v=>fetch("/api/sync-sheets",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items,movements:v,countHistory})}));
  useFirebasePersist("counts",countHistory,ready,v=>fetch("/api/sync-sheets",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items,movements,countHistory:v})}));
  useFirebasePersist("users",users,ready);
  useFirebasePersist("devices",devices,ready);
  useFirebasePersist("loginHistory",loginHistory,ready);
  useFirebasePersist("auditLog",auditLog,ready);
  useFirebasePersist("alertSettings",alertSettings,ready);
  useFirebasePersist("theme",isDark,ready);

  // ── Real-time sync via Firestore onSnapshot ───────────────────────────────
  useEffect(()=>{
    if(!ready||!currentUser) return;
    // fingerprint: compare array length + first item id to avoid O(n) JSON.stringify diff
    const changed=(prev,next)=>{
      if(!Array.isArray(prev)||!Array.isArray(next)) return true;
      if(prev.length!==next.length) return true;
      if(prev[0]?.id!==next[0]?.id) return true;
      return false;
    };
    const SETTERS={items:setItems,movements:setMovements,counts:setCountHistory,users:setUsers,devices:setDevices,loginHistory:setLoginHistory};
    const unsubs=Object.keys(SETTERS).map(key=>
      onSnapshot(doc(db,"hazel",key), snap=>{
        if(!snap.exists()) return;
        try{
          const val=JSON.parse(snap.data().data);
          SETTERS[key](p=>changed(p,val)?val:p);
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
    // Remove items no longer low from tracking set
    items.forEach(i=>{if(!isLow(i)) alertedRef.current.delete(i.id);});
    // Find newly low items not yet alerted
    const newLow=items.filter(i=>isLow(i)&&!alertedRef.current.has(i.id));
    if(newLow.length>0){
      newLow.forEach(i=>alertedRef.current.add(i.id));
      // Single localStorage write per effect run, not one per item
      localStorage.setItem("alertedIds",JSON.stringify([...alertedRef.current]));
      setAlertBanner(prev=>{
        const ids=new Set(prev.map(x=>x.id));
        return[...prev,...newLow.filter(i=>!ids.has(i.id))];
      });
    }
    // Prune banner to only currently-low items
    setAlertBanner(prev=>prev.filter(i=>{
      const cur=items.find(x=>x.id===i.id);
      return cur&&isLow(cur);
    }));
  },[items,ready,currentUser,alertSettings.threshold]);

  // Track last activity and auto-timeout after 2 hours
  useEffect(()=>{
    if(!currentUser) return;
    lastActivityRef.current=Date.now();
    const updateActivity=()=>{lastActivityRef.current=Date.now();};
    window.addEventListener("click",updateActivity);
    window.addEventListener("touchstart",updateActivity);
    window.addEventListener("keydown",updateActivity);
    const interval=setInterval(()=>{
      const elapsed=Date.now()-lastActivityRef.current;
      if(elapsed>SESSION_TIMEOUT_MS){
        if(loginSessionRef.current){
          const timeoutTime=nowStr();
          setLoginHistory(prev=>prev.map(h=>h.id===loginSessionRef.current?{...h,logoutTime:"Timed out · "+timeoutTime}:h));
          loginSessionRef.current=null;
        }
        setCurrentUser(null);
        setTab("out");
        setAlertBanner([]);
        alertedRef.current.clear();
        setActiveModule(null);
      }
    },30000);// check every 30 seconds
    return()=>{
      window.removeEventListener("click",updateActivity);
      window.removeEventListener("touchstart",updateActivity);
      window.removeEventListener("keydown",updateActivity);
      clearInterval(interval);
    };
  },[currentUser]);

  const handleLogin=u=>{
    setCurrentUser(u);
    setActiveModule(null);
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

  const handleLogout=()=>{
    if(loginSessionRef.current){
      setLoginHistory(prev=>prev.map(h=>h.id===loginSessionRef.current?{...h,logoutTime:nowStr()}:h));
      loginSessionRef.current=null;
    }
    setCurrentUser(null);setTab("out");setAlertBanner([]);alertedRef.current.clear();setActiveModule(null);
  };

  // Apply initialTab from quick action
  useEffect(()=>{if(initialTab&&ready){setTab(initialTab);setInitialTab(null);}},[initialTab,ready]);

  if(!ready) return(
    <ThemeContext.Provider value={LIGHT}>
      <div style={{minHeight:"100vh",background:LIGHT.bg,display:"flex",alignItems:"center",justifyContent:"center",color:LIGHT.muted,fontFamily:SE}}>
        <div style={{textAlign:"center"}}><HazelLogo T={LIGHT} size={50}/><div style={{marginTop:12,fontSize:16,letterSpacing:"0.12em",color:LIGHT.muted}}>Loading…</div></div>
      </div>
    </ThemeContext.Provider>
  );
  if(!currentUser) return(
    <ThemeContext.Provider value={T}>
      <LoginScreen T={T} isDark={isDark} onToggle={()=>setIsDark(p=>!p)} users={users} setUsers={setUsers} onLogin={handleLogin}/>
      <CreatorStamp T={T}/>
    </ThemeContext.Provider>
  );
  if(!activeModule) return(
    <ThemeContext.Provider value={T}>
      <ModuleSelector T={T} isDark={isDark} onToggle={()=>setIsDark(p=>!p)} currentUser={currentUser} onSelect={(m,tab)=>{setInitialTab(tab||null);setActiveModule(m);}} onLogout={handleLogout} items={items} movements={movements} grnLog={[]} wastageLog={[]} glassItems={[]} countHistory={countHistory}/>
    </ThemeContext.Provider>
  );
  if(activeModule==="glassware") return(
    <ThemeContext.Provider value={T}>
      <GlasswareModule T={T} isDark={isDark} onToggle={()=>setIsDark(p=>!p)} currentUser={currentUser} onBack={()=>setActiveModule(null)} onLogout={handleLogout} setAuditLog={setAuditLog} auditLog={auditLog}/>
    </ThemeContext.Provider>
  );
  if(activeModule==="wastage") return(
    <ThemeContext.Provider value={T}>
      <WastageModule T={T} isDark={isDark} onToggle={()=>setIsDark(p=>!p)} currentUser={currentUser} onBack={()=>setActiveModule(null)} onLogout={handleLogout} fbItems={items} glassItems={[]} setFbItems={setItems} setGlassItems={()=>{}}/>
    </ThemeContext.Provider>
  );
  if(activeModule==="grn") return(
    <ThemeContext.Provider value={T}>
      <GRNModule T={T} isDark={isDark} onToggle={()=>setIsDark(p=>!p)} currentUser={currentUser} onBack={()=>setActiveModule(null)} onLogout={handleLogout} fbItems={items} setFbItems={setItems} glassItems={[]} setGlassItems={()=>{}}/>
    </ThemeContext.Provider>
  );

  const role=ROLES[currentUser.role];
  const allowedTabs=ALL_TABS.filter(t=>role.tabs.includes(t.key));
  const safeTab=role.tabs.includes(tab)?tab:role.tabs[0];
  const deficit=items.filter(i=>i.stock<i.minQty).length;
  const empty=items.filter(i=>i.stock<=0).length;

  return(
    <ThemeContext.Provider value={T}>
    <div style={{minHeight:"100vh",width:"100%",maxWidth:"100vw",overflowX:"hidden",background:T.bg,fontFamily:MO,color:T.text,transition:"background 0.25s,color 0.25s"}}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>
      <div style={{background:T.navBg,borderBottom:`1px solid ${T.navBorder}`,position:"sticky",top:0,zIndex:90,boxShadow:T.shadow}}>
        <div style={{maxWidth:1440,margin:"0 auto",padding:"0 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,height:50}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              <button onClick={()=>setActiveModule(null)} style={{display:"flex",alignItems:"center",gap:4,background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 10px",cursor:"pointer",color:T.muted,fontFamily:MO,fontSize:11,fontWeight:700,flexShrink:0,transition:"all 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.background=T.accentDim;e.currentTarget.style.color=T.accent;e.currentTarget.style.borderColor=T.accent;}}
                onMouseLeave={e=>{e.currentTarget.style.background=T.card;e.currentTarget.style.color=T.muted;e.currentTarget.style.borderColor=T.border;}}>
                <span style={{fontSize:14,fontWeight:800}}>‹</span>
                {!isMobile&&<span>Modules</span>}
              </button>
              <HazelLogo T={T} size={30}/><div><div style={{fontSize:14,fontWeight:600,color:T.accent,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:SE,lineHeight:1.1}}>Hazel</div><div style={{fontSize:8,color:T.muted,letterSpacing:"0.22em",textTransform:"uppercase",lineHeight:1,fontFamily:MO}}>Cafe &amp; Cakery</div></div>
            </div>
            <div style={{marginLeft:"auto",display:"flex",gap:7,alignItems:"center",flexShrink:0}}>
              {deficit>0&&<span style={{fontSize:10,fontWeight:700,color:T.low,background:T.lowBg,padding:"3px 7px",borderRadius:5,fontFamily:MO}}>{deficit} low</span>}
              {empty>0&&<span style={{fontSize:10,fontWeight:700,color:T.warn,background:T.warnBg,padding:"3px 7px",borderRadius:5,fontFamily:MO}}>{empty} empty</span>}
              <span style={{width:6,height:6,borderRadius:"50%",background:syncDot?T.ok:T.border,transition:"background 0.3s",flexShrink:0}} title="Firebase sync"/>
              <button onClick={()=>syncToSheets({items,movements,countHistory})} title={sheetsLastSync?"Last synced: "+sheetsLastSync:"Sync to Google Sheets"} style={{background:sheetsError?T.lowBg:sheetsLastSync?T.okBg:T.card,border:`1px solid ${sheetsError?T.low:sheetsLastSync?T.ok:T.border}`,borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11,color:sheetsError?T.low:sheetsLastSync?T.ok:T.muted,fontFamily:MO,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
                {sheetsSyncing?"⟳":"📊"}{!isMobile&&(sheetsSyncing?" Syncing…":sheetsError?" Error":sheetsLastSync?" Synced":"Sheets")}
              </button>
              <button onClick={()=>setShowAlertSettings(true)} title="Alert settings" style={{position:"relative",background:alertBanner.length>0?T.warnBg:"transparent",border:`1px solid ${alertBanner.length>0?T.warn:T.border}`,borderRadius:7,padding:"4px 9px",cursor:"pointer",color:alertBanner.length>0?T.warn:T.muted,fontSize:14,lineHeight:1}}>🔔{alertBanner.length>0&&(<span style={{position:"absolute",top:-4,right:-4,minWidth:16,height:16,borderRadius:8,background:T.low,border:`2px solid ${T.navBg}`,fontSize:8,fontWeight:800,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:MO,padding:"0 3px"}}>{alertBanner.length}</span>)}</button>
              <ThemeToggle T={T} isDark={isDark} onToggle={()=>setIsDark(p=>!p)}/>
              <UserMenu T={T} user={currentUser} onLogout={handleLogout} isMobile={isMobile}/>
            </div>
          </div>
          <div style={{display:"flex",gap:0,overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch"}}>{allowedTabs.map(t=>{const c=tabColor(t.key,T);const active=safeTab===t.key;return(<button key={t.key} onClick={()=>setTab(t.key)} style={{padding:"8px 13px",border:"none",borderBottom:active?`2px solid ${c}`:"2px solid transparent",background:active?c+"12":"transparent",color:active?c:T.muted,fontWeight:700,cursor:"pointer",fontSize:11,fontFamily:MO,whiteSpace:"nowrap",transition:"all 0.15s",flexShrink:0}}>{t.icon} {t.label}</button>);})}</div>
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
        {safeTab==="audit"&&<AuditLogTab T={T} auditLog={auditLog} isMobile={isMobile}/>
        }
        {safeTab==="value"&&<StockValueTab T={T} items={items} isMobile={isMobile}/>}
      </div>
      {isMobile&&(<div style={{position:"fixed",bottom:0,left:0,right:0,background:T.navBg,borderTop:`1px solid ${T.navBorder}`,display:"flex",zIndex:100,overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch",scrollSnapType:"x mandatory"}}><style>{`.mobile-tab-scroll::-webkit-scrollbar{display:none}`}</style>{allowedTabs.map(t=>{const c=tabColor(t.key,T);const active=safeTab===t.key;return(<button key={t.key} onClick={()=>setTab(t.key)} style={{flexShrink:0,minWidth:60,padding:"9px 6px 7px",border:"none",background:active?c+"15":"transparent",color:active?c:T.muted,cursor:"pointer",fontFamily:MO,display:"flex",flexDirection:"column",alignItems:"center",gap:2,borderTop:active?`2px solid ${c}`:`2px solid transparent`,scrollSnapAlign:"start",transition:"all 0.15s"}}><span style={{fontSize:16,lineHeight:1}}>{t.icon}</span><span style={{fontSize:8,fontWeight:700,whiteSpace:"nowrap"}}>{t.label}</span></button>);})}</div>)}
      {showAlertSettings&&<AlertSettingsModal T={T} settings={alertSettings} onClose={()=>setShowAlertSettings(false)} onSave={s=>{setAlertSettings(s);setShowAlertSettings(false);}}/> }
      <CreatorStamp T={T}/>
    </div>
    </ThemeContext.Provider>
  );
}