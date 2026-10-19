const ICONS={
 trend:'<path d="m4 6 6 6 3-3 7 7"/><path d="M14 16h6v-6" transform="rotate(90 17 13)"/>',
 car:'<path d="M5 16v3M19 16v3M4 16h16v-5l-2-5H6l-2 5z"/><path d="M4 11h16M7.5 13.5h.01M16.5 13.5h.01"/>',
 sliders:'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
 doc:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 14h2"/><circle cx="10" cy="13" r="0"/>',
 road:'<path d="M8 3 4 21M16 3l4 18M12 4v3M12 11v3M12 18v3"/>',
 check:'<path d="m5 12 5 5 9-10"/>'
};
const svg=(k,s=20)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>`;
// Cada item: [título, o que verificar, dica, prioridade]  ·  prioridade: c = crítico, i = importante, r = recomendado
const LEVEL={c:'Crítico',i:'Importante',r:'Recomendado'};
const DATA=[
 {n:"1. Anúncio e Preço",t:"Checagem: Anúncio e Preço",i:"trend",items:[
  ["Verificar Chassi (VIN) e Histórico","Verifique o número do chassi (VIN) em um serviço de histórico veicular confiável.","Confira se o chassi do anúncio bate com o do documento e com a gravação no veículo. Consulte leilão, sinistro, recall e restrições.","c"],
  ["Comparação de Valor de Mercado","Garanta que o preço pedido esteja alinhado com o valor de mercado atual (Tabela FIPE, Webmotors, KBB).","Compare com pelo menos três anúncios do mesmo modelo, ano e quilometragem. Preço muito abaixo da média merece desconfiança.","i"],
  ["Análise do Perfil do Vendedor","Verifique há quanto tempo ele possui o carro. Se for menos de um ano, pergunte o motivo da venda.","Prefira vendedores que apresentem notas de revisão e documentos em nome próprio.","i"],
  ["Fotos e Descrição do Anúncio","Compare as fotos com o carro ao vivo: cor, rodas, acessórios, versão e quilometragem devem bater.","Fotos só de longe, com placa escondida ou tiradas na chuva pedem cautela. Faça uma busca reversa da imagem para ver se ela não foi copiada de outro anúncio.","i"],
  ["Quilometragem Compatível","A média brasileira fica entre 12 e 15 mil km por ano. O desgaste de volante, pedais e bancos deve condizer com o hodômetro.","Hodômetro baixo com volante liso, pedais gastos e banco do motorista afundado indica possível adulteração.","c"],
  ["Histórico de Manutenção","Peça o manual com as revisões carimbadas e as notas fiscais dos serviços feitos.","Revisões na concessionária ou em oficina com nota fiscal ajudam a comprovar a quilometragem real e o cuidado do dono anterior.","i"],
  ["Negociação e Pagamento Seguro","Nunca pague sinal antes de ver o carro e o documento. Transfira apenas para a conta do proprietário registrado.","No golpe do falso intermediário, o dinheiro vai para um terceiro. Confirme que o nome da conta é o mesmo do documento.","c"]]},
 {n:"2. Visual Externo",t:"Checagem: Visual Externo",i:"car",items:[
  ["Alinhamento da Lataria","Observe frestas entre portas, capô e porta-malas: devem ter espessura uniforme.","Frestas irregulares podem indicar colisão e reparo mal feito.","i"],
  ["Diferenças de Pintura","Olhe a lataria em ângulo, sob luz natural, procurando variações de tom ou textura.","Pontos foscos, marcas de fita e respingos em borrachas indicam repintura.","i"],
  ["Pneus e Vidros","Verifique o desgaste dos pneus, a data de fabricação e trincas nos vidros.","Desgaste desigual pode apontar problemas de suspensão ou alinhamento.","i"],
  ["Estrutura e Longarinas","Abra capô e porta-malas e procure soldas, longarinas amassadas e parafusos com a tinta riscada.","Parafusos de para-lamas e dobradiças sem tinta mostram que a peça foi removida. Estrutura reparada desvaloriza o carro e compromete a segurança.","c"],
  ["Gravações nos Vidros e Etiquetas","Confira se o final do chassi gravado nos vidros e nas etiquetas (porta, coluna, motor) é o mesmo do documento.","Vidro sem gravação ou com marca diferente indica troca: pergunte o motivo. Etiqueta raspada ou ausente é sinal de alerta.","c"],
  ["Ferrugem e Corrosão","Inspecione caixas de roda, soleiras, parte inferior das portas, porta-malas e assoalho.","Bolhas na pintura costumam esconder ferrugem por baixo. Carros de cidades litorâneas merecem atenção extra.","i"],
  ["Faróis, Lanternas e Setas","Teste farol baixo e alto, luz de freio, ré, pisca e neblina. Observe se as lentes estão foscas ou com umidade.","Um farol muito mais novo que o outro pode indicar batida na dianteira.","r"]]},
 {n:"3. Checagem Mecânica",t:"Checagem: Mecânica",i:"sliders",items:[
  ["Motor e Fluidos","Confira nível e cor do óleo, líquido de arrefecimento e vazamentos sob o carro.","Óleo muito escuro ou com aspecto leitoso é sinal de alerta.","c"],
  ["Suspensão e Freios","Teste freios em baixa velocidade e escute ruídos ao passar em buracos.","Puxões para um lado ou vibração no pedal exigem revisão.","c"],
  ["Scanner de Falhas","Use um scanner OBD-II para ler códigos de erro armazenados.","Luzes do painel apagadas com códigos ativos podem indicar fraude.","i"],
  ["Arrefecimento e Superaquecimento","O reservatório deve estar limpo, sem óleo boiando, e o ponteiro de temperatura estável.","Óleo no líquido de arrefecimento ou água no óleo pode indicar junta do cabeçote queimada, um reparo caro.","c"],
  ["Correia Dentada e Acessórios","Pergunte quando foi a última troca da correia dentada e veja o estado das correias auxiliares.","Correia vencida pode romper e danificar o motor. Peça a nota fiscal da troca.","i"],
  ["Embaixo do Carro","Com uma lanterna, procure vazamentos, escapamento furado, coxins rachados e amortecedores com óleo.","Se possível, peça para erguer o carro em um elevador de oficina.","i"],
  ["Bateria e Parte Elétrica","Teste vidros, travas, retrovisores, multimídia, buzina e limpadores. Veja a data da bateria.","Bateria com terminais esverdeados (zinabre) ou mais de três anos de uso pode precisar de troca em breve.","r"]]},
 {n:"4. Documentação",t:"Checagem: Documentação",i:"doc",items:[
  ["CRLV e Licenciamento","Confirme que o licenciamento está em dia e sem multas ou débitos.","Consulte o Detran do estado para verificar pendências.","c"],
  ["Nome do Proprietário","O vendedor deve ser o proprietário registrado no documento.","Se for procurador, exija procuração válida e reconhecida em cartório.","c"],
  ["Recibo e Transferência","Formalize a venda pela ATPV-e (antigo recibo) e faça a transferência em até 30 dias.","Registre a data e a quilometragem. Enquanto a transferência não sair, multas e IPVA continuam no nome do antigo dono.","c"],
  ["Gravame e Restrições","Consulte se há alienação fiduciária (financiamento), bloqueio judicial ou registro de roubo e furto.","Carro financiado só pode ser transferido depois da quitação e da baixa do gravame pelo banco.","c"],
  ["Laudo de Vistoria Cautelar","Faça uma vistoria cautelar em uma empresa credenciada antes de pagar.","O laudo aponta repintura, chassi remarcado e estrutura comprometida. O custo é pequeno perto do risco.","i"],
  ["Recall Atendido","Consulte pelo chassi, no site da montadora ou no Portal Senatran, se há recall pendente.","Recall é gratuito em qualquer concessionária da marca, mesmo para o segundo dono.","i"],
  ["Chave Reserva, Manual e Itens Obrigatórios","Confirme chave reserva, manual, estepe, macaco, chave de roda e triângulo.","Chave reserva codificada custa caro. Se estiver faltando, use isso na negociação.","r"]]},
 {n:"5. Teste de Rodagem",t:"Checagem: Teste de Rodagem",i:"road",items:[
  ["Partida e Marcha Lenta","Ligue o motor a frio e observe fumaça, ruídos e estabilidade da marcha lenta.","Motor frio revela problemas que o aquecido pode esconder.","i"],
  ["Câmbio e Embreagem","Passe todas as marchas e note trancos, patinação ou dificuldade de engate.","Em automáticos, observe a suavidade das trocas.","c"],
  ["Direção e Estabilidade","Em reta, solte levemente o volante e veja se o carro mantém a trajetória.","Vibração em velocidade pode indicar balanceamento ou suspensão.","i"]]}
];
const short=c=>c.n.replace(/^\d+\.\s*/,'');
const $=id=>document.getElementById(id);

// Estado salvo no navegador (marcações, veículo e aparência do carro 3D)
const KEY='clearinspect:v2';
let saved={};
try{saved=JSON.parse(localStorage.getItem(KEY))||{};}catch(e){}
const state=DATA.map((c,k)=>c.items.map((_,j)=>!!(saved.state&&saved.state[k]&&saved.state[k][j])));
const CI=window.CI={cur:0,type:saved.type||'sedan',color:saved.color||'#2c449f',model:saved.model||'',plate:saved.plate||''};
function save(){
  try{localStorage.setItem(KEY,JSON.stringify({state,type:CI.type,color:CI.color,model:CI.model,plate:CI.plate}));}catch(e){}
}
const catDone=k=>state[k].filter(Boolean).length;

// Abas e cartões do checklist
function renderTabs(){
  $('tabs').innerHTML=DATA.map((c,k)=>{
    const d=catDone(k),full=d===c.items.length;
    return `<button class="tab${k===CI.cur?' on':''}${full?' full':''}" data-k="${k}" aria-current="${k===CI.cur}">
      <span class="ic">${svg(full?'check':c.i)}</span>${c.n}<span class="cnt">${d}/${c.items.length}</span></button>`;
  }).join('');
  // Mantém a aba ativa visível na rolagem horizontal (sem rolar a página)
  const t=$('tabs'),on=t.querySelector('.on');
  if(on&&(on.offsetLeft<t.scrollLeft||on.offsetLeft+on.offsetWidth>t.scrollLeft+t.clientWidth))
    t.scrollTo({left:on.offsetLeft-16,behavior:'smooth'});
}
function renderList(){
  const c=DATA[CI.cur];
  $('title').textContent=c.t;
  $('list').innerHTML=c.items.map((it,j)=>`
   <article class="card${state[CI.cur][j]?' done':''}" data-j="${j}">
    <div class="card-h">
      <button class="chk" role="checkbox" aria-checked="${state[CI.cur][j]}" aria-label="Concluído: ${it[0]}"></button>
      <button class="card-open" aria-expanded="false">
        <span class="txt"><span class="lvl lvl-${it[3]}">${LEVEL[it[3]]}</span><h4>${it[0]}</h4><p>${it[1]}</p></span>
        <svg class="chev" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
    </div>
    <div class="more"><p><b>Dica:</b> ${it[2]}</p><button class="toggle">${state[CI.cur][j]?'Desmarcar':'Marcar como concluído'}</button></div>
   </article>`).join('');
  $('prev').disabled=CI.cur===0;
  $('next').disabled=CI.cur===DATA.length-1;
  update();
}
function renderSummary(){
  $('catList').innerHTML=DATA.map((c,k)=>{
    const d=catDone(k),p=Math.round(d/c.items.length*100);
    return `<li><button class="${k===CI.cur?'on':''}${p===100?' full':''}" data-k="${k}">
      <span class="cl-top"><span>${short(c)}</span><small>${d}/${c.items.length}</small></span>
      <span class="mini"><i style="width:${p}%"></i></span></button></li>`;
  }).join('');
  $('vModel').textContent=CI.model||'Não informado';
  $('vPlate').textContent=CI.plate?fmtPlate(CI.plate):'Não informada';
}
function update(){
  const done=catDone(CI.cur);
  $('pill').textContent=`${done} / ${state[CI.cur].length} concluídos`;
  const all=state.flat(),pct=Math.round(all.filter(Boolean).length/all.length*100);
  $('health').textContent=`${pct}% Avaliado`;
  $('fill').style.width=pct+'%';
  $('ringPct').textContent=pct+'%';
  const r=$('ring'),len=2*Math.PI*52;
  r.style.strokeDasharray=len;
  r.style.strokeDashoffset=len*(1-pct/100);
  document.querySelectorAll('.hs').forEach(h=>{
    const k=+h.dataset.k;
    h.classList.toggle('done',catDone(k)===DATA[k].items.length);
    h.classList.toggle('on',k===CI.cur);
  });
  renderSummary();
}
function select(k,scroll){
  if(k<0||k>=DATA.length)return;
  CI.cur=k;renderTabs();renderList();
  if(window.Car3D)Car3D.focus(k);
  if(scroll)$('checklist').scrollIntoView({behavior:'smooth',block:'start'});
}

$('tabs').addEventListener('click',e=>{
  const b=e.target.closest('.tab');if(b)select(+b.dataset.k);
});
$('catList').addEventListener('click',e=>{
  const b=e.target.closest('button');if(b)select(+b.dataset.k);
});
$('prev').onclick=()=>select(CI.cur-1);
$('next').onclick=()=>select(CI.cur+1);
$('list').addEventListener('click',e=>{
  const card=e.target.closest('.card');if(!card)return;
  const j=+card.dataset.j;
  if(e.target.closest('.toggle')||e.target.closest('.chk')){
    state[CI.cur][j]=!state[CI.cur][j];
    card.classList.toggle('done',state[CI.cur][j]);
    card.querySelector('.toggle').textContent=state[CI.cur][j]?'Desmarcar':'Marcar como concluído';
    card.querySelector('.chk').setAttribute('aria-checked',state[CI.cur][j]);
    save();update();renderTabs();
    if(catDone(CI.cur)===DATA[CI.cur].items.length)toast(`Etapa "${short(DATA[CI.cur])}" concluída!`);
    return;
  }
  if(e.target.closest('.card-open')){
    const open=card.classList.toggle('open');
    card.querySelector('.card-open').setAttribute('aria-expanded',open);
  }
});

// Pontos clicáveis sobre o carro 3D (posicionados pelo car3d.js)
$('hotspots').innerHTML=DATA.map((c,k)=>`<button class="hs" data-k="${k}" data-label="${short(c)}" aria-label="Etapa ${k+1}: ${short(c)}"><span>${k+1}</span></button>`).join('');
$('hotspots').addEventListener('click',e=>{
  const b=e.target.closest('.hs');if(b)select(+b.dataset.k,true);
});

// Tipo de carroceria e cor do modelo 3D
function setType(t){
  CI.type=t;
  document.querySelectorAll('#types button').forEach(b=>b.setAttribute('aria-checked',b.dataset.type===t));
  if(window.Car3D)Car3D.setType(t);
  save();
}
function setColor(c){
  CI.color=c;
  document.querySelectorAll('#colors button').forEach(b=>b.setAttribute('aria-checked',b.dataset.color===c));
  if(window.Car3D)Car3D.setColor(c);
  save();
}
$('types').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setType(b.dataset.type);});
$('colors').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setColor(b.dataset.color);});

// Sugestões da barra de pesquisa
const CARS=[["Chevrolet Onix","Hatch","hatch"],["Hyundai HB20","Hatch","hatch"],["Volkswagen Gol","Hatch","hatch"],["Honda Civic","Sedã","sedan"],["Toyota Corolla","Sedã","sedan"],["Jeep Compass","SUV","suv"],["Volkswagen T-Cross","SUV","suv"],["Fiat Strada","Picape","picape"],["Toyota Hilux","Picape","picape"]];
const q=$('q'),sug=$('sug');
let act=-1;
function showSug(){
  const t=q.value.trim().toLowerCase();
  const lista=CARS.filter(c=>c[0].toLowerCase().includes(t)||t.includes(c[0].toLowerCase()));
  act=-1;
  sug.innerHTML=lista.map((c,i)=>`<li role="option" id="sg${i}" data-i="${CARS.indexOf(c)}">${svg('car',18)}${c[0]}<small>${c[1]}</small></li>`).join('');
  sug.hidden=!lista.length;
  q.setAttribute('aria-expanded',!sug.hidden);
}
function hideSug(){sug.hidden=true;q.setAttribute('aria-expanded',false);}
function pickCar(name,type){
  CI.model=name;q.value=name;
  if(type)setType(type);
  save();renderSummary();hideSug();
  toast(`Veículo definido: ${name}`);
}
q.addEventListener('focus',showSug);
q.addEventListener('click',showSug);
q.addEventListener('input',showSug);
sug.addEventListener('mousedown',e=>{
  const li=e.target.closest('li');if(!li)return;
  e.preventDefault();
  const c=CARS[+li.dataset.i];
  pickCar(c[0],c[2]);q.blur();
});
document.addEventListener('click',e=>{if(!e.target.closest('.search-wrap'))hideSug();});
q.addEventListener('keydown',e=>{
  const lis=[...sug.querySelectorAll('li')];
  if(e.key==='Escape'){hideSug();q.blur();return;}
  if((e.key==='ArrowDown'||e.key==='ArrowUp')&&lis.length){
    e.preventDefault();
    act=(act+(e.key==='ArrowDown'?1:-1)+lis.length)%lis.length;
    lis.forEach((l,i)=>l.classList.toggle('act',i===act));
    q.setAttribute('aria-activedescendant',lis[act].id);
  }
  if(e.key==='Enter'){
    e.preventDefault();
    if(act>=0&&lis[act]){const c=CARS[+lis[act].dataset.i];pickCar(c[0],c[2]);}
    else if(q.value.trim()){
      // Texto livre: tenta reconhecer um modelo conhecido no que foi digitado
      const t=q.value.trim(),c=CARS.find(c=>t.toLowerCase().includes(c[0].toLowerCase().split(' ').pop()));
      pickCar(t,c&&c[2]);
    }
  }
});
if(CI.model)q.value=CI.model;

// Placa: formato Mercosul (ABC1D23) ou antigo (ABC-1234)
const plate=$('plate');
const cleanPlate=v=>v.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,7);
const fmtPlate=p=>/^[A-Z]{3}\d{4}$/.test(p)?p.slice(0,3)+'-'+p.slice(3):p;
plate.addEventListener('input',()=>{
  plate.value=fmtPlate(cleanPlate(plate.value));
  plate.parentElement.classList.remove('bad');
});
$('plateForm').addEventListener('submit',e=>{
  e.preventDefault();
  const p=cleanPlate(plate.value),msg=$('plateMsg');
  if(!/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(p)){
    plate.parentElement.classList.add('bad');
    msg.textContent='Placa inválida. Use o formato ABC1D23 (Mercosul) ou ABC-1234.';
    msg.classList.add('err');
    plate.focus();return;
  }
  CI.plate=p;save();renderSummary();
  msg.textContent=`Placa ${fmtPlate(p)} adicionada ao relatório.`;
  msg.classList.remove('err');
  toast(`Placa ${fmtPlate(p)} salva`);
  select(CI.cur,true);
});
if(CI.plate)plate.value=fmtPlate(CI.plate);

// Relatório em PDF: monta uma versão com todas as etapas só para impressão
function buildPrint(){
  const all=state.flat(),pct=Math.round(all.filter(Boolean).length/all.length*100);
  const esc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  $('printout').innerHTML=`
   <h1>Relatório de checagem · ClearInspect</h1>
   <p class="pmeta"><b>Modelo:</b> ${esc(CI.model||'Não informado')} &nbsp;·&nbsp; <b>Placa:</b> ${CI.plate?fmtPlate(CI.plate):'Não informada'} &nbsp;·&nbsp; <b>Data:</b> ${new Date().toLocaleDateString('pt-BR')} &nbsp;·&nbsp; <b>Avaliado:</b> ${pct}%</p>
   ${DATA.map((c,k)=>`<h2>${c.n} <small>(${catDone(k)}/${c.items.length})</small></h2><ul>${
     c.items.map((it,j)=>`<li class="${state[k][j]?'ok':''}"><span class="box">${state[k][j]?'✓':''}</span><div><b>${it[0]}</b><br>${it[1]}</div></li>`).join('')}</ul>`).join('')}`;
}
window.addEventListener('beforeprint',buildPrint);
$('pdf').onclick=()=>{buildPrint();window.print();};
$('fipe').onclick=()=>window.open('https://veiculos.fipe.org.br/','_blank','noopener');
$('help').onclick=()=>{const d=$('helpDlg');d.showModal?d.showModal():alert('Marque cada item conforme for verificando. Clique em um cartão para ver detalhes.');};
$('helpDlg').addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.close();});
$('reset').onclick=()=>{
  if(!confirm('Apagar todas as marcações, o modelo e a placa?'))return;
  state.forEach(a=>a.fill(false));
  CI.model=CI.plate='';q.value=plate.value='';
  save();select(0);toast('Checagem reiniciada');
};

// Aviso rápido no canto da tela
let tt;
function toast(m){
  const t=$('toast');t.textContent=m;t.classList.add('show');
  clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2600);
}

// Animação de entrada das seções
const io='IntersectionObserver' in window&&new IntersectionObserver(es=>es.forEach(en=>{
  if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}
}),{threshold:.15});
document.querySelectorAll('.reveal').forEach(el=>io?io.observe(el):el.classList.add('in'));

setType(CI.type);setColor(CI.color);
renderTabs();renderList();
