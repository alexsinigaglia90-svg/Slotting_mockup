"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WarehouseHero } from "@/components/hero/warehouse-hero";
import { WarehouseSidebar } from "@/components/warehouse/warehouse-sidebar";
import { LiveIndicator } from "@/components/ui/live-indicator";
import { Pill } from "@/components/ui/pill";
import { Button } from "@/components/ui/button";
import { ReslotProposal } from "@/components/warehouse/reslot-proposal";
import { DetailToaster } from "@/components/warehouse/detail-toaster";
import { ConfirmToaster } from "@/components/warehouse/confirm-toaster";
import { NewSkuWizard } from "@/components/warehouse/new-sku-wizard";
import { CommandCenter } from "@/components/warehouse/command-center";

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
const VCOL:Record<Velocity,string>={A:"#34d89e",B:"#f0c040",C:"#5ba8ff",D:"#8090b8",empty:"transparent"};

const PROBLEMS=[
  {sev:"critical"as const,msg:"Co-occurrence cluster 'Schoonmaak' verspreid over 5 gangpaden — 34% route-verlies gedetecteerd"},
  {sev:"critical"as const,msg:"Gangpad A03: 3.2× meer picks dan A12 — zone-balancering door OR-solver aanbevolen"},
  {sev:"warning"as const,msg:"Seizoenspatroon gedetecteerd: tuin-SKUs velocity stijgt 280% — herclassificatie aanbevolen"},
  {sev:"warning"as const,msg:"Affinity cluster 'Beauty Basics' gefragmenteerd — 6 gangpaden i.p.v. optimaal 2"},
  {sev:"info"as const,msg:"23 D-class SKUs blokkeren high-frequency posities — swap kandidaten geïdentificeerd"},
];

/* ═══ ZOOMABLE WAREHOUSE MAP WITH LIVE PICKS ═══ */
function Map({level,onHover,onSelect,onShowProposal,clearSuboptimal,onPickUpdate,onSuboptimalUpdate,reslotHighlights}:{level:number;onHover:(l:Loc|null,x:number,y:number)=>void;onSelect:(l:Loc|null)=>void;onShowProposal:()=>void;clearSuboptimal:boolean;onPickUpdate:(n:number)=>void;onSuboptimalUpdate:(n:number)=>void;reslotHighlights:Set<string>}){
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
      onPickUpdate(totalPicks);
      setTimeout(()=>setActivePicks(new Set()),600);

      // After 20 picks, detect suboptimal
      if(totalPicks>=20&&!detected){
        detected=true;
        const subs=new Set<string>();
        nonEmpty.forEach(l=>{
          if(l.picksWeek>30&&l.coScore<50) subs.add(l.id);
          if(l.picksWeek<5&&l.aisle<=3&&l.velocity!=="A") subs.add(l.id);
          if(l.routeScore>3.0&&l.picksWeek>15) subs.add(l.id);
        });
        setSuboptimal(subs);
        onSuboptimalUpdate(subs.size);
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
      {/* Zoom indicator */}
      <div style={{position:"absolute",top:12,left:12,zIndex:5}}>
        <div style={{padding:"5px 12px",borderRadius:"var(--radius-full)",background:"var(--bg-elevated)",border:"1px solid var(--border-medium)",fontSize:11,fontWeight:500,color:"var(--text-secondary)",fontFamily:"var(--font-mono)"}}>
          {Math.round(scale*100)}%
        </div>
      </div>
      {/* Suboptimal alert removed — handled by CommandCenter */}
      {/* Zoomable content */}
      <div style={{transform:`translate(${pan.x}px,${pan.y}px) scale(${scale})`,transformOrigin:"0 0",padding:"20px 24px",willChange:"transform"}}>
        {/* Depot + live status */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 14px",borderRadius:"var(--radius-full)",background:"rgba(54,216,158,0.12)",border:"1px solid rgba(54,216,158,0.25)",fontSize:11,fontWeight:600,color:"var(--accent-green)"}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:"var(--accent-green)",animation:"pulse 2s ease infinite"}}/>PICKING START
          </div>
          <div style={{fontSize:9,color:"var(--text-tertiary)"}}>DC Echt · Live monitoring</div>
        </div>

        {/* Zone labels */}
        <div style={{display:"flex",gap:8,marginBottom:6}}>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{width:3,height:12,borderRadius:1,background:"var(--accent-green)",opacity:0.5}}/>
            <span style={{fontSize:8,color:"var(--text-tertiary)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em"}}>Forward Pick Zone</span>
          </div>
          <div style={{flex:1}}/>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{width:3,height:12,borderRadius:1,background:"var(--accent-purple)",opacity:0.5}}/>
            <span style={{fontSize:8,color:"var(--text-tertiary)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em"}}>Bulk Storage</span>
          </div>
        </div>

        <div style={{display:"flex",gap:8}}>
          {Array.from({length:NUM_AISLES},(_,ai)=>{
            const al=filtered.filter(l=>l.aisle===ai);
            const left=al.filter(l=>l.side==="L").sort((a,b)=>a.position-b.position);
            const right=al.filter(l=>l.side==="R").sort((a,b)=>a.position-b.position);
            const totalPicks=al.reduce((s,l)=>s+l.picksWeek,0);
            const isForwardPick=ai<5;
            const isBulk=ai>=10;
            // Zone separator line between forward pick and regular
            const showZoneLine=ai===5||ai===10;
            return(
              <div key={ai} style={{display:"flex",gap:0}}>
                {showZoneLine&&<div style={{width:2,background:ai===5?"var(--accent-green)":"var(--accent-purple)",opacity:0.15,borderRadius:1,margin:"20px 3px 0 3px"}}/>}
                <div className="aisle-enter" style={{display:"flex",flexDirection:"column",alignItems:"center",animationDelay:`${ai*0.06}s`}}>
                  <div style={{textAlign:"center",marginBottom:4}}>
                    <div style={{fontSize:11,fontWeight:700,fontFamily:"var(--font-mono)",color:isForwardPick?"var(--accent-green)":isBulk?"var(--text-tertiary)":"var(--text-secondary)",opacity:isForwardPick?0.9:isBulk?0.5:0.7}}>A{String(ai+1).padStart(2,"0")}</div>
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
                              :reslotHighlights.has(loc.id)
                              ?{animation:"suboptimalPulse 1.5s ease-in-out infinite",outline:"2px solid var(--accent-cict)",outlineOffset:"1px",zIndex:4,filter:"brightness(1.3)"}
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
              </div>
            );
          })}
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

/* ═══ LEGEND ═══ */
function Legend(){
  return(
    <motion.div
      initial={{opacity:0,y:8}}
      animate={{opacity:1,y:0}}
      transition={{duration:0.4,delay:0.15,ease:[0.16,1,0.3,1]}}
      style={{position:"absolute",top:12,right:16,background:"rgba(10,10,15,0.75)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid var(--color-border)",borderRadius:"var(--radius)",padding:"10px 14px",boxShadow:"0 8px 32px rgba(0,0,0,0.4)",fontSize:11,zIndex:4}}
    >
      <div className="label" style={{marginBottom:8}}>Velocity</div>
      {([["A","Snellopers"],["B","Frequent"],["C","Normaal"],["D","Langzaam"]]as const).map(([v,label])=>(
        <div key={v} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <span style={{width:8,height:8,borderRadius:2,background:VCOL[v as Velocity],boxShadow:`0 0 6px ${VCOL[v as Velocity]}88`}}/>
          <Pill tone="default" style={{fontSize:9,padding:"1px 6px"}}>{label}</Pill>
        </div>
      ))}
    </motion.div>
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
  const[livePicks,setLivePicks]=useState(0);
  const[suboptimalCount,setSuboptimalCount]=useState(0);
  const[newSkuReady,setNewSkuReady]=useState(false);
  const[reslotHighlights,setReslotHighlights]=useState<Set<string>>(new Set());

  // Trigger new SKU batch notification after 45 seconds
  useEffect(()=>{const t=setTimeout(()=>setNewSkuReady(true),45000);return()=>clearTimeout(t);},[]);
  const onHover=useCallback((l:Loc|null,x:number,y:number)=>{setHovered(l?{loc:l,x,y}:null);},[]);

  return(
    <div style={{overflowY:"auto",height:"calc(100vh - 3.5rem)"}}>
      <WarehouseHero />
    <div style={{display:"flex",height:"calc(100vh - 3.5rem)",overflow:"hidden",position:"relative"}}>
      {/* Ambient orbs */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
        <div style={{position:"absolute",width:900,height:900,top:"-20%",left:"-10%",background:"radial-gradient(circle, rgba(139,111,255,0.55) 0%, rgba(139,111,255,0.15) 45%, transparent 70%)",borderRadius:"50%",filter:"blur(40px)",animation:"orbFloat1 20s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:800,height:800,bottom:"-15%",right:"-5%",background:"radial-gradient(circle, rgba(255,92,124,0.45) 0%, rgba(255,92,124,0.12) 45%, transparent 70%)",borderRadius:"50%",filter:"blur(40px)",animation:"orbFloat2 25s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:700,height:700,top:"30%",left:"45%",background:"radial-gradient(circle, rgba(77,168,255,0.35) 0%, rgba(77,168,255,0.10) 45%, transparent 70%)",borderRadius:"50%",filter:"blur(40px)",animation:"orbFloat3 28s ease-in-out infinite"}}/>
      </div>

      {/* ── Cinematic Sidebar ── */}
      <WarehouseSidebar active={active} onChange={setActive}/>

      <div style={{flex:1,display:"flex",flexDirection:"column",position:"relative"}}>

        {/* ── Cinematic Map Header Bar ── */}
        <motion.div
          initial={{opacity:0,y:-8}}
          animate={{opacity:1,y:0}}
          transition={{duration:0.4,ease:[0.16,1,0.3,1]}}
          style={{
            height:60,
            background:"rgba(10,10,15,0.55)",
            backdropFilter:"blur(20px)",
            WebkitBackdropFilter:"blur(20px)",
            borderBottom:"1px solid var(--color-border)",
            display:"flex",
            alignItems:"center",
            justifyContent:"space-between",
            padding:"0 24px",
            flexShrink:0,
            gap:16,
          }}
        >
          {/* Left: live pill + meta */}
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <LiveIndicator />
            <div>
              <span style={{fontSize:15,fontWeight:800,letterSpacing:"-0.03em",color:"var(--color-fg)"}}>DC-Demo</span>
              <span style={{fontSize:11,color:"var(--color-fg-muted)",marginLeft:10,fontFamily:"var(--font-mono)"}}>3.000 slots · 15 gangpaden · last sync 2s ago</span>
            </div>
          </div>

          {/* Center: level switcher with animated active indicator */}
          <div style={{display:"flex",alignItems:"center",gap:4,position:"relative"}}>
            <span className="label" style={{marginRight:8}}>Niveau</span>
            <div style={{display:"flex",gap:3,background:"var(--color-bg-card)",borderRadius:"var(--radius-sm)",padding:"3px"}}>
              {[1,2,3,4,5].map(l=>{
                const isActive=level===l;
                return(
                  <motion.button
                    key={l}
                    onClick={()=>setLevel(l===level?0:l)}
                    whileHover={{y:-1}}
                    whileTap={{scale:0.95}}
                    style={{
                      position:"relative",
                      width:32,height:30,
                      borderRadius:"var(--radius-sm)",
                      border:"none",
                      cursor:"pointer",
                      background:isActive?"var(--color-accent)":"transparent",
                      color:isActive?"#0a0a0f":"var(--color-fg-muted)",
                      fontSize:12,fontWeight:700,
                      fontFamily:"var(--font-mono)",
                      boxShadow:isActive?"0 0 16px var(--color-accent-glow)":"none",
                      transition:"background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
                    }}
                  >
                    {l}
                  </motion.button>
                );
              })}
              <motion.button
                onClick={()=>setLevel(0)}
                whileHover={{y:-1}}
                whileTap={{scale:0.95}}
                style={{
                  height:30,padding:"0 12px",
                  borderRadius:"var(--radius-sm)",
                  border:"none",
                  cursor:"pointer",
                  background:level===0?"var(--color-accent)":"transparent",
                  color:level===0?"#0a0a0f":"var(--color-fg-muted)",
                  fontSize:11,fontWeight:700,
                  boxShadow:level===0?"0 0 16px var(--color-accent-glow)":"none",
                  transition:"background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                Alle
              </motion.button>
            </div>
          </div>

          {/* Right: action buttons */}
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <Button variant="ghost" style={{fontSize:12,height:32,padding:"0 14px"}} onClick={()=>{setShowProposal(true);setSelected(null);}}>
              Reslot
            </Button>
            <Button variant="ghost" style={{fontSize:12,height:32,padding:"0 14px"}}>
              Simuleer
            </Button>
            <Button variant="primary" style={{fontSize:12,height:32,padding:"0 14px"}} onClick={()=>{setShowNewSkuWizard(true);setSelected(null);}}>
              Nieuwe SKUs
            </Button>
          </div>
        </motion.div>

        {/* ── Map viewport with cinematic frame ── */}
        <div style={{
          flex:1,
          display:"flex",
          position:"relative",
          overflow:"hidden",
          border:"1px solid var(--color-border)",
          borderTop:"none",
          borderBottom:"none",
          boxShadow:"inset 0 20px 40px -20px rgba(0,0,0,0.5), inset 0 -20px 40px -20px rgba(0,0,0,0.4)",
        }}>
          <Map level={level} onHover={onHover} onSelect={setSelected} onShowProposal={()=>{setShowProposal(true);setSelected(null);}} clearSuboptimal={shouldClearSuboptimal} onPickUpdate={setLivePicks} onSuboptimalUpdate={setSuboptimalCount} reslotHighlights={reslotHighlights}/>
          <Legend/>
        </div>
        {hovered&&<Tip loc={hovered.loc} x={hovered.x} y={hovered.y}/>}
      </div>
      <AnimatePresence>
        {showProposal&&<ReslotProposal key="reslot" suboptimalCount={suboptimalCount||20} onConfirm={()=>{setShowProposal(false);setShowConfirmToast(true);setShouldClearSuboptimal(true);setSuboptimalCount(0);setReslotHighlights(new Set());}} onCancel={()=>{setShowProposal(false);setReslotHighlights(new Set());}} onTabChange={(tab:number)=>{
          if(tab===1){setReslotHighlights(new Set(["A09-L14-L1","A03-R03-L1","A11-R08-L1","A04-L07-L1","A10-L19-L1","A03-R01-L1","A02-L04-L1","A12-R11-L1","A01-R09-L1","A14-L06-L1"]));}else{setReslotHighlights(new Set());}
        }}/>}
      </AnimatePresence>
      <AnimatePresence>
        {selected&&!showProposal&&!showNewSkuWizard&&<DetailToaster key="detail" loc={selected} onClose={()=>setSelected(null)}/>}
      </AnimatePresence>
      <AnimatePresence>
        {showConfirmToast&&<ConfirmToaster key="confirm" onDone={()=>setShowConfirmToast(false)}/>}
      </AnimatePresence>
      <AnimatePresence>
        {showNewSkuWizard&&<NewSkuWizard key="wizard" onConfirm={()=>{setShowNewSkuWizard(false);setNewSkuReady(false);setShowConfirmToast(true);}} onCancel={()=>setShowNewSkuWizard(false)}/>}
      </AnimatePresence>
      <CommandCenter picks={livePicks} suboptimalCount={suboptimalCount} newSkuReady={newSkuReady} onOpenReslot={()=>{setShowProposal(true);setSelected(null);}} onOpenNewSku={()=>{setShowNewSkuWizard(true);setSelected(null);}}/>
    </div>
    </div>
  );
}
