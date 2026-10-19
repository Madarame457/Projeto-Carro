// Visualizador 3D do carro. O Three.js é carregado do CDN por import() dinâmico,
// assim o site também funciona abrindo o index.html direto (file://).
// Os modelos são gerados por código: perfil lateral extrudado + rodas + vidros.
(async()=>{
const box=document.getElementById('viewer');
const layer=document.getElementById('hotspots');
const CI=window.CI||{cur:0,type:'sedan',color:'#2c449f',plate:''};
const fail=()=>box.classList.add('no3d');
let THREE;
try{THREE=await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js');}
catch(e){fail();return;}

let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}
catch(e){fail();return;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.0;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.VSMShadowMap;
box.prepend(renderer.domElement);

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(26,1,.1,100);
const {Vector3}=THREE;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const sstep=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};

/* ---------- Iluminação de estúdio (vira mapa de reflexo) ---------- */
(function(){
  const env=new THREE.Scene();
  const sg=new THREE.SphereGeometry(30,64,32),cols=[],c=new THREE.Color();
  const floor=new THREE.Color(0x07080b),hor=new THREE.Color(0x58607a),top=new THREE.Color(0x161b26);
  for(let i=0;i<sg.attributes.position.count;i++){
    const t=sg.attributes.position.getY(i)/30;
    if(t<0)c.copy(hor).lerp(floor,Math.min(1,-t*6));
    else c.copy(hor).lerp(top,Math.min(1,t*2.2));
    cols.push(c.r,c.g,c.b);
  }
  sg.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
  env.add(new THREE.Mesh(sg,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
  const panel=(w,h,k,x,y,z,tint=[1,1,1])=>{
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(k*tint[0],k*tint[1],k*tint[2]),side:THREE.DoubleSide}));
    m.position.set(x,y,z);m.lookAt(0,0,0);env.add(m);
  };
  panel(18,7,3.2,0,16,0);                       // softbox superior
  panel(30,1.6,2.8,0,2.6,14);  panel(30,1.6,2.8,0,2.6,-14); // tiras laterais (linhas de reflexo)
  panel(30,.6,1.6,0,9,14);   panel(30,.6,1.6,0,9,-14);
  panel(8,5,3.4,15,6,6,[1,.92,.82]);            // luz principal quente
  panel(8,5,2.4,-15,5,-6,[.75,.85,1.15]);       // contraluz frio
  panel(10,3,1.4,-4,3,-16,[.8,.9,1.2]);
  const pm=new THREE.PMREMGenerator(renderer);
  scene.environment=pm.fromScene(env,.02).texture;
  pm.dispose();
})();
const sun=new THREE.DirectionalLight(0xffffff,1.1);
sun.position.set(1.5,9,2.5);
sun.castShadow=true;
Object.assign(sun.shadow.camera,{left:-4.5,right:4.5,top:4.5,bottom:-4.5,near:1,far:20});
sun.shadow.mapSize.set(2048,2048);sun.shadow.radius=9;sun.shadow.blurSamples=24;sun.shadow.bias=-.0004;
scene.add(sun,new THREE.HemisphereLight(0xc8d6ff,0x090a0e,.35));

// Chão: sombra projetada + oclusão suave + plataforma
function radialTex(stops){
  const cv=document.createElement('canvas');cv.width=cv.height=256;
  const g=cv.getContext('2d'),gr=g.createRadialGradient(128,128,0,128,128,128);
  stops.forEach(s=>gr.addColorStop(s[0],s[1]));
  g.fillStyle=gr;g.fillRect(0,0,256,256);
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const ground=new THREE.Mesh(new THREE.PlaneGeometry(14,14),new THREE.ShadowMaterial({opacity:.55}));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;
const ao=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({
  map:radialTex([[0,'rgba(0,0,0,.9)'],[.55,'rgba(0,0,0,.6)'],[1,'rgba(0,0,0,0)']]),transparent:true,depthWrite:false}));
ao.rotation.x=-Math.PI/2;ao.position.y=.003;
const disc=new THREE.Mesh(new THREE.CircleGeometry(3.6,96),new THREE.MeshBasicMaterial({
  map:radialTex([[0,'rgba(60,90,200,.28)'],[.7,'rgba(44,68,159,.10)'],[1,'rgba(44,68,159,0)']]),transparent:true,depthWrite:false}));
disc.rotation.x=-Math.PI/2;disc.position.y=-.002;
const ring=new THREE.Mesh(new THREE.RingGeometry(3.15,3.17,160),new THREE.MeshBasicMaterial({color:0x5b7bff,transparent:true,opacity:.35}));
ring.rotation.x=-Math.PI/2;ring.position.y=.001;
scene.add(disc,ring,ground);

/* ---------- Materiais ---------- */
const M={
  paint:new THREE.MeshPhysicalMaterial({color:CI.color,metalness:.5,roughness:.36,clearcoat:1,clearcoatRoughness:.09}),
  glass:new THREE.MeshPhysicalMaterial({color:0x080b10,metalness:.2,roughness:.04,clearcoat:1,clearcoatRoughness:.02,envMapIntensity:1.6}),
  gloss:new THREE.MeshPhysicalMaterial({color:0x07080a,metalness:.1,roughness:.12,clearcoat:1,clearcoatRoughness:.05}),
  trim:new THREE.MeshStandardMaterial({color:0x101216,roughness:.62,metalness:.05}),
  chrome:new THREE.MeshStandardMaterial({color:0xe9edf2,metalness:1,roughness:.08}),
  tire:new THREE.MeshStandardMaterial({color:0x17181a,roughness:.88}),
  rim:new THREE.MeshStandardMaterial({color:0xc3c8d0,metalness:1,roughness:.22}),
  rimDark:new THREE.MeshStandardMaterial({color:0x2b2e34,metalness:.85,roughness:.38}),
  disc:new THREE.MeshStandardMaterial({color:0x8d9198,metalness:.9,roughness:.42}),
  caliper:new THREE.MeshStandardMaterial({color:0x32353b,metalness:.4,roughness:.45}),
  void:new THREE.MeshBasicMaterial({color:0x020203}),
  lamp:new THREE.MeshPhysicalMaterial({color:0x14181e,metalness:.6,roughness:.06,clearcoat:1}),
  led:new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xeef4ff,emissiveIntensity:3}),
  lens:new THREE.MeshStandardMaterial({color:0xdfe8ff,emissive:0xcfe0ff,emissiveIntensity:1.2,metalness:.3,roughness:.1}),
  tail:new THREE.MeshPhysicalMaterial({color:0x4a060a,metalness:.3,roughness:.08,clearcoat:1,emissive:0x300000,emissiveIntensity:1}),
  tailLed:new THREE.MeshStandardMaterial({color:0xb00000,emissive:0xff0000,emissiveIntensity:1.15}),
  amber:new THREE.MeshStandardMaterial({color:0xffa640,emissive:0xff8a1a,emissiveIntensity:.9})
};

/* ---------- Matemática dos perfis ---------- */
// Interpolação cúbica monotônica (sem "ondas" entre os pontos de controle)
function curve(pts){
  const n=pts.length,X=pts.map(p=>p[0]),Y=pts.map(p=>p[1]),d=[],m=[];
  for(let i=0;i<n-1;i++)d[i]=(Y[i+1]-Y[i])/(X[i+1]-X[i]);
  m[0]=d[0];m[n-1]=d[n-2];
  for(let i=1;i<n-1;i++)m[i]=d[i-1]*d[i]<=0?0:(d[i-1]+d[i])/2;
  for(let i=0;i<n-1;i++){
    if(d[i]===0){m[i]=m[i+1]=0;continue;}
    const a=m[i]/d[i],b=m[i+1]/d[i],s=a*a+b*b;
    if(s>9){const t=3/Math.sqrt(s);m[i]=t*a*d[i];m[i+1]=t*b*d[i];}
  }
  return x=>{
    if(x<=X[0])return Y[0];if(x>=X[n-1])return Y[n-1];
    let i=0;while(x>X[i+1])i++;
    const h=X[i+1]-X[i],t=(x-X[i])/h,t2=t*t,t3=t2*t;
    return (2*t3-3*t2+1)*Y[i]+(t3-2*t2+t)*h*m[i]+(-2*t3+3*t2)*Y[i+1]+(t3-t2)*h*m[i+1];
  };
}
// Arredondamento circular das pontas: começa a raio "r" da extremidade e termina tangente
const round=(d,r)=>d>=r?0:r-Math.sqrt(Math.max(0,r*r-(r-d)*(r-d)));

/* ---------- Especificações das carrocerias (metros; frente = +x) ---------- */
// yb: linha inferior, yt: linha de cintura/capô/porta-malas, roof: perfil da estufa,
// side: janelas laterais, roofX: trecho do teto pintado, B: coluna central, doors: recortes.
const SPECS={
 hatch:{F:2.0,R:-2.05,W:1.74,r:.315,ax:[1.27,-1.28],rc:[.22,.2,.075,.07,.05,.05],trimH:.055,nt:5.2,ng:3.2,gap:.05,hl:[.085,.14],
  yb:[[-2.05,.38],[-1.75,.28],[-1.28,.26],[1.27,.25],[1.7,.26],[2,.29]],
  yt:[[-2.05,.96],[-1.6,.955],[-.6,.93],[.4,.895],[.86,.87],[1.4,.82],[1.7,.79],[2,.75]],
  gh:[.86,-1.96],roof:[[.45,1.15],[.05,1.36],[-.3,1.435],[-.9,1.43],[-1.35,1.39],[-1.66,1.30],[-1.86,1.12]],
  roofX:[-1.6,.02],side:[.66,-1.36],B:-.36,doors:[.80,-.36,-1.06],hood:1.36},
 sedan:{F:2.315,R:-2.315,W:1.78,r:.325,ax:[1.38,-1.32],rc:[.24,.24,.08,.08,.05,.05],trimH:.055,nt:5.2,ng:3.2,gap:.05,hl:[.085,.14],
  yb:[[-2.315,.36],[-2.0,.28],[-1.32,.25],[1.38,.24],[2.0,.25],[2.315,.28]],
  yt:[[-2.315,.95],[-1.9,.972],[-1.6,.972],[-1.1,.955],[-.2,.925],[.6,.89],[.98,.87],[1.6,.83],[2.0,.79],[2.315,.73]],
  gh:[.98,-1.62],roof:[[.55,1.17],[.12,1.36],[-.15,1.42],[-.6,1.44],[-.95,1.40],[-1.25,1.25]],
  roofX:[-.96,.06],side:[.78,-1.32],B:-.30,doors:[.92,-.30,-1.12],hood:1.5},
 suv:{F:2.21,R:-2.21,W:1.84,r:.36,ax:[1.33,-1.31],rc:[.18,.16,.07,.07,.06,.06],trimH:.11,clad:true,rails:true,nt:6.5,ng:3.8,gap:.06,hl:[.09,.15],
  yb:[[-2.21,.46],[-1.9,.38],[-1.31,.37],[1.33,.37],[1.9,.39],[2.21,.42]],
  yt:[[-2.21,1.07],[-1.7,1.075],[-.6,1.055],[.5,1.025],[1.0,1.0],[1.55,.985],[1.9,.97],[2.21,.94]],
  gh:[1.0,-2.12],roof:[[.6,1.33],[.22,1.575],[-.05,1.645],[-1.5,1.66],[-1.9,1.62],[-2.06,1.45]],
  roofX:[-1.94,-.02],side:[.84,-1.82],B:-.30,C2:-1.22,doors:[.92,-.30,-1.08],hood:1.55},
 picape:{F:2.6,R:-2.7,W:1.86,r:.375,ax:[1.62,-1.46],rc:[.15,.08,.06,.04,.06,.05],trimH:.11,clad:true,bed:-.93,nt:7,ng:4,gap:.06,hl:[.10,.16],
  yb:[[-2.7,.50],[-2.45,.44],[-1.46,.42],[1.62,.41],[2.3,.43],[2.6,.45]],
  yt:[[-2.7,1.13],[-.95,1.14],[.3,1.12],[1.25,1.10],[1.9,1.09],[2.3,1.08],[2.6,1.05]],
  gh:[1.25,-.88],roof:[[.85,1.42],[.5,1.71],[.2,1.79],[-.68,1.79],[-.83,1.62]],
  roofX:[-.74,.16],side:[1.08,-.72],B:-.02,doors:[1.14,-.02,-.86],hood:1.8}
};

/* ---------- Seção transversal da carroceria ---------- */
const NB=6;                   // expoente da superelipse na parte de baixo (o do ombro vem de cada tipo)
function section(T,x){
  const L=T.F-T.R,dF=T.F-x,dR=x-T.R,front=dF<dR,d=Math.max(0,front?dF:dR);
  const [hF,hR,tF,tR,bF,bR]=T.rc;
  let hw=T.W/2*T.plan(x);
  T.ax.forEach(a=>{hw*=1+.012*Math.exp(-(((x-a)/.5)**2));}); // leve alargamento sobre as rodas
  hw-=round(d,front?hF:hR);
  const yt=T.ytf(x)-round(d,front?tF:tR);
  const yb=T.ybf(x)+round(d,front?bF:bR);
  let clip=-1;
  T.ax.forEach(a=>{const dx=x-a;if(Math.abs(dx)<T.ar)clip=Math.max(clip,T.r+.02+Math.sqrt(T.ar*T.ar-dx*dx));});
  const yw=yb+(yt-yb)*.56;
  return {x,yb,yt,hw:Math.max(hw,.001),yw,clip,nt:T.nt,bed:T.bed!==undefined&&x<T.bed-.02&&x>T.R+.1};
}
// Ponto da seção no ângulo th (-PI/2 = fundo, 0 = lateral direita, PI/2 = topo)
function ringPt(S,th,o){
  const c=Math.cos(th),s=Math.sin(th);let y,z;
  if(s>=0){
    const e=2/S.nt,q=Math.pow(s,e);
    y=S.yw+(S.yt-S.yw)*q;
    // ombro com leve inclinação + vinco lateral (linha de caráter)
    z=S.hw*Math.sign(c)*Math.pow(Math.abs(c),e)*(1-.05*q-.006*Math.exp(-(((q-.5)/.03)**2)));
    if(S.bed){const k=sstep(S.hw-.05,S.hw-.11,Math.abs(z));y-=.045*k;}
  }else{
    const e=2/NB,q=Math.pow(-s,e);
    y=S.yw-(S.yw-S.yb)*q;
    z=S.hw*Math.sign(c)*Math.pow(Math.abs(c),e)*(1-.05*q);
  }
  if(y<S.clip)y=S.clip;                  // recorte da caixa de roda
  o.y=y;o.z=z;return o;
}
// Ângulo do lado direito que corresponde a uma altura y (busca binária)
function thAtY(S,y){
  let a=-Math.PI/2,b=Math.PI/2;const p={};
  for(let i=0;i<30;i++){const m=(a+b)/2;ringPt(S,m,p);if(p.y<y)a=m;else b=m;}
  return (a+b)/2;
}
// Altura da superfície superior numa largura z
function topYAtZ(S,z){
  let a=0,b=Math.PI/2;const p={};
  for(let i=0;i<24;i++){const m=(a+b)/2;ringPt(S,m,p);if(p.z>z)a=m;else b=m;}
  return ringPt(S,(a+b)/2,p).y;
}

// Monta um carro e devolve também as âncoras dos pontos de checagem
function buildCar(type){
  const T=TYPES[type],g=new THREE.Group(),ar=T.r+.08,W=T.W;
  // Carroceria inferior com recortes das caixas de roda
  const s=new THREE.Shape(),[fa,ra]=T.ax;
  s.moveTo(T.R+.12,T.y0);
  [ra,fa].forEach(a=>{
    s.lineTo(a-ar,T.y0);s.lineTo(a-ar,T.r);
    s.absarc(a,T.r,ar,Math.PI,0,true);
    s.lineTo(a+ar,T.y0);
  });
  s.lineTo(T.F-.12,T.y0);
  T.top.forEach(p=>p[0]==='L'?s.lineTo(p[1],p[2]):s.quadraticCurveTo(p[1],p[2],p[3],p[4]));
  g.add(new THREE.Mesh(extrude(s,W,.08),paint));
  // Cabine de vidro + teto pintado
  const cabW=W*.86;
  g.add(new THREE.Mesh(extrude(path(T.cab[0],T.cab.slice(1)),cabW,.1),glass));
  const [r0,r1,ry]=T.roof;
  const roof=path([r0,ry-.05],[['L',r1,ry-.05],['Q',r1+.12,ry-.04,r1+.1,ry+.03],['L',r0-.05,ry+.03],['Q',r0-.14,ry-.04,r0,ry-.05]]);
  g.add(new THREE.Mesh(extrude(roof,cabW+.06,.04),paint));
  // Coluna central (B) escurecida
  const bp=new THREE.Mesh(new THREE.BoxGeometry(.09,ry-T.cab[0][1]-.1,cabW+.22),black);
  bp.position.set((r0+r1)/2+(type==='picape'?0:.05),(ry+T.cab[0][1])/2-.02,0);
  if(type!=='picape')g.add(bp);
  // Saias laterais, para-choques e grade
  const len=T.F-T.R;
  const sill=new THREE.Mesh(new THREE.BoxGeometry(fa-ra-ar*2-.05,.09,W+.03),black);
  sill.position.set((fa+ra)/2,T.y0+.06,0);g.add(sill);
  const grill=new THREE.Mesh(new THREE.BoxGeometry(.1,.16,W*.5),black);
  grill.position.set(T.F+.04,T.lf[1]-.17,0);g.add(grill);
  const bumpF=new THREE.Mesh(new THREE.BoxGeometry(.12,.1,W*.82),black);
  bumpF.position.set(T.F+.03,T.y0+.12,0);g.add(bumpF);
  const bumpR=bumpF.clone();bumpR.position.x=T.R-.01;g.add(bumpR);
  // Faróis, lanternas e placa
  [-1,1].forEach(z=>{
    const h=new THREE.Mesh(new THREE.BoxGeometry(.12,.07,W*.24),headM);
    h.position.set(T.lf[0],T.lf[1],z*W*.32);g.add(h);
    const t=new THREE.Mesh(new THREE.BoxGeometry(.1,.08,W*.26),tailM);
    t.position.set(T.lr[0],T.lr[1],z*W*.32);g.add(t);
    const m=new THREE.Mesh(new THREE.BoxGeometry(.18,.08,.05),paint);
    m.position.set(T.cab[0][0]-.25,T.cab[0][1]+.12,z*(cabW/2+.12));g.add(m);
  });
  const pl=new THREE.Mesh(new THREE.BoxGeometry(.03,.15,.5),plateM);
  pl.position.set(T.plate[0],T.plate[1],0);g.add(pl);
  // Caçamba da picape e rack de teto do SUV
  if(T.bed){
    const bed=new THREE.Mesh(new THREE.BoxGeometry(T.bed[1]-T.bed[0],.03,W-.22),black);
    bed.position.set((T.bed[0]+T.bed[1])/2,1.215,0);g.add(bed);
  }
  if(T.rails)[-1,1].forEach(z=>{
    const rl=new THREE.Mesh(new THREE.BoxGeometry(r1-r0-.2,.04,.05),black);
    rl.position.set((r0+r1)/2,ry+.1,z*cabW*.4);g.add(rl);
  });
  // Rodas
  [fa,ra].forEach(x=>[-1,1].forEach(z=>{
    const w=wheel(T);w.position.set(x,T.r,z*(W/2-.13));
    if(z<0)w.rotation.y=Math.PI;
    g.add(w);
  }));
  // Centraliza no comprimento
  const cx=(T.F+T.R)/2;g.children.forEach(m=>m.position.x-=cx);
  const V=(x,y,z)=>new THREE.Vector3(x-cx,y,z);
  const belt=T.cab[0][1];
  return {group:g,len,W,anchors:[
    {p:V((r0+r1)/2-.35,belt+.22,cabW/2+.1),n:new THREE.Vector3(0,0,1)},                   // 1 anúncio: etiqueta no vidro
    {p:V(fa-.75,belt-.32,W/2+.02),n:new THREE.Vector3(0,0,1)},                            // 2 lataria: porta dianteira
    {p:V(T.F-.6,belt+.02,0),n:new THREE.Vector3(.75,.65,.2).normalize()},                // 3 mecânica: capô
    {p:V(T.plate[0]-.03,T.plate[1],0),n:new THREE.Vector3(-1,0,0)},                       // 4 documentação: placa
    {p:V(ra,T.r,W/2+.02),n:new THREE.Vector3(0,0,1)}                                       // 5 rodagem: roda traseira
  ]};
}

/* ---------- Troca de carroceria com pequena animação ---------- */
const pivot=new THREE.Group();scene.add(pivot);pivot.add(ao);
let car=null,pop=1,dist=10;
function setType(t){
  if(!TYPES[t])return;
  if(car)pivot.remove(car.group);
  car=buildCar(t);
  pivot.add(car.group);
  shadow.scale.set(car.len*1.25,car.W*1.6,1);
  pop=0;
  resize();
}

// Controles: arrastar gira o carro (horizontal) e a câmera (vertical)
let yaw=-.6,yawT=yaw,pitch=.32,pitchT=pitch,drag=null,idle=0,lastT=performance.now();
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const cv=renderer.domElement;
cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,yaw:yawT,pitch:pitchT};cv.setPointerCapture(e.pointerId);box.classList.add('grab');});
cv.addEventListener('pointermove',e=>{
  if(!drag)return;
  yawT=drag.yaw+(e.clientX-drag.x)*.008;
  pitchT=Math.min(.75,Math.max(.05,drag.pitch+(e.clientY-drag.y)*.004));
  idle=0;
});
const end=()=>{drag=null;box.classList.remove('grab');};
cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);

function focus(k){
  if(!car||!car.anchors[k])return;
  const n=car.anchors[k].n;
  let target=Math.atan2(camera.position.x,camera.position.z)-Math.atan2(n.x,n.z);
  target+=(n.y>.5?-.5:.35); // vista 3/4 em vez de totalmente de frente
  const d=((target-yawT)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI;
  yawT+=d;pitchT=n.y>.5?.55:.28;idle=-5;
}

function resize(){
  const w=box.clientWidth,h=box.clientHeight;
  if(!w||!h)return;
  renderer.setSize(w,h,false);
  camera.aspect=w/h;
  camera.updateProjectionMatrix();
  // Distância que enquadra o carro inteiro em qualquer proporção de tela
  const L=car?car.len:4.3,fov=camera.fov*Math.PI/180;
  dist=Math.max(L*.7/Math.tan(fov/2)/Math.min(camera.aspect,1.6),2.1/Math.tan(fov/2));
}
new ResizeObserver(resize).observe(box);

// Pontos HTML acompanham a projeção 3D
const hsEls=[...layer.querySelectorAll('.hs')];
const tmp=new THREE.Vector3(),nrm=new THREE.Vector3(),toCam=new THREE.Vector3();
function placeHotspots(){
  const w=box.clientWidth,h=box.clientHeight;
  hsEls.forEach((el,k)=>{
    const a=car.anchors[k];if(!a)return;
    tmp.copy(a.p).applyMatrix4(car.group.matrixWorld);
    nrm.copy(a.n).applyQuaternion(pivot.quaternion);
    toCam.copy(camera.position).sub(tmp).normalize();
    el.classList.toggle('back',nrm.dot(toCam)<.08);
    tmp.project(camera);
    el.style.transform=`translate(${(tmp.x*.5+.5)*w}px,${(-tmp.y*.5+.5)*h}px)`;
  });
}

let visible=true;
new IntersectionObserver(es=>{visible=es[0].isIntersecting;}).observe(box);
function loop(now){
  requestAnimationFrame(loop);
  const dt=Math.min(Math.max((now-lastT)/1000,0),.05);lastT=now;
  idle+=dt;
  if(!drag&&idle>4&&!reduce)yawT+=dt*.25;
  yaw+=(yawT-yaw)*Math.min(1,dt*6);
  pitch+=(pitchT-pitch)*Math.min(1,dt*6);
  pivot.rotation.y=yaw;
  if(pop<1){pop=Math.min(1,pop+dt*2.5);const e=1-Math.pow(1-pop,3);car.group.scale.set(1,.85+.15*e,1);car.group.position.y=(1-e)*.25;}
  camera.position.set(0,.85+Math.sin(pitch)*dist,Math.cos(pitch)*dist);
  camera.lookAt(0,.85,0);
  pivot.updateMatrixWorld(true);
  renderer.render(scene,camera);
  placeHotspots();
}

setType(CI.type);
window.Car3D={setType,setColor:c=>paint.color.set(c),focus};
box.classList.add('ready');
requestAnimationFrame(loop);
})();
