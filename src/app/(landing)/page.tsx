import Link from 'next/link'
import {
  MessageSquare, Zap, BarChart3, Users, ArrowRight,
  CheckCircle2, Bell, Calendar, Megaphone, Bot,
} from 'lucide-react'

/* ─── Hero ─────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pb-20 pt-16 md:pt-24">
      {/* fundo decorativo */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-teal-50 opacity-60 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6 text-center">
        <span className="mb-5 inline-flex items-center gap-2 rounded-pill border border-teal-100 bg-teal-50 px-4 py-1.5 text-xs font-semibold text-teal-700">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
          Novo: agendamento de follow-ons com envio automático
        </span>

        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-teal-900 md:text-5xl lg:text-6xl">
          Atendimento no WhatsApp que escala com você
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg text-ink-soft">
          Gerencie conversas, automatize respostas com IA e envie broadcasts segmentados — tudo em um painel simples para o seu time.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-pill bg-coral px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-coral-hover"
          >
            Começar grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#como-funciona"
            className="inline-flex items-center gap-2 rounded-pill border border-teal-600 px-7 py-3.5 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-50"
          >
            Ver como funciona
          </Link>
        </div>

        <p className="mt-5 text-xs text-ink-faint">
          Grátis para começar · Sem cartão de crédito
        </p>
      </div>

      {/* Dashboard mockup */}
      <div className="mx-auto mt-16 max-w-5xl px-6">
        <div className="rounded-card border border-[#EEF2F6] bg-white shadow-sende overflow-hidden">
          <div className="flex h-8 items-center gap-1.5 border-b border-[#EEF2F6] bg-gray-50 px-4">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-teal-400" />
          </div>
          <div className="flex h-72 md:h-96">
            {/* Sidebar mockup */}
            <div className="hidden w-52 shrink-0 border-r border-[#EEF2F6] bg-white p-3 md:block">
              <div className="mb-4 flex items-center gap-2 px-2 py-2">
                <div className="h-6 w-6 rounded-md bg-teal-600" />
                <div className="h-3 w-16 rounded-full bg-teal-900/20" />
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`mb-1 flex items-center gap-2 rounded-lg px-3 py-2 ${i === 1 ? 'bg-teal-50' : ''}`}>
                  <div className={`h-3 w-3 rounded-sm ${i === 1 ? 'bg-teal-600' : 'bg-gray-200'}`} />
                  <div className={`h-2.5 rounded-full ${i === 1 ? 'w-16 bg-teal-600' : 'w-14 bg-gray-200'}`} />
                </div>
              ))}
            </div>
            {/* Conversation list mockup */}
            <div className="hidden w-64 shrink-0 border-r border-[#EEF2F6] p-3 md:block">
              <div className="mb-3 h-8 rounded-lg bg-gray-100" />
              {[
                { name: 'Ana Beatriz', time: '14:23', unread: true },
                { name: 'Carlos Mendes', time: '13:45', unread: false },
                { name: 'Fernanda Lima', time: '12:10', unread: true },
                { name: 'Ricardo Souza', time: 'Ontem', unread: false },
              ].map((c) => (
                <div key={c.name} className="mb-1 flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-teal-50">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-ink truncate">{c.name}</p>
                      <p className="text-[10px] text-ink-faint">{c.time}</p>
                    </div>
                    <p className="text-[10px] text-ink-faint truncate">Olá, gostaria de saber...</p>
                  </div>
                  {c.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-teal-500" />}
                </div>
              ))}
            </div>
            {/* Chat mockup */}
            <div className="flex-1 flex flex-col p-4">
              <div className="mb-4 flex items-center gap-2 border-b border-[#EEF2F6] pb-3">
                <div className="h-7 w-7 rounded-full bg-teal-100 flex items-center justify-center text-xs font-semibold text-teal-700">A</div>
                <p className="text-xs font-semibold text-ink">Ana Beatriz</p>
                <span className="ml-auto rounded-pill bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700">Aberta</span>
              </div>
              <div className="flex-1 space-y-2 overflow-hidden">
                <div className="flex justify-start">
                  <div className="max-w-[60%] rounded-lg rounded-bl-none bg-white border border-[#EEF2F6] px-3 py-1.5 text-xs text-ink shadow-sm">
                    Olá! Gostaria de saber sobre os planos disponíveis.
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[60%] rounded-lg rounded-br-none bg-teal-600 px-3 py-1.5 text-xs text-white">
                    Olá Ana! Claro, temos 3 opções. Posso te enviar o detalhamento?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[60%] rounded-lg rounded-bl-none bg-white border border-[#EEF2F6] px-3 py-1.5 text-xs text-ink shadow-sm">
                    Sim, por favor!
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#EEF2F6] bg-gray-50 px-3 py-2">
                <div className="h-2 flex-1 rounded-full bg-gray-200" />
                <div className="h-6 w-6 rounded-full bg-teal-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Números ───────────────────────────────────────────── */
function Stats() {
  const items = [
    { value: '10×', label: 'mais rápido que e-mail' },
    { value: '98%', label: 'taxa de abertura no WhatsApp' },
    { value: '3×', label: 'mais conversões com follow-on' },
    { value: '< 2min', label: 'para configurar o primeiro número' },
  ]
  return (
    <section className="bg-teal-900 py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {items.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-extrabold text-white">{s.value}</p>
              <p className="mt-1 text-sm text-teal-100/70">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Funcionalidades ───────────────────────────────────── */
const features = [
  {
    icon: MessageSquare,
    title: 'Caixa de entrada unificada',
    desc: 'Todos os atendimentos em um só lugar. Delegue conversas, veja histórico e colabore em equipe sem trocar de aba.',
    color: 'bg-teal-100 text-teal-700',
  },
  {
    icon: Megaphone,
    title: 'Broadcasts segmentados',
    desc: 'Envie mensagens ou templates para listas de contatos com tags. Acompanhe taxa de entrega, leitura e resposta em tempo real.',
    color: 'bg-teal-100 text-teal-700',
  },
  {
    icon: Bot,
    title: 'IA com contexto de campanha',
    desc: 'Configure prompts por número ou por broadcast. O bot responde com o contexto certo para cada cliente, classificando intenções automaticamente.',
    color: 'bg-teal-100 text-teal-700',
  },
  {
    icon: Calendar,
    title: 'Follow-ons automáticos',
    desc: 'Agende ligações, reuniões ou envios de mensagem. Dentro da janela de 24h envio texto livre; depois, seleciona template — o sistema avisa antes de expirar.',
    color: 'bg-teal-100 text-teal-700',
  },
  {
    icon: Zap,
    title: 'Automações de ciclo de vida',
    desc: 'Dispare mensagens por aniversário, recompra ou inadimplência. Defina o intervalo certo e deixe a ferramenta trabalhar por você.',
    color: 'bg-teal-100 text-teal-700',
  },
  {
    icon: BarChart3,
    title: 'Dashboard e relatórios',
    desc: 'Veja conversas abertas, taxa de resposta de broadcasts, sentimentos dos clientes e agenda de follow-ons por atendente.',
    color: 'bg-teal-100 text-teal-700',
  },
]

function Features() {
  return (
    <section id="funcionalidades" className="bg-teal-50 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-teal-900 md:text-4xl">
            Tudo que seu time precisa
          </h2>
          <p className="mt-4 text-base text-ink-soft">
            De atendimento 1-a-1 a campanhas em massa — numa única plataforma.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="rounded-card border border-[#EEF2F6] bg-white p-6 shadow-sende-sm transition-shadow hover:shadow-sende"
              >
                <div className={`mb-4 inline-flex rounded-xl p-2.5 ${f.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-teal-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-ink-soft">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─── Como funciona ─────────────────────────────────────── */
const steps = [
  {
    n: '01',
    title: 'Conecte seu número WhatsApp Business',
    desc: 'Configure o webhook na Meta em menos de 5 minutos. Suporte a múltiplos números e WABAs.',
  },
  {
    n: '02',
    title: 'Importe contatos e crie automações',
    desc: 'Suba sua lista via CSV com tags, defina regras de aniversário, recompra e inadimplência.',
  },
  {
    n: '03',
    title: 'Atenda, automatize e acompanhe',
    desc: 'Deixe a IA cuidar das respostas rotineiras e o time focar nas conversas que fecham negócio.',
  },
]

function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-teal-900 md:text-4xl">
            Em 3 passos você está operando
          </h2>
          <p className="mt-4 text-base text-ink-soft">
            Sem burocracia de onboarding. Setup guiado do zero ao primeiro atendimento.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.n} className="relative">
              {i < steps.length - 1 && (
                <div className="absolute left-[calc(100%_-_8px)] top-6 hidden h-px w-full bg-teal-100 md:block" />
              )}
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-pill bg-teal-600 font-display text-sm font-bold text-white">
                  {s.n}
                </div>
                <div>
                  <h3 className="mb-2 text-base font-semibold text-teal-900">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-soft">{s.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Planos ─────────────────────────────────────────────── */
const plans = [
  {
    name: 'Free',
    price: 'R$ 0',
    period: 'para sempre',
    desc: 'Para experimentar e validar o canal.',
    cta: 'Criar conta grátis',
    highlight: false,
    features: [
      '1 número WhatsApp',
      'Até 500 conversas/mês',
      'Broadcasts básicos',
      'Dashboard simples',
    ],
  },
  {
    name: 'Starter',
    price: 'R$ 197',
    period: '/mês',
    desc: 'Para times que já atendem via WhatsApp.',
    cta: 'Começar agora',
    highlight: true,
    features: [
      'Até 3 números WhatsApp',
      'Conversas ilimitadas',
      'IA com prompts customizados',
      'Automações de ciclo de vida',
      'Follow-ons com envio automático',
      'Relatórios avançados',
    ],
  },
  {
    name: 'Pro',
    price: 'R$ 497',
    period: '/mês',
    desc: 'Para operações de alto volume.',
    cta: 'Falar com vendas',
    highlight: false,
    features: [
      'Números ilimitados',
      'Multi-WABA',
      'API pública',
      'SLA prioritário',
      'Onboarding dedicado',
      'Tudo do Starter',
    ],
  },
]

function Pricing() {
  return (
    <section id="planos" className="bg-teal-50 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-teal-900 md:text-4xl">
            Planos simples, sem surpresas
          </h2>
          <p className="mt-4 text-base text-ink-soft">
            Comece grátis e escale conforme o seu crescimento.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-card border p-8 ${
                p.highlight
                  ? 'border-teal-600 bg-teal-900 text-white shadow-sende ring-1 ring-teal-600'
                  : 'border-[#EEF2F6] bg-white shadow-sende-sm'
              }`}
            >
              <p className={`text-xs font-semibold uppercase tracking-wider ${p.highlight ? 'text-teal-300' : 'text-teal-600'}`}>
                {p.name}
              </p>
              <div className="mt-3 flex items-end gap-1">
                <span className={`font-display text-3xl font-extrabold ${p.highlight ? 'text-white' : 'text-teal-900'}`}>
                  {p.price}
                </span>
                <span className={`mb-1 text-sm ${p.highlight ? 'text-teal-300' : 'text-ink-faint'}`}>
                  {p.period}
                </span>
              </div>
              <p className={`mt-2 text-sm ${p.highlight ? 'text-teal-100/80' : 'text-ink-soft'}`}>
                {p.desc}
              </p>

              <ul className="my-6 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${p.highlight ? 'text-teal-400' : 'text-teal-600'}`} />
                    <span className={p.highlight ? 'text-teal-100' : 'text-ink-soft'}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={`block w-full rounded-pill py-3 text-center text-sm font-semibold transition-colors ${
                  p.highlight
                    ? 'bg-coral text-white hover:bg-coral-hover'
                    : 'border border-teal-600 text-teal-700 hover:bg-teal-50'
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── CTA Final ─────────────────────────────────────────── */
function CtaFinal() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <Bell className="mx-auto mb-4 h-10 w-10 text-teal-500" />
        <h2 className="text-3xl font-bold tracking-tight text-teal-900 md:text-4xl">
          Pronto para transformar seu atendimento?
        </h2>
        <p className="mt-4 text-base text-ink-soft">
          Configure seu número WhatsApp em minutos e comece a atender com mais agilidade hoje mesmo.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-pill bg-coral px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-coral-hover"
          >
            Criar conta grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-ink-soft hover:text-teal-600 transition-colors"
          >
            Já tenho conta →
          </Link>
        </div>
        <p className="mt-5 text-xs text-ink-faint">
          Sem cartão de crédito · Cancele quando quiser
        </p>
      </div>
    </section>
  )
}

/* ─── Page ───────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Pricing />
      <CtaFinal />
    </>
  )
}
