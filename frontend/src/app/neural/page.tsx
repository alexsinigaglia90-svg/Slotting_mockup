"use client";

import { useRef, useEffect, useState } from "react";

/* ═══ ULTRA DENSE NEURAL MESH ═══ */

interface N { id:number;x:number;y:number;vx:number;vy:number;r:number;label:string;group:number;color:string;a:number;picks:number;targetX:number;targetY:number; }
interface E { from:number;to:number;w:number; }

const GROUPS=[
  {label:"Schoonmaak",color:"#34d89e"},{label:"Beauty",color:"#e879a8"},{label:"Snacks",color:"#f0c040"},
  {label:"Tuin",color:"#5ba8ff"},{label:"Kantoor",color:"#8b6fff"},{label:"Huisdier",color:"#ff8c5a"},
  {label:"Decoratie",color:"#c084fc"},{label:"Kleding",color:"#6dd4e0"},{label:"Food",color:"#f07060"},
  {label:"Seizoen",color:"#E2D44A"},{label:"Keuken",color:"#7cba5f"},{label:"Baby",color:"#ffb3d9"},
];

function seed(s:number){return()=>{s=(s*16807)%2147483647;return s/2147483647;};}

function buildGraph(w:number,h:number):{nodes:N[];edges:E[]}{
  const r=seed(42);
  const nodes:N[]=[];
  const edges:E[]=[];
  const cx=w/2,cy=h/2;

  // Generate 200+ product nodes across 12 clusters
  const PRODUCTS_PER_CLUSTER=18;
  for(let g=0;g<GROUPS.length;g++){
    const ga=(g/GROUPS.length)*Math.PI*2;
    const gdist=Math.min(w,h)*0.28+r()*40;
    const gcx=cx+Math.cos(ga)*gdist;
    const gcy=cy+Math.sin(ga)*gdist;

    for(let i=0;i<PRODUCTS_PER_CLUSTER;i++){
      const angle=ga+(r()-0.5)*1.2;
      const dist=30+r()*80;
      const x=gcx+Math.cos(angle)*dist+(r()-0.5)*40;
      const y=gcy+Math.sin(angle)*dist+(r()-0.5)*40;
      nodes.push({
        id:nodes.length,x:cx+(r()-0.5)*100,y:cy+(r()-0.5)*100,// start clustered in center
        vx:0,vy:0,r:1.5+r()*3,
        label:`SKU-${String(nodes.length).padStart(3,"0")}`,
        group:g,color:GROUPS[g].color,a:0,picks:Math.floor(r()*80),
        targetX:x,targetY:y,
      });
    }
  }

  // 12 ML/OR engine nodes in center
  const engines=["Velocity ML","Affinity Engine","Route Solver","Demand Predictor","Zone Balancer","Cluster AI","Pattern Detect","Anomaly Detect","Forecast","Optimizer","Replenish AI","Co-occur Engine"];
  engines.forEach((label,i)=>{
    const angle=(i/engines.length)*Math.PI*2;
    const dist=30+r()*50;
    nodes.push({
      id:nodes.length,x:cx,y:cy,vx:0,vy:0,r:4+r()*3,
      label,group:-1,color:"#E2D44A",a:0.3,picks:0,
      targetX:cx+Math.cos(angle)*dist,targetY:cy+Math.sin(angle)*dist,
    });
  });

  const total=nodes.length;

  // Dense intra-cluster edges
  for(let g=0;g<GROUPS.length;g++){
    const clusterNodes=nodes.filter(n=>n.group===g);
    for(let i=0;i<clusterNodes.length;i++){
      for(let j=i+1;j<clusterNodes.length;j++){
        if(r()<0.45){// ~45% chance of connection within cluster
          edges.push({from:clusterNodes[i].id,to:clusterNodes[j].id,w:0.2+r()*0.6});
        }
      }
    }
  }

  // Cross-cluster edges (sparser)
  for(let i=0;i<200;i++){
    const a=Math.floor(r()*(total-engines.length));
    const b=Math.floor(r()*(total-engines.length));
    if(a!==b&&nodes[a].group!==nodes[b].group){
      edges.push({from:a,to:b,w:0.03+r()*0.12});
    }
  }

  // Engine-to-cluster hub edges
  const engineNodes=nodes.filter(n=>n.group===-1);
  for(const en of engineNodes){
    // Connect to 4-6 random cluster nodes
    for(let i=0;i<4+Math.floor(r()*3);i++){
      const target=Math.floor(r()*(total-engines.length));
      edges.push({from:en.id,to:target,w:0.08+r()*0.15});
    }
    // Connect engines to each other
    for(const en2 of engineNodes){
      if(en.id<en2.id&&r()<0.4){
        edges.push({from:en.id,to:en2.id,w:0.1+r()*0.2});
      }
    }
  }

  return{nodes,edges};
}

function hexToRgb(hex:string):string{
  return`${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}

export default function NeuralPage(){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const graphRef=useRef<{nodes:N[];edges:E[]}|null>(null);
  const mouseRef=useRef({x:-999,y:-999});
  const [stats,setStats]=useState({picks:0,active:0,thinking:0,nodes:0,edges:0});
  const [hovered,setHovered]=useState<N|null>(null);
  const initializedRef=useRef(false);

  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas)return;
    const ctx=canvas.getContext("2d");
    if(!ctx)return;
    let animId:number;
    let tick=0;

    const dpr=window.devicePixelRatio||1;
    const resize=()=>{
      canvas.width=canvas.offsetWidth*dpr;
      canvas.height=canvas.offsetHeight*dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      if(!initializedRef.current){
        graphRef.current=buildGraph(canvas.offsetWidth,canvas.offsetHeight);
        initializedRef.current=true;
      }
    };
    resize();
    window.addEventListener("resize",resize);

    const render=()=>{
      if(!graphRef.current){animId=requestAnimationFrame(render);return;}
      tick++;
      const{nodes,edges}=graphRef.current;
      const w=canvas.offsetWidth,h=canvas.offsetHeight;

      // Clear with slight trail effect
      ctx.fillStyle="rgba(10,11,16,0.15)";
      ctx.fillRect(0,0,w,h);

      // Every 10 frames, do a full clear to prevent artifacts
      if(tick%120===0){
        ctx.fillStyle="#0a0b10";
        ctx.fillRect(0,0,w,h);
      }

      // Ambient glow
      if(tick%120<2){
        const g1=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.min(w,h)*0.5);
        g1.addColorStop(0,"rgba(139,111,255,0.025)");
        g1.addColorStop(0.4,"rgba(226,212,74,0.015)");
        g1.addColorStop(1,"transparent");
        ctx.fillStyle=g1;
        ctx.fillRect(0,0,w,h);
      }

      // Simulate picks — multiple per frame for density
      if(tick%12===0){
        const skuNodes=nodes.filter(n=>n.group>=0);
        const count=2+Math.floor(Math.random()*4);
        for(let c=0;c<count;c++){
          const picked=skuNodes[Math.floor(Math.random()*skuNodes.length)];
          if(picked){
            picked.a=1;
            picked.picks++;
            // Ripple
            for(const e of edges){
              if(e.from===picked.id||e.to===picked.id){
                const oid=e.from===picked.id?e.to:e.from;
                if(nodes[oid])nodes[oid].a=Math.max(nodes[oid].a,0.25+e.w*0.3);
              }
            }
            // Engine pulse
            nodes.filter(n=>n.group===-1).forEach(n=>{n.a=Math.min(1,n.a+0.08);});
          }
        }
      }

      // Physics
      const cx=w/2,cy=h/2;
      for(const n of nodes){
        // Move toward target position (gentle spring)
        n.vx+=(n.targetX-n.x)*0.003;
        n.vy+=(n.targetY-n.y)*0.003;

        // Slight random jitter for organic feel
        n.vx+=(Math.random()-0.5)*0.15;
        n.vy+=(Math.random()-0.5)*0.15;

        // Damping
        n.vx*=0.9;
        n.vy*=0.9;
        n.x+=n.vx;
        n.y+=n.vy;

        // Decay activity
        n.a*=0.965;
      }

      // Draw edges
      ctx.lineCap="round";
      for(const e of edges){
        const a=nodes[e.from],b=nodes[e.to];
        if(!a||!b)continue;
        const activity=Math.max(a.a,b.a);

        // Skip very faint edges when inactive
        if(activity<0.05&&e.w<0.15)continue;

        ctx.beginPath();
        ctx.moveTo(a.x,a.y);

        // Slight curve for organic feel
        const mx=(a.x+b.x)/2+(Math.sin(tick*0.01+e.from)*3);
        const my=(a.y+b.y)/2+(Math.cos(tick*0.01+e.to)*3);
        ctx.quadraticCurveTo(mx,my,b.x,b.y);

        if(activity>0.1){
          const isEngine=a.group===-1||b.group===-1;
          const col=isEngine?"226,212,74":a.group===b.group?hexToRgb(a.color):"139,111,255";
          ctx.strokeStyle=`rgba(${col},${Math.min(0.8,0.05+activity*0.6)})`;
          ctx.lineWidth=0.3+activity*2;
        }else{
          ctx.strokeStyle=`rgba(255,255,255,${0.008+e.w*0.02})`;
          ctx.lineWidth=0.2;
        }
        ctx.stroke();
      }

      // Draw nodes
      for(const n of nodes){
        const isEngine=n.group===-1;

        // Glow
        if(n.a>0.08){
          const glowSize=n.r+30*n.a;
          const gr=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,glowSize);
          gr.addColorStop(0,n.color+(isEngine?"50":"30"));
          gr.addColorStop(1,"transparent");
          ctx.fillStyle=gr;
          ctx.beginPath();
          ctx.arc(n.x,n.y,glowSize,0,Math.PI*2);
          ctx.fill();
        }

        // Dot
        const pulse=n.a>0.3?1+Math.sin(tick*0.15)*0.3*n.a:0;
        ctx.beginPath();
        ctx.arc(n.x,n.y,n.r+pulse,0,Math.PI*2);
        const alpha=isEngine?0.8+n.a*0.2:0.35+n.a*0.65;
        ctx.fillStyle=n.color+Math.round(alpha*255).toString(16).padStart(2,"0");
        ctx.fill();

        // Engine ring
        if(isEngine&&n.a>0.1){
          ctx.beginPath();
          ctx.arc(n.x,n.y,n.r+4+n.a*3,0,Math.PI*2);
          ctx.strokeStyle=`rgba(226,212,74,${n.a*0.4})`;
          ctx.lineWidth=0.8;
          ctx.stroke();
        }
      }

      // Hover highlight
      const mx=mouseRef.current.x,my=mouseRef.current.y;
      let found:N|null=null;
      for(const n of nodes){
        if(Math.hypot(mx-n.x,my-n.y)<n.r+10){found=n;break;}
      }
      setHovered(found);

      if(found){
        // Highlight ring
        ctx.beginPath();
        ctx.arc(found.x,found.y,found.r+8,0,Math.PI*2);
        ctx.strokeStyle=found.color;
        ctx.lineWidth=1.5;
        ctx.stroke();

        // Highlight connections
        for(const e of edges){
          if(e.from!==found.id&&e.to!==found.id)continue;
          const a=nodes[e.from],b=nodes[e.to];
          if(!a||!b)continue;
          ctx.beginPath();
          ctx.moveTo(a.x,a.y);
          ctx.lineTo(b.x,b.y);
          ctx.strokeStyle=found.color+"60";
          ctx.lineWidth=1;
          ctx.stroke();
          // Highlight connected node
          const other=e.from===found.id?b:a;
          ctx.beginPath();
          ctx.arc(other.x,other.y,other.r+3,0,Math.PI*2);
          ctx.strokeStyle=found.color+"40";
          ctx.lineWidth=1;
          ctx.stroke();
        }

        // Label
        ctx.fillStyle="#fff";
        ctx.font="bold 11px Inter,sans-serif";
        ctx.textAlign="center";
        ctx.shadowColor="rgba(0,0,0,0.8)";
        ctx.shadowBlur=4;
        ctx.fillText(found.label,found.x,found.y-found.r-12);
        if(found.group>=0&&GROUPS[found.group]){
          ctx.font="9px Inter,sans-serif";
          ctx.fillStyle=found.color;
          ctx.fillText(GROUPS[found.group].label,found.x,found.y-found.r-24);
        }
        ctx.shadowBlur=0;
      }

      // Stats update
      if(tick%30===0){
        setStats({
          picks:nodes.reduce((s,n)=>s+n.picks,0),
          active:edges.filter(e=>{const a=nodes[e.from],b=nodes[e.to];return a&&b&&Math.max(a.a,b.a)>0.08;}).length,
          thinking:Math.round(nodes.filter(n=>n.group===-1).reduce((s,n)=>s+n.a,0)/12*100),
          nodes:nodes.length,
          edges:edges.length,
        });
      }

      animId=requestAnimationFrame(render);
    };

    animId=requestAnimationFrame(render);
    return()=>{cancelAnimationFrame(animId);window.removeEventListener("resize",resize);};
  },[]);

  return(
    <div style={{height:"100vh",background:"#0a0b10",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Header */}
      <div style={{height:44,background:"rgba(12,13,20,0.95)",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",zIndex:2,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <a href="/warehouse" style={{fontSize:10,color:"var(--text-tertiary)",textDecoration:"none",padding:"3px 8px",borderRadius:4,border:"1px solid var(--border-medium)"}}>← Map</a>
          <span style={{fontSize:13,fontWeight:700,letterSpacing:"-0.02em"}}>SlotPilot Neural Graph</span>
          <span style={{fontSize:8,padding:"2px 8px",borderRadius:10,background:"rgba(139,111,255,0.15)",color:"#8b6fff",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>ML + OR Live</span>
        </div>
        <div style={{display:"flex",gap:12,fontSize:9,fontFamily:"var(--font-mono)"}}>
          <span style={{display:"flex",alignItems:"center",gap:3,color:"var(--accent-green)"}}><span style={{width:4,height:4,borderRadius:"50%",background:"var(--accent-green)",animation:"pulse 1.5s ease infinite"}}/>LIVE</span>
          <span style={{color:"var(--text-tertiary)"}}>{stats.nodes} nodes</span>
          <span style={{color:"var(--text-tertiary)"}}>{stats.edges} edges</span>
          <span style={{color:"var(--text-tertiary)"}}>{stats.picks} picks</span>
          <span style={{color:"var(--accent-cict)"}}>{stats.active} active</span>
          <span style={{color:"var(--accent-purple)"}}>Think {stats.thinking}%</span>
        </div>
      </div>

      <canvas ref={canvasRef} onMouseMove={(e)=>{const r=e.currentTarget.getBoundingClientRect();mouseRef.current={x:e.clientX-r.left,y:e.clientY-r.top};}} style={{flex:1,cursor:"crosshair"}}/>

      {/* Hover detail */}
      {hovered&&hovered.group>=0&&(
        <div style={{position:"fixed",left:mouseRef.current.x+16,top:mouseRef.current.y+52,background:"rgba(12,13,20,0.95)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"8px 12px",minWidth:160,boxShadow:"0 8px 24px rgba(0,0,0,0.5)",zIndex:100,pointerEvents:"none"}}>
          <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:hovered.color}}/>
            <span style={{fontSize:11,fontWeight:600}}>{hovered.label}</span>
          </div>
          <div style={{fontSize:9,color:"var(--text-tertiary)"}}>{GROUPS[hovered.group]?.label} · Picks: {hovered.picks} · {Math.round(hovered.a*100)}% active</div>
        </div>
      )}

      {/* Legend */}
      <div style={{position:"absolute",bottom:14,left:14,background:"rgba(12,13,20,0.9)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:8,padding:"8px 12px",zIndex:2}}>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,maxWidth:300}}>
          {GROUPS.map((g,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:3}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:g.color}}/>
              <span style={{fontSize:7,color:"rgba(255,255,255,0.4)"}}>{g.label}</span>
            </div>
          ))}
          <div style={{display:"flex",alignItems:"center",gap:3}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:"#E2D44A"}}/>
            <span style={{fontSize:7,color:"rgba(255,255,255,0.4)"}}>ML/OR</span>
          </div>
        </div>
      </div>
    </div>
  );
}
