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

// Parâmetros distribuídos por comprimento de arco (pontos igualmente espaçados na curva)
function arcParams(f,t0,t1,n,inclusive){
  const K=3000,cum=[0],ts=[t0];let a=f(t0);
  for(let k=1;k<=K;k++){const t=t0+(t1-t0)*k/K,b=f(t);cum.push(cum[k-1]+Math.hypot(b.y-a.y,b.z-a.z));ts.push(t);a=b;}
  const tot=cum[K],out=[];let k=0;const m=inclusive?n:n-1;
  for(let j=0;j<=m;j++){
    if(!inclusive&&j===n)break;
    const tg=tot*j/n;while(k<K&&cum[k+1]<tg)k++;
    const u=(tg-cum[k])/Math.max(1e-9,cum[k+1]-cum[k]);out.push(lerp(ts[k],ts[Math.min(K,k+1)],clamp(u,0,1)));
  }
  return out;
}

/* ---------- Gerador de malha a partir de uma grade (u = comprimento, v = seção) ---------- */
// cls(i,j) devolve o índice do material de cada quadrado; closed = seção fechada
function gridMesh(P,nu,nv,closed,cls,mats){
  const pos=new Float32Array(P),groups=mats.map(()=>[]);
  const cols=closed?nv:nv-1,step=nv;
  for(let i=0;i<nu-1;i++)for(let j=0;j<cols;j++){
    const a=i*step+j,b=i*step+(j+1)%nv,c=a+step,d=b+step;
    groups[cls?cls(i,j):0].push(a,c,b,c,d,b);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  let n=0;groups.forEach((arr,k)=>{if(arr.length){g.addGroup(n,arr.length,k);n+=arr.length;}});
  const ia=new Uint32Array(n);n=0;groups.forEach(arr=>{ia.set(arr,n);n+=arr.length;});
  g.setIndex(new THREE.BufferAttribute(ia,1));g.computeVertexNormals();
  return new THREE.Mesh(g,mats);
}
// "Adesivo" sobre a lataria: grade em (x, ângulo) deslocada para fora pela normal
function decal(T,x0,x1,thf,off,mat,nu=28,nv=8,yMax){
  const P=[],p={};
  for(let i=0;i<=nu;i++){
    const u=i/nu,x=lerp(x0,x1,u),S=section(T,x),[a,b]=thf(S,u);
    for(let j=0;j<=nv;j++){ringPt(S,lerp(a,b,j/nv),p);P.push(x,yMax?Math.min(p.y,yMax):p.y,p.z);}
  }
  const m=gridMesh(P,nu+1,nv+1,false,null,[mat]),g=m.geometry,pa=g.attributes.position,na=g.attributes.normal;
  for(let k=0;k<pa.count;k++)pa.setXYZ(k,pa.getX(k)+na.getX(k)*off,pa.getY(k)+na.getY(k)*off,pa.getZ(k)+na.getZ(k)*off);
  g.computeVertexNormals();
  m.material=mat;g.clearGroups();
  return m;
}
const both=(g,mk)=>{const a=mk(),b=mk();b.scale.z=-1;g.add(a,b);return [a,b];};

/* ---------- Roda completa ---------- */
const wheelCache={};
function wheel(r){
  if(wheelCache[r])return wheelCache[r].clone();
  const w=new THREE.Group(),tw=r*.68,rr=r*.66,hw=tw/2;
  // Pneu: perfil de revolução com ombro arredondado, flanco abaulado e sulcos
  const prof=[[rr,-hw+.012],[rr+.012,-hw-.002],[r*.86,-hw-.006],[r-.022,-hw+.004],[r-.004,-hw+.022],[r,-hw+.04]];
  const gro=[];for(let k=0;k<4;k++){const zc=lerp(-hw+.06,hw-.06,k/3);gro.push([r,zc-.012],[r-.007,zc-.008],[r-.007,zc+.008],[r,zc+.012]);}
  const half=prof.concat(gro).concat(prof.slice().reverse().map(p=>[p[0],-p[1]]));
  const tire=new THREE.Mesh(new THREE.LatheGeometry(half.map(p=>new THREE.Vector2(p[0],p[1])),72),M.tire);
  tire.rotation.x=Math.PI/2;w.add(tire);
  // Interior escuro (impede ver através da roda)
  const back=new THREE.Mesh(new THREE.CircleGeometry(rr,40),M.void);back.position.z=-hw+.02;w.add(back);
  const barrel=new THREE.Mesh(new THREE.CylinderGeometry(rr,rr,tw-.03,48,1,true),M.rimDark);
  barrel.rotation.x=Math.PI/2;w.add(barrel);
  // Disco e pinça de freio
  const dsk=new THREE.Mesh(new THREE.CylinderGeometry(rr*.78,rr*.78,.022,48),M.disc);
  dsk.rotation.x=Math.PI/2;dsk.position.z=hw-.1;w.add(dsk);
  const hat=new THREE.Mesh(new THREE.CylinderGeometry(rr*.38,rr*.38,.03,32),M.rimDark);
  hat.rotation.x=Math.PI/2;hat.position.z=hw-.095;w.add(hat);
  const cal=new THREE.Mesh(new THREE.TorusGeometry(rr*.7,rr*.11,10,16,.9),M.caliper);
  cal.position.z=hw-.075;cal.rotation.z=Math.PI*.62;cal.scale.z=2.2;w.add(cal);
  // Face do aro: 5 pares de raios (furos recortados de um disco)
  const ro=rr*.9,ri=rr*.34,sh=new THREE.Shape();sh.absarc(0,0,rr*.995,0,Math.PI*2,false);
  const win=(a0,a1,rin,wO,wI)=>{
    const p=new THREE.Path(),A0=a0+wO/ro,A1=a1-wO/ro,B0=a0+wI/rin,B1=a1-wI/rin;
    p.moveTo(Math.cos(B0)*rin,Math.sin(B0)*rin);p.lineTo(Math.cos(A0)*ro,Math.sin(A0)*ro);
    p.absarc(0,0,ro,A0,A1,false);p.lineTo(Math.cos(B1)*rin,Math.sin(B1)*rin);p.absarc(0,0,rin,B1,B0,true);
    sh.holes.push(p);
  };
  for(let k=0;k<5;k++){
    const a=k*Math.PI*2/5+Math.PI/2,dl=.15;
    win(a-dl,a+dl,rr*.56,.012,.006);                 // fresta entre os raios gêmeos
    win(a+dl,a+Math.PI*2/5-dl,ri,.014,.02);          // janela grande
  }
  const fg=new THREE.ExtrudeGeometry(sh,{depth:.02,bevelEnabled:true,bevelThickness:.008,bevelSize:.006,bevelSegments:3,curveSegments:40});
  const face=new THREE.Mesh(fg,M.rim);face.position.z=hw-.05;w.add(face);
  const lipG=new THREE.TorusGeometry(rr*.985,.009,8,64);
  const lip=new THREE.Mesh(lipG,M.rim);lip.position.z=hw-.02;w.add(lip);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(ri*.42,ri*.46,.03,32),M.rimDark);
  cap.rotation.x=Math.PI/2;cap.position.z=hw-.015;w.add(cap);
  for(let k=0;k<5;k++){
    const a=k*Math.PI*2/5+Math.PI/2+Math.PI/5,n=new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,.02,6),M.chrome);
    n.rotation.x=Math.PI/2;n.position.set(Math.cos(a)*ri*.7,Math.sin(a)*ri*.7,hw-.02);w.add(n);
  }
  w.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  wheelCache[r]=w;return w.clone();
}

/* ---------- Placa Mercosul com o texto informado pelo usuário ---------- */
const plateCv=document.createElement('canvas');plateCv.width=512;plateCv.height=166;
const plateTex=new THREE.CanvasTexture(plateCv);plateTex.colorSpace=THREE.SRGBColorSpace;plateTex.anisotropy=4;
function drawPlate(txt){
  txt=String(txt||'').toUpperCase();if(/^[A-Z]{3}\d{4}$/.test(txt))txt=txt.slice(0,3)+'-'+txt.slice(3);
  const g=plateCv.getContext('2d');
  g.fillStyle='#f4f5f7';g.fillRect(0,0,512,166);
  g.fillStyle='#1f3fa5';g.fillRect(0,0,512,38);
  g.fillStyle='#fff';g.font='700 24px Inter,Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('BRASIL',256,20);
  g.fillStyle='#009c3b';g.fillRect(452,10,34,20);g.fillStyle='#ffdf00';g.beginPath();g.moveTo(469,12);g.lineTo(484,20);g.lineTo(469,28);g.lineTo(454,20);g.fill();
  g.fillStyle='#14161a';g.font='700 96px "JetBrains Mono",ui-monospace,monospace';g.fillText(txt||'ABC1D23',256,106);
  g.strokeStyle='#1d1f24';g.lineWidth=8;g.strokeRect(4,4,504,158);
  plateTex.needsUpdate=true;
}
drawPlate(CI.plate);
const plateM=new THREE.MeshStandardMaterial({map:plateTex,roughness:.45,metalness:.1});

// Textura de colmeia para a grade
const hexTex=(()=>{
  const cv=document.createElement('canvas');cv.width=cv.height=128;const g=cv.getContext('2d');
  g.fillStyle='#0b0c0f';g.fillRect(0,0,128,128);g.strokeStyle='#2a2e36';g.lineWidth=5;
  const hx=(cx,cy,r)=>{g.beginPath();for(let k=0;k<6;k++){const a=Math.PI/3*k+Math.PI/6;g.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}g.closePath();g.stroke();};
  for(let y=0;y<4;y++)for(let x=-1;x<4;x++)hx(x*37+(y%2?18.5:0)+10,y*32+16,19);
  const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t;
})();

function rrectShape(w,h,r){
  const s=new THREE.Shape(),x=-w/2,y=-h/2;
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
}
// Peça plana colada numa das tampas (frente: dir=1, traseira: dir=-1)
function capPiece(g,geo,mat,x,y,z,dir){
  const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.y=dir>0?Math.PI/2:-Math.PI/2;g.add(m);return m;
}

/* ---------- Montagem do carro ---------- */
function buildCar(type){
  const T=Object.assign({},SPECS[type]);
  T.ytf=curve(T.yt);T.ybf=curve(T.yb);T.ar=T.r+T.gap;
  T.plan=curve([[T.R,.93],[T.R+.7,1],[T.F-.8,1],[T.F,.94]]);
  const g=new THREE.Group(),[fa,ra]=T.ax,L=T.F-T.R;

  // 1) Estações ao longo do comprimento: mais densas nas pontas e nas caixas de roda
  let xs=[];const N=150;
  for(let i=0;i<=N;i++)xs.push(T.R+L*(.5-.5*Math.cos(Math.PI*i/N)));
  for(let i=0;i<=70;i++)xs.push(T.R+L*i/70);
  T.ax.forEach(a=>{for(let k=-30;k<=30;k++)xs.push(a+T.ar*k/30);xs.push(a-T.ar-.006,a+T.ar+.006);});
  [T.gh[0],T.gh[1],...T.doors].forEach(v=>xs.push(v));
  if(T.bed!==undefined)xs.push(T.bed-.02,T.bed-.04);
  xs=xs.filter(v=>v>=T.R&&v<=T.F).sort((a,b)=>a-b).filter((v,i,a)=>!i||v-a[i-1]>.0015);

  // 2) Carroceria inferior. Ângulos da seção: uniformes + extras no vinco lateral
  const ref=section(T,(fa+ra)/2);ref.clip=-1;ref.bed=false;
  let ths=arcParams(t=>ringPt(ref,t,{}),-Math.PI/2,Math.PI*1.5,150,false);
  for(let k=0;k<=14;k++){const q=lerp(.42,.58,k/14),t=Math.asin(Math.pow(q,T.nt/2));ths.push(t,Math.PI-t);}
  ths=ths.sort((a,b)=>a-b).filter((v,i,a)=>!i||v-a[i-1]>.0008);
  const NV=ths.length,P=[],secs=[],p={};
  xs.forEach(x=>{const S=section(T,x);secs.push(S);ths.forEach(t=>{ringPt(S,t,p);P.push(x,p.y,p.z);});});
  const body=gridMesh(P,xs.length,NV,true,(i,j)=>{
    const k=(i*NV+j)*3,k2=((i+1)*NV+(j+1)%NV)*3;
    const x=(P[k]+P[k2])/2,y=(P[k+1]+P[k2+1])/2,z=Math.abs(P[k+2]+P[k2+2])/2,S=secs[i];
    if(S.clip>0&&y<=S.clip+.002)return 1;                       // forro da caixa de roda
    if(y<T.ybf(x)+.012)return 1;                                // assoalho
    if(S.bed&&z<S.hw-.075&&y>S.yt-.08)return 1;                 // capota marítima da caçamba
    return 0;
  },[M.paint,M.trim]);
  // Tampas dianteira e traseira (planas: recebem grade, placa e luzes)
  const capPoly=(S,cut)=>ths.map(t=>{ringPt(S,t,p);return new THREE.Vector2(p.z,Math.min(p.y,cut));});
  [0,xs.length-1].forEach(i=>{
    const S=secs[i],m=new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(capPoly(S,9)),1),M.paint);
    m.position.x=S.x;m.rotation.y=i?Math.PI/2:-Math.PI/2;g.add(m);
    // faixa inferior preta do para-choque, recortada no mesmo contorno
    const tm=new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(capPoly(S,T.ybf(S.x)+T.trimH)),1),M.trim);
    tm.position.x=S.x+(i?.0015:-.0015);tm.rotation.y=m.rotation.y;g.add(tm);
  });
  body.castShadow=true;g.add(body);
  // Saia lateral e moldura das caixas de roda (acompanham a lataria, sem degraus)
  both(g,()=>decal(T,T.R,T.F,S=>[thAtY(S,S.yb+.004),thAtY(S,T.ybf(S.x)+T.trimH)],.0015,M.trim,220,4));
  if(T.clad)T.ax.forEach(a=>{
    const cw=.075,ao=T.ar+cw;
    both(g,()=>decal(T,a-ao,a+ao,S=>{
      const dx=S.x-a,lo=Math.abs(dx)<T.ar?T.r+.02+Math.sqrt(T.ar*T.ar-dx*dx)+.001:T.ybf(S.x)+T.trimH-.002;
      const hi=Math.min(S.yt-.1,T.r+.02+Math.sqrt(Math.max(0,ao*ao-dx*dx)));
      return [thAtY(S,lo),thAtY(S,Math.max(lo,hi))];
    },.006,M.trim,80,6));
  });

  // 3) Estufa: vidros, colunas e teto
  const [xa,xc]=T.gh,ya=T.ytf(xa)+.012,yc=T.ytf(xc)+.012;
  const yr=curve([[xc,yc],...T.roof.slice().reverse(),[xa,ya]].sort((a,b)=>a[0]-b[0]));
  const gx=xs.filter(x=>x>=xc&&x<=xa),NG=80,GP=[],ginfo=[];
  const CT=.52,CP=.74,CF=.78;                                  // limites topo / coluna / moldura
  let gk=null,gS;
  const ng=T.ng,gpt=(x,ph,o={})=>{
    if(gk!==x){const S=section(T,x),hwB=S.hw*.95,base=topYAtZ(S,hwB)-.012,top=Math.max(yr(x),S.yt+.012);gS={hwB,base,top,h:top-base};gk=x;}
    const {hwB,base,top,h}=gS;
    const c=Math.cos(ph),s=Math.sin(ph),e=2/ng,q=Math.pow(s,e);
    o.base=base;o.top=top;o.y=base+h*q;o.z=hwB*(1-.2*q*clamp(h/.4,0,1))*Math.sign(c)*Math.pow(Math.abs(c),e);return o;
  };
  const xm=(T.roofX[0]+T.roofX[1])/2;
  const phis=arcParams(ph=>gpt(xm,ph),0,Math.PI,NG,true);
  [CT,CP,CF].forEach(cv=>{phis.push(Math.acos(cv),Math.acos(-cv));});
  phis.sort((a,b)=>a-b);
  gx.forEach(x=>{
    const o={};phis.forEach((ph,j)=>{gpt(x,ph,o);GP.push(x,o.y,o.z);});
    ginfo.push({x,base:o.base,top:o.top});
  });
  const NP=phis.length,[sx0,sx1]=[T.side[1],T.side[0]];
  const gh=gridMesh(GP,gx.length,NP,false,(i,j)=>{
    const x=(gx[i]+gx[i+1])/2,c=Math.abs(Math.cos((phis[j]+phis[j+1])/2));
    if(x>xa-.05||x<xc+.04)return 2;                            // vedação do para-brisa/vigia
    if(c<CT)return (x>T.roofX[0]&&x<T.roofX[1])?0:1;          // teto ou para-brisa/vigia
    if(c<CP)return 0;                                          // colunas A/C e calha do teto
    if(x<sx0||x>sx1)return 0;                                  // colunas fora das janelas
    if(c<CF)return 2;                                          // moldura preta das janelas
    if(Math.abs(x-T.B)<.05||(T.C2&&Math.abs(x-T.C2)<.035))return 2; // coluna B (e C no SUV)
    const S=ginfo[i];if(GP[(i*NP+j)*3+1]<S.base+.035)return 2; // friso da linha de cintura
    return 1;
  },[M.paint,M.glass,M.gloss]);
  gh.castShadow=true;g.add(gh);

  // 4) Frisos das portas e maçanetas
  const gap=x=>both(g,()=>decal(T,x-.003,x+.003,S=>[thAtY(S,S.yb+T.trimH+.01),thAtY(S,S.yt-.012)],.0015,M.void,1,24));
  T.doors.forEach(gap);
  [[T.doors[0],T.doors[1]],[T.doors[1],T.doors[2]]].forEach(([d0,d1])=>{
    const x=d1+.16,S=section(T,x),y=S.yt-.11,th=thAtY(S,y);ringPt(S,th,p);
    both(g,()=>{const hm=new THREE.Mesh(new THREE.CapsuleGeometry(.011,.11,4,10),M.chrome);hm.rotation.z=Math.PI/2;hm.position.set(x,y,p.z+.006);hm.scale.z=.6;return hm;});
  });
  // Linha do capô
  const hood=T.hood,hS=section(T,hood);
  both(g,()=>decal(T,hood-.002,hood+.002,S=>[thAtY(S,S.yt-.05),Math.PI/2-.001],.0015,M.void,1,16));

  // 5) Faróis (envolvem o canto dianteiro) e lanternas
  const hl=Math.max(.3,T.rc[0]*1.5);
  const hlRange=(S,u,h0,h1)=>[thAtY(S,S.yt-lerp(h0,h1,u)),thAtY(S,S.yt-.03)];
  both(g,()=>decal(T,T.F-hl,T.F,(S,u)=>hlRange(S,u,T.hl[0],T.hl[1]),.004,M.lamp,24,8));
  both(g,()=>decal(T,T.F-hl*.92,T.F,(S,u)=>{const a=thAtY(S,S.yt-.042),b=thAtY(S,S.yt-.032);return [a,b];},.0065,M.led,22,2));
  both(g,()=>decal(T,T.F-hl*.92,T.F-hl*.68,S=>[thAtY(S,S.yt-.075),thAtY(S,S.yt-.055)],.006,M.amber,6,2));
  const tl=Math.max(.24,T.rc[1]*1.3);
  both(g,()=>decal(T,T.R,T.R+tl,(S,u)=>hlRange(S,1-u,.1,.15),.004,M.tail,20,8));
  both(g,()=>decal(T,T.R,T.R+tl*.85,S=>[thAtY(S,S.yt-.09),thAtY(S,S.yt-.078)],.0065,M.tailLed,18,2));

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
