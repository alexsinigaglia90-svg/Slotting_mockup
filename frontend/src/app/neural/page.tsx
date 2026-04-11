"use client";

import { useRef, useEffect, useState } from "react";
import { genLocs, buildSkuGraph, CLUSTER_COLORS, type SkuNode, type CoEdge } from "@/lib/mock-data";

/* ═══ NEURAL GRAPH — real data, light background, grey mesh with pastel touches ═══ */

interface RenderNode extends SkuNode {
  x:number;y:number;vx:number;vy:number;r:number;a:number;color:string;
}

function hexToRgb(hex:string){return[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];}

export default function NeuralPage(){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const nodesRef=useRef<RenderNode[]>([]);
  const edgesRef=useRef<CoEdge[]>([]);
  const mouseRef=useRef({x:-999,y:-999});
  const [hovered,setHovered]=useState<RenderNode|null>(null);
  const [stats,setStats]=useState({nodes:0,edges:0,clusters:0,picks:0,active:0,correlations:0});
  const initRef=useRef(false);

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
    };
    resize();
    window.addEventListener("resize",resize);

    // Build graph from real data
    if(!initRef.current){
      initRef.current=true;
      const locs=genLocs();
      const{nodes:skuNodes,edges}=buildSkuGraph(locs);
      const w=canvas.offsetWidth,h=canvas.offsetHeight;
      const cx=w/2,cy=h/2;

      // Position nodes by cluster — arrange clusters in a circle
      const clusterNames=[...new Set(skuNodes.map(n=>n.cluster).filter(Boolean))];
      const clusterPositions=new Map<string,{x:number;y:number}>();
      clusterNames.forEach((name,i)=>{
        const angle=(i/clusterNames.length)*Math.PI*2-Math.PI/2;
        const dist=Math.min(w,h)*0.3;
        clusterPositions.set(name,{x:cx+Math.cos(angle)*dist,y:cy+Math.sin(angle)*dist});
      });

      const rng=(s:number)=>{let v=s;return()=>{v=(v*16807)%2147483647;return v/2147483647;};};
      const r=rng(99);

      nodesRef.current=skuNodes.map(n=>{
        const cp=clusterPositions.get(n.cluster)||{x:cx,y:cy};
        const angle=r()*Math.PI*2;
        const dist=20+r()*70;
        const color=CLUSTER_COLORS[n.cluster]||"#888";
        return{
          ...n,
          x:cp.x+Math.cos(angle)*dist,
          y:cp.y+Math.sin(angle)*dist,
          vx:0,vy:0,
          r:2+Math.sqrt(n.picksWeek)*0.3,// size proportional to picks
          a:0,
          color,
        };
      });
      edgesRef.current=edges;
    }

    const render=()=>{
      tick++;
      const nodes=nodesRef.current;
      const edges=edgesRef.current;
      const w=canvas.offsetWidth,h=canvas.offsetHeight;
      const cx=w/2,cy=h/2;

      // Light background
      ctx.fillStyle="#f5f5fa";
      ctx.fillRect(0,0,w,h);

      // Subtle grid
      ctx.strokeStyle="rgba(0,0,0,0.03)";
      ctx.lineWidth=0.5;
      for(let x=0;x<w;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
      for(let y=0;y<h;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}

      // Simulate picks
      if(tick%15===0){
        const skuNodes=nodes.filter(n=>n.picksWeek>0);
        const count=1+Math.floor(Math.random()*3);
        for(let c=0;c<count;c++){
          // Weight by picks — more picks = more likely to be activated
          const totalPicks=skuNodes.reduce((s,n)=>s+n.picksWeek,0);
          let pick=Math.random()*totalPicks;
          let chosen=skuNodes[0];
          for(const n of skuNodes){pick-=n.picksWeek;if(pick<=0){chosen=n;break;}}
          if(chosen){
            chosen.a=1;
            // Ripple to co-occurring items
            for(const e of edges){
              if(e.from===chosen.id||e.to===chosen.id){
                const oid=e.from===chosen.id?e.to:e.from;
                const other=nodes.find(n=>n.id===oid);
                if(other)other.a=Math.max(other.a,e.weight*0.6);
              }
            }
          }
        }
      }

      // Gentle physics
      for(const n of nodes){
        // Damped spring to initial position
        n.vx+=(n.x-n.x)*0;// no spring, just jitter
        n.vy+=(n.y-n.y)*0;
        // Random organic movement
        n.vx+=(Math.random()-0.5)*0.08;
        n.vy+=(Math.random()-0.5)*0.08;
        // Gentle repulsion
        for(const m of nodes){
          if(m===n)continue;
          const dx=n.x-m.x,dy=n.y-m.y;
          const d2=dx*dx+dy*dy;
          if(d2<400){
            const dist=Math.sqrt(d2)||1;
            n.vx+=dx/dist*0.2;
            n.vy+=dy/dist*0.2;
          }
        }
        n.vx*=0.92;
        n.vy*=0.92;
        n.x+=n.vx;
        n.y+=n.vy;
        n.x=Math.max(n.r+4,Math.min(w-n.r-4,n.x));
        n.y=Math.max(n.r+4,Math.min(h-n.r-4,n.y));
        n.a*=0.96;
      }

      // Draw edges — grey by default, colored when active
      ctx.lineCap="round";
      for(const e of edges){
        const a=nodes.find(n=>n.id===e.from);
        const b=nodes.find(n=>n.id===e.to);
        if(!a||!b)continue;
        const activity=Math.max(a.a,b.a);

        if(activity<0.03&&e.weight<0.25)continue;

        ctx.beginPath();
        // Slight curve
        const mx=(a.x+b.x)/2+(Math.sin(a.id+b.id)*4);
        const my=(a.y+b.y)/2+(Math.cos(a.id-b.id)*4);
        ctx.moveTo(a.x,a.y);
        ctx.quadraticCurveTo(mx,my,b.x,b.y);

        if(activity>0.1){
          const[cr,cg,cb]=hexToRgb(a.color);
          ctx.strokeStyle=`rgba(${cr},${cg},${cb},${0.1+activity*0.5})`;
          ctx.lineWidth=0.5+activity*e.weight*3;
        }else{
          ctx.strokeStyle=`rgba(0,0,0,${0.02+e.weight*0.04})`;
          ctx.lineWidth=0.3+e.weight*0.5;
        }
        ctx.stroke();
      }

      // Draw nodes
      for(const n of nodes){
        // Active glow
        if(n.a>0.1){
          const gr=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r+20*n.a);
          const[cr,cg,cb]=hexToRgb(n.color);
          gr.addColorStop(0,`rgba(${cr},${cg},${cb},${0.15+n.a*0.2})`);
          gr.addColorStop(1,"transparent");
          ctx.fillStyle=gr;
          ctx.beginPath();
          ctx.arc(n.x,n.y,n.r+20*n.a,0,Math.PI*2);
          ctx.fill();
        }

        // Node dot — grey base with pastel tint when active
        ctx.beginPath();
        ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
        if(n.a>0.15){
          const[cr,cg,cb]=hexToRgb(n.color);
          const mix=n.a;
          const grey=180;
          const fr=Math.round(grey*(1-mix)+cr*mix);
          const fg=Math.round(grey*(1-mix)+cg*mix);
          const fb=Math.round(grey*(1-mix)+cb*mix);
          ctx.fillStyle=`rgb(${fr},${fg},${fb})`;
        }else{
          const grey=160+Math.round(n.picksWeek*0.3);
          ctx.fillStyle=`rgb(${Math.min(200,grey)},${Math.min(200,grey)},${Math.min(210,grey)})`;
        }
        ctx.fill();

        // Subtle border
        ctx.strokeStyle=n.a>0.2?n.color+"80":"rgba(0,0,0,0.08)";
        ctx.lineWidth=n.a>0.2?1:0.5;
        ctx.stroke();
      }

      // Hover
      const mx=mouseRef.current.x,my=mouseRef.current.y;
      let found:RenderNode|null=null;
      for(const n of nodes){
        if(Math.hypot(mx-n.x,my-n.y)<n.r+8){found=n;break;}
      }
      setHovered(found);

      if(found){
        // Highlight ring
        ctx.beginPath();
        ctx.arc(found.x,found.y,found.r+6,0,Math.PI*2);
        ctx.strokeStyle=found.color;
        ctx.lineWidth=2;
        ctx.stroke();

        // Highlight connections with color
        const connectedIds=new Set<number>();
        for(const e of edges){
          if(e.from!==found.id&&e.to!==found.id)continue;
          const a=nodes.find(n=>n.id===e.from);
          const b=nodes.find(n=>n.id===e.to);
          if(!a||!b)continue;
          connectedIds.add(e.from===found.id?e.to:e.from);
          ctx.beginPath();
          ctx.moveTo(a.x,a.y);
          ctx.lineTo(b.x,b.y);
          ctx.strokeStyle=found.color+"60";
          ctx.lineWidth=1+e.weight*2;
          ctx.stroke();
        }

        // Highlight connected nodes
        for(const n of nodes){
          if(!connectedIds.has(n.id))continue;
          ctx.beginPath();
          ctx.arc(n.x,n.y,n.r+3,0,Math.PI*2);
          ctx.strokeStyle=found.color+"50";
          ctx.lineWidth=1.5;
          ctx.stroke();
        }

        // Label
        ctx.shadowColor="rgba(255,255,255,0.9)";
        ctx.shadowBlur=6;
        ctx.fillStyle="#1a1a2e";
        ctx.font="bold 11px Inter,sans-serif";
        ctx.textAlign="center";
        ctx.fillText(found.skuName,found.x,found.y-found.r-10);
        ctx.font="9px Inter,sans-serif";
        ctx.fillStyle=found.color;
        ctx.fillText(`${found.cluster} · ${found.picksWeek} picks/wk · co:${found.coScore}%`,found.x,found.y-found.r-22);
        ctx.shadowBlur=0;
      }

      // Cluster labels — faint, positioned at cluster centers
      if(tick%300<2){// redraw rarely for perf
        const clusterCenters=new Map<string,{x:number;y:number;count:number}>();
        for(const n of nodes){
          if(!n.cluster)continue;
          const c=clusterCenters.get(n.cluster)||{x:0,y:0,count:0};
          c.x+=n.x;c.y+=n.y;c.count++;
          clusterCenters.set(n.cluster,c);
        }
        clusterCenters.forEach((c,name)=>{
          const x=c.x/c.count,y=c.y/c.count;
          ctx.fillStyle="rgba(0,0,0,0.12)";
          ctx.font="bold 10px Inter,sans-serif";
          ctx.textAlign="center";
          ctx.fillText(name.toUpperCase(),x,y);
        });
      }

      // Stats
      if(tick%30===0){
        const clusters=new Set(nodes.map(n=>n.cluster).filter(Boolean));
        setStats({
          nodes:nodes.length,
          edges:edges.length,
          clusters:clusters.size,
          picks:nodes.reduce((s,n)=>Math.max(s,n.picksWeek),0),
          active:nodes.filter(n=>n.a>0.05).length,
          correlations:edges.filter(e=>{const a=nodes.find(n=>n.id===e.from);const b=nodes.find(n=>n.id===e.to);return a&&b&&e.weight>0.4;}).length,
        });
      }

      animId=requestAnimationFrame(render);
    };

    animId=requestAnimationFrame(render);
    return()=>{cancelAnimationFrame(animId);window.removeEventListener("resize",resize);};
  },[]);

  return(
    <div style={{height:"100vh",background:"#f5f5fa",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Header */}
      <div style={{height:44,background:"#fff",borderBottom:"1px solid rgba(0,0,0,0.08)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",zIndex:2,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <a href="/warehouse" style={{fontSize:10,color:"#888",textDecoration:"none",padding:"3px 8px",borderRadius:4,border:"1px solid rgba(0,0,0,0.1)"}}>← Map</a>
          <span style={{fontSize:13,fontWeight:700,color:"#1a1a2e",letterSpacing:"-0.02em"}}>SlotPilot Neural Graph</span>
          <span style={{fontSize:8,padding:"2px 8px",borderRadius:10,background:"rgba(139,111,255,0.1)",color:"#8b6fff",fontWeight:700,letterSpacing:"0.06em"}}>CORRELATIE ANALYSE</span>
        </div>
        <div style={{display:"flex",gap:14,fontSize:9,fontFamily:"var(--font-mono)",color:"#999"}}>
          <span style={{display:"flex",alignItems:"center",gap:3,color:"#34d89e"}}><span style={{width:4,height:4,borderRadius:"50%",background:"#34d89e",animation:"pulse 1.5s ease infinite"}}/>LIVE</span>
          <span>{stats.nodes} SKUs</span>
          <span>{stats.edges} relaties</span>
          <span>{stats.clusters} clusters</span>
          <span style={{color:"#8b6fff"}}>{stats.correlations} sterke correlaties</span>
          <span>{stats.active} actief</span>
        </div>
      </div>

      <canvas ref={canvasRef} onMouseMove={(e)=>{const r=e.currentTarget.getBoundingClientRect();mouseRef.current={x:e.clientX-r.left,y:e.clientY-r.top};}} style={{flex:1,cursor:"crosshair"}}/>

      {/* Hover detail */}
      {hovered&&(
        <div style={{position:"fixed",left:mouseRef.current.x+16,top:mouseRef.current.y+52,background:"#fff",border:"1px solid rgba(0,0,0,0.1)",borderRadius:10,padding:"10px 14px",minWidth:220,boxShadow:"0 8px 24px rgba(0,0,0,0.1)",zIndex:100,pointerEvents:"none"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:hovered.color}}/>
            <span style={{fontSize:12,fontWeight:600,color:"#1a1a2e"}}>{hovered.skuName}</span>
          </div>
          <div style={{fontSize:10,color:"#888",marginBottom:6}}>{hovered.category} · {hovered.cluster}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,fontSize:10}}>
            <div><div style={{color:"#bbb",fontSize:8}}>Picks/wk</div><div style={{fontWeight:600,fontFamily:"var(--font-mono)",color:"#1a1a2e"}}>{hovered.picksWeek}</div></div>
            <div><div style={{color:"#bbb",fontSize:8}}>Co-occur.</div><div style={{fontWeight:600,fontFamily:"var(--font-mono)",color:hovered.coScore>70?"#34d89e":"#f0c040"}}>{hovered.coScore}%</div></div>
            <div><div style={{color:"#bbb",fontSize:8}}>Slotting</div><div style={{fontWeight:600,fontFamily:"var(--font-mono)",color:hovered.slottingScore>70?"#34d89e":"#f07060"}}>{hovered.slottingScore}%</div></div>
          </div>
          <div style={{fontSize:9,color:"#aaa",marginTop:6,borderTop:"1px solid rgba(0,0,0,0.06)",paddingTop:4}}>
            {hovered.velocity}-class · {hovered.locationCount} locatie(s) · Gangpad {hovered.aisles.map(a=>`A${String(a+1).padStart(2,"0")}`).join(", ")}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{position:"absolute",bottom:14,left:14,background:"rgba(255,255,255,0.95)",border:"1px solid rgba(0,0,0,0.06)",borderRadius:8,padding:"8px 12px",zIndex:2}}>
        <div style={{fontSize:8,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4,fontWeight:600}}>Affinity Clusters</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,maxWidth:280}}>
          {Object.entries(CLUSTER_COLORS).map(([name,color])=>(
            <div key={name} style={{display:"flex",alignItems:"center",gap:3}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:color}}/>
              <span style={{fontSize:7,color:"#999"}}>{name}</span>
            </div>
          ))}
        </div>
        <div style={{fontSize:7,color:"#bbb",marginTop:4,borderTop:"1px solid rgba(0,0,0,0.04)",paddingTop:3}}>
          Node grootte = pickfrequentie · Lijn dikte = co-occurrence sterkte
        </div>
      </div>
    </div>
  );
}
