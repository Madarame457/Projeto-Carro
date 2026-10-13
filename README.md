# Projeto-Carro
Repositório onde iremos colocar os arquivos/versionamentos do nosso projeto de Web Design.

## ClearInspect
Site de checagem de carro usado: um checklist guiado (anúncio, lataria, mecânica, documentação e teste de rodagem) com um modelo 3D interativo do carro.

### Arquivos
- `index.html`: estrutura da página (hero, como funciona, checklist, consultas, dúvidas).
- `style.css`: visual do site, responsivo e com versão de impressão para o relatório em PDF.
- `script.js`: checklist, busca de modelos, placa (Mercosul/antiga), progresso salvo no navegador e relatório.
- `car3d.js`: visualizador 3D feito com [Three.js](https://threejs.org/) (carregado via CDN). Os carros (hatch, sedã, SUV e picape) são gerados por código e têm pontos clicáveis ligados às etapas do checklist.

### Como abrir
Basta abrir o `index.html` no navegador (precisa de internet para carregar o Three.js e as fontes).
Se o 3D não carregar, o restante do site continua funcionando.
