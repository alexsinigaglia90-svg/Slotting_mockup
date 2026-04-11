"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { FunnelChart } from "@/components/ui/funnel-chart";

/* ═══ MOCK DATA ═══ */
const NUM_AISLES = 15;
const RACKS_PER_SIDE = 20;
type Velocity = "A" | "B" | "C" | "D" | "empty";

interface Loc {
  id: string; aisle: number; side: "L" | "R"; position: number; level: number;
  velocity: Velocity; skuName: string | null; skuId: string | null;
  category: string | null; picksWeek: number; picksMonth: number;
  lastPicked: string | null;
  routeScore: number; // avg aisles visited per order containing this SKU
  slottingScore: number; // 0-100, how well placed based on ML/OR analysis
  coCluster: string; // affinity cluster name
  coScore: number; // co-occurrence score with cluster neighbors (0-100)
  stock: number; maxStock: number;
}

const CATS = ["Huishoudelijk","Beauty","Speelgoed","Food","Tuin & Seizoen","Kleding","Kantoor","Dier","Decoratie"];
const PRODS: Record<string,string[]> = {
  Huishoudelijk:["Afwasmiddel 500ml","Allesreiniger Spray","WC-Reiniger","Schoonmaakdoekjes 80st","Waspoeder 2kg"],
  Beauty:["Shampoo Argan 300ml","Douchegel Kokos","Handcrème Aloe","Tandpasta Fresh Mint","Deodorant Sport"],
  Speelgoed:["Puzzel 500st Dieren","Kleurpotloden 24st","Speelgoedauto Rood","Knuffel Beer 30cm","Kaartspel Uno"],
  Food:["Chips Paprika 200g","Chocoladereep Puur","Nootjes Mix 300g","Popcorn Zoet","Koekjes Boter 250g"],
  "Tuin & Seizoen":["BBQ Houtskool 3kg","Tuinkaars Citronella","Plantenpot 20cm","Gieter 5L Groen","Zaadjes Tomaat"],
  Kleding:["Sokken Maat 39-42","T-shirt Basic Wit","Cap Zwart","Sjaal Wol Grijs","Riem Leder Bruin"],
  Kantoor:["Balpen Blauw 10st","Notitieboek A5 Lijntjes","Plakband 3st","Schaar RVS 21cm","Markeerstiften 6st"],
  Dier:["Hondenvoer Kip 500g","Kattenvoer Zalm","Kattenbakkorrels 10L","Hondensnoepjes Dental","Voerbak RVS"],
  Decoratie:["Kaars 15cm Wit 3st","Fotolijst Eiken 13x18","Vaas Glas Cilinder","Kussen Velvet 45x45","Kunstbloem Roos"],
};

function rng(seed:number){let s=seed;return()=>{s=(s*16807)%2147483647;return s/2147483647;};}

function genLocs():Loc[]{
  const r=rng(42);const locs:Loc[]=[];let idx=0;
  for(let a=0;a<NUM_AISLES;a++)for(const side of["L","R"]as const)
    for(let p=1;p<=RACKS_PER_SIDE;p++)for(let l=1;l<=5;l++){
      idx++;const d=(a/NUM_AISLES+(l-1)/5)/2;const empty=r()<0.04;
      const vel:Velocity=empty?"empty":d<0.15?"A":d<0.35?"B":d<0.6?"C":"D";
      const cat=empty?null:CATS[Math.floor(r()*CATS.length)];
      const prods=cat?PRODS[cat]:null;
      const pw=vel==="A"?30+Math.floor(r()*70):vel==="B"?10+Math.floor(r()*25):vel==="C"?2+Math.floor(r()*10):vel==="D"?Math.floor(r()*3):0;
      locs.push({
        id:`A${String(a+1).padStart(2,"0")}-${side}${String(p).padStart(2,"0")}-L${l}`,
        aisle:a,side:side as"L"|"R",position:p,level:l,velocity:vel,
        skuId:empty?null:`SKU-${String(idx).padStart(5,"0")}`,
        skuName:empty?null:prods?prods[Math.floor(r()*prods.length)]:null,
        category:cat,picksWeek:pw,picksMonth:pw*4+Math.floor(r()*pw),
        lastPicked:empty?null:`${Math.floor(r()*48)}u geleden`,
        routeScore:empty?0:vel==="A"?1.2+r()*0.8:vel==="B"?1.8+r()*1.2:vel==="C"?2.5+r()*1.5:3.5+r()*2,
        slottingScore:empty?0:vel==="A"&&a<5?80+Math.floor(r()*20):vel==="A"&&a>=8?15+Math.floor(r()*20):vel==="D"&&a<3?20+Math.floor(r()*15):35+Math.floor(r()*45),
        coCluster:empty?"":["Schoonmaak","Beauty Basics","Snacks & Snoep","Tuin & Buiten","Kantoor Essentials","Huisdier","Seizoen Deco","Kids Fun","Keuken"][Math.floor((a+Math.floor(r()*3))%9)],
        coScore:empty?0:40+Math.floor(r()*60),
        maxStock:vel==="A"?48:vel==="B"?36:vel==="C"?24:12,
        stock:empty?0:vel==="A"?8+Math.floor(r()*40):vel==="B"?5+Math.floor(r()*30):vel==="C"?2+Math.floor(r()*22):Math.floor(r()*12),
      });
    }
  return locs;
}

const LOCS=genLocs();
const VCOL:Record<Velocity,string>={A:"#ff5c7c",B:"#ffb340",C:"#4da8ff",D:"#6478a0",empty:"transparent"};

const PROBLEMS=[
  {sev:"critical"as const,msg:"Co-occurrence cluster 'Schoonmaak' verspreid over 5 gangpaden — ML detecteert 34% route-verlies"},
  {sev:"critical"as const,msg:"Gangpad A03: 3.2× meer picks dan A12 — zone-balancering door OR-solver aanbevolen"},
  {sev:"warning"as const,msg:"Seizoenspatroon gedetecteerd: tuin-SKUs velocity stijgt 280% — herclassificatie aanbevolen"},
  {sev:"warning"as const,msg:"Affinity cluster 'Beauty Basics' gefragmenteerd — 6 gangpaden i.p.v. optimaal 2"},
  {sev:"info"as const,msg:"ML-model: 23 D-class SKUs blokkeren high-frequency posities — swap kandidaten geïdentificeerd"},
];

/* ═══ SIDEBAR ═══ */
function Sidebar({active,onChange}:{active:string;onChange:(v:string)=>void}){
  const items=[
    {id:"overview",label:"Overzicht",icon:"⊞"},
    {id:"warehouse",label:"Warehouse Map",icon:"⊟"},
    {id:"problems",label:"Problemen",icon:"⚡",badge:5},
    {id:"optimize",label:"Optimalisatie",icon:"◉"},
    {id:"movements",label:"Verplaatsingen",icon:"⇄"},
    {id:"opex",label:"Opex Impact",icon:"€"},
  ];
  return(
    <div style={{width:240,minHeight:"100vh",background:"var(--bg-surface)",borderRight:"1px solid var(--border-medium)",display:"flex",flexDirection:"column",padding:"20px 0",animation:"slideInLeft 0.35s var(--ease-out) backwards",position:"relative",zIndex:2}}>
      <div style={{padding:"0 20px",marginBottom:32}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:2}}>
          <div style={{width:30,height:30,borderRadius:10,background:"linear-gradient(135deg, var(--accent-purple), var(--velocity-a))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff",boxShadow:"0 2px 8px rgba(139,111,255,0.25)"}}>S</div>
          <span style={{fontSize:17,fontWeight:800,letterSpacing:"-0.03em"}}>SlotPilot</span>
        </div>
        <span style={{fontSize:10,fontWeight:500,color:"var(--text-tertiary)",letterSpacing:"0.06em",textTransform:"uppercase"}}>Warehouse Intelligence</span>
        <div style={{width:40,height:2,borderRadius:1,background:"var(--accent-cict)",marginTop:8,opacity:0.6}}/>
      </div>
      <nav className="stagger" style={{padding:"0 10px",flex:1,display:"flex",flexDirection:"column",gap:2}}>
        {items.map(it=>(
          <button key={it.id} onClick={()=>onChange(it.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:"var(--radius-sm)",border:"none",cursor:"pointer",background:active===it.id?"var(--accent-purple-soft)":"transparent",color:active===it.id?"var(--accent-purple)":"var(--text-secondary)",fontSize:13,fontWeight:active===it.id?600:450,fontFamily:"var(--font-sans)",transition:"all 0.15s ease"}}>
            <span style={{width:18,textAlign:"center",fontSize:13}}>{it.icon}</span>
            <span style={{flex:1,textAlign:"left"}}>{it.label}</span>
            {it.badge&&<span style={{background:"var(--accent-red)",color:"#fff",fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:"var(--radius-full)",minWidth:18,textAlign:"center"}}>{it.badge}</span>}
          </button>
        ))}
      </nav>
      <div style={{padding:"16px 20px",borderTop:"1px solid var(--border-light)"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"var(--text-tertiary)",marginBottom:8}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:"var(--accent-green)"}}/>WMS Connected — DC Echt
        </div>
        <div style={{fontSize:10,color:"var(--text-tertiary)",marginBottom:14}}>Laatste sync: 4 min geleden</div>
        {/* CICT Logo */}
        <div style={{display:"flex",alignItems:"center",gap:8,opacity:0.7}}>
          <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
            {/* Yellow background square */}
            <rect x="5" y="5" width="55" height="55" rx="4" fill="var(--accent-cict)" style={{animation:"cictFadeIn 0.8s ease-out 0.5s backwards"}}/>
            {/* Arc/swoosh */}
            <path d="M 52 8 Q 8 8, 8 52" stroke="#1a1a2e" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray="120" style={{animation:"cictArcDraw 1.2s ease-out 0.8s backwards"}}/>
            {/* C letter */}
            <text x="22" y="52" fontSize="38" fontWeight="900" fill="#1a1a2e" fontFamily="var(--font-sans)" style={{animation:"cictFadeIn 0.6s ease-out 1.2s backwards"}}>C</text>
            {/* ICT text */}
            <text x="48" y="80" fontSize="26" fontWeight="900" fill="var(--text-primary)" fontFamily="var(--font-sans)" style={{animation:"cictFadeIn 0.6s ease-out 1.4s backwards"}}>ICT</text>
          </svg>
          <div>
            <div style={{fontSize:9,fontWeight:700,color:"var(--text-tertiary)",letterSpacing:"0.03em"}}>POWERED BY</div>
            <div style={{fontSize:11,fontWeight:700,color:"var(--accent-cict)"}}>CICT Innovations</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ ZOOMABLE WAREHOUSE MAP WITH LIVE PICKS ═══ */
function Map({level,onHover,onSelect,onShowProposal,clearSuboptimal}:{level:number;onHover:(l:Loc|null,x:number,y:number)=>void;onSelect:(l:Loc|null)=>void;onShowProposal:()=>void;clearSuboptimal:boolean}){
  const filtered=level===0?LOCS.filter(l=>l.level===1):LOCS.filter(l=>l.level===level);
  const [scale,setScale]=useState(1);
  const [pan,setPan]=useState({x:0,y:0});
  const [dragging,setDragging]=useState(false);
  const [activePicks,setActivePicks]=useState<Set<string>>(new Set());
  const [pickCount,setPickCount]=useState(0);
  const dragStart=useRef({x:0,y:0,px:0,py:0});
  const containerRef=useRef<HTMLDivElement>(null);

  // Suboptimal locations — detected after enough picks
  const [suboptimal,setSuboptimal]=useState<Set<string>>(new Set());

  // Clear suboptimal when confirmed
  useEffect(()=>{
    if(clearSuboptimal){setSuboptimal(new Set());}
  },[clearSuboptimal]);

  // Live pick simulation + suboptimal detection
  useEffect(()=>{
    const nonEmpty=LOCS.filter(l=>l.velocity!=="empty"&&l.level===1);
    let totalPicks=0;
    let detected=false;

    const interval=setInterval(()=>{
      // Simulate picks
      const count=1+Math.floor(Math.random()*3);
      const picked=new Set<string>();
      for(let i=0;i<count;i++){
        const loc=nonEmpty[Math.floor(Math.random()*nonEmpty.length)];
        picked.add(loc.id);
      }
      setActivePicks(picked);
      totalPicks+=picked.size;
      setPickCount(totalPicks);
      setTimeout(()=>setActivePicks(new Set()),600);

      // After 20 picks, detect suboptimal
      if(totalPicks>=20&&!detected){
        detected=true;
        const subs=new Set<string>();
        nonEmpty.forEach(l=>{
          // High-frequency items with poor co-occurrence clustering
          if(l.picksWeek>30&&l.coScore<50) subs.add(l.id);
          // Low-frequency items in high-traffic zones blocking better candidates
          if(l.picksWeek<5&&l.aisle<=3&&l.velocity!=="A") subs.add(l.id);
          // Items with high route score (causing many aisle visits)
          if(l.routeScore>3.0&&l.picksWeek>15) subs.add(l.id);
        });
        setSuboptimal(subs);
      }
    },900);

    return()=>clearInterval(interval);
  },[]);

  const onWheel=useCallback((e:React.WheelEvent)=>{
    e.preventDefault();
    const el=containerRef.current;
    if(!el)return;
    const rect=el.getBoundingClientRect();
    const mx=e.clientX-rect.left;
    const my=e.clientY-rect.top;
    const f=e.deltaY>0?0.92:1.08;
    const ns=Math.min(10,Math.max(0.8,scale*f));
    setPan(p=>({x:mx-(mx-p.x)*(ns/scale),y:my-(my-p.y)*(ns/scale)}));
    setScale(ns);
  },[scale]);

  const onDown=useCallback((e:React.MouseEvent)=>{if(e.button!==0)return;setDragging(true);dragStart.current={x:e.clientX,y:e.clientY,px:pan.x,py:pan.y};},[pan]);
  const onMove=useCallback((e:React.MouseEvent)=>{if(!dragging)return;setPan({x:dragStart.current.px+e.clientX-dragStart.current.x,y:dragStart.current.py+e.clientY-dragStart.current.y});},[dragging]);
  const onUp=useCallback(()=>setDragging(false),[]);

  return(
    <div ref={containerRef} onWheel={onWheel} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
      style={{flex:1,overflow:"hidden",background:"transparent",cursor:dragging?"grabbing":"grab",position:"relative",zIndex:1}}>
      {/* Zoom + live picks indicator */}
      <div style={{position:"absolute",top:12,left:12,zIndex:5,display:"flex",gap:8}}>
        <div style={{padding:"5px 12px",borderRadius:"var(--radius-full)",background:"var(--bg-elevated)",border:"1px solid var(--border-medium)",fontSize:11,fontWeight:500,color:"var(--text-secondary)",fontFamily:"var(--font-mono)"}}>
          {Math.round(scale*100)}%
        </div>
        <div style={{padding:"5px 12px",borderRadius:"var(--radius-full)",background:"var(--bg-elevated)",border:"1px solid var(--border-medium)",fontSize:11,fontWeight:500,display:"flex",alignItems:"center",gap:6}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:"var(--accent-green)",animation:"pulse 1.5s ease infinite"}}/>
          <span style={{color:"var(--accent-green)",fontFamily:"var(--font-mono)"}}>{pickCount} picks</span>
          <span style={{color:"var(--text-tertiary)"}}>live</span>
        </div>
      </div>
      {/* Suboptimal alert — fixed position so it's not clipped by overflow:hidden */}
      {suboptimal.size>0&&(
        <div style={{position:"fixed",top:70,left:260,zIndex:100}}>
          <SuboptimalAlert count={suboptimal.size} onViewProposal={onShowProposal}/>
        </div>
      )}
      {/* Zoomable content */}
      <div style={{transform:`translate(${pan.x}px,${pan.y}px) scale(${scale})`,transformOrigin:"0 0",padding:"20px 24px",willChange:"transform"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 14px",borderRadius:"var(--radius-full)",background:"rgba(54,216,158,0.12)",border:"1px solid rgba(54,216,158,0.25)",fontSize:11,fontWeight:600,color:"var(--accent-green)",marginBottom:14}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:"var(--accent-green)",animation:"pulse 2s ease infinite"}}/>PICKING START · Live monitoring actief
        </div>
        <div style={{display:"flex",gap:8}}>
          {Array.from({length:NUM_AISLES},(_,ai)=>{
            const al=filtered.filter(l=>l.aisle===ai);
            const left=al.filter(l=>l.side==="L").sort((a,b)=>a.position-b.position);
            const right=al.filter(l=>l.side==="R").sort((a,b)=>a.position-b.position);
            const totalPicks=al.reduce((s,l)=>s+l.picksWeek,0);
            return(
              <div key={ai} className="aisle-enter" style={{display:"flex",flexDirection:"column",alignItems:"center",animationDelay:`${ai*0.06}s`}}>
                <div style={{textAlign:"center",marginBottom:4}}>
                  <div style={{fontSize:11,fontWeight:700,fontFamily:"var(--font-mono)",color:"var(--text-secondary)"}}>A{String(ai+1).padStart(2,"0")}</div>
                  <div style={{fontSize:9,color:"var(--text-tertiary)",fontWeight:500}}>{totalPicks}/wk</div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  {[left,right].map((side,si)=>(
                    <div key={si} style={{display:"flex",flexDirection:"column",gap:1}}>
                      {side.map((loc,ci)=>(
                        <div key={loc.id}
                          onMouseEnter={(e)=>{e.stopPropagation();onHover(loc,e.clientX,e.clientY);}}
                          onMouseLeave={()=>onHover(null,0,0)}
                          onClick={(e)=>{e.stopPropagation();onSelect(loc);}}
                          style={{
                            width:14,height:7,borderRadius:2,
                            background:VCOL[loc.velocity],
                            opacity:loc.velocity==="empty"?0:0.9,
                            cursor:loc.velocity!=="empty"?"pointer":"default",
                            ...(activePicks.has(loc.id)
                              ?{animation:"pickFlash 0.6s ease-out",zIndex:5}
                              :suboptimal.has(loc.id)
                              ?{animation:"suboptimalPulse 2s ease-in-out infinite",outline:"1.5px solid rgba(255,92,108,0.6)",outlineOffset:"1px",zIndex:3}
                              :{animation:`cellAppear 0.3s var(--ease-spring) ${ai*0.06+ci*0.008}s backwards`}),
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══ SUBOPTIMAL ALERT ═══ */
function SuboptimalAlert({count,onViewProposal}:{count:number;onViewProposal:()=>void}){
  return(
    <div style={{padding:"10px 20px",borderRadius:"var(--radius-md)",background:"#2a1520",border:"1px solid rgba(255,92,108,0.3)",boxShadow:"0 4px 20px rgba(255,92,108,0.15)",display:"flex",alignItems:"center",gap:12,animation:"slideUp 0.4s var(--ease-out) backwards",maxWidth:500}}>
      <span style={{width:8,height:8,borderRadius:"50%",background:"var(--accent-red)",animation:"pulse 1.5s ease infinite",flexShrink:0}}/>
      <div style={{flex:1}}>
        <div style={{fontSize:12,fontWeight:600,color:"var(--accent-red)",marginBottom:2}}>Suboptimale slotting gedetecteerd</div>
        <div style={{fontSize:11,color:"var(--text-secondary)"}}>{count} locaties vereisen herslotting — co-occurrence clusters verbroken, route-efficiëntie suboptimaal</div>
      </div>
      <button onClick={onViewProposal} style={{padding:"6px 16px",borderRadius:"var(--radius-sm)",background:"var(--accent-red)",color:"#fff",border:"none",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",transition:"transform 0.1s ease"}} onMouseOver={e=>{e.currentTarget.style.transform="scale(1.05)"}} onMouseOut={e=>{e.currentTarget.style.transform="scale(1)"}}>Bekijk voorstel</button>
    </div>
  );
}

/* ═══ RESLOT PROPOSAL PANEL ═══ */
function ReslotProposal({suboptimalCount,onConfirm,onCancel}:{suboptimalCount:number;onConfirm:()=>void;onCancel:()=>void}){
  const [holding,setHolding]=useState(false);
  const [holdProgress,setHoldProgress]=useState(0);
  const [confirmed,setConfirmed]=useState(false);
  const holdTimer=useRef<ReturnType<typeof setInterval>|null>(null);

  const startHold=()=>{
    setHolding(true);
    setHoldProgress(0);
    let p=0;
    holdTimer.current=setInterval(()=>{
      p+=2;
      setHoldProgress(p);
      if(p>=100){
        if(holdTimer.current) clearInterval(holdTimer.current);
        setConfirmed(true);
        setTimeout(()=>onConfirm(),1500);
      }
    },30);
  };
  const cancelHold=()=>{
    setHolding(false);
    setHoldProgress(0);
    if(holdTimer.current) clearInterval(holdTimer.current);
  };

  const moves=[
    {from:"A09-L14-L1",to:"A03-R03-L1",sku:"Afwasmiddel 500ml",reason:"Co-occurrence 87% met WC-Reiniger & Schoonmaakdoekjes — cluster hergroeperen verlaagt gangpaden/order van 4.2 → 2.1",cat:"Huishoudelijk"},
    {from:"A11-R08-L1",to:"A04-L07-L1",sku:"Chips Paprika 200g",reason:"Top-5 co-picked met Chocoladereep & Nootjes Mix — plaatsing in Snacks-cluster verlaagt route-score 38%",cat:"Food"},
    {from:"A10-L19-L1",to:"A03-R01-L1",sku:"Shampoo Argan 300ml",reason:"Beauty-cluster verspreid over 5 gangpaden — hergroeperen bespaart 1.3 gangpad/order gemiddeld",cat:"Beauty"},
    {from:"A02-L04-L1",to:"A12-R11-L1",sku:"Riem Leder Bruin",reason:"2 picks/wk bezet high-frequency zone — vrijmaken voor snelloper verhoogt zone-efficiëntie 15%",cat:"Kleding"},
    {from:"A01-R09-L1",to:"A14-L06-L1",sku:"Kunstbloem Roos",reason:"1 pick/wk, ML-model detecteert 0% co-occurrence met zone-cluster — verplaatsen naar low-frequency zone",cat:"Decoratie"},
  ];

  // Confirmed state — don't replace panel, toaster is shown separately


  return(
    <div style={{width:420,minHeight:"100%",background:"var(--bg-surface)",borderLeft:"1px solid var(--border-light)",overflow:"auto",animation:"slideInRight 0.3s var(--ease-out)",padding:"24px",boxShadow:"-4px 0 16px rgba(0,0,0,0.2)"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>Herslotting voorstel</div>
          <div style={{fontSize:12,color:"var(--text-secondary)"}}>{moves.length} verplaatsingen · {suboptimalCount} locaties betrokken</div>
        </div>
        <button onClick={onCancel} style={{width:28,height:28,borderRadius:"var(--radius-sm)",border:"1px solid var(--border-light)",background:"var(--bg-subtle)",color:"var(--text-secondary)",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>

      {/* Impact summary */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        <div style={{background:"var(--bg-card)",borderRadius:"var(--radius-sm)",padding:12}}>
          <div style={{fontSize:10,color:"var(--text-tertiary)",marginBottom:3}}>Gangpaden/order reductie</div>
          <div style={{fontSize:20,fontWeight:700,fontFamily:"var(--font-mono)",color:"var(--accent-green)"}}>-1.4</div>
          <div style={{fontSize:10,color:"var(--text-tertiary)"}}>gem. per order</div>
        </div>
        <div style={{background:"var(--bg-card)",borderRadius:"var(--radius-sm)",padding:12}}>
          <div style={{fontSize:10,color:"var(--text-tertiary)",marginBottom:3}}>Route-efficiëntie</div>
          <div style={{fontSize:20,fontWeight:700,fontFamily:"var(--font-mono)",color:"var(--accent-green)"}}>+23%</div>
          <div style={{fontSize:10,color:"var(--text-tertiary)"}}>ML-geoptimaliseerd</div>
        </div>
      </div>

      {/* Movement list */}
      <div style={{fontSize:10,color:"var(--text-tertiary)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10,fontWeight:600}}>Voorgestelde verplaatsingen</div>
      {moves.map((m,i)=>(
        <div key={i} style={{background:"var(--bg-card)",borderRadius:"var(--radius-sm)",padding:12,marginBottom:8,animation:`fadeInUp 0.3s var(--ease-out) ${i*0.05}s backwards`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <span style={{fontSize:12,fontWeight:600}}>{m.sku}</span>
            <span style={{fontSize:10,color:"var(--text-tertiary)",background:"var(--bg-elevated)",padding:"2px 8px",borderRadius:"var(--radius-full)"}}>{m.cat}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <span style={{fontSize:11,fontFamily:"var(--font-mono)",color:"var(--accent-red)"}}>{m.from}</span>
            <span style={{fontSize:11,color:"var(--text-tertiary)"}}>→</span>
            <span style={{fontSize:11,fontFamily:"var(--font-mono)",color:"var(--accent-green)"}}>{m.to}</span>
          </div>
          <div style={{fontSize:10,color:"var(--text-tertiary)"}}>{m.reason}</div>
        </div>
      ))}

      {/* Hold to Slot button */}
      <div style={{marginTop:20,position:"sticky",bottom:0,paddingTop:16,paddingBottom:8,background:"var(--bg-surface)"}}>
        <button
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          style={{
            width:"100%",height:52,borderRadius:"var(--radius-md)",border:"2px solid",
            borderColor:holding?"var(--accent-green)":"var(--border-medium)",
            cursor:"pointer",
            background:holding?`linear-gradient(90deg, rgba(54,216,158,0.25) ${holdProgress}%, var(--bg-elevated) ${holdProgress}%)`:"var(--bg-elevated)",
            color:holding?"var(--accent-green)":"var(--text-primary)",
            fontSize:14,fontWeight:700,
            transition:holding?"none":"all 0.2s ease",
            position:"relative",overflow:"hidden",
            userSelect:"none",
            touchAction:"none",
          }}
        >
          {holding?`${Math.round(holdProgress)}% — Blijf vasthouden...`:"⏎ Houd ingedrukt om naar WMS te sturen"}
        </button>
        <div style={{fontSize:10,color:"var(--text-tertiary)",textAlign:"center",marginTop:8}}>
          Verplaatsingsinstructies worden direct naar het WMS verzonden
        </div>
      </div>
    </div>
  );
}

/* ═══ CONFIRMATION TOASTER — celebration style, top right ═══ */
function ConfirmToaster({onDone}:{onDone:()=>void}){
  useEffect(()=>{const t=setTimeout(onDone,3000);return()=>clearTimeout(t);},[onDone]);
  // Generate confetti particles — spread across full width
  const confetti=useRef(Array.from({length:40},(_,i)=>({
    x:Math.random()*320-10,
    y:-10-Math.random()*40,
    rot:Math.random()*360,
    color:["#ff5c7c","#ffb340","#4da8ff","#36d89e","#8b6fff","#ffbe30"][i%6],
    size:4+Math.random()*6,
    delay:Math.random()*0.4,
    dur:1.2+Math.random()*0.8,
  })));
  return(
    <div style={{position:"fixed",top:20,right:20,zIndex:200,animation:"toasterIn 0.5s var(--ease-out)"}}>
      <div style={{width:320,padding:"24px",borderRadius:"var(--radius-lg)",background:"var(--bg-surface)",border:"1px solid rgba(54,216,158,0.25)",boxShadow:"0 12px 48px rgba(0,0,0,0.5), 0 0 30px rgba(54,216,158,0.08)",position:"relative",overflow:"hidden"}}>
        {/* Confetti */}
        {confetti.current.map((c,i)=>(
          <div key={i} style={{
            position:"absolute",left:c.x,top:c.y,
            width:c.size,height:c.size*0.6,borderRadius:1,
            background:c.color,opacity:0.9,
            transform:`rotate(${c.rot}deg)`,
            animation:`confettiFall ${c.dur}s ease-in ${c.delay}s forwards`,
          }}/>
        ))}
        {/* Content */}
        <div style={{textAlign:"center",position:"relative",zIndex:1}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(54,216,158,0.12)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",animation:"checkPop 0.5s var(--ease-out) 0.15s backwards"}}>
            <span style={{fontSize:28,color:"var(--accent-green)"}}>✓</span>
          </div>
          <div style={{fontSize:16,fontWeight:800,color:"var(--text-primary)",marginBottom:6}}>Herslotting bevestigd</div>
          <div style={{fontSize:13,color:"var(--accent-green)",fontWeight:600,marginBottom:4}}>5 verplaatsingen verzonden naar WMS</div>
          <div style={{fontSize:12,color:"var(--text-secondary)",marginBottom:16}}>Route-efficiëntie +23% · Co-occurrence clusters hersteld</div>
          <div style={{fontSize:11,color:"var(--text-tertiary)",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"var(--accent-green)",animation:"pulse 1s ease infinite"}}/>
            WMS instructies worden verwerkt
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ TOOLTIP ═══ */
function Tip({loc,x,y}:{loc:Loc;x:number;y:number}){
  return(
    <div style={{position:"fixed",left:x+14,top:y-8,background:"#1e2030",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"var(--radius-md)",padding:"14px 18px",minWidth:250,boxShadow:"0 8px 32px rgba(0,0,0,0.6)",zIndex:1000,animation:"tooltipPop 0.15s var(--ease-out)",pointerEvents:"none"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <span style={{fontFamily:"var(--font-mono)",fontSize:12,fontWeight:600}}>{loc.id}</span>
        <span style={{fontSize:10,fontWeight:700,padding:"2px 10px",borderRadius:"var(--radius-full)",background:VCOL[loc.velocity],color:"#fff"}}>{loc.velocity==="empty"?"Leeg":`${loc.velocity}-class`}</span>
      </div>
      {loc.skuName&&<div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{loc.skuName}</div>}
      {loc.category&&<div style={{fontSize:11,color:"var(--text-tertiary)",marginBottom:10}}>{loc.category}</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 20px"}}>
        {[
          {label:"Picks/week",val:String(loc.picksWeek),color:loc.picksWeek>50?"var(--velocity-a)":"var(--text-primary)"},
          {label:"Route score",val:`${loc.routeScore.toFixed(1)} gangp/order`,color:loc.routeScore<2?"var(--accent-green)":loc.routeScore>3?"var(--accent-red)":"var(--accent-amber)"},
          {label:"Co-occurrence",val:`${loc.coScore}%`,color:loc.coScore>70?"var(--accent-green)":loc.coScore<40?"var(--accent-red)":"var(--accent-amber)"},
          {label:"Slotting score",val:`${loc.slottingScore}%`,color:loc.slottingScore>70?"var(--accent-green)":loc.slottingScore<35?"var(--accent-red)":"var(--accent-amber)"},
        ].map((m,i)=>(
          <div key={i}><div style={{fontSize:10,color:"var(--text-tertiary)",marginBottom:2}}>{m.label}</div><div style={{fontSize:13,fontWeight:600,fontFamily:"var(--font-mono)",color:m.color}}>{m.val}</div></div>
        ))}
      </div>
    </div>
  );
}

/* ═══ CIRCULAR GAUGE (Apple Watch style) ═══ */
function Gauge({value,max,label,color,size=64}:{value:number;max:number;label:string;color:string;size?:number}){
  const pct=Math.min(100,Math.max(0,(value/max)*100));
  const r=(size-8)/2;
  const circ=2*Math.PI*r;
  const offset=circ-(pct/100)*circ;
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth={5}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{transition:"stroke-dashoffset 0.8s var(--ease-out)"}}/>
      </svg>
      <div style={{position:"relative",marginTop:-size+4,width:size,height:size,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontSize:16,fontWeight:800,fontFamily:"var(--font-mono)",color}}>{Math.round(pct)}%</div>
      </div>
      <div style={{fontSize:9,color:"var(--text-tertiary)",fontWeight:500,textAlign:"center",marginTop:2}}>{label}</div>
    </div>
  );
}

/* ═══ BKLIT-STYLE BAR CHART ═══ */
function BklitBarChart({data,color}:{data:number[];color:string}){
  const max=Math.max(...data,1);
  return(
    <div style={{display:"flex",alignItems:"flex-end",gap:3,height:72,padding:"0 2px"}}>
      {data.map((v,i)=>{
        const h=Math.max(3,(v/max)*72);
        const isRecent=i>=data.length-7;
        return(
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"flex-end",alignItems:"center",gap:0}}>
            <div style={{
              width:"100%",height:h,
              borderRadius:"4px 4px 2px 2px",
              background:isRecent?`linear-gradient(180deg, ${color}, ${color}88)`:
                `linear-gradient(180deg, var(--bg-elevated), var(--bg-card))`,
              opacity:isRecent?0.9:0.4,
              transition:"height 0.4s var(--ease-out)",
            }}/>
          </div>
        );
      })}
    </div>
  );
}

/* ═══ BKLIT-STYLE FUNNEL CHART ═══ */
function BklitFunnel({data}:{data:{label:string;value:number;color:string}[]}){
  const max=data[0]?.value||1;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {data.map((d,i)=>{
        const pct=(d.value/max)*100;
        return(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,animation:`fadeInUp 0.3s var(--ease-out) ${i*0.08}s backwards`}}>
            <div style={{width:80,fontSize:10,color:"var(--text-tertiary)",textAlign:"right",flexShrink:0}}>{d.label}</div>
            <div style={{flex:1,height:24,background:"var(--bg-elevated)",borderRadius:6,overflow:"hidden",position:"relative"}}>
              <div style={{
                width:`${pct}%`,height:"100%",
                borderRadius:6,
                background:`linear-gradient(90deg, ${d.color}, ${d.color}99)`,
                transition:"width 0.6s var(--ease-out)",
                display:"flex",alignItems:"center",paddingLeft:8,
              }}>
                <span style={{fontSize:10,fontWeight:700,color:"#fff",fontFamily:"var(--font-mono)",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>{d.value.toLocaleString()}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══ DETAIL TOASTER — compact floating panel with tabs ═══ */
function Detail({loc,onClose}:{loc:Loc;onClose:()=>void}){
  const[tab,setTab]=useState(0);
  const r=rng(loc.id.charCodeAt(3)*100+loc.position);
  const barData=Array.from({length:28},()=>Math.max(1,Math.round(r()*(loc.velocity==="A"?80:loc.velocity==="B"?40:loc.velocity==="C"?15:5))));
  const funnelData=[
    {label:"Dagorders",value:3500,color:"var(--accent-purple)"},
    {label:"Dit SKU",value:Math.round(loc.picksWeek*5.2),color:"var(--velocity-a)"},
    {label:"Deze zone",value:Math.round(loc.picksWeek*3.8),color:"var(--velocity-b)"},
    {label:"Locatie",value:loc.picksWeek,color:"var(--accent-green)"},
  ];
  const tabs=["Overzicht","Charts","AI Analyse"];

  return(
    <div style={{position:"fixed",bottom:24,right:24,width:340,background:"var(--bg-surface)",border:"1px solid var(--border-medium)",borderRadius:"var(--radius-lg)",overflow:"hidden",animation:"toasterIn 0.4s var(--ease-out)",boxShadow:"var(--shadow-xl)",zIndex:50}}>
      {/* Header — compact */}
      <div style={{padding:"12px 16px",borderBottom:"1px solid var(--border-light)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:"var(--radius-full)",background:VCOL[loc.velocity],color:"#fff"}}>{loc.velocity}</span>
          <div>
            <div style={{fontSize:12,fontWeight:700,fontFamily:"var(--font-mono)"}}>{loc.id}</div>
            <div style={{fontSize:10,color:"var(--text-tertiary)"}}>{loc.skuName} · {loc.stock}/{loc.maxStock}</div>
          </div>
        </div>
        <button onClick={onClose} style={{width:22,height:22,borderRadius:6,border:"1px solid var(--border-light)",background:"var(--bg-subtle)",color:"var(--text-tertiary)",cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:"1px solid var(--border-light)"}}>
        {tabs.map((t,i)=>(
          <button key={i} onClick={()=>setTab(i)} style={{flex:1,padding:"8px 0",border:"none",cursor:"pointer",fontSize:10,fontWeight:tab===i?600:400,color:tab===i?"var(--accent-purple)":"var(--text-tertiary)",background:"transparent",borderBottom:tab===i?"2px solid var(--accent-purple)":"2px solid transparent",transition:"all 0.15s ease",fontFamily:"var(--font-sans)"}}>{t}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{padding:"14px 16px",maxHeight:320,overflow:"auto"}}>

        {/* Tab 0: Overzicht */}
        {tab===0&&(
          <div>
            {/* Gauges */}
            <div style={{display:"flex",justifyContent:"space-around",marginBottom:12}}>
              <Gauge value={loc.slottingScore} max={100} label="Slotting" color={loc.slottingScore>70?"var(--accent-green)":loc.slottingScore<35?"var(--accent-red)":"var(--accent-amber)"} size={56}/>
              <Gauge value={loc.coScore} max={100} label="Co-occur." color={loc.coScore>70?"var(--accent-green)":loc.coScore<40?"var(--accent-red)":"var(--accent-amber)"} size={56}/>
              <Gauge value={Math.round((1-(loc.routeScore-1)/4)*100)} max={100} label="Route" color={loc.routeScore<2?"var(--accent-green)":loc.routeScore>3?"var(--accent-red)":"var(--accent-amber)"} size={56}/>
            </div>
            {/* Metrics */}
            <div style={{display:"flex",gap:6,marginBottom:12}}>
              {[{l:"Picks/wk",v:String(loc.picksWeek)},{l:"Gangp.",v:loc.routeScore.toFixed(1)},{l:"Cluster",v:loc.coCluster}].map((m,i)=>(
                <div key={i} style={{flex:1,background:"var(--bg-card)",borderRadius:6,padding:"6px 8px",textAlign:"center"}}>
                  <div style={{fontSize:8,color:"var(--text-tertiary)"}}>{m.l}</div>
                  <div style={{fontSize:12,fontWeight:700,fontFamily:"var(--font-mono)"}}>{m.v}</div>
                </div>
              ))}
            </div>
            {/* Co-picked */}
            <div style={{fontSize:9,color:"var(--text-tertiary)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6,fontWeight:600}}>Vaak samen gepickt</div>
            {["Afwasmiddel 500ml","WC-Reiniger","Schoonmaakdoekjes"].map((n,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:i<2?"1px solid var(--border-light)":"none",fontSize:10}}>
                <span style={{fontWeight:500}}>{n}</span>
                <span style={{fontFamily:"var(--font-mono)",color:"var(--text-tertiary)"}}>{85-i*12}%</span>
              </div>
            ))}
          </div>
        )}

        {/* Tab 1: Charts */}
        {tab===1&&(
          <div>
            <div style={{fontSize:9,color:"var(--text-tertiary)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8,fontWeight:600}}>Pick frequentie — 4 weken</div>
            <BklitBarChart data={barData} color={VCOL[loc.velocity]}/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:"var(--text-tertiary)",marginTop:4,marginBottom:16}}><span>4w geleden</span><span>Nu</span></div>

            <div style={{fontSize:9,color:"var(--text-tertiary)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8,fontWeight:600}}>Pick Flow Funnel</div>
            <FunnelChart
              data={funnelData.map((d,i)=>({
                label:d.label,
                value:d.value,
                gradient:[
                  {offset:"0%",color:i===0?"var(--accent-purple)":i===1?"var(--velocity-a)":i===2?"var(--velocity-b)":"var(--accent-green)"},
                  {offset:"100%",color:i===0?"var(--velocity-a)":i===1?"var(--velocity-b)":i===2?"var(--accent-green)":"var(--accent-green)"},
                ],
              }))}
              layers={3}
              showPercentage={true}
              showValues={true}
              showLabels={true}
              edges="curved"
              style={{aspectRatio:"2.5/1"}}
            />
          </div>
        )}

        {/* Tab 2: AI Analyse */}
        {tab===2&&(
          <div>
            <div style={{background:loc.slottingScore<35?"rgba(255,92,108,0.06)":"rgba(54,216,158,0.06)",borderRadius:8,padding:12,marginBottom:12,border:`1px solid ${loc.slottingScore<35?"rgba(255,92,108,0.12)":"rgba(54,216,158,0.12)"}`}}>
              <div style={{fontSize:11,fontWeight:600,marginBottom:3,color:loc.slottingScore<35?"var(--accent-red)":"var(--accent-green)"}}>{loc.slottingScore<35?"⚠ Herslotting aanbevolen":"✓ Optimaal geslot"}</div>
              <div style={{fontSize:10,color:"var(--text-secondary)",lineHeight:1.5}}>
                {loc.slottingScore<35&&loc.picksWeek>30
                  ?`ML: ${loc.coScore}% co-occurrence met "${loc.coCluster}" maar buiten zone. Hergroepering: ${loc.routeScore.toFixed(1)} → ${(loc.routeScore*0.6).toFixed(1)} gangp/order.`
                  :loc.slottingScore<35
                  ?`OR-solver: lage co-occurrence (${loc.coScore}%). Verplaatsing naar ${loc.coCluster}-cluster aanbevolen.`
                  :`ML+OR: correct in ${loc.coCluster}-cluster (${loc.coScore}%). Route ${loc.routeScore.toFixed(1)} is optimaal.`}
              </div>
            </div>
            {[{l:"Affinity Cluster",v:loc.coCluster},{l:"Velocity",v:`${loc.velocity}-class`},{l:"Co-occurrence Score",v:`${loc.coScore}%`},{l:"Route Impact",v:`${loc.routeScore.toFixed(1)} gangp/order`}].map((f,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:i<3?"1px solid var(--border-light)":"none",fontSize:10}}>
                <span style={{color:"var(--text-tertiary)"}}>{f.l}</span>
                <span style={{fontWeight:600,fontFamily:"var(--font-mono)"}}>{f.v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ NEW SKU WIZARD ═══ */
const NEW_SKUS=[
  {id:"SKU-NEW-001",name:"LED Tuinverlichting Solar 4st",cat:"Tuin & Seizoen",velocity:"A"as Velocity,expectedPicks:62},
  {id:"SKU-NEW-002",name:"Zonnebrand SPF50 200ml",cat:"Beauty",velocity:"A"as Velocity,expectedPicks:55},
  {id:"SKU-NEW-003",name:"Picknickkleed 150x200",cat:"Tuin & Seizoen",velocity:"B"as Velocity,expectedPicks:28},
  {id:"SKU-NEW-004",name:"Insectenspray 400ml",cat:"Huishoudelijk",velocity:"B"as Velocity,expectedPicks:22},
  {id:"SKU-NEW-005",name:"Opblaasbaar Zwembad 120cm",cat:"Tuin & Seizoen",velocity:"B"as Velocity,expectedPicks:18},
  {id:"SKU-NEW-006",name:"IJsvormpjes Siliconen",cat:"Huishoudelijk",velocity:"C"as Velocity,expectedPicks:8},
  {id:"SKU-NEW-007",name:"Strandlaken 90x170",cat:"Kleding",velocity:"C"as Velocity,expectedPicks:7},
  {id:"SKU-NEW-008",name:"Citronella Kaars Set 3st",cat:"Tuin & Seizoen",velocity:"C"as Velocity,expectedPicks:9},
  {id:"SKU-NEW-009",name:"Waterpistool XL 45cm",cat:"Speelgoed",velocity:"C"as Velocity,expectedPicks:6},
  {id:"SKU-NEW-010",name:"Tuinslang Koppeling Set",cat:"Tuin & Seizoen",velocity:"D"as Velocity,expectedPicks:3},
  {id:"SKU-NEW-011",name:"Camping Bestek Set",cat:"Huishoudelijk",velocity:"D"as Velocity,expectedPicks:2},
  {id:"SKU-NEW-012",name:"Hangmat Katoen Naturel",cat:"Tuin & Seizoen",velocity:"D"as Velocity,expectedPicks:2},
];

const SLOT_SUGGESTIONS=[
  {sku:"LED Tuinverlichting Solar 4st",location:"A02-R05-L1",reason:"ML voorspelt A-class velocity — 89% co-occurrence met Tuin & Buiten cluster"},
  {sku:"Zonnebrand SPF50 200ml",location:"A01-L12-L1",reason:"A-class verwacht — OR-solver plaatst in Beauty Basics cluster, route-score optimaal"},
  {sku:"Picknickkleed 150x200",location:"A04-R08-L2",reason:"B-class, tuin-zone, co-occurrence met BBQ producten"},
  {sku:"Insectenspray 400ml",location:"A03-L15-L1",reason:"B-class, huishoudelijk zone, grondniveau"},
  {sku:"Opblaasbaar Zwembad 120cm",location:"A05-R02-L1",reason:"B-class, groot formaat → grondniveau verplicht"},
  {sku:"IJsvormpjes Siliconen",location:"A06-L09-L2",reason:"C-class, huishoudelijk cluster"},
  {sku:"Strandlaken 90x170",location:"A08-R03-L2",reason:"C-class, kleding/accessoires zone"},
  {sku:"Citronella Kaars Set 3st",location:"A07-L11-L2",reason:"C-class, naast bestaande kaarsen"},
  {sku:"Waterpistool XL 45cm",location:"A09-R06-L3",reason:"C-class, speelgoed zone, niveau 3"},
  {sku:"Tuinslang Koppeling Set",location:"A12-L04-L3",reason:"D-class, bulk storage zone"},
  {sku:"Camping Bestek Set",location:"A13-R07-L4",reason:"D-class, laagfrequent, bovenin"},
  {sku:"Hangmat Katoen Naturel",location:"A14-L02-L4",reason:"D-class, groot, bulk storage"},
];

const DISPLACED=[
  {sku:"Wintersjaal Grijs",from:"A02-R05-L1",to:"A11-L08-L3",reason:"D-class, 1 pick/wk → verplaatst naar bulk"},
  {sku:"Kerstverlichting 200LED",from:"A01-L12-L1",to:"A13-R12-L4",reason:"Seizoensartikel buiten seizoen → opslag"},
  {sku:"Handschoenen Fleece",from:"A04-R08-L2",to:"A14-L09-L4",reason:"0 picks afgelopen maand → verplaatst"},
];

function NewSkuWizard({onConfirm,onCancel}:{onConfirm:()=>void;onCancel:()=>void}){
  const[step,setStep]=useState(0);
  const[holding,setHolding]=useState(false);
  const[holdProgress,setHoldProgress]=useState(0);
  const holdTimer=useRef<ReturnType<typeof setInterval>|null>(null);

  const startHold=()=>{
    setHolding(true);setHoldProgress(0);let p=0;
    holdTimer.current=setInterval(()=>{p+=2;setHoldProgress(p);if(p>=100){if(holdTimer.current)clearInterval(holdTimer.current);setTimeout(onConfirm,300);}},30);
  };
  const cancelHold=()=>{setHolding(false);setHoldProgress(0);if(holdTimer.current)clearInterval(holdTimer.current);};

  const steps=["Nieuwe SKUs","Voorgestelde locaties","Impact","Bevestig"];

  return(
    <div style={{position:"fixed",bottom:24,right:24,zIndex:150,width:420,maxHeight:"70vh",borderRadius:"var(--radius-lg)",background:"var(--bg-surface)",border:"1px solid var(--border-medium)",boxShadow:"var(--shadow-xl), 0 0 40px rgba(139,111,255,0.06)",animation:"toasterIn 0.5s var(--ease-out)",display:"flex",flexDirection:"column"}}>
      {/* Header */}
      <div style={{padding:"16px 20px",borderBottom:"1px solid var(--border-light)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>Nieuwe SKU Batch</div>
          <div style={{fontSize:11,color:"var(--text-tertiary)"}}>{NEW_SKUS.length} artikelen ontvangen van WMS</div>
        </div>
        <button onClick={onCancel} style={{width:28,height:28,borderRadius:"var(--radius-sm)",border:"1px solid var(--border-light)",background:"var(--bg-subtle)",color:"var(--text-secondary)",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>

      {/* Step indicators */}
      <div style={{padding:"12px 20px",display:"flex",gap:4,flexShrink:0}}>
        {steps.map((s,i)=>(
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",gap:4,cursor:"pointer"}} onClick={()=>i<=step&&setStep(i)}>
            <div style={{height:3,borderRadius:2,background:i<=step?"var(--accent-purple)":"var(--bg-elevated)",transition:"background 0.3s ease"}}/>
            <span style={{fontSize:9,color:i===step?"var(--accent-purple)":"var(--text-tertiary)",fontWeight:i===step?600:400}}>{s}</span>
          </div>
        ))}
      </div>

      {/* Content — scrollable */}
      <div style={{flex:1,overflow:"auto",padding:"0 20px 16px"}}>

        {/* Step 0: New SKUs list */}
        {step===0&&(
          <div>
            <div style={{fontSize:11,color:"var(--text-secondary)",marginBottom:10}}>De volgende artikelen zijn ontvangen en wachten op slotting:</div>
            {NEW_SKUS.map((s,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 0",borderBottom:i<NEW_SKUS.length-1?"1px solid var(--border-light)":"none",animation:`fadeInUp 0.3s var(--ease-out) ${i*0.03}s backwards`}}>
                <div>
                  <div style={{fontSize:12,fontWeight:500}}>{s.name}</div>
                  <div style={{fontSize:10,color:"var(--text-tertiary)"}}>{s.cat} · {s.id}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:10,fontFamily:"var(--font-mono)",color:"var(--text-tertiary)"}}>{s.expectedPicks}/wk</span>
                  <span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:"var(--radius-full)",background:VCOL[s.velocity],color:"#fff"}}>{s.velocity}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Suggested locations */}
        {step===1&&(
          <div>
            <div style={{fontSize:11,color:"var(--text-secondary)",marginBottom:10}}>Op basis van velocity, affiniteit en beschikbaarheid stellen wij de volgende locaties voor:</div>
            {SLOT_SUGGESTIONS.map((s,i)=>(
              <div key={i} style={{padding:"8px 10px",background:"var(--bg-card)",borderRadius:"var(--radius-sm)",marginBottom:6,animation:`fadeInUp 0.3s var(--ease-out) ${i*0.03}s backwards`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                  <span style={{fontSize:12,fontWeight:600}}>{s.sku}</span>
                  <span style={{fontSize:10,fontFamily:"var(--font-mono)",color:"var(--accent-green)"}}>{s.location}</span>
                </div>
                <div style={{fontSize:10,color:"var(--text-tertiary)"}}>{s.reason}</div>
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Impact on existing slotting */}
        {step===2&&(
          <div>
            <div style={{fontSize:11,color:"var(--text-secondary)",marginBottom:10}}>Om ruimte te maken worden de volgende bestaande producten verplaatst:</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              <div style={{background:"var(--bg-card)",borderRadius:"var(--radius-sm)",padding:12}}>
                <div style={{fontSize:10,color:"var(--text-tertiary)",marginBottom:3}}>Producten verplaatst</div>
                <div style={{fontSize:22,fontWeight:700,fontFamily:"var(--font-mono)",color:"var(--accent-amber)"}}>{DISPLACED.length}</div>
              </div>
              <div style={{background:"var(--bg-card)",borderRadius:"var(--radius-sm)",padding:12}}>
                <div style={{fontSize:10,color:"var(--text-tertiary)",marginBottom:3}}>Netto impact</div>
                <div style={{fontSize:22,fontWeight:700,fontFamily:"var(--font-mono)",color:"var(--accent-green)"}}>+8%</div>
                <div style={{fontSize:10,color:"var(--text-tertiary)"}}>picks/uur</div>
              </div>
            </div>
            {DISPLACED.map((d,i)=>(
              <div key={i} style={{padding:"8px 10px",background:"rgba(255,190,48,0.06)",border:"1px solid rgba(255,190,48,0.12)",borderRadius:"var(--radius-sm)",marginBottom:6,animation:`fadeInUp 0.3s var(--ease-out) ${i*0.05}s backwards`}}>
                <div style={{fontSize:12,fontWeight:600,marginBottom:4}}>{d.sku}</div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                  <span style={{fontSize:11,fontFamily:"var(--font-mono)",color:"var(--accent-red)"}}>{d.from}</span>
                  <span style={{fontSize:11,color:"var(--text-tertiary)"}}>→</span>
                  <span style={{fontSize:11,fontFamily:"var(--font-mono)",color:"var(--accent-amber)"}}>{d.to}</span>
                </div>
                <div style={{fontSize:10,color:"var(--text-tertiary)"}}>{d.reason}</div>
              </div>
            ))}
          </div>
        )}

        {/* Step 3: Confirm */}
        {step===3&&(
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:40,marginBottom:12}}>📦</div>
            <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>{NEW_SKUS.length} nieuwe SKUs slotten</div>
            <div style={{fontSize:13,color:"var(--text-secondary)",marginBottom:4}}>{DISPLACED.length} bestaande producten verplaatsen</div>
            <div style={{fontSize:13,color:"var(--accent-green)",fontWeight:600,marginBottom:20}}>Verwachte verbetering: +8% picks/uur</div>
            <button onPointerDown={startHold} onPointerUp={cancelHold} onPointerLeave={cancelHold} style={{
              width:"100%",height:52,borderRadius:"var(--radius-md)",border:"2px solid",
              borderColor:holding?"var(--accent-green)":"var(--border-medium)",cursor:"pointer",
              background:holding?`linear-gradient(90deg, rgba(54,216,158,0.25) ${holdProgress}%, var(--bg-elevated) ${holdProgress}%)`:"var(--bg-elevated)",
              color:holding?"var(--accent-green)":"var(--text-primary)",fontSize:14,fontWeight:700,
              transition:holding?"none":"all 0.2s ease",userSelect:"none",touchAction:"none",
            }}>
              {holding?`${Math.round(holdProgress)}% — Blijf vasthouden...`:"⏎ Houd ingedrukt om te bevestigen"}
            </button>
          </div>
        )}
      </div>

      {/* Footer nav */}
      {step<3&&(
        <div style={{padding:"12px 20px",borderTop:"1px solid var(--border-light)",display:"flex",justifyContent:"space-between",flexShrink:0}}>
          <button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0} style={{padding:"6px 16px",borderRadius:"var(--radius-sm)",border:"1px solid var(--border-medium)",background:"transparent",color:step===0?"var(--text-tertiary)":"var(--text-secondary)",fontSize:12,fontWeight:500,cursor:step===0?"default":"pointer"}}>Vorige</button>
          <button onClick={()=>setStep(s=>s+1)} style={{padding:"6px 16px",borderRadius:"var(--radius-sm)",border:"none",background:"var(--accent-purple)",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>Volgende</button>
        </div>
      )}
    </div>
  );
}

/* ═══ PROBLEMS ═══ */
function Problems(){
  const sevColor={critical:"var(--accent-red)",warning:"var(--accent-amber)",info:"var(--accent-purple)"};
  return(
    <div style={{position:"absolute",bottom:16,left:20,right:20,background:"var(--bg-elevated)",border:"1px solid var(--border-medium)",borderRadius:"var(--radius-lg)",padding:"14px 20px",boxShadow:"var(--shadow-lg)",animation:"slideUp 0.4s var(--ease-out) 0.3s backwards",maxHeight:160,overflow:"auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><span style={{fontSize:13,fontWeight:700}}>Gedetecteerde problemen</span><span style={{background:"var(--accent-red)",color:"#fff",fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:"var(--radius-full)"}}>5</span></div>
      {PROBLEMS.map((p,i)=>(
        <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"5px 0",borderBottom:i<PROBLEMS.length-1?"1px solid var(--border-light)":"none"}}>
          <span style={{width:6,height:6,borderRadius:"50%",marginTop:6,flexShrink:0,background:sevColor[p.sev]}}/>
          <span style={{fontSize:12,color:"var(--text-secondary)",lineHeight:1.5}}>{p.msg}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══ LEGEND ═══ */
function Legend(){
  return(
    <div style={{position:"absolute",top:72,right:16,background:"var(--bg-elevated)",border:"1px solid var(--border-medium)",borderRadius:"var(--radius-md)",padding:"12px 16px",boxShadow:"var(--shadow-md)",fontSize:11,animation:"fadeInUp 0.3s var(--ease-out) 0.15s backwards"}}>
      <div style={{fontSize:10,color:"var(--text-tertiary)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8,fontWeight:600}}>Velocity</div>
      {([["A","Snellopers"],["B","Frequent"],["C","Normaal"],["D","Langzaam"]]as const).map(([v,label])=>(
        <div key={v} style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}><span style={{width:10,height:10,borderRadius:3,background:VCOL[v as Velocity]}}/><span style={{color:"var(--text-secondary)",fontWeight:450}}>{label}</span></div>
      ))}
    </div>
  );
}

/* ═══ PAGE ═══ */
export default function WarehousePage(){
  const[active,setActive]=useState("warehouse");
  const[level,setLevel]=useState(0);
  const[hovered,setHovered]=useState<{loc:Loc;x:number;y:number}|null>(null);
  const[selected,setSelected]=useState<Loc|null>(null);
  const[showProposal,setShowProposal]=useState(false);
  const[showConfirmToast,setShowConfirmToast]=useState(false);
  const[shouldClearSuboptimal,setShouldClearSuboptimal]=useState(false);
  const[showNewSkuWizard,setShowNewSkuWizard]=useState(false);

  // Trigger new SKU wizard after 45 seconds
  useEffect(()=>{const t=setTimeout(()=>setShowNewSkuWizard(true),45000);return()=>clearTimeout(t);},[]);
  const onHover=useCallback((l:Loc|null,x:number,y:number)=>{setHovered(l?{loc:l,x,y}:null);},[]);

  return(
    <div style={{display:"flex",height:"100vh",overflow:"hidden",position:"relative"}}>
      {/* Ambient orbs */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
        <div style={{position:"absolute",width:900,height:900,top:"-20%",left:"-10%",background:"radial-gradient(circle, rgba(139,111,255,0.55) 0%, rgba(139,111,255,0.15) 45%, transparent 70%)",borderRadius:"50%",filter:"blur(40px)",animation:"orbFloat1 20s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:800,height:800,bottom:"-15%",right:"-5%",background:"radial-gradient(circle, rgba(255,92,124,0.45) 0%, rgba(255,92,124,0.12) 45%, transparent 70%)",borderRadius:"50%",filter:"blur(40px)",animation:"orbFloat2 25s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:700,height:700,top:"30%",left:"45%",background:"radial-gradient(circle, rgba(77,168,255,0.35) 0%, rgba(77,168,255,0.10) 45%, transparent 70%)",borderRadius:"50%",filter:"blur(40px)",animation:"orbFloat3 28s ease-in-out infinite"}}/>
      </div>
      <Sidebar active={active} onChange={setActive}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",position:"relative"}}>
        <div style={{height:54,background:"var(--bg-surface)",borderBottom:"1px solid var(--border-medium)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",animation:"fadeIn 0.3s var(--ease-out) backwards"}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <span style={{fontSize:14,fontWeight:700}}>DC Echt</span>
            <span style={{fontSize:11,color:"var(--text-tertiary)",fontWeight:500,background:"var(--bg-card)",padding:"4px 12px",borderRadius:"var(--radius-full)",fontFamily:"var(--font-mono)"}}>3.000 locaties · 15 gangpaden · 5 niveaus</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:11,color:"var(--text-tertiary)",marginRight:4,fontWeight:500}}>Niveau:</span>
            {[1,2,3,4,5].map(l=>(
              <button key={l} onClick={()=>setLevel(l===level?0:l)} style={{width:30,height:30,borderRadius:"var(--radius-sm)",border:`1.5px solid ${level===l?"var(--accent-purple)":"var(--border-medium)"}`,background:level===l?"var(--accent-purple)":"var(--bg-surface)",color:level===l?"#fff":"var(--text-secondary)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"var(--font-mono)",boxShadow:level===l?"var(--shadow-glow-purple)":"none",transition:"all 0.15s ease"}}>{l}</button>
            ))}
            <button onClick={()=>setLevel(0)} style={{height:30,padding:"0 14px",borderRadius:"var(--radius-sm)",border:`1.5px solid ${level===0?"var(--accent-purple)":"var(--border-medium)"}`,background:level===0?"var(--accent-purple)":"var(--bg-surface)",color:level===0?"#fff":"var(--text-secondary)",fontSize:11,fontWeight:600,cursor:"pointer",boxShadow:level===0?"var(--shadow-glow-purple)":"none",transition:"all 0.15s ease"}}>Alle</button>
          </div>
        </div>
        <div style={{flex:1,display:"flex",position:"relative",overflow:"hidden"}}>
          <Map level={level} onHover={onHover} onSelect={setSelected} onShowProposal={()=>{setShowProposal(true);setSelected(null);}} clearSuboptimal={shouldClearSuboptimal}/>
          {showProposal&&<ReslotProposal suboptimalCount={20} onConfirm={()=>{setShowProposal(false);setShowConfirmToast(true);setShouldClearSuboptimal(true);}} onCancel={()=>setShowProposal(false)}/>}
        </div>
        {hovered&&<Tip loc={hovered.loc} x={hovered.x} y={hovered.y}/>}
        <Legend/>
      </div>
      {selected&&!showProposal&&<Detail loc={selected} onClose={()=>setSelected(null)}/>}
      {showConfirmToast&&<ConfirmToaster onDone={()=>setShowConfirmToast(false)}/>}
      {showNewSkuWizard&&<NewSkuWizard onConfirm={()=>{setShowNewSkuWizard(false);setShowConfirmToast(true);}} onCancel={()=>setShowNewSkuWizard(false)}/>}
    </div>
  );
}
