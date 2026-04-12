// Shared mock data used by warehouse map

export type Velocity = "A" | "B" | "C" | "D" | "empty";

export interface Loc {
  id: string; aisle: number; side: "L" | "R"; position: number; level: number;
  velocity: Velocity; skuName: string | null; skuId: string | null;
  category: string | null; picksWeek: number; picksMonth: number;
  lastPicked: string | null;
  routeScore: number;
  slottingScore: number;
  coCluster: string;
  coScore: number;
  stock: number; maxStock: number;
}

const NUM_AISLES = 15;
const RACKS_PER_SIDE = 20;

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

export const CLUSTER_NAMES = ["Schoonmaak","Beauty Basics","Snacks & Snoep","Tuin & Buiten","Kantoor Essentials","Huisdier","Seizoen Deco","Kids Fun","Keuken"];

export const CLUSTER_COLORS: Record<string,string> = {
  "Schoonmaak":"#34d89e","Beauty Basics":"#e879a8","Snacks & Snoep":"#f0c040",
  "Tuin & Buiten":"#5ba8ff","Kantoor Essentials":"#8b6fff","Huisdier":"#ff8c5a",
  "Seizoen Deco":"#c084fc","Kids Fun":"#6dd4e0","Keuken":"#7cba5f",
};

function rng(seed:number){let s=seed;return()=>{s=(s*16807)%2147483647;return s/2147483647;};}

export function genLocs():Loc[]{
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
        coCluster:empty?"":CLUSTER_NAMES[Math.floor((a+Math.floor(r()*3))%9)],
        coScore:empty?0:40+Math.floor(r()*60),
        maxStock:vel==="A"?48:vel==="B"?36:vel==="C"?24:12,
        stock:empty?0:vel==="A"?8+Math.floor(r()*40):vel==="B"?5+Math.floor(r()*30):vel==="C"?2+Math.floor(r()*22):Math.floor(r()*12),
      });
    }
  return locs;
}

// Build co-occurrence graph from locations
// Group by unique SKU name, compute co-occurrence between SKUs in same orders
export interface SkuNode {
  id: number;
  skuName: string;
  category: string;
  cluster: string;
  velocity: Velocity;
  picksWeek: number;
  coScore: number;
  slottingScore: number;
  locationCount: number;
  aisles: number[];
}

export interface CoEdge {
  from: number;
  to: number;
  weight: number; // 0-1, based on co-occurrence strength
  reason: string;
}

export function buildSkuGraph(locs: Loc[]): { nodes: SkuNode[]; edges: CoEdge[] } {
  const r = rng(77);
  // Get unique SKU names (level 1 only to avoid duplicates)
  const skuMap = new Map<string, Loc[]>();
  locs.filter(l => l.velocity !== "empty" && l.level === 1 && l.skuName).forEach(l => {
    const existing = skuMap.get(l.skuName!) || [];
    existing.push(l);
    skuMap.set(l.skuName!, existing);
  });

  const nodes: SkuNode[] = [];
  const nameToId = new Map<string, number>();

  skuMap.forEach((locations, name) => {
    const first = locations[0];
    const id = nodes.length;
    nameToId.set(name, id);
    nodes.push({
      id,
      skuName: name,
      category: first.category || "",
      cluster: first.coCluster,
      velocity: first.velocity,
      picksWeek: locations.reduce((s, l) => s + l.picksWeek, 0),
      coScore: first.coScore,
      slottingScore: first.slottingScore,
      locationCount: locations.length,
      aisles: [...new Set(locations.map(l => l.aisle))],
    });
  });

  const edges: CoEdge[] = [];

  // Co-occurrence: SKUs in the same cluster are co-picked
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];

      // Same cluster = strong co-occurrence
      if (a.cluster === b.cluster && a.cluster !== "") {
        const weight = 0.3 + Math.min(a.coScore, b.coScore) / 100 * 0.5 + r() * 0.2;
        if (weight > 0.35) {
          edges.push({ from: i, to: j, weight: Math.min(1, weight), reason: `Co-occurrence in ${a.cluster} cluster` });
        }
      }
      // Same aisle = spatial correlation
      else if (a.aisles.some(ai => b.aisles.includes(ai))) {
        const weight = 0.1 + r() * 0.2;
        if (r() < 0.3) { // sparse cross-cluster
          edges.push({ from: i, to: j, weight, reason: `Spatial proximity in aisle ${a.aisles[0]}` });
        }
      }
      // Same category = category affinity
      else if (a.category === b.category && a.category !== "") {
        const weight = 0.15 + r() * 0.15;
        if (r() < 0.2) {
          edges.push({ from: i, to: j, weight, reason: `Category affinity: ${a.category}` });
        }
      }
    }
  }

  return { nodes, edges };
}
