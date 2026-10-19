# Projeto-Carro
Repositório onde iremos colocar os arquivos/versionamentos do nosso projeto de Web Design.

## ClearInspect
Site de checagem de carro usado: um checklist guiado com 35 pontos (anúncio, lataria, mecânica, documentação e teste de rodagem), um modelo 3D interativo do carro e um relatório em PDF.

### Arquivos
- `index.html`: estrutura da página (hero, como funciona, checklist, consultas, dúvidas e créditos).
- `style.css`: visual do site, responsivo, e o layout A4 do relatório em PDF.
- `script.js`: checklist com itens classificados por prioridade (crítico, importante, recomendado), busca de modelos, placa (Mercosul/antiga), progresso salvo no navegador e montagem do relatório.
- `car3d.js`: visualizador 3D feito com [Three.js](https://threejs.org/) (carregado via CDN). Carrega os modelos da pasta `models/` e, se algum não carregar, usa um carro gerado por código. Os pontos clicáveis levam às etapas do checklist.
- `models/`: modelos 3D (hatch, sedã, SUV e picape) em glTF comprimido, embutidos em arquivos `.js` para o site funcionar abrindo o `index.html` direto do computador.

### Relatório em PDF
Clique em "Relatório PDF" e escolha "Salvar como PDF". O relatório traz identificação do veículo com foto do modelo 3D, parecer geral, resumo por etapa, pendências prioritárias, checklist completo com orientações e campos para observações e assinaturas.

### Como abrir
Basta abrir o `index.html` no navegador (precisa de internet para carregar o Three.js e as fontes).
Se o 3D não carregar, o restante do site continua funcionando.

### Créditos dos modelos 3D
Modelos do [Blend Swap](https://blendswap.com), adaptados para a web:
- "Volkswagen VW Golf MK4", por Jay-Artist (CC BY 3.0)
- "Audi A8 2010", por 50Groszy (CC BY-SA 3.0)
- "Chevrolet SUV (Rigged)", por FA1RYDUST (CC BY)
- "Chevrolet Pickup Truck", Blend Swap #92893 (CC BY 3.0)
