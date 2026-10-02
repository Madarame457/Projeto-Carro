const ICONS={
 trend:'<path d="m4 6 6 6 3-3 7 7"/><path d="M14 16h6v-6" transform="rotate(90 17 13)"/>',
 car:'<path d="M5 16v3M19 16v3M4 16h16v-5l-2-5H6l-2 5z"/><path d="M4 11h16M7.5 13.5h.01M16.5 13.5h.01"/>',
 sliders:'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
 doc:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 14h2"/><circle cx="10" cy="13" r="0"/>',
 road:'<path d="M8 3 4 21M16 3l4 18M12 4v3M12 11v3M12 18v3"/>'
};
const svg=(k,s=20)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>`;
const DATA=[
 {n:"1. Anúncio e Preço",t:"Checagem: Anúncio e Preço",i:"trend",items:[
  ["Verificar Chassi (VIN) e Histórico","Verifique o número do chassi (VIN) em um serviço de histórico veicular confiável.","Confira se o chassi do anúncio bate com o do documento e com a gravação no veículo. Consulte leilão, sinistro, recall e restrições."],
  ["Comparação de Valor de Mercado","Garanta que o preço pedido esteja alinhado com o valor de mercado atual (Tabela FIPE, Webmotors, KBB).","Compare com pelo menos três anúncios do mesmo modelo, ano e quilometragem. Preço muito abaixo da média merece desconfiança."],
  ["Análise do Perfil do Vendedor","Verifique há quanto tempo ele possui o carro. Se for menos de um ano, pergunte o motivo da venda.","Prefira vendedores que apresentem notas de revisão e documentos em nome próprio."]]},
 {n:"2. Visual Externo",t:"Checagem: Visual Externo",i:"car",items:[
  ["Alinhamento da Lataria","Observe frestas entre portas, capô e porta-malas: devem ter espessura uniforme.","Frestas irregulares podem indicar colisão e reparo mal feito."],
  ["Diferenças de Pintura","Olhe a lataria em ângulo, sob luz natural, procurando variações de tom ou textura.","Pontos foscos, marcas de fita e respingos em borrachas indicam repintura."],
  ["Pneus e Vidros","Verifique o desgaste dos pneus, a data de fabricação e trincas nos vidros.","Desgaste desigual pode apontar problemas de suspensão ou alinhamento."]]},
 {n:"3. Checagem Mecânica",t:"Checagem: Mecânica",i:"sliders",items:[
  ["Motor e Fluidos","Confira nível e cor do óleo, líquido de arrefecimento e vazamentos sob o carro.","Óleo muito escuro ou com aspecto leitoso é sinal de alerta."],
  ["Suspensão e Freios","Teste freios em baixa velocidade e escute ruídos ao passar em buracos.","Puxões para um lado ou vibração no pedal exigem revisão."],
  ["Scanner de Falhas","Use um scanner OBD-II para ler códigos de erro armazenados.","Luzes do painel apagadas com códigos ativos podem indicar fraude."]]},
 {n:"4. Documentação",t:"Checagem: Documentação",i:"doc",items:[
  ["CRLV e Licenciamento","Confirme que o licenciamento está em dia e sem multas ou débitos.","Consulte o Detran do estado para verificar pendências."],
  ["Nome do Proprietário","O vendedor deve ser o proprietário registrado no documento.","Se for procurador, exija procuração válida e reconhecida em cartório."],
  ["Recibo e Transferência","Formalize a venda com recibo e faça a transferência no prazo legal.","Registre a data e a quilometragem no recibo."]]},
 {n:"5. Teste de Rodagem",t:"Checagem: Teste de Rodagem",i:"road",items:[
  ["Partida e Marcha Lenta","Ligue o motor a frio e observe fumaça, ruídos e estabilidade da marcha lenta.","Motor frio revela problemas que o aquecido pode esconder."],
  ["Câmbio e Embreagem","Passe todas as marchas e note trancos, patinação ou dificuldade de engate.","Em automáticos, observe a suavidade das trocas."],
  ["Direção e Estabilidade","Em reta, solte levemente o volante e veja se o carro mantém a trajetória.","Vibração em velocidade pode indicar balanceamento ou suspensão."]]}
];
const state=DATA.map(c=>c.items.map(()=>false));
let cur=0;
const $=id=>document.getElementById(id);
function renderTabs(){
  $('tabs').innerHTML=DATA.map((c,k)=>`<button class="tab${k===cur?' on':''}" data-k="${k}"><span class="ic">${svg(c.i)}</span>${c.n}</button>`).join('');
}
function renderList(){
  const c=DATA[cur];
  $('title').textContent=c.t;
  $('list').innerHTML=c.items.map((it,j)=>`
   <article class="card${state[cur][j]?' done':''}" data-j="${j}">
    <button class="card-h" aria-expanded="false">
      <span class="chk" role="checkbox" aria-checked="${state[cur][j]}"></span>
      <span class="txt"><h3>${it[0]}</h3><p>${it[1]}</p></span>
      <svg class="chev" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    <div class="more">${it[2]}<br><button class="toggle">${state[cur][j]?'Desmarcar':'Marcar como concluído'}</button></div>
   </article>`).join('');
  update();
}
function update(){
  const done=state[cur].filter(Boolean).length;
  $('pill').textContent=`${done} / ${state[cur].length} concluídos`;
  const all=state.flat(),pct=Math.round(all.filter(Boolean).length/all.length*100);
  $('health').textContent=`${pct}% Avaliado`;
  $('fill').style.width=pct+'%';
}
$('tabs').addEventListener('click',e=>{
  const b=e.target.closest('.tab');if(!b)return;
  cur=+b.dataset.k;renderTabs();renderList();
});
$('list').addEventListener('click',e=>{
  const card=e.target.closest('.card');if(!card)return;
  const j=+card.dataset.j;
  if(e.target.closest('.toggle')||e.target.closest('.chk')){
    state[cur][j]=!state[cur][j];
    card.classList.toggle('done',state[cur][j]);
    card.querySelector('.toggle').textContent=state[cur][j]?'Desmarcar':'Marcar como concluído';
    card.querySelector('.chk').setAttribute('aria-checked',state[cur][j]);
    update();return;
  }
  if(e.target.closest('.card-h')){
    const open=card.classList.toggle('open');
    card.querySelector('.card-h').setAttribute('aria-expanded',open);
  }
});
$('pdf').onclick=()=>window.print();
$('fipe').onclick=()=>window.open('https://veiculos.fipe.org.br/','_blank','noopener');
$('help').onclick=()=>alert('Marque cada item conforme for verificando. Clique em um cartão para ver detalhes.');
renderTabs();renderList();
// Sugestões da barra de pesquisa
const CARS=[["Chevrolet Onix","Hatch"],["Hyundai HB20","Hatch"],["Volkswagen Gol","Hatch"],["Fiat Strada","Picape"],["Honda Civic","Sedã"]];
const q=$('q'),sug=$('sug');
function showSug(){
  const t=q.value.trim().toLowerCase();
  const lista=CARS.filter(c=>c[0].toLowerCase().includes(t));
  sug.innerHTML=lista.map(c=>`<li role="option" data-n="${c[0]}">${svg('car',18)}${c[0]}<small>${c[1]}</small></li>`).join('');
  sug.hidden=!lista.length;
}
q.addEventListener('focus',showSug);
q.addEventListener('click',showSug);
q.addEventListener('input',showSug);
sug.addEventListener('mousedown',e=>{
  const li=e.target.closest('li');if(!li)return;
  e.preventDefault();
  q.value=li.dataset.n;
  sug.hidden=true;q.blur();
});
document.addEventListener('click',e=>{if(!e.target.closest('.search-wrap'))sug.hidden=true;});
q.addEventListener('keydown',e=>{if(e.key==='Escape'){sug.hidden=true;q.blur();}});