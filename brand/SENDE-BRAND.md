# SENDE — Guia de marca para o código

> Este arquivo instrui agentes de código (Claude Code) e desenvolvedores
> sobre como aplicar a identidade visual do Sende no sistema.
> Referenciar no CLAUDE.md do projeto.

## Identidade

- Produto: **Sende** — CRM conversacional para WhatsApp (sende.app.br)
- Empresa: GlobalSix Technology — CNPJ 53.843.384/0001-70
- Wordmark: "sende" sempre em minúsculo, fonte Sora ExtraBold (800),
  com ponto final colorido ("sende.")
- Arquivos de logo: usar os SVG/PNG da pasta `/brand` (não recriar o logo em CSS/texto)

## Regras de cor (obrigatórias)

1. **Fonte da verdade**: `sende-tokens.css` (CSS vars) ou `sende-tailwind.js` (Tailwind).
   NUNCA usar hex hardcoded em componentes — sempre var/classe do token.
2. **Teal 600 (#0D9488)** = ação primária: botões principais, links de ação, toggles ativos.
3. **Teal 900 (#134E4A)** = títulos e headings. Não usar preto puro em títulos.
4. **Coral (#F97316)** = EXCLUSIVO para CTAs de conversão (assinar, testar grátis,
   fazer upgrade). Proibido usar coral para: erros, avisos, ícones decorativos,
   estados de perigo. Para erro/perigo, usar vermelho padrão (#DC2626).
5. **Status de conversa** (padrão do painel):
   - IA respondendo → badge teal-100 / texto teal-700
   - Com atendente (humano) → badge #FFEDD5 / texto #C2410C
   - Resolvido/venda → badge #DCFCE7 / texto #15803D
6. Fundos de seção alternados usam **teal-50 (#F0FDFA)**, nunca cinza.

## Tipografia

- **Sora** (700/800): títulos h1–h3, números de destaque, wordmark.
- **Inter** (400–600): corpo, labels, botões, tabelas.
- Carregar via Google Fonts ou self-host. Letter-spacing de títulos: -0.02em.

## Forma

- Cards e painéis: raio 20px, borda 1px #EEF2F6, sombra `--sende-shadow-sm`.
- Botões e badges: raio pill (999px).
- Botão primário: teal-600, texto branco, hover teal-700.
- Botão secundário: borda 1.5px teal-600, texto teal-700, fundo transparente,
  hover fundo teal-50.

## Checklist para qualquer PR de UI

- [ ] Nenhum hex hardcoded (só tokens)
- [ ] Coral aparece somente em CTA de conversão
- [ ] Títulos em Sora + teal-900
- [ ] Favicon e logos vindos de `/brand`, não inline recriados
