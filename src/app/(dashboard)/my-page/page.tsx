'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Globe, ExternalLink, Sparkles, ArrowRight, LayoutGrid, Code2, Wand2 } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { Site } from '@/types'

const TEMPLATES: { key: string; label: string; category: string | null; html: string }[] = [
  {
    key: 'blank',
    label: 'Em branco',
    category: null,
    html: '',
  },
  {
    key: 'vendas',
    label: 'Serviços (genérico)',
    category: 'Vendas',
    html: `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Nome do Produto</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#0f172a; }
  .hero { background:linear-gradient(135deg,#0f172a,#1e293b); color:#fff; padding:80px 24px 96px; text-align:center; }
  .hero h1 { font-size:36px; max-width:680px; margin:0 auto 16px; line-height:1.25; }
  .hero p { font-size:17px; color:#cbd5e1; max-width:560px; margin:0 auto 28px; line-height:1.6; }
  .cta { display:inline-block; padding:14px 32px; background:#22c55e; color:#fff; text-decoration:none; border-radius:999px; font-weight:700; font-size:16px; }
  .section { max-width:960px; margin:0 auto; padding:64px 24px; }
  .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-top:32px; }
  @media (max-width:720px) { .grid { grid-template-columns:1fr; } }
  .card { background:#f8fafc; border-radius:16px; padding:28px; text-align:center; }
  .card .emoji { font-size:32px; margin-bottom:12px; }
  .card h3 { font-size:17px; margin:0 0 8px; }
  .card p { font-size:14px; color:#475569; line-height:1.5; margin:0; }
  .quote { max-width:640px; margin:0 auto; text-align:center; font-size:19px; font-style:italic; color:#1e293b; line-height:1.6; }
  .quote span { display:block; margin-top:14px; font-size:14px; font-style:normal; color:#64748b; }
  .final { background:#0f172a; color:#fff; text-align:center; padding:64px 24px; }
  .final h2 { font-size:26px; margin:0 0 20px; }
  footer { text-align:center; padding:24px; font-size:13px; color:#94a3b8; }
</style>
</head>
<body>
<section class="hero">
  <h1>O título que resolve o problema do seu cliente em uma frase</h1>
  <p>Explique em uma ou duas frases o que você vende e por que isso importa pra quem está lendo agora.</p>
  <a class="cta" href="https://wa.me/5500000000000">Quero saber mais</a>
</section>

<section class="section">
  <div class="grid">
    <div class="card"><div class="emoji">⚡</div><h3>Benefício 1</h3><p>Descreva rapidamente o primeiro grande benefício do seu produto ou serviço.</p></div>
    <div class="card"><div class="emoji">🎯</div><h3>Benefício 2</h3><p>Descreva o segundo benefício — o que torna sua solução diferente das outras.</p></div>
    <div class="card"><div class="emoji">🤝</div><h3>Benefício 3</h3><p>Descreva o terceiro benefício, reforçando confiança e resultado.</p></div>
  </div>
</section>

<section class="section">
  <p class="quote">"Coloque aqui um depoimento real de um cliente satisfeito — isso gera muito mais confiança do que qualquer texto de venda."<span>Nome do Cliente, Empresa</span></p>
</section>

<section class="final">
  <h2>Pronto pra começar?</h2>
  <a class="cta" href="https://wa.me/5500000000000">Falar no WhatsApp agora</a>
</section>

<footer>© Nome da Empresa — todos os direitos reservados</footer>
</body>
</html>`,
  },
  {
    key: 'odonto',
    label: 'Padrão',
    category: 'Clínica Odontológica',
    html: `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Clínica Odontológica</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#0c4a6e; }
  nav { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; border-bottom:1px solid #e0f2fe; }
  nav .logo { font-weight:800; font-size:18px; color:#0369a1; }
  nav a.phone { color:#0369a1; text-decoration:none; font-weight:600; font-size:14px; }
  .hero { background:#f0f9ff; padding:64px 24px; text-align:center; }
  .hero h1 { font-size:34px; max-width:600px; margin:0 auto 14px; color:#0c4a6e; }
  .hero p { font-size:16px; color:#0369a1; max-width:520px; margin:0 auto 26px; line-height:1.6; }
  .cta { display:inline-block; padding:14px 30px; background:#0ea5e9; color:#fff; text-decoration:none; border-radius:999px; font-weight:700; }
  .section { max-width:960px; margin:0 auto; padding:56px 24px; }
  .section h2 { text-align:center; font-size:26px; margin-bottom:32px; color:#0c4a6e; }
  .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
  @media (max-width:720px) { .grid { grid-template-columns:1fr 1fr; } }
  .card { background:#fff; border:1px solid #e0f2fe; border-radius:14px; padding:22px; text-align:center; }
  .card .emoji { font-size:28px; margin-bottom:8px; }
  .card h3 { font-size:15px; margin:0; color:#0c4a6e; }
  .why { background:#f0f9ff; }
  .why ul { max-width:480px; margin:0 auto; padding:0; list-style:none; }
  .why li { padding:8px 0; font-size:15px; }
  .why li::before { content:"✓ "; color:#0ea5e9; font-weight:800; }
  .final { text-align:center; padding:56px 24px; }
  footer { text-align:center; padding:24px; font-size:13px; color:#64748b; border-top:1px solid #e0f2fe; }
</style>
</head>
<body>
<nav>
  <span class="logo">Nome da Clínica</span>
  <a class="phone" href="https://wa.me/5500000000000">(00) 00000-0000</a>
</nav>

<section class="hero">
  <h1>Sorria com confiança</h1>
  <p>Cuidado odontológico completo, com atendimento humano e tecnologia de ponta pra sua família.</p>
  <a class="cta" href="https://wa.me/5500000000000">Agendar consulta</a>
</section>

<section class="section">
  <h2>Nossos tratamentos</h2>
  <div class="grid">
    <div class="card"><div class="emoji">✨</div><h3>Clareamento</h3></div>
    <div class="card"><div class="emoji">🦷</div><h3>Ortodontia</h3></div>
    <div class="card"><div class="emoji">🔧</div><h3>Implantes</h3></div>
    <div class="card"><div class="emoji">🪥</div><h3>Limpeza</h3></div>
    <div class="card"><div class="emoji">👑</div><h3>Próteses</h3></div>
    <div class="card"><div class="emoji">🚨</div><h3>Urgência</h3></div>
  </div>
</section>

<section class="section why">
  <h2>Por que escolher a gente</h2>
  <ul>
    <li>Equipe especializada e atualizada</li>
    <li>Equipamentos modernos e esterilização rigorosa</li>
    <li>Atendimento acolhedor, sem pressa</li>
    <li>Facilidade de agendamento pelo WhatsApp</li>
  </ul>
</section>

<section class="final">
  <h2>Marque sua avaliação</h2>
  <a class="cta" href="https://wa.me/5500000000000">Falar no WhatsApp</a>
</section>

<footer>Nome da Clínica — Endereço, Cidade/UF</footer>
</body>
</html>`,
  },
  {
    key: 'medica',
    label: 'Padrão',
    category: 'Clínica Médica',
    html: `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Clínica Médica</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#134e4a; }
  nav { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; border-bottom:1px solid #ccfbf1; }
  nav .logo { font-weight:800; font-size:18px; color:#0f766e; }
  nav a.phone { color:#0f766e; text-decoration:none; font-weight:600; font-size:14px; }
  .hero { background:#f0fdfa; padding:64px 24px; text-align:center; }
  .hero h1 { font-size:34px; max-width:600px; margin:0 auto 14px; color:#134e4a; }
  .hero p { font-size:16px; color:#0f766e; max-width:520px; margin:0 auto 26px; line-height:1.6; }
  .cta { display:inline-block; padding:14px 30px; background:#14b8a6; color:#fff; text-decoration:none; border-radius:999px; font-weight:700; }
  .section { max-width:960px; margin:0 auto; padding:56px 24px; }
  .section h2 { text-align:center; font-size:26px; margin-bottom:32px; color:#134e4a; }
  .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
  @media (max-width:720px) { .grid { grid-template-columns:1fr 1fr; } }
  .card { background:#fff; border:1px solid #ccfbf1; border-radius:14px; padding:20px; text-align:center; }
  .card .emoji { font-size:26px; margin-bottom:8px; }
  .card h3 { font-size:14px; margin:0; color:#134e4a; }
  .team { background:#f0fdfa; text-align:center; }
  .team p { max-width:560px; margin:0 auto; line-height:1.6; color:#0f766e; }
  .final { text-align:center; padding:56px 24px; }
  footer { text-align:center; padding:24px; font-size:13px; color:#64748b; border-top:1px solid #ccfbf1; }
</style>
</head>
<body>
<nav>
  <span class="logo">Nome da Clínica</span>
  <a class="phone" href="https://wa.me/5500000000000">(00) 00000-0000</a>
</nav>

<section class="hero">
  <h1>Cuidado médico que você pode confiar</h1>
  <p>Atendimento humanizado, diagnóstico preciso e acompanhamento completo da sua saúde.</p>
  <a class="cta" href="https://wa.me/5500000000000">Agendar consulta</a>
</section>

<section class="section">
  <h2>Especialidades</h2>
  <div class="grid">
    <div class="card"><div class="emoji">🩺</div><h3>Clínico Geral</h3></div>
    <div class="card"><div class="emoji">❤️</div><h3>Cardiologia</h3></div>
    <div class="card"><div class="emoji">🧒</div><h3>Pediatria</h3></div>
    <div class="card"><div class="emoji">🩹</div><h3>Dermatologia</h3></div>
    <div class="card"><div class="emoji">🦴</div><h3>Ortopedia</h3></div>
    <div class="card"><div class="emoji">🧠</div><h3>Neurologia</h3></div>
    <div class="card"><div class="emoji">🤰</div><h3>Ginecologia</h3></div>
    <div class="card"><div class="emoji">👁️</div><h3>Oftalmologia</h3></div>
  </div>
</section>

<section class="section team">
  <h2>Nossa equipe</h2>
  <p>Médicos experientes e comprometidos em oferecer o melhor cuidado em cada consulta, com estrutura completa pra exames e procedimentos no mesmo local.</p>
</section>

<section class="final">
  <h2>Marque sua consulta</h2>
  <a class="cta" href="https://wa.me/5500000000000">Falar no WhatsApp</a>
</section>

<footer>Nome da Clínica — Endereço, Cidade/UF</footer>
</body>
</html>`,
  },
  {
    key: 'odonto-premium',
    label: 'Premium',
    category: 'Clínica Odontológica',
    html: `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Clínica Odontológica Premium</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#f5f1e6; background:#0b0b0c; }
  nav { display:flex; align-items:center; justify-content:space-between; padding:22px 32px; border-bottom:1px solid #26231c; }
  nav .logo { font-weight:800; font-size:18px; letter-spacing:1px; color:#d4af37; }
  nav a.phone { color:#f5f1e6; text-decoration:none; font-size:13px; border:1px solid #d4af37; padding:8px 16px; border-radius:999px; }
  .hero { padding:96px 24px; text-align:center; background:radial-gradient(circle at 50% 0%,#1c1a14,#0b0b0c 70%); }
  .hero span { color:#d4af37; letter-spacing:3px; font-size:12px; text-transform:uppercase; }
  .hero h1 { font-size:38px; max-width:620px; margin:16px auto 16px; line-height:1.3; font-weight:600; }
  .hero p { font-size:16px; color:#c9c4b6; max-width:480px; margin:0 auto 32px; line-height:1.7; }
  .cta { display:inline-block; padding:15px 34px; background:#d4af37; color:#0b0b0c; text-decoration:none; border-radius:2px; font-weight:700; letter-spacing:1px; font-size:13px; text-transform:uppercase; }
  .section { max-width:880px; margin:0 auto; padding:72px 24px; }
  .section h2 { text-align:center; font-size:24px; font-weight:600; margin-bottom:8px; }
  .section .sub { text-align:center; color:#8a8577; font-size:13px; margin-bottom:40px; }
  .list { display:grid; grid-template-columns:1fr 1fr; gap:1px; background:#26231c; }
  @media (max-width:640px) { .list { grid-template-columns:1fr; } }
  .list div { background:#0b0b0c; padding:28px; }
  .list h3 { color:#d4af37; font-size:15px; margin:0 0 8px; font-weight:600; }
  .list p { font-size:13px; color:#9c9888; margin:0; line-height:1.6; }
  .final { text-align:center; padding:80px 24px; border-top:1px solid #26231c; }
  .final h2 { font-size:26px; margin:0 0 24px; font-weight:600; }
  footer { text-align:center; padding:28px; font-size:12px; color:#6b6758; }
</style>
</head>
<body>
<nav>
  <span class="logo">NOME DA CLÍNICA</span>
  <a class="phone" href="https://wa.me/5500000000000">Agendar</a>
</nav>

<section class="hero">
  <span>Odontologia de alto padrão</span>
  <h1>Excelência e sofisticação no cuidado com o seu sorriso</h1>
  <p>Atendimento exclusivo, tecnologia de ponta e discrição pra quem busca o melhor em saúde bucal.</p>
  <a class="cta" href="https://wa.me/5500000000000">Agendar avaliação</a>
</section>

<section class="section">
  <h2>Tratamentos</h2>
  <p class="sub">Uma experiência pensada em cada detalhe</p>
  <div class="list">
    <div><h3>Lentes de Contato Dental</h3><p>Transformação estética com naturalidade e durabilidade.</p></div>
    <div><h3>Implantes Premium</h3><p>Tecnologia de ponta com planejamento digital 3D.</p></div>
    <div><h3>Harmonização Orofacial</h3><p>Equilíbrio entre saúde bucal e estética facial.</p></div>
    <div><h3>Odontologia Digital</h3><p>Diagnóstico de precisão com scanner intraoral.</p></div>
  </div>
</section>

<section class="final">
  <h2>Agende sua avaliação exclusiva</h2>
  <a class="cta" href="https://wa.me/5500000000000">Falar no WhatsApp</a>
</section>

<footer>Nome da Clínica — Endereço, Cidade/UF</footer>
</body>
</html>`,
  },
  {
    key: 'odonto-infantil',
    label: 'Infantil',
    category: 'Clínica Odontológica',
    html: `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Odontopediatria</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#5b2e00; background:#fffaf0; }
  nav { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; }
  nav .logo { font-weight:900; font-size:20px; color:#ff6b35; }
  nav a.phone { background:#06b6d4; color:#fff; text-decoration:none; font-weight:700; font-size:13px; padding:10px 18px; border-radius:999px; }
  .hero { padding:48px 24px 72px; text-align:center; background:linear-gradient(180deg,#fff2d6,#fffaf0); border-radius:0 0 50% 50% / 0 0 40px 40px; }
  .hero h1 { font-size:32px; max-width:560px; margin:0 auto 14px; color:#ff6b35; }
  .hero p { font-size:16px; color:#7a4a1f; max-width:460px; margin:0 auto 28px; line-height:1.6; }
  .cta { display:inline-block; padding:16px 34px; background:#06b6d4; color:#fff; text-decoration:none; border-radius:999px; font-weight:800; font-size:16px; box-shadow:0 8px 0 #0891b2; }
  .section { max-width:920px; margin:0 auto; padding:56px 24px; }
  .section h2 { text-align:center; font-size:26px; color:#ff6b35; margin-bottom:32px; }
  .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
  @media (max-width:720px) { .grid { grid-template-columns:1fr 1fr; } }
  .card { background:#fff; border-radius:24px; padding:22px; text-align:center; box-shadow:0 6px 0 #ffe0c2; }
  .card .emoji { font-size:34px; margin-bottom:8px; }
  .card h3 { font-size:14px; margin:0; color:#5b2e00; }
  .why { background:#ffe8cc; border-radius:32px; margin:0 24px; padding:40px 24px; text-align:center; }
  .why p { max-width:560px; margin:0 auto; line-height:1.7; color:#7a4a1f; }
  .final { text-align:center; padding:56px 24px; }
  footer { text-align:center; padding:24px; font-size:13px; color:#b58a5c; }
</style>
</head>
<body>
<nav>
  <span class="logo">🦷 Nome da Clínica Kids</span>
  <a class="phone" href="https://wa.me/5500000000000">Agendar</a>
</nav>

<section class="hero">
  <h1>Cuidando do sorriso dos pequenos com muito carinho 😁</h1>
  <p>Consultório pensado pros nossos pacientes mais especiais: colorido, divertido e sem medo de dentista!</p>
  <a class="cta" href="https://wa.me/5500000000000">Marcar consulta</a>
</section>

<section class="section">
  <h2>O que fazemos</h2>
  <div class="grid">
    <div class="card"><div class="emoji">🦷</div><h3>Primeira consulta</h3></div>
    <div class="card"><div class="emoji">🪥</div><h3>Prevenção</h3></div>
    <div class="card"><div class="emoji">✨</div><h3>Flúor e selante</h3></div>
    <div class="card"><div class="emoji">🎈</div><h3>Tratamento de canal</h3></div>
  </div>
</section>

<section class="why">
  <p>Ambiente lúdico, equipe especializada em crianças e muita paciência — transformamos a ida ao dentista em uma experiência divertida!</p>
</section>

<section class="final">
  <h2 style="color:#ff6b35;">Agende a consulta do seu filho</h2>
  <a class="cta" href="https://wa.me/5500000000000">Falar no WhatsApp</a>
</section>

<footer>Nome da Clínica Kids — Endereço, Cidade/UF</footer>
</body>
</html>`,
  },
  {
    key: 'odonto-orto',
    label: 'Ortodontia / Aparelhos',
    category: 'Clínica Odontológica',
    html: `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Ortodontia</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#1e1b2e; }
  nav { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; }
  nav .logo { font-weight:800; font-size:18px; color:#312e81; }
  nav a.phone { color:#312e81; text-decoration:none; font-weight:600; font-size:14px; }
  .hero { background:linear-gradient(120deg,#0d9488,#6d28d9); color:#fff; padding:72px 24px; text-align:center; }
  .hero h1 { font-size:34px; max-width:620px; margin:0 auto 14px; }
  .hero p { font-size:16px; color:#e0e7ff; max-width:520px; margin:0 auto 28px; line-height:1.6; }
  .cta { display:inline-block; padding:14px 30px; background:#fff; color:#312e81; text-decoration:none; border-radius:999px; font-weight:700; }
  .section { max-width:960px; margin:0 auto; padding:64px 24px; }
  .section h2 { text-align:center; font-size:26px; margin-bottom:32px; color:#312e81; }
  .options { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
  @media (max-width:720px) { .options { grid-template-columns:1fr; } }
  .opt { border:2px solid #e9e8f5; border-radius:16px; padding:26px; text-align:center; }
  .opt .emoji { font-size:28px; margin-bottom:10px; }
  .opt h3 { font-size:16px; margin:0 0 8px; color:#1e1b2e; }
  .opt p { font-size:13px; color:#64748b; margin:0; line-height:1.5; }
  .steps { background:#f5f3ff; }
  .steps ol { max-width:460px; margin:0 auto; padding-left:20px; }
  .steps li { padding:8px 0; font-size:15px; }
  .final { text-align:center; padding:64px 24px; }
  footer { text-align:center; padding:24px; font-size:13px; color:#64748b; }
</style>
</head>
<body>
<nav>
  <span class="logo">Nome da Clínica</span>
  <a class="phone" href="https://wa.me/5500000000000">(00) 00000-0000</a>
</nav>

<section class="hero">
  <h1>O sorriso alinhado que você sempre quis</h1>
  <p>Aparelhos fixos, estéticos e invisíveis — encontre o ideal pra sua rotina e seu objetivo.</p>
  <a class="cta" href="https://wa.me/5500000000000">Agendar avaliação</a>
</section>

<section class="section">
  <h2>Qual aparelho é ideal pra você?</h2>
  <div class="options">
    <div class="opt"><div class="emoji">🦷</div><h3>Metálico</h3><p>Custo-benefício e eficiência comprovada.</p></div>
    <div class="opt"><div class="emoji">💎</div><h3>Estético</h3><p>Discreto, com braquetes da cor do dente.</p></div>
    <div class="opt"><div class="emoji">👻</div><h3>Invisível</h3><p>Alinhadores removíveis, quase imperceptíveis.</p></div>
  </div>
</section>

<section class="section steps">
  <h2>Como funciona</h2>
  <ol>
    <li>Avaliação inicial e escaneamento digital</li>
    <li>Plano de tratamento personalizado</li>
    <li>Instalação do aparelho escolhido</li>
    <li>Acompanhamento mensal até o resultado</li>
  </ol>
</section>

<section class="final">
  <h2 style="color:#312e81;">Comece sua transformação</h2>
  <a class="cta" style="background:#312e81;color:#fff;" href="https://wa.me/5500000000000">Falar no WhatsApp</a>
</section>

<footer>Nome da Clínica — Endereço, Cidade/UF</footer>
</body>
</html>`,
  },
  {
    key: 'medica-checkup',
    label: 'Check-up Premium',
    category: 'Clínica Médica',
    html: `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Check-up Premium</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#eef2ff; background:#0b1f3a; }
  nav { display:flex; align-items:center; justify-content:space-between; padding:22px 32px; border-bottom:1px solid #16305a; }
  nav .logo { font-weight:800; font-size:18px; letter-spacing:1px; color:#d4af37; }
  nav a.phone { color:#eef2ff; text-decoration:none; font-size:13px; border:1px solid #d4af37; padding:8px 16px; border-radius:999px; }
  .hero { padding:96px 24px; text-align:center; }
  .hero span { color:#d4af37; letter-spacing:3px; font-size:12px; text-transform:uppercase; }
  .hero h1 { font-size:36px; max-width:640px; margin:16px auto 16px; line-height:1.3; }
  .hero p { font-size:16px; color:#b9c4e0; max-width:520px; margin:0 auto 32px; line-height:1.7; }
  .cta { display:inline-block; padding:15px 34px; background:#d4af37; color:#0b1f3a; text-decoration:none; border-radius:2px; font-weight:700; letter-spacing:1px; font-size:13px; text-transform:uppercase; }
  .section { max-width:920px; margin:0 auto; padding:64px 24px; }
  .section h2 { text-align:center; font-size:24px; margin-bottom:36px; }
  .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:#16305a; }
  @media (max-width:720px) { .grid { grid-template-columns:1fr; } }
  .grid div { background:#0b1f3a; padding:28px; text-align:center; }
  .grid .emoji { font-size:26px; margin-bottom:10px; }
  .grid h3 { font-size:14px; margin:0; color:#d4af37; }
  .final { text-align:center; padding:80px 24px; border-top:1px solid #16305a; }
  footer { text-align:center; padding:28px; font-size:12px; color:#6b7fa3; }
</style>
</head>
<body>
<nav>
  <span class="logo">NOME DA CLÍNICA</span>
  <a class="phone" href="https://wa.me/5500000000000">Agendar</a>
</nav>

<section class="hero">
  <span>Medicina preventiva de alto padrão</span>
  <h1>Check-up completo pra quem não abre mão de cuidar da saúde</h1>
  <p>Avaliação completa em um único dia, com equipe multidisciplinar e resultado em até 48h.</p>
  <a class="cta" href="https://wa.me/5500000000000">Agendar check-up</a>
</section>

<section class="section">
  <h2>O que está incluso</h2>
  <div class="grid">
    <div><div class="emoji">🩸</div><h3>Exames laboratoriais completos</h3></div>
    <div><div class="emoji">🫀</div><h3>Avaliação cardiológica</h3></div>
    <div><div class="emoji">🖥️</div><h3>Exames de imagem</h3></div>
    <div><div class="emoji">🧬</div><h3>Avaliação genética (opcional)</h3></div>
    <div><div class="emoji">🥗</div><h3>Consulta nutricional</h3></div>
    <div><div class="emoji">📋</div><h3>Relatório personalizado</h3></div>
  </div>
</section>

<section class="final">
  <h2>Reserve seu dia de check-up</h2>
  <a class="cta" href="https://wa.me/5500000000000">Falar no WhatsApp</a>
</section>

<footer>Nome da Clínica — Endereço, Cidade/UF</footer>
</body>
</html>`,
  },
  {
    key: 'medica-pediatria',
    label: 'Pediatria',
    category: 'Clínica Médica',
    html: `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Pediatria</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#7c2d12; background:#fff7ed; }
  nav { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; }
  nav .logo { font-weight:900; font-size:19px; color:#ea580c; }
  nav a.phone { background:#facc15; color:#7c2d12; text-decoration:none; font-weight:700; font-size:13px; padding:10px 18px; border-radius:999px; }
  .hero { padding:56px 24px; text-align:center; }
  .hero h1 { font-size:32px; max-width:560px; margin:0 auto 14px; color:#ea580c; }
  .hero p { font-size:16px; color:#9a3412; max-width:460px; margin:0 auto 28px; line-height:1.6; }
  .cta { display:inline-block; padding:15px 32px; background:#ea580c; color:#fff; text-decoration:none; border-radius:999px; font-weight:800; }
  .section { max-width:920px; margin:0 auto; padding:48px 24px; }
  .section h2 { text-align:center; font-size:25px; color:#ea580c; margin-bottom:28px; }
  .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
  @media (max-width:720px) { .grid { grid-template-columns:1fr 1fr; } }
  .card { background:#fff; border-radius:18px; padding:20px; text-align:center; box-shadow:0 4px 12px rgba(234,88,12,0.08); }
  .card .emoji { font-size:28px; margin-bottom:8px; }
  .card h3 { font-size:13px; margin:0; }
  .final { text-align:center; padding:48px 24px; }
  footer { text-align:center; padding:24px; font-size:13px; color:#c2703f; }
</style>
</head>
<body>
<nav>
  <span class="logo">👶 Nome da Clínica</span>
  <a class="phone" href="https://wa.me/5500000000000">Agendar</a>
</nav>

<section class="hero">
  <h1>Cuidado pediátrico com carinho, do jeitinho que seu filho merece</h1>
  <p>Acompanhamento completo do crescimento e desenvolvimento, com atenção especial à família.</p>
  <a class="cta" href="https://wa.me/5500000000000">Agendar consulta</a>
</section>

<section class="section">
  <h2>Atendimentos</h2>
  <div class="grid">
    <div class="card"><div class="emoji">👶</div><h3>Puericultura</h3></div>
    <div class="card"><div class="emoji">💉</div><h3>Vacinação</h3></div>
    <div class="card"><div class="emoji">🤒</div><h3>Consulta de urgência</h3></div>
    <div class="card"><div class="emoji">📈</div><h3>Acompanhamento de crescimento</h3></div>
  </div>
</section>

<section class="final">
  <h2 style="color:#ea580c;">Marque a consulta do seu filho</h2>
  <a class="cta" href="https://wa.me/5500000000000">Falar no WhatsApp</a>
</section>

<footer>Nome da Clínica — Endereço, Cidade/UF</footer>
</body>
</html>`,
  },
  {
    key: 'medica-tele',
    label: 'Telemedicina',
    category: 'Clínica Médica',
    html: `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Telemedicina</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#eef2ff; background:#0f0a2e; }
  nav { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; }
  nav .logo { font-weight:800; font-size:18px; color:#a78bfa; }
  nav a.phone { color:#fff; text-decoration:none; font-weight:600; font-size:13px; background:#7c3aed; padding:9px 18px; border-radius:999px; }
  .hero { background:linear-gradient(135deg,#1e1b4b,#4c1d95); padding:80px 24px; text-align:center; }
  .hero h1 { font-size:34px; max-width:600px; margin:0 auto 14px; }
  .hero p { font-size:16px; color:#c4b5fd; max-width:500px; margin:0 auto 28px; line-height:1.6; }
  .cta { display:inline-block; padding:14px 32px; background:#a78bfa; color:#1e1b4b; text-decoration:none; border-radius:999px; font-weight:700; }
  .section { max-width:920px; margin:0 auto; padding:64px 24px; }
  .section h2 { text-align:center; font-size:26px; margin-bottom:36px; }
  .steps { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
  @media (max-width:720px) { .steps { grid-template-columns:1fr; } }
  .step { text-align:center; padding:24px; }
  .step .num { width:40px; height:40px; line-height:40px; border-radius:50%; background:#7c3aed; margin:0 auto 14px; font-weight:800; }
  .step h3 { font-size:15px; margin:0 0 8px; }
  .step p { font-size:13px; color:#c4b5fd; margin:0; line-height:1.5; }
  .final { text-align:center; padding:64px 24px; border-top:1px solid #312e81; }
  footer { text-align:center; padding:24px; font-size:13px; color:#8b86b8; }
</style>
</head>
<body>
<nav>
  <span class="logo">💻 Nome da Clínica</span>
  <a class="phone" href="https://wa.me/5500000000000">Agendar</a>
</nav>

<section class="hero">
  <h1>Consulta médica online, sem sair de casa</h1>
  <p>Atendimento por videochamada com médicos de verdade, receita digital e praticidade total.</p>
  <a class="cta" href="https://wa.me/5500000000000">Agendar consulta online</a>
</section>

<section class="section">
  <h2>Como funciona</h2>
  <div class="steps">
    <div class="step"><div class="num">1</div><h3>Agende pelo WhatsApp</h3><p>Escolha o melhor horário pra você.</p></div>
    <div class="step"><div class="num">2</div><h3>Entre na videochamada</h3><p>Consulta pelo celular ou computador.</p></div>
    <div class="step"><div class="num">3</div><h3>Receba sua receita</h3><p>Prescrição digital enviada na hora.</p></div>
  </div>
</section>

<section class="final">
  <h2>Marque sua consulta online agora</h2>
  <a class="cta" href="https://wa.me/5500000000000">Falar no WhatsApp</a>
</section>

<footer>Nome da Clínica — Atendimento 100% online</footer>
</body>
</html>`,
  },
  {
    key: 'ecommerce-produto',
    label: 'Produto Físico',
    category: 'Vendas pela Internet',
    html: `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Nome do Produto</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#111827; }
  .wrap { max-width:960px; margin:0 auto; padding:56px 24px; display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:center; }
  @media (max-width:720px) { .wrap { grid-template-columns:1fr; padding-top:32px; } }
  .img-box { aspect-ratio:1/1; background:linear-gradient(135deg,#f1f5f9,#e2e8f0); border-radius:20px; display:flex; align-items:center; justify-content:center; font-size:64px; }
  .tag { display:inline-block; background:#111827; color:#fff; font-size:11px; padding:4px 10px; border-radius:999px; margin-bottom:14px; }
  h1 { font-size:30px; margin:0 0 12px; }
  .price { font-size:28px; font-weight:800; color:#16a34a; margin:0 0 16px; }
  .price span { font-size:15px; color:#9ca3af; text-decoration:line-through; font-weight:400; margin-left:8px; }
  .desc { color:#4b5563; line-height:1.7; margin-bottom:24px; }
  .cta { display:inline-block; width:100%; text-align:center; padding:16px; background:#16a34a; color:#fff; text-decoration:none; border-radius:10px; font-weight:700; font-size:16px; }
  .features { list-style:none; padding:0; margin:24px 0 0; }
  .features li { padding:6px 0; font-size:14px; color:#374151; }
  .features li::before { content:"✓ "; color:#16a34a; font-weight:800; }
  footer { text-align:center; padding:24px; font-size:13px; color:#9ca3af; border-top:1px solid #f1f5f9; }
</style>
</head>
<body>
<div class="wrap">
  <div class="img-box">📦</div>
  <div>
    <span class="tag">Mais vendido</span>
    <h1>Nome do Produto</h1>
    <p class="price">R$ 197<span>R$ 297</span></p>
    <p class="desc">Descreva aqui o produto: pra que serve, qual problema resolve e por que ele é diferente dos outros do mercado.</p>
    <a class="cta" href="https://wa.me/5500000000000">Comprar agora</a>
    <ul class="features">
      <li>Entrega pra todo o Brasil</li>
      <li>Garantia de 30 dias</li>
      <li>Pagamento em até 12x</li>
    </ul>
  </div>
</div>
<footer>© Nome da Loja — todos os direitos reservados</footer>
</body>
</html>`,
  },
  {
    key: 'ecommerce-loja',
    label: 'Loja Online',
    category: 'Vendas pela Internet',
    html: `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Nome da Loja</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#111827; }
  nav { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; border-bottom:1px solid #f1f5f9; }
  nav .logo { font-weight:800; font-size:18px; }
  nav .cats { display:flex; gap:18px; font-size:13px; color:#6b7280; }
  .hero { background:#f8fafc; padding:48px 24px; text-align:center; }
  .hero h1 { font-size:28px; margin:0 0 10px; }
  .hero p { color:#6b7280; margin:0; }
  .grid { max-width:1040px; margin:0 auto; padding:48px 24px; display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
  @media (max-width:720px) { .grid { grid-template-columns:1fr 1fr; } nav .cats { display:none; } }
  .product { border:1px solid #f1f5f9; border-radius:14px; overflow:hidden; }
  .product .img { aspect-ratio:1/1; background:#f1f5f9; display:flex; align-items:center; justify-content:center; font-size:36px; }
  .product .info { padding:14px; }
  .product h3 { font-size:14px; margin:0 0 6px; }
  .product .price { font-weight:800; color:#16a34a; font-size:15px; margin:0 0 10px; }
  .product a { display:block; text-align:center; padding:8px; background:#111827; color:#fff; border-radius:8px; text-decoration:none; font-size:13px; font-weight:600; }
  footer { text-align:center; padding:28px; font-size:13px; color:#9ca3af; border-top:1px solid #f1f5f9; }
</style>
</head>
<body>
<nav>
  <span class="logo">Nome da Loja</span>
  <div class="cats"><span>Novidades</span><span>Mais vendidos</span><span>Promoções</span></div>
</nav>

<section class="hero">
  <h1>Tudo que você precisa, em um só lugar</h1>
  <p>Frete rápido e pagamento facilitado em toda a loja</p>
</section>

<div class="grid">
  <div class="product"><div class="img">👟</div><div class="info"><h3>Produto 1</h3><p class="price">R$ 129</p><a href="https://wa.me/5500000000000">Comprar</a></div></div>
  <div class="product"><div class="img">👜</div><div class="info"><h3>Produto 2</h3><p class="price">R$ 199</p><a href="https://wa.me/5500000000000">Comprar</a></div></div>
  <div class="product"><div class="img">⌚</div><div class="info"><h3>Produto 3</h3><p class="price">R$ 249</p><a href="https://wa.me/5500000000000">Comprar</a></div></div>
  <div class="product"><div class="img">🧴</div><div class="info"><h3>Produto 4</h3><p class="price">R$ 79</p><a href="https://wa.me/5500000000000">Comprar</a></div></div>
  <div class="product"><div class="img">🎧</div><div class="info"><h3>Produto 5</h3><p class="price">R$ 159</p><a href="https://wa.me/5500000000000">Comprar</a></div></div>
  <div class="product"><div class="img">🕶️</div><div class="info"><h3>Produto 6</h3><p class="price">R$ 99</p><a href="https://wa.me/5500000000000">Comprar</a></div></div>
</div>

<footer>© Nome da Loja — todos os direitos reservados</footer>
</body>
</html>`,
  },
  {
    key: 'ecommerce-oferta',
    label: 'Oferta / Promoção',
    category: 'Vendas pela Internet',
    html: `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Oferta por tempo limitado</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#1f1300; }
  .banner { background:#dc2626; color:#fff; text-align:center; padding:10px; font-size:13px; font-weight:700; letter-spacing:0.5px; }
  .hero { background:linear-gradient(160deg,#111827,#1f2937); color:#fff; padding:56px 24px; text-align:center; }
  .hero .tag { color:#fbbf24; font-weight:800; letter-spacing:2px; font-size:13px; text-transform:uppercase; }
  .hero h1 { font-size:32px; max-width:600px; margin:14px auto; }
  .countdown { display:flex; justify-content:center; gap:12px; margin:24px 0; }
  .countdown div { background:#fff; color:#111827; border-radius:10px; padding:12px 16px; min-width:64px; }
  .countdown div .n { font-size:24px; font-weight:800; display:block; }
  .countdown div .l { font-size:10px; color:#6b7280; text-transform:uppercase; }
  .price { font-size:40px; font-weight:900; color:#facc15; margin:16px 0 4px; }
  .price span { font-size:18px; color:#9ca3af; text-decoration:line-through; font-weight:400; margin-left:10px; }
  .cta { display:inline-block; margin-top:16px; padding:18px 40px; background:#facc15; color:#1f1300; text-decoration:none; border-radius:999px; font-weight:800; font-size:17px; }
  .section { max-width:760px; margin:0 auto; padding:56px 24px; text-align:center; }
  .bullets { display:flex; flex-wrap:wrap; justify-content:center; gap:14px; margin-top:24px; }
  .bullets span { background:#fef3c7; padding:8px 16px; border-radius:999px; font-size:13px; font-weight:600; }
  footer { text-align:center; padding:24px; font-size:12px; color:#9ca3af; }
</style>
</head>
<body>
<div class="banner">🔥 OFERTA ESPECIAL — ESTOQUE LIMITADO 🔥</div>

<section class="hero">
  <span class="tag">Só até acabar o estoque</span>
  <h1>Leve agora com até 50% de desconto</h1>
  <div class="countdown">
    <div><span class="n">12</span><span class="l">horas</span></div>
    <div><span class="n">45</span><span class="l">min</span></div>
    <div><span class="n">30</span><span class="l">seg</span></div>
  </div>
  <p class="price">R$ 97<span>R$ 194</span></p>
  <a class="cta" href="https://wa.me/5500000000000">Garantir minha oferta</a>
</section>

<section class="section">
  <h2>Por que aproveitar agora</h2>
  <div class="bullets">
    <span>✓ Frete grátis</span>
    <span>✓ Garantia de 7 dias</span>
    <span>✓ Pagamento facilitado</span>
    <span>✓ Vagas/estoque limitado</span>
  </div>
</section>

<footer>© Nome da Empresa — oferta válida enquanto durar o estoque</footer>
</body>
</html>`,
  },
  {
    key: 'info-curso',
    label: 'Curso Online',
    category: 'Infoproduto',
    html: `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Nome do Curso</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#eef2ff; background:#111133; }
  .hero { background:linear-gradient(135deg,#312e81,#1e1b4b); padding:80px 24px; text-align:center; }
  .hero span { color:#a5b4fc; font-size:13px; letter-spacing:2px; text-transform:uppercase; }
  .hero h1 { font-size:36px; max-width:680px; margin:16px auto; line-height:1.3; }
  .hero p { font-size:16px; color:#c7d2fe; max-width:540px; margin:0 auto 28px; line-height:1.6; }
  .cta { display:inline-block; padding:16px 36px; background:#facc15; color:#1e1b4b; text-decoration:none; border-radius:999px; font-weight:800; font-size:16px; }
  .section { max-width:800px; margin:0 auto; padding:64px 24px; }
  .section h2 { text-align:center; font-size:26px; margin-bottom:32px; }
  .module { display:flex; gap:16px; align-items:flex-start; padding:16px 0; border-bottom:1px solid #312e81; }
  .module .n { width:32px; height:32px; line-height:32px; text-align:center; background:#4338ca; border-radius:50%; font-weight:800; font-size:13px; flex-shrink:0; }
  .module h3 { margin:0 0 4px; font-size:15px; }
  .module p { margin:0; font-size:13px; color:#a5b4fc; }
  .instructor { display:flex; gap:20px; align-items:center; background:#1e1b4b; border-radius:20px; padding:28px; margin-top:24px; }
  .instructor .avatar { width:72px; height:72px; border-radius:50%; background:#4338ca; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:28px; }
  .instructor p { font-size:13px; color:#c7d2fe; line-height:1.6; margin:0; }
  .final { text-align:center; padding:64px 24px; }
  footer { text-align:center; padding:24px; font-size:12px; color:#6366f1; }
</style>
</head>
<body>
<section class="hero">
  <span>Curso online</span>
  <h1>Aprenda [habilidade] do zero, no seu ritmo</h1>
  <p>Um passo a passo completo pra você sair do zero até o resultado prático — com aulas gravadas e suporte direto.</p>
  <a class="cta" href="https://wa.me/5500000000000">Quero me inscrever</a>
</section>

<section class="section">
  <h2>O que você vai aprender</h2>
  <div class="module"><div class="n">1</div><div><h3>Módulo 1 — Fundamentos</h3><p>Os conceitos essenciais pra começar com o pé direito.</p></div></div>
  <div class="module"><div class="n">2</div><div><h3>Módulo 2 — Na prática</h3><p>Exercícios guiados pra aplicar o que aprendeu.</p></div></div>
  <div class="module"><div class="n">3</div><div><h3>Módulo 3 — Avançado</h3><p>Técnicas pra ir além do básico.</p></div></div>
  <div class="module"><div class="n">4</div><div><h3>Módulo 4 — Resultado</h3><p>Como aplicar tudo e ver resultado de verdade.</p></div></div>

  <div class="instructor">
    <div class="avatar">🧑‍🏫</div>
    <p><strong>Nome do Instrutor</strong><br/>Breve bio contando a experiência e credenciais de quem ensina o curso.</p>
  </div>
</section>

<section class="final">
  <h2>Pronto pra começar?</h2>
  <a class="cta" href="https://wa.me/5500000000000">Garantir minha vaga</a>
</section>

<footer>© Nome do Curso — todos os direitos reservados</footer>
</body>
</html>`,
  },
  {
    key: 'info-ebook',
    label: 'Ebook / Material Digital',
    category: 'Infoproduto',
    html: `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Nome do Ebook</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#1c1917; background:#fdfaf3; }
  .wrap { max-width:960px; margin:0 auto; padding:72px 24px; display:grid; grid-template-columns:1fr 1.2fr; gap:48px; align-items:center; }
  @media (max-width:720px) { .wrap { grid-template-columns:1fr; } }
  .book { width:220px; height:300px; margin:0 auto; background:linear-gradient(135deg,#166534,#14532d); border-radius:6px 12px 12px 6px; box-shadow:10px 10px 0 rgba(0,0,0,0.08); display:flex; align-items:center; justify-content:center; padding:24px; }
  .book span { color:#fef9c3; font-weight:800; font-size:18px; text-align:center; line-height:1.4; }
  .tag { display:inline-block; background:#166534; color:#fff; font-size:11px; padding:4px 10px; border-radius:999px; margin-bottom:14px; }
  h1 { font-size:30px; margin:0 0 14px; line-height:1.3; }
  .desc { color:#57534e; line-height:1.7; margin-bottom:20px; }
  .bullets { list-style:none; padding:0; margin:0 0 24px; }
  .bullets li { padding:6px 0; font-size:14px; }
  .bullets li::before { content:"📘 "; }
  .price { font-size:26px; font-weight:800; color:#166534; margin:0 0 16px; }
  .cta { display:inline-block; padding:16px 32px; background:#166534; color:#fff; text-decoration:none; border-radius:10px; font-weight:700; }
  footer { text-align:center; padding:24px; font-size:13px; color:#a8a29e; border-top:1px solid #e7e2d6; }
</style>
</head>
<body>
<div class="wrap">
  <div class="book"><span>Nome do Ebook</span></div>
  <div>
    <span class="tag">Material digital</span>
    <h1>Tudo que você precisa saber sobre [assunto], num só lugar</h1>
    <p class="desc">Descreva o que a pessoa vai aprender ou resolver com esse material — direto ao ponto, sem enrolação.</p>
    <ul class="bullets">
      <li>Conteúdo direto ao ponto, sem enrolação</li>
      <li>Acesso imediato após a compra</li>
      <li>Formato PDF, leia onde quiser</li>
    </ul>
    <p class="price">R$ 47</p>
    <a class="cta" href="https://wa.me/5500000000000">Quero meu exemplar</a>
  </div>
</div>
<footer>© Nome do Ebook — material digital, entrega imediata</footer>
</body>
</html>`,
  },
  {
    key: 'info-mentoria',
    label: 'Mentoria / Consultoria',
    category: 'Infoproduto',
    html: `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Nome do Mentor</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#1c1917; background:#faf8f5; }
  .hero { max-width:680px; margin:0 auto; padding:80px 24px; text-align:center; }
  .avatar { width:96px; height:96px; border-radius:50%; background:#d6d3d1; margin:0 auto 20px; display:flex; align-items:center; justify-content:center; font-size:36px; }
  .hero h1 { font-size:30px; margin:0 0 14px; }
  .hero p { color:#57534e; line-height:1.7; max-width:520px; margin:0 auto 28px; }
  .cta { display:inline-block; padding:15px 32px; background:#1c1917; color:#fff; text-decoration:none; border-radius:999px; font-weight:700; }
  .section { max-width:720px; margin:0 auto; padding:48px 24px; border-top:1px solid #e7e2d6; }
  .section h2 { text-align:center; font-size:22px; margin-bottom:28px; }
  .for-who { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  @media (max-width:640px) { .for-who { grid-template-columns:1fr; } }
  .for-who div { background:#fff; border:1px solid #e7e2d6; border-radius:14px; padding:22px; }
  .for-who h3 { font-size:14px; margin:0 0 10px; }
  .for-who ul { margin:0; padding-left:18px; font-size:13px; color:#57534e; line-height:1.8; }
  .final { text-align:center; padding:56px 24px; }
  footer { text-align:center; padding:24px; font-size:13px; color:#a8a29e; }
</style>
</head>
<body>
<section class="hero">
  <div class="avatar">🧑‍💼</div>
  <h1>Mentoria individual com Nome do Mentor</h1>
  <p>Acompanhamento próximo e personalizado pra você sair do ponto onde está e chegar aonde quer, com direção clara.</p>
  <a class="cta" href="https://wa.me/5500000000000">Agendar conversa</a>
</section>

<section class="section">
  <h2>Pra quem é essa mentoria</h2>
  <div class="for-who">
    <div>
      <h3>✅ É pra você se:</h3>
      <ul>
        <li>Quer acelerar resultados com direção certa</li>
        <li>Busca acompanhamento próximo, não genérico</li>
        <li>Está pronto pra colocar em prática</li>
      </ul>
    </div>
    <div>
      <h3>❌ Não é pra você se:</h3>
      <ul>
        <li>Procura fórmula mágica sem esforço</li>
        <li>Não tem disponibilidade pra aplicar o plano</li>
      </ul>
    </div>
  </div>
</section>

<section class="final">
  <h2>Vamos conversar sobre o seu momento?</h2>
  <a class="cta" href="https://wa.me/5500000000000">Agendar uma conversa</a>
</section>

<footer>© Nome do Mentor — todos os direitos reservados</footer>
</body>
</html>`,
  },
  {
    key: 'bar-restaurante',
    label: 'Restaurante',
    category: 'Bar e Restaurante',
    html: `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Nome do Restaurante</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#3b2318; background:#fffaf5; }
  nav { display:flex; align-items:center; justify-content:space-between; padding:20px 28px; }
  nav .logo { font-weight:800; font-size:19px; color:#9a3412; }
  nav a.phone { background:#9a3412; color:#fff; text-decoration:none; font-weight:700; font-size:13px; padding:10px 20px; border-radius:999px; }
  .hero { background:linear-gradient(160deg,#fde8d7,#fffaf5); padding:64px 24px; text-align:center; }
  .hero h1 { font-size:34px; max-width:600px; margin:0 auto 14px; color:#7c2d12; }
  .hero p { font-size:16px; color:#92531f; max-width:500px; margin:0 auto 28px; line-height:1.6; }
  .cta { display:inline-block; padding:15px 32px; background:#9a3412; color:#fff; text-decoration:none; border-radius:999px; font-weight:700; }
  .section { max-width:960px; margin:0 auto; padding:56px 24px; }
  .section h2 { text-align:center; font-size:26px; margin-bottom:32px; color:#7c2d12; }
  .menu { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
  @media (max-width:720px) { .menu { grid-template-columns:1fr; } }
  .dish { background:#fff; border-radius:16px; overflow:hidden; border:1px solid #fde8d7; }
  .dish .img { height:140px; background:#fde8d7; display:flex; align-items:center; justify-content:center; font-size:40px; }
  .dish .info { padding:16px; }
  .dish h3 { font-size:15px; margin:0 0 6px; }
  .dish p { font-size:13px; color:#92531f; margin:0; }
  .hours { background:#fde8d7; text-align:center; padding:40px 24px; }
  .hours p { margin:4px 0; font-size:14px; }
  .final { text-align:center; padding:56px 24px; }
  footer { text-align:center; padding:24px; font-size:13px; color:#c89a79; }
</style>
</head>
<body>
<nav>
  <span class="logo">Nome do Restaurante</span>
  <a class="phone" href="https://wa.me/5500000000000">Reservar mesa</a>
</nav>

<section class="hero">
  <h1>Sabor e tradição em cada prato</h1>
  <p>Um ambiente acolhedor pra reunir quem você ama em volta de uma boa mesa.</p>
  <a class="cta" href="https://wa.me/5500000000000">Fazer reserva</a>
</section>

<section class="section">
  <h2>Destaques do cardápio</h2>
  <div class="menu">
    <div class="dish"><div class="img">🍝</div><div class="info"><h3>Prato 1</h3><p>Descrição curta e apetitosa do prato.</p></div></div>
    <div class="dish"><div class="img">🥘</div><div class="info"><h3>Prato 2</h3><p>Descrição curta e apetitosa do prato.</p></div></div>
    <div class="dish"><div class="img">🍰</div><div class="info"><h3>Sobremesa</h3><p>Descrição curta e apetitosa da sobremesa.</p></div></div>
  </div>
</section>

<section class="hours">
  <p><strong>Horário de funcionamento</strong></p>
  <p>Terça a domingo — 12h às 23h</p>
</section>

<section class="final">
  <h2 style="color:#7c2d12;">Reserve sua mesa</h2>
  <a class="cta" href="https://wa.me/5500000000000">Falar no WhatsApp</a>
</section>

<footer>Nome do Restaurante — Endereço, Cidade/UF</footer>
</body>
</html>`,
  },
  {
    key: 'bar-pub',
    label: 'Bar / Pub',
    category: 'Bar e Restaurante',
    html: `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Nome do Bar</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#fef3c7; background:#0a0a0a; }
  nav { display:flex; align-items:center; justify-content:space-between; padding:20px 28px; border-bottom:1px solid #27272a; }
  nav .logo { font-weight:900; font-size:20px; color:#facc15; letter-spacing:1px; }
  nav a.phone { color:#0a0a0a; background:#facc15; text-decoration:none; font-weight:800; font-size:13px; padding:10px 20px; border-radius:999px; }
  .hero { padding:80px 24px; text-align:center; background:radial-gradient(circle at 50% 30%,#27272a,#0a0a0a 70%); }
  .hero h1 { font-size:36px; max-width:600px; margin:0 auto 14px; color:#fff; }
  .hero p { font-size:16px; color:#d4d4d8; max-width:480px; margin:0 auto 28px; line-height:1.6; }
  .cta { display:inline-block; padding:15px 34px; background:#facc15; color:#0a0a0a; text-decoration:none; border-radius:999px; font-weight:800; }
  .section { max-width:920px; margin:0 auto; padding:56px 24px; }
  .section h2 { text-align:center; font-size:26px; margin-bottom:32px; color:#facc15; }
  .events { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
  @media (max-width:720px) { .events { grid-template-columns:1fr; } }
  .event { background:#18181b; border-radius:14px; padding:22px; text-align:center; border:1px solid #27272a; }
  .event .emoji { font-size:28px; margin-bottom:10px; }
  .event h3 { font-size:15px; margin:0 0 6px; color:#fff; }
  .event p { font-size:13px; color:#a1a1aa; margin:0; }
  .final { text-align:center; padding:56px 24px; border-top:1px solid #27272a; }
  footer { text-align:center; padding:24px; font-size:13px; color:#52525b; }
</style>
</head>
<body>
<nav>
  <span class="logo">🍻 Nome do Bar</span>
  <a class="phone" href="https://wa.me/5500000000000">Reservar</a>
</nav>

<section class="hero">
  <h1>Chopp gelado, boa música e a melhor companhia</h1>
  <p>O point certo pra happy hour, jogos ao vivo e noites que você não vai esquecer.</p>
  <a class="cta" href="https://wa.me/5500000000000">Fazer reserva</a>
</section>

<section class="section">
  <h2>Agenda da semana</h2>
  <div class="events">
    <div class="event"><div class="emoji">🍺</div><h3>Happy Hour</h3><p>Seg a sex, 18h às 20h — chopp em dobro</p></div>
    <div class="event"><div class="emoji">🎤</div><h3>Música ao vivo</h3><p>Sextas e sábados a partir das 21h</p></div>
    <div class="event"><div class="emoji">⚽</div><h3>Telão</h3><p>Transmissão dos principais jogos</p></div>
  </div>
</section>

<section class="final">
  <h2 style="color:#facc15;">Garanta sua mesa</h2>
  <a class="cta" href="https://wa.me/5500000000000">Falar no WhatsApp</a>
</section>

<footer>Nome do Bar — Endereço, Cidade/UF</footer>
</body>
</html>`,
  },
  {
    key: 'comercio-loja',
    label: 'Loja / Comércio Local',
    category: 'Comércio em Geral',
    html: `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Nome da Loja</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#0c2340; }
  nav { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; }
  nav .logo { font-weight:800; font-size:18px; color:#1d4ed8; }
  nav a.phone { color:#fff; background:#1d4ed8; text-decoration:none; font-weight:700; font-size:13px; padding:9px 18px; border-radius:999px; }
  .hero { background:#eff6ff; padding:56px 24px; text-align:center; }
  .hero h1 { font-size:30px; max-width:560px; margin:0 auto 14px; }
  .hero p { font-size:16px; color:#3b5280; max-width:460px; margin:0 auto 26px; line-height:1.6; }
  .cta { display:inline-block; padding:14px 30px; background:#1d4ed8; color:#fff; text-decoration:none; border-radius:999px; font-weight:700; }
  .section { max-width:920px; margin:0 auto; padding:56px 24px; }
  .section h2 { text-align:center; font-size:24px; margin-bottom:28px; }
  .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
  @media (max-width:720px) { .grid { grid-template-columns:1fr 1fr; } }
  .card { background:#fff; border:1px solid #e0e7ff; border-radius:14px; padding:20px; text-align:center; }
  .card .emoji { font-size:26px; margin-bottom:8px; }
  .card h3 { font-size:13px; margin:0; }
  .info-box { background:#eff6ff; border-radius:16px; padding:32px; display:flex; flex-wrap:wrap; gap:24px; justify-content:center; text-align:center; }
  .info-box div h4 { margin:0 0 6px; font-size:14px; color:#1d4ed8; }
  .info-box div p { margin:0; font-size:13px; color:#3b5280; }
  .final { text-align:center; padding:56px 24px; }
  footer { text-align:center; padding:24px; font-size:13px; color:#93a7c9; }
</style>
</head>
<body>
<nav>
  <span class="logo">Nome da Loja</span>
  <a class="phone" href="https://wa.me/5500000000000">Falar no WhatsApp</a>
</nav>

<section class="hero">
  <h1>Tudo o que você precisa, perto de você</h1>
  <p>Atendimento de confiança há anos no seu bairro, com os melhores produtos e preço justo.</p>
  <a class="cta" href="https://wa.me/5500000000000">Fazer pedido</a>
</section>

<section class="section">
  <h2>Categorias</h2>
  <div class="grid">
    <div class="card"><div class="emoji">🛒</div><h3>Categoria 1</h3></div>
    <div class="card"><div class="emoji">📦</div><h3>Categoria 2</h3></div>
    <div class="card"><div class="emoji">🎁</div><h3>Categoria 3</h3></div>
    <div class="card"><div class="emoji">⭐</div><h3>Categoria 4</h3></div>
  </div>
</section>

<section class="section">
  <div class="info-box">
    <div><h4>Horário</h4><p>Seg a sáb — 9h às 19h</p></div>
    <div><h4>Localização</h4><p>Endereço, Bairro, Cidade/UF</p></div>
    <div><h4>Contato</h4><p>Pedidos direto pelo WhatsApp</p></div>
  </div>
</section>

<section class="final">
  <h2>Faça seu pedido agora</h2>
  <a class="cta" href="https://wa.me/5500000000000">Falar no WhatsApp</a>
</section>

<footer>© Nome da Loja — todos os direitos reservados</footer>
</body>
</html>`,
  },
  {
    key: 'comercio-servico',
    label: 'Prestador de Serviço',
    category: 'Comércio em Geral',
    html: `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Nome do Negócio</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#0f2a1e; }
  nav { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; }
  nav .logo { font-weight:800; font-size:18px; color:#15803d; }
  nav a.phone { color:#fff; background:#15803d; text-decoration:none; font-weight:700; font-size:13px; padding:9px 18px; border-radius:999px; }
  .hero { background:#f0fdf4; padding:56px 24px; text-align:center; }
  .hero h1 { font-size:30px; max-width:580px; margin:0 auto 14px; }
  .hero p { font-size:16px; color:#3f6b50; max-width:480px; margin:0 auto 26px; line-height:1.6; }
  .cta { display:inline-block; padding:14px 30px; background:#15803d; color:#fff; text-decoration:none; border-radius:999px; font-weight:700; }
  .section { max-width:920px; margin:0 auto; padding:56px 24px; }
  .section h2 { text-align:center; font-size:24px; margin-bottom:28px; }
  .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
  @media (max-width:720px) { .grid { grid-template-columns:1fr; } }
  .card { background:#fff; border:1px solid #dcfce7; border-radius:14px; padding:22px; text-align:center; }
  .card .emoji { font-size:28px; margin-bottom:10px; }
  .card h3 { font-size:15px; margin:0 0 6px; }
  .card p { font-size:13px; color:#3f6b50; margin:0; }
  .steps { background:#f0fdf4; text-align:center; padding:40px 24px; }
  .steps ol { max-width:420px; margin:0 auto; padding-left:20px; text-align:left; }
  .steps li { padding:6px 0; font-size:14px; }
  .final { text-align:center; padding:56px 24px; }
  footer { text-align:center; padding:24px; font-size:13px; color:#86b89a; }
</style>
</head>
<body>
<nav>
  <span class="logo">Nome do Negócio</span>
  <a class="phone" href="https://wa.me/5500000000000">Pedir orçamento</a>
</nav>

<section class="hero">
  <h1>Serviço de qualidade, com quem você pode confiar</h1>
  <p>Anos de experiência cuidando do que é importante pra você, com atendimento rápido e preço justo.</p>
  <a class="cta" href="https://wa.me/5500000000000">Solicitar orçamento</a>
</section>

<section class="section">
  <h2>Nossos serviços</h2>
  <div class="grid">
    <div class="card"><div class="emoji">🔧</div><h3>Serviço 1</h3><p>Breve descrição do serviço prestado.</p></div>
    <div class="card"><div class="emoji">✂️</div><h3>Serviço 2</h3><p>Breve descrição do serviço prestado.</p></div>
    <div class="card"><div class="emoji">🧰</div><h3>Serviço 3</h3><p>Breve descrição do serviço prestado.</p></div>
  </div>
</section>

<section class="steps">
  <h2>Como funciona</h2>
  <ol>
    <li>Você entra em contato pelo WhatsApp</li>
    <li>Fazemos uma avaliação e enviamos o orçamento</li>
    <li>Agendamos o melhor dia pra você</li>
  </ol>
</section>

<section class="final">
  <h2 style="color:#15803d;">Peça seu orçamento sem compromisso</h2>
  <a class="cta" href="https://wa.me/5500000000000">Falar no WhatsApp</a>
</section>

<footer>Nome do Negócio — Endereço, Cidade/UF</footer>
</body>
</html>`,
  },
]

const templateGroups: [string | null, typeof TEMPLATES][] = (() => {
  const groups = new Map<string | null, typeof TEMPLATES>()
  for (const t of TEMPLATES) {
    const list = groups.get(t.category) ?? []
    list.push(t)
    groups.set(t.category, list)
  }
  return Array.from(groups.entries())
})()

const CATEGORY_STYLES: Record<string, { border: string; badge: string; chipActive: string; dot: string }> = {
  'Clínica Odontológica': { border: 'hover:border-blue-400', badge: 'bg-blue-100 text-blue-700', chipActive: 'bg-blue-600 text-white border-blue-600', dot: 'bg-blue-500' },
  'Clínica Médica': { border: 'hover:border-teal-400', badge: 'bg-teal-100 text-teal-700', chipActive: 'bg-teal-600 text-white border-teal-600', dot: 'bg-teal-500' },
  'Vendas pela Internet': { border: 'hover:border-purple-400', badge: 'bg-purple-100 text-purple-700', chipActive: 'bg-purple-600 text-white border-purple-600', dot: 'bg-purple-500' },
  Infoproduto: { border: 'hover:border-orange-400', badge: 'bg-orange-100 text-orange-700', chipActive: 'bg-orange-600 text-white border-orange-600', dot: 'bg-orange-500' },
  'Bar e Restaurante': { border: 'hover:border-amber-400', badge: 'bg-amber-100 text-amber-700', chipActive: 'bg-amber-600 text-white border-amber-600', dot: 'bg-amber-500' },
  'Comércio em Geral': { border: 'hover:border-green-400', badge: 'bg-green-100 text-green-700', chipActive: 'bg-green-600 text-white border-green-600', dot: 'bg-green-500' },
  Vendas: { border: 'hover:border-gray-400', badge: 'bg-gray-100 text-gray-700', chipActive: 'bg-gray-700 text-white border-gray-700', dot: 'bg-gray-400' },
}

const CATEGORIES = templateGroups.map(([category]) => category).filter((c): c is string => !!c)

function SitePreview({ html }: { html: string }) {
  return (
    <iframe
      title="Preview"
      srcDoc={html || '<p style="font-family:sans-serif;color:#9ca3af;padding:24px;">Cole o HTML pra ver o preview aqui.</p>'}
      sandbox=""
      className="h-full w-full rounded-lg border bg-white"
    />
  )
}

function TemplateThumbnail({ html }: { html: string }) {
  return (
    <div className="relative h-36 w-full overflow-hidden rounded-t-lg bg-gray-50">
      {html ? (
        <iframe
          title="thumb"
          srcDoc={html}
          sandbox=""
          tabIndex={-1}
          style={{ width: '400%', height: '400%', transform: 'scale(0.25)', transformOrigin: 'top left', pointerEvents: 'none', border: 0 }}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-gray-300">Em branco</div>
      )}
    </div>
  )
}

function TemplateGallery({ onSelect }: { onSelect: (html: string) => void }) {
  const [filter, setFilter] = useState<string | null>(null)
  const groupsToShow = filter ? templateGroups.filter(([category]) => category === filter) : templateGroups

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter(null)}
          className={cn(
            'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
            filter === null ? 'border-teal-600 bg-teal-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
          )}
        >
          Todos
        </button>
        {CATEGORIES.map((category) => {
          const style = CATEGORY_STYLES[category]
          const active = filter === category
          return (
            <button
              key={category}
              type="button"
              onClick={() => setFilter(category)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                active ? style?.chipActive : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
              )}
            >
              {category}
            </button>
          )
        })}
      </div>

      <div className="space-y-7">
        {groupsToShow.map(([category, templates]) => (
          <div key={category ?? 'sem-categoria'}>
            {!filter && category && (
              <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span className={cn('h-1.5 w-1.5 rounded-full', CATEGORY_STYLES[category]?.dot)} />
                {category}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
              {templates.map((t) => {
                const style = t.category ? CATEGORY_STYLES[t.category] : undefined
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => onSelect(t.html)}
                    className={cn(
                      'group overflow-hidden rounded-lg border-2 border-gray-200 bg-white text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg',
                      style?.border,
                    )}
                  >
                    <TemplateThumbnail html={t.html} />
                    <div className="space-y-1.5 p-2.5">
                      <p className="truncate text-xs font-semibold text-gray-800">{t.label}</p>
                      {t.category && (
                        <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-medium', style?.badge)}>
                          {t.category}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SiteForm({
  initial,
  onCancel,
  onSubmit,
  isPending,
}: {
  initial?: { name: string; slug: string; content: string }
  onCancel: () => void
  onSubmit: (data: { name: string; slug: string; content: string }) => void
  isPending: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(!!initial)
  const [content, setContent] = useState(initial?.content ?? '')
  const [started, setStarted] = useState(!!initial)
  const [focusCodeOnMount, setFocusCodeOnMount] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const codeRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (started && focusCodeOnMount) {
      codeRef.current?.focus()
      setFocusCodeOnMount(false)
    }
  }, [started, focusCodeOnMount])

  function handleNameChange(value: string) {
    setName(value)
    if (!slugTouched) {
      setSlug(
        value
          .toLowerCase()
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      )
    }
  }

  function applyGeneratedHtml(html: string) {
    setContent(html)
    setStarted(true)
    if (!name.trim()) {
      const match = html.match(/<title>([^<]*)<\/title>/i)
      if (match?.[1]?.trim()) handleNameChange(match[1].trim())
    }
  }

  function pickTemplate(html: string) {
    setContent(html)
    setStarted(true)
  }

  function startBlank() {
    setFocusCodeOnMount(true)
    setStarted(true)
  }

  // Serve tanto pra gerar do zero (content vazio) quanto pra pedir ajuste
  // sobre o que já existe (template escolhido, HTML colado ou já gerado
  // antes) — o backend decide o modo com base em currentHtml estar
  // preenchido ou não.
  async function handleAiAction() {
    if (!aiPrompt.trim()) return
    setGenerating(true)
    try {
      const res = await api.post('/sites-mine/generate', { prompt: aiPrompt, currentHtml: content || undefined })
      applyGeneratedHtml(res.data.html)
      setAiPrompt('')
      toast({ title: content ? 'Ajuste aplicado — confira o preview' : 'Página gerada — revise o conteúdo antes de salvar', variant: 'success' })
    } catch (err: any) {
      toast({ title: err?.response?.data?.message || 'Erro ao gerar com IA', variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  if (!started) {
    return (
      <div className="space-y-8">
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="flex flex-col rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-teal-500 p-6 text-white shadow-lg transition-shadow hover:shadow-xl">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              <h2 className="text-lg font-bold">Criar com IA</h2>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-white/90">
              <span className="rounded-full bg-white/20 px-2.5 py-1">1. Descreva</span>
              <ArrowRight className="h-3 w-3" />
              <span className="rounded-full bg-white/20 px-2.5 py-1">2. Gerar</span>
              <ArrowRight className="h-3 w-3" />
              <span className="rounded-full bg-white/20 px-2.5 py-1">3. Ver e ajustar</span>
            </div>
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ex: página de vendas pra uma barbearia masculina, tom moderno, com seção de serviços e botão de agendar no WhatsApp"
              className="h-28 flex-1 border-white/30 bg-white/10 text-sm text-white placeholder:text-white/60 focus-visible:ring-white"
            />
            <Button
              type="button"
              className="mt-3 w-full bg-white font-semibold text-indigo-700 hover:bg-white/90"
              disabled={!aiPrompt.trim() || generating}
              onClick={handleAiAction}
            >
              {generating ? 'Gerando sua página...' : 'Gerar página com IA'}
            </Button>
          </div>

          <div className="flex flex-col rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-3 flex items-center gap-2 text-amber-700">
              <LayoutGrid className="h-6 w-6" />
              <h2 className="text-lg font-bold text-gray-800">Escolher um modelo</h2>
            </div>
            <p className="text-sm text-gray-600">
              20 modelos prontos (clínicas, vendas, infoproduto, bar/restaurante, comércio). Escolha um e, se quiser,
              refine com IA depois — dentro do editor.
            </p>
            <div className="mt-4 flex-1" />
            <p className="text-xs font-medium text-amber-700">↓ Veja a galeria completa logo abaixo</p>
          </div>

          <div className="flex flex-col rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-3 flex items-center gap-2 text-slate-700">
              <Code2 className="h-6 w-6" />
              <h2 className="text-lg font-bold text-gray-800">Colar meu HTML</h2>
            </div>
            <p className="text-sm text-gray-600">Já tem o código pronto (exportado de outro editor, feito à mão)? Cole direto e veja o preview na hora.</p>
            <div className="flex-1" />
            <Button type="button" variant="outline" className="mt-4 border-slate-300" onClick={startBlank}>
              Colar código
            </Button>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-800">Galeria de modelos</h2>
          <TemplateGallery onSelect={pickTemplate} />
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-white p-6 md:p-8">
      {!initial && (
        <button type="button" onClick={() => setStarted(false)} className="mb-4 text-xs font-medium text-teal-600 hover:underline">
          ← Voltar pras opções de início
        </button>
      )}

      <div className="grid gap-4 md:grid-cols-2 md:max-w-2xl">
        <div>
          <Label>Nome da página</Label>
          <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Ex: Loja da Maria" />
        </div>
        <div>
          <Label>Slug (identificador interno)</Label>
          <Input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value)
            }}
            placeholder="loja-da-maria"
          />
        </div>
      </div>

      <div className="mt-5 rounded-xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-5 shadow-sm">
        <div className="mb-1.5 flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-violet-600" />
          <Label className="!mb-0 text-sm font-semibold text-violet-900">
            {content.trim() ? 'Pedir ajuste à IA' : 'Gerar com IA'}
          </Label>
        </div>
        <p className="mb-3 text-xs text-violet-700/80">
          {content.trim()
            ? 'Descreva o que quer mudar (ex: "deixe o botão verde", "troque o título pra X") — a IA edita o HTML atual preservando o resto.'
            : 'Descreva o negócio e o que a página deve ter — a IA gera o HTML completo.'}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder={content.trim() ? 'Ex: deixe as cores mais vivas e troque o título' : 'Ex: página de vendas pra uma barbearia masculina...'}
            className="h-20 flex-1 border-violet-200 bg-white text-sm"
          />
          <Button
            type="button"
            className="shrink-0 bg-violet-600 text-white hover:bg-violet-700 sm:h-20"
            disabled={!aiPrompt.trim() || generating}
            onClick={handleAiAction}
          >
            {generating ? 'Aplicando...' : content.trim() ? 'Aplicar ajuste' : 'Gerar página'}
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <Label>Código HTML da página</Label>
          <Textarea
            ref={codeRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Cole aqui o HTML completo da página..."
            className="mt-1.5 h-[68vh] min-h-[480px] resize-none font-mono text-sm"
          />
        </div>
        <div>
          <Label>Preview</Label>
          <div className="mt-1.5 h-[68vh] min-h-[480px]">
            <SitePreview html={content} />
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button
          className="bg-teal-600 text-white hover:bg-teal-700"
          disabled={!name.trim() || !slug.trim() || isPending}
          onClick={() => onSubmit({ name, slug, content })}
        >
          {isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  )
}

export default function MyPagePage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { data: sites = [], isLoading } = useQuery<Site[]>({
    queryKey: ['my-sites'],
    queryFn: () => api.get('/sites-mine').then((r) => r.data),
  })

  const editingSite = useMemo(() => sites.find((s) => s.id === editingId) ?? null, [sites, editingId])

  const createMutation = useMutation({
    mutationFn: (data: { name: string; slug: string; content: string }) => api.post('/sites-mine', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-sites'] })
      setShowCreate(false)
      toast({ title: 'Página criada', variant: 'success' })
    },
    onError: (err: any) => toast({ title: err?.response?.data?.message || 'Erro ao criar página', variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; content: string }) =>
      api.patch(`/sites-mine/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-sites'] })
      setEditingId(null)
      toast({ title: 'Página atualizada', variant: 'success' })
    },
    onError: () => toast({ title: 'Erro ao atualizar', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/sites-mine/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-sites'] })
      toast({ title: 'Página removida' })
    },
    onError: () => toast({ title: 'Erro ao remover', variant: 'destructive' }),
  })

  const isEditing = showCreate || !!editingSite

  return (
    <div className={isEditing ? 'p-4 md:p-8' : 'p-4 md:p-8 max-w-4xl'}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-teal-900">Minha Página</h1>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? 'Edite o conteúdo com calma — nada é publicado até você clicar em Salvar.'
              : 'Crie e edite o conteúdo da sua página — o domínio é configurado pela nossa equipe depois que você cria.'}
          </p>
        </div>
        {!isEditing && (
          <Button className="bg-teal-600 text-white hover:bg-teal-700" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nova página
          </Button>
        )}
      </div>

      {showCreate && (
        <SiteForm
          onCancel={() => setShowCreate(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isPending={createMutation.isPending}
        />
      )}

      {editingSite && (
        <SiteForm
          key={editingSite.id}
          initial={{ name: editingSite.name, slug: editingSite.slug, content: editingSite.content }}
          onCancel={() => setEditingId(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editingSite.id, name: data.name, content: data.content })}
          isPending={updateMutation.isPending}
        />
      )}

      {!isEditing &&
        (isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : sites.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-gray-50/60 p-8 text-center">
            <Globe className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm font-medium text-gray-700">Você ainda não tem nenhuma página criada</p>
            <p className="mx-auto mt-1.5 max-w-sm text-xs text-muted-foreground">
              Clique em "Nova página", cole o HTML (ou comece de um modelo pronto) e salve. Depois de criar, fale com a
              gente pra configurarmos o domínio próprio da sua página — até lá, ela fica salva mas sem endereço público.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sites.map((site) => (
              <div key={site.id} className="flex items-center justify-between gap-3 rounded-lg border bg-white p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-gray-900">{site.name}</p>
                    <span className={site.isActive ? 'rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-medium text-teal-700' : 'rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600'}>
                      {site.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  {site.domain ? (
                    <a
                      href={`https://${site.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 flex items-center gap-1 text-xs text-teal-600 hover:underline"
                    >
                      {site.domain} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <a
                      href={`/sites/${site.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 flex items-center gap-1 text-xs text-amber-600 hover:underline"
                    >
                      Link temporário de preview (sem domínio ainda) <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => setEditingId(site.id)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm(`Remover a página "${site.name}"? Essa ação não pode ser desfeita.`)) {
                        deleteMutation.mutate(site.id)
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  )
}
