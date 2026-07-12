import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  ContactRound,
  Inbox,
  Megaphone,
  MessageCircleMore,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

/* ─── Header ────────────────────────────────────────────── */
function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-teal-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-6">
        <Link
          href="#"
          className="font-display text-2xl font-extrabold tracking-tight text-teal-900"
        >
          sende<span className="text-teal-500">.</span>
        </Link>

        <nav className="flex items-center gap-7">
          <Link
            href="#recursos"
            className="hidden text-sm font-medium text-ink-soft transition-colors hover:text-teal-700 md:inline"
          >
            Recursos
          </Link>
          <Link
            href="#como-funciona"
            className="hidden text-sm font-medium text-ink-soft transition-colors hover:text-teal-700 md:inline"
          >
            Como funciona
          </Link>
          <Link
            href="#planos"
            className="hidden text-sm font-medium text-ink-soft transition-colors hover:text-teal-700 md:inline"
          >
            Planos
          </Link>
          <Link
            href="#cta"
            className="rounded-pill bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-teal-700"
          >
            Agendar demonstração
          </Link>
        </nav>
      </div>
    </header>
  );
}

/* ─── Hero ──────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pb-20 pt-16 md:pt-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-teal-50 opacity-70 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6 text-center">
        <span className="mb-5 inline-flex items-center gap-2 rounded-pill border border-teal-100 bg-teal-50 px-4 py-1.5 text-xs font-semibold text-teal-700">
          <Sparkles className="h-3.5 w-3.5" />
          CRM conversacional para WhatsApp
        </span>

        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-teal-900 md:text-5xl lg:text-6xl">
          Seu <span className="text-teal-500">time de vendas</span> no WhatsApp,
          trabalhando mesmo quando você não está
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-soft">
          O Sende responde clientes com IA, dispara campanhas e organiza seus
          leads 24 horas por dia. Você configura uma vez; ele vende enquanto
          você dorme.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="#cta"
            className="inline-flex items-center gap-2 rounded-pill bg-teal-600 px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-teal-700"
          >
            Começar agora
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#como-funciona"
            className="inline-flex items-center gap-2 rounded-pill border border-teal-600 px-7 py-3.5 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-50"
          >
            Ver como funciona
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-xl px-6">
        <div className="overflow-hidden rounded-[26px] border border-teal-50 bg-white shadow-sende">
          <div className="flex items-center gap-3 border-b border-[#EEF2F6] px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 font-display text-xs font-bold text-white">
              BM
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Bella Moda</p>
              <p className="text-xs font-medium text-teal-600">
                Sende ativo · 24h
              </p>
            </div>
          </div>

          <div className="space-y-3 p-5">
            <ChatBubble side="left" time="23:47">
              Oi! Ainda tem o vestido midi verde no tamanho M?
            </ChatBubble>

            <ChatBubble side="right" time="23:47">
              Oi, <strong>Carla</strong>! 😊 Tem sim — o vestido midi verde em M
              está por <strong>R$ 189</strong>. Quer que eu separe pra você?
            </ChatBubble>

            <StatusTag>
              <Sparkles className="h-3.5 w-3.5" />
              Respondido pela IA — fora do horário comercial
            </StatusTag>

            <ChatBubble side="left" time="23:49">
              Quero sim! Como faço o pagamento?
            </ChatBubble>

            <ChatBubble side="right" time="23:49">
              Perfeito! Reservei o seu 💚 Te mando o link de pagamento agora, e
              a peça sai pra entrega amanhã cedo.
            </ChatBubble>

            <div className="inline-flex items-center gap-2 rounded-pill bg-orange-100 px-3.5 py-1.5 text-xs font-semibold text-orange-700">
              <Users className="h-3.5 w-3.5" />
              08:12 — Fabricio assumiu a conversa
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChatBubble({
  side,
  time,
  children,
}: {
  side: "left" | "right";
  time: string;
  children: React.ReactNode;
}) {
  const isRight = side === "right";

  return (
    <div className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${
          isRight
            ? "rounded-br-md border border-teal-100 bg-teal-50 text-ink"
            : "rounded-bl-md border border-[#EEF2F6] bg-slate-50 text-ink"
        }`}
      >
        <p>{children}</p>
        <span className="mt-1 block text-right text-[10px] text-ink-faint">
          {time}
        </span>
      </div>
    </div>
  );
}

function StatusTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-pill bg-teal-100 px-3.5 py-1.5 text-xs font-semibold text-teal-700">
      {children}
    </div>
  );
}

/* ─── Prova social ──────────────────────────────────────── */
function SocialProof() {
  const brands = [
    "Bella Moda",
    "Clínica Vitalle",
    "PetShop Amigo",
    "Studio Fit",
    "Doce Encanto",
  ];

  return (
    <section className="border-y border-teal-100 bg-white py-9">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <p className="text-[11px] font-bold tracking-[0.18em] text-teal-900">
          EMPRESAS QUE JÁ VENDEM COM O SENDE
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {brands.map((brand) => (
            <span
              key={brand}
              className="font-display text-base font-bold text-slate-300"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Recursos ──────────────────────────────────────────── */
const features = [
  {
    icon: Inbox,
    title: "Inbox inteligente",
    desc: "Todas as conversas em um painel único, com atribuição de atendentes, tags e histórico completo.",
    stat: "1 painel, zero bagunça",
  },
  {
    icon: Bot,
    title: "Bot com IA",
    desc: "Responde automaticamente no tom da sua empresa, com regras e contexto configurados por você.",
    stat: "Atendimento 24h",
  },
  {
    icon: Megaphone,
    title: "Broadcasts",
    desc: "Dispare mensagens para contatos por tag ou planilha e deixe a IA classificar cada resposta.",
    stat: "Leads organizados sozinhos",
  },
  {
    icon: Clock3,
    title: "Automações",
    desc: "Envie mensagens de aniversário, cobrança, recompra e lembretes exatamente na hora certa.",
    stat: "No piloto automático",
  },
  {
    icon: ContactRound,
    title: "Gestão de contatos",
    desc: "Histórico de compras, produtos, tags e notas para personalizar cada atendimento.",
    stat: "Cada cliente, um contexto",
  },
];

function Features() {
  return (
    <section id="recursos" className="bg-white py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-teal-900 md:text-4xl">
            Tudo que sua equipe faria no WhatsApp — no automático
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-ink-soft">
            Cinco pilares que transformam seu WhatsApp em um canal de vendas que
            trabalha sozinho.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-card border border-[#EEF2F6] bg-white p-7 shadow-sende-sm transition-shadow hover:shadow-sende"
              >
                <div className="mb-4 inline-flex rounded-xl bg-teal-100 p-3 text-teal-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-teal-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {feature.desc}
                </p>
                <p className="mt-5 font-display text-xl font-extrabold text-teal-500">
                  {feature.stat}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Como funciona ─────────────────────────────────────── */
const conversations = [
  {
    name: "Carla Mendes",
    desc: "Reservou vestido midi M",
    label: "Venda fechada",
    style: "bg-green-100 text-green-700",
  },
  {
    name: "João Pereira",
    desc: "Perguntou sobre entrega",
    label: "IA respondendo",
    style: "bg-teal-100 text-teal-700",
  },
  {
    name: "Marina Souza",
    desc: "Quer trocar um pedido",
    label: "Com atendente",
    style: "bg-orange-100 text-orange-700",
  },
  {
    name: "Campanha Dia das Mães",
    desc: "247 enviados · 63 respostas",
    label: "IA classificando",
    style: "bg-teal-100 text-teal-700",
  },
];

function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-teal-50 py-20 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-teal-900 md:text-4xl">
            Seu time trabalhando mesmo quando você não está
          </h2>
          <p className="mt-4 text-base text-ink-soft">
            Quando precisar de toque humano, você entra. Quando não precisar, o
            Sende segura o atendimento.
          </p>

          <ul className="mt-7 space-y-4">
            {[
              "O bot responde de madrugada, no domingo e no feriado.",
              "Você assume qualquer conversa com um clique e recebe todo o histórico.",
              "A IA identifica lead quente, suporte e quem apenas perguntou o preço.",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm text-ink"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-card border border-[#EEF2F6] bg-white p-6 shadow-sende">
          {conversations.map((conversation, index) => (
            <div
              key={conversation.name}
              className={`flex items-center justify-between gap-4 py-4 ${
                index < conversations.length - 1
                  ? "border-b border-[#EEF2F6]"
                  : ""
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-ink">
                  {conversation.name}
                </p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {conversation.desc}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-pill px-3 py-1 text-[11px] font-bold ${conversation.style}`}
              >
                {conversation.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Planos ────────────────────────────────────────────── */
const plans = [
  {
    name: "Início",
    price: "R$ 200",
    period: "/mês",
    desc: "Pra sair do improviso e centralizar o atendimento.",
    cta: "Assinar o Início",
    highlight: false,
    credits: "R$ 30/mês em créditos inclusos",
    features: [
      "1 número de WhatsApp",
      "2 atendentes no painel",
      "Bot com IA",
      "Até 500 contatos",
      "Tags e histórico de conversas",
    ],
  },
  {
    name: "Profissional",
    price: "R$ 400",
    period: "/mês",
    desc: "Pra quem vende todo dia e precisa de campanha e automação.",
    cta: "Assinar o Profissional",
    highlight: true,
    credits: "R$ 80/mês em créditos inclusos",
    features: [
      "Tudo do Início",
      "5 atendentes no painel",
      "Broadcasts com classificação por IA",
      "Automações de aniversário, cobrança e recompra",
      "Até 5.000 contatos",
    ],
  },
  {
    name: "Escala",
    price: "R$ 800",
    period: "/mês",
    desc: "Pra operações com equipe e múltiplos números.",
    cta: "Falar com vendas",
    highlight: false,
    credits: "R$ 200/mês em créditos inclusos",
    features: [
      "Tudo do Profissional",
      "Atendentes ilimitados",
      "Múltiplos números de WhatsApp",
      "Contatos ilimitados",
      "Suporte prioritário e onboarding assistido",
    ],
  },
];

function Pricing() {
  return (
    <section id="planos" className="bg-white py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-teal-900 md:text-4xl">
            Planos que crescem com o seu atendimento
          </h2>
          <p className="mt-4 text-base text-ink-soft">
            Comece pequeno e escale quando suas conversas escalarem.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-card border p-8 ${
                plan.highlight
                  ? "border-teal-600 bg-white shadow-sende ring-1 ring-teal-600"
                  : "border-[#EEF2F6] bg-white shadow-sende-sm"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-pill bg-teal-600 px-4 py-1 text-[11px] font-bold tracking-wide text-white">
                  MAIS ESCOLHIDO
                </span>
              )}

              <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">
                {plan.name}
              </p>
              <div className="mt-3 flex items-end gap-1">
                <span className="font-display text-3xl font-extrabold text-teal-900">
                  {plan.price}
                </span>
                <span className="mb-1 text-sm text-ink-faint">
                  {plan.period}
                </span>
              </div>
              <p className="mt-2 text-sm text-ink-soft">{plan.desc}</p>

              <div className="mt-5 flex items-start gap-2 rounded-xl bg-teal-50 p-3 text-sm font-semibold text-teal-800">
                <Zap className="mt-0.5 h-4 w-4 shrink-0" />
                {plan.credits}
              </div>

              <ul className="my-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-ink-soft"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="#cta"
                className={`block w-full rounded-pill py-3 text-center text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? "bg-coral text-white hover:bg-coral-hover"
                    : "border border-teal-600 text-teal-700 hover:bg-teal-50"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-ink-faint">
          Sem fidelidade — cancele quando quiser.
        </p>

        <Credits />
      </div>
    </section>
  );
}

const creditRows = [
  {
    type: "Campanha",
    category: "Marketing",
    when: "Você dispara oferta, promoção ou recompra para sua base",
    price: "R$ 0,50 /msg",
  },
  {
    type: "Campanha - Resposta",
    category: "Marketing",
    when: "Cliente responde a uma mensagem de marketing",
    price: "R$ 0,05 /msg",
  },
  {
    type: "Aviso",
    category: "Utilidade",
    when: "Cobrança, confirmação de pedido ou lembrete de entrega",
    price: "R$ 0,05 /msg",
  },
  {
    type: "Resposta",
    category: "Atendimento",
    when: "O cliente chamou ou respondeu sua campanha",
    price: "GRÁTIS",
  },
];

function Credits() {
  return (
    <div className="mt-14 rounded-card border border-teal-100 bg-teal-50 p-6 md:p-8">
      <h3 className="text-xl font-bold text-teal-900">
        Como funcionam os créditos
      </h3>
      <p className="mt-3 max-w-4xl text-sm leading-relaxed text-ink-soft">
        A assinatura cobre inbox, bot com IA, automações e CRM. Os disparos usam
        créditos para pagar as tarifas da Meta por mensagem entregue. Você pode
        recarregar via Pix, sem cadastrar cartão na Meta. Receber mensagens e
        atender quem procura sua empresa não consome créditos.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-[#EEF2F6] bg-white">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead className="bg-teal-100">
            <tr>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-teal-700">
                Tipo de mensagem
              </th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-teal-700">
                Quando acontece
              </th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-teal-700">
                Custo
              </th>
            </tr>
          </thead>
          <tbody>
            {creditRows.map((row) => (
              <tr key={row.type} className="border-t border-[#EEF2F6]">
                <td className="px-5 py-4 text-sm text-ink">
                  <strong className="block">{row.type}</strong>
                  <span className="text-xs text-ink-faint">{row.category}</span>
                </td>
                <td className="px-5 py-4 text-sm text-ink-soft">{row.when}</td>
                <td className="px-5 py-4 text-sm font-bold text-teal-900">
                  {row.price === "GRÁTIS" ? (
                    <span className="rounded-pill bg-green-100 px-3 py-1 text-xs text-green-700">
                      GRÁTIS
                    </span>
                  ) : (
                    row.price
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-ink-faint">
        Créditos inclusos renovam mensalmente e não acumulam. Recargas avulsas
        via Pix não expiram. Valores sujeitos à tabela vigente da Meta.
      </p>
    </div>
  );
}

/* ─── CTA Final ─────────────────────────────────────────── */
function CtaFinal() {
  return (
    <section id="cta" className="bg-teal-50 py-20 md:py-24">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <MessageCircleMore className="mx-auto mb-4 h-10 w-10 text-teal-500" />
        <h2 className="text-3xl font-bold tracking-tight text-teal-900 md:text-4xl">
          Pronto para ter um time que atende 24h?
        </h2>
        <p className="mt-4 text-base text-ink-soft">
          Configure seu atendimento e comece a vender pelo WhatsApp com mais
          organização, automação e contexto.
        </p>
        <Link
          href="#"
          className="mt-8 inline-flex items-center gap-2 rounded-pill bg-coral px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-coral-hover"
        >
          Começar agora
          <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="mt-5 text-xs text-ink-faint">
          Configuração em 1 dia útil · Cancele quando quiser
        </p>
      </div>
    </section>
  );
}

/* ─── Footer ────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-teal-100 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-8 px-6 md:flex-row">
        <div>
          <Link
            href="#"
            className="font-display text-xl font-extrabold tracking-tight text-teal-900"
          >
            sende<span className="text-teal-500">.</span>
          </Link>
          <p className="mt-2 text-xs leading-relaxed text-ink-faint">
            Atendimento inteligente via WhatsApp
            <br />
            sende.app.br
          </p>
        </div>

        <div className="text-xs leading-relaxed text-ink-faint md:text-right">
          <p>
            Sende é um produto{" "}
            <strong className="font-semibold text-ink-soft">
              GlobalSix Technology
            </strong>
          </p>
          <p>CNPJ 53.843.384/0001-70</p>
          <p>Asa Sul, Brasília – DF, 70200-002</p>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-6xl border-t border-[#EEF2F6] px-6 pt-5 text-center">
        <p className="text-xs text-ink-faint">
          © 2026 GlobalSix Technology · Todos os direitos reservados
        </p>
      </div>
    </footer>
  );
}

/* ─── Page ──────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <SocialProof />
        <Features />
        <HowItWorks />
        <Pricing />
        <CtaFinal />
      </main>
      <Footer />
    </>
  );
}
