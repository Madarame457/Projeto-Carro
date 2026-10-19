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

// Materiais compartilhados
const paint=new THREE.MeshPhysicalMaterial({color:CI.color,metalness:.45,roughness:.35,clearcoat:1,clearcoatRoughness:.06});
const glass=new THREE.MeshPhysicalMaterial({color:0x0b111c,metalness:.3,roughness:.04,clearcoat:1,envMapIntensity:1.4});
const black=new THREE.MeshStandardMaterial({color:0x111318,roughness:.6,metalness:.2});
const tire=new THREE.MeshStandardMaterial({color:0x121212,roughness:.92});
const rim=new THREE.MeshStandardMaterial({color:0xcfd5de,metalness:1,roughness:.25});
const headM=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xeaf2ff,emissiveIntensity:2.2});
const tailM=new THREE.MeshStandardMaterial({color:0x550000,emissive:0xff1a1a,emissiveIntensity:1.6});
const plateM=new THREE.MeshStandardMaterial({color:0xf2f4f8,roughness:.5});

// Perfis laterais de cada carroceria. Segmentos: ['L',x,y] linha, ['Q',cx,cy,x,y] curva.
// F/R: frente/traseira, ax: eixos, r: raio da roda, y0: altura do assoalho, W: largura.
const TYPES={
 hatch:{F:1.95,R:-2,ax:[1.25,-1.25],r:.33,y0:.28,W:1.74,
  top:[['L',1.95,.45],['Q',2.03,.62,1.93,.74],['L',1.78,.8],['Q',1.3,.9,.7,.96],['L',-1.7,1],['Q',-1.98,1,-2.02,.85],['L',-2,.36],['Q',-1.98,.28,-1.9,.28]],
  cab:[[.75,.9],['L',.05,1.36],['Q',-.12,1.43,-.38,1.43],['L',-1.3,1.41],['Q',-1.58,1.39,-1.74,1.2],['L',-1.94,.98],['L',-1.94,.9]],
  roof:[-1.4,.02,1.43],lf:[1.9,.76],lr:[-2.03,.9],plate:[-2.04,.58]},
 sedan:{F:2.15,R:-2.15,ax:[1.3,-1.3],r:.33,y0:.28,W:1.8,
  top:[['L',2.15,.45],['Q',2.24,.62,2.12,.74],['L',1.95,.8],['Q',1.4,.92,.85,.96],['L',-1.25,.98],['Q',-1.75,.98,-2.08,.92],['Q',-2.22,.88,-2.2,.62],['L',-2.15,.36],['Q',-2.12,.28,-2.02,.28]],
  cab:[[.9,.9],['L',.18,1.35],['Q',.02,1.42,-.24,1.42],['L',-.78,1.42],['Q',-.98,1.41,-1.12,1.3],['L',-1.5,.97],['L',-1.5,.9]],
  roof:[-.92,.08,1.42],lf:[2.1,.76],lr:[-2.2,.86],plate:[-2.24,.6]},
 suv:{F:2.2,R:-2.2,ax:[1.35,-1.35],r:.38,y0:.36,W:1.86,
  top:[['L',2.22,.55],['Q',2.32,.78,2.2,.95],['L',2.05,1],['Q',1.5,1.08,1,1.12],['L',-1.95,1.15],['Q',-2.22,1.15,-2.26,.95],['L',-2.24,.45],['Q',-2.22,.36,-2.12,.36]],
  cab:[[1.05,1.05],['L',.32,1.6],['Q',.16,1.67,-.1,1.67],['L',-1.85,1.65],['Q',-2.06,1.63,-2.11,1.48],['L',-2.18,1.1],['L',-2.18,1.05]],
  roof:[-1.95,.12,1.67],rails:true,lf:[2.2,.96],lr:[-2.27,1.05],plate:[-2.3,.68]},
 picape:{F:2.45,R:-2.5,ax:[1.55,-1.5],r:.37,y0:.36,W:1.84,
  top:[['L',2.47,.55],['Q',2.56,.8,2.45,.95],['L',2.3,1],['Q',1.8,1.08,1.25,1.12],['L',-2.4,1.16],['Q',-2.52,1.16,-2.52,1],['L',-2.5,.45],['Q',-2.48,.36,-2.38,.36]],
  cab:[[1.3,1.05],['L',.6,1.62],['Q',.45,1.69,.2,1.69],['L',-.55,1.69],['Q',-.69,1.67,-.71,1.55],['L',-.73,1.1],['L',-.73,1.05]],
  roof:[-.62,.42,1.69],bed:[-2.38,-.84],lf:[2.45,.96],lr:[-2.55,1.02],plate:[-2.56,.62]}
};

function extrude(shape,depth,bevel){
  const g=new THREE.ExtrudeGeometry(shape,{depth:depth-bevel*2,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel*.8,bevelSegments:5,curveSegments:24});
  g.translate(0,0,-(depth-bevel*2)/2);
  return g;
}
function path(start,segs){
  const s=new THREE.Shape();s.moveTo(start[0],start[1]);
  segs.forEach(p=>p[0]==='L'?s.lineTo(p[1],p[2]):s.quadraticCurveTo(p[1],p[2],p[3],p[4]));
  return s;
}
function wheel(T){
  const w=new THREE.Group(),r=T.r;
  const t=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.26,40),tire);
  t.rotation.x=Math.PI/2;w.add(t);
  const side=new THREE.Mesh(new THREE.TorusGeometry(r*.86,r*.13,12,40),tire);
  side.position.z=.12;w.add(side);
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(r*.64,r*.64,.02,32),new THREE.MeshStandardMaterial({color:0x2a2e36,metalness:.6,roughness:.5}));
  disc.rotation.x=Math.PI/2;disc.position.z=.1;w.add(disc);
  for(let i=0;i<5;i++){
    const sp=new THREE.Mesh(new THREE.BoxGeometry(r*1.18,r*.16,.04),rim);
    sp.rotation.z=i*Math.PI*2/5;sp.position.z=.125;w.add(sp);
  }
  const lip=new THREE.Mesh(new THREE.TorusGeometry(r*.64,r*.05,8,40),rim);
  lip.position.z=.125;w.add(lip);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(r*.16,r*.16,.06,20),rim);
  hub.rotation.x=Math.PI/2;hub.position.z=.13;w.add(hub);
  return w;
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
