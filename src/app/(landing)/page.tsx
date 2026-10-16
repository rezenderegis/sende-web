import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  CheckCircle2,
  Clock3,
  ContactRound,
  Gift,
  Inbox,
  Megaphone,
  MessageCircleMore,
  Percent,
  Smartphone,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import TrialForm from "@/components/landing/trial-form";

/* ─── Hero ──────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pb-20 pt-16 md:pt-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-teal-50 opacity-70 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6 text-center">
        <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-pill border border-teal-100 bg-teal-50 px-4 py-1.5 text-xs font-semibold text-teal-700">
            <Sparkles className="h-3.5 w-3.5" />
            CRM conversacional para WhatsApp
          </span>
          <span className="inline-flex items-center gap-2 rounded-pill border border-teal-900/15 bg-teal-900 px-4 py-1.5 text-xs font-semibold text-white">
            <BadgeCheck className="h-3.5 w-3.5" />
            Meta Business Partner — Tech Provider
          </span>
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-teal-900 md:text-5xl lg:text-6xl">
          Seu <span className="text-teal-500">time de vendas</span> no WhatsApp,
          trabalhando mesmo quando você não está
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-soft">
          O Sende responde clientes com IA, dispara campanhas e organiza seus
          leads 24 horas por dia. Você configura uma vez; ele atende enquanto
          você dorme.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="#cta"
            className="inline-flex items-center gap-2 rounded-pill bg-coral px-7 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-coral-hover"
          >
            COMEÇAR TESTE DE 7 DIAS
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#como-funciona"
            className="inline-flex items-center gap-2 rounded-pill border border-teal-600 px-7 py-3.5 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-50"
          >
            Ver como funciona
          </Link>
        </div>

        <p className="mt-5 text-xs font-medium text-ink-faint">
          Sem cartão de crédito · Configuramos seu número em até 1 dia útil
        </p>
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
    desc: "Responde automaticamente no tom da sua empresa. Você escreve as instruções em português — sem montar fluxograma.",
    stat: "Atendimento 24h",
  },
  {
    icon: Smartphone,
    title: "App para iOS e Android",
    desc: "Seu time atende do celular e você acompanha a operação de onde estiver. Sem depender de computador ligado.",
    stat: "Operação no bolso",
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
            Seis pilares que transformam seu WhatsApp em um canal de vendas que
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
              "Tudo isso também pelo app, no celular do seu time.",
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
const platform = {
  price: "R$ 298",
  period: "/mês",
  desc: "Acesso completo à plataforma: inbox compartilhado, CRM, automações e agente de IA conectado à API oficial do WhatsApp.",
  features: [
    "API oficial do WhatsApp (Meta Business Partner)",
    "App iOS e Android grátis — oferta de lançamento",
    "Inbox compartilhado, CRM e histórico completo",
    "Automações e fluxos guiados com IA",
  ],
  seats: "2 usuários inclusos · adicional R$ 100/mês",
  setup: "Implantação: R$ 800 (opcional, pagamento único)",
};

function Pricing() {
  return (
    <section id="planos" className="bg-white py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-teal-900 md:text-4xl">
            Um plano simples, pago por consumo
          </h2>
          <p className="mt-4 text-base text-ink-soft">
            A mensalidade dá acesso à plataforma. As respostas da IA e as
            mensagens do WhatsApp são pagas à parte, por consumo.
          </p>
        </div>

        <div className="overflow-hidden rounded-card border border-teal-600 bg-white shadow-sende ring-1 ring-teal-600 md:grid md:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-col justify-center bg-teal-900 p-8 text-white md:p-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-200">
              Plataforma
            </p>
            <div className="mt-3 flex items-end gap-1">
              <span className="font-display text-4xl font-extrabold leading-none">
                {platform.price}
              </span>
              <span className="mb-0.5 text-sm text-teal-200">
                {platform.period}
              </span>
            </div>
            <p className="mt-1 text-[11px] font-medium text-teal-200">
              + respostas de IA e créditos de WhatsApp
            </p>
            <p className="mt-4 text-sm leading-relaxed text-teal-50">
              {platform.desc}
            </p>
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-white/10 p-3 text-xs font-semibold text-white">
              <Users className="mt-0.5 h-4 w-4 shrink-0" />
              {platform.seats}
            </div>
            <Link
              href="#cta"
              className="mt-6 block w-full rounded-pill bg-coral py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-coral-hover"
            >
              Testar 7 dias grátis
            </Link>
          </div>

          <div className="flex flex-col justify-center p-8 md:p-10">
            <ul className="space-y-3">
              {platform.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-ink-soft"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-teal-50 p-3 text-xs font-semibold text-teal-800">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0" />
              {platform.setup}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-ink-faint">
          Teste de 7 dias sem cartão. Sem fidelidade, cancele quando quiser.
        </p>

        <AiResponses />
        <Credits />
        <AdditionalServices />
        <ReferralProgram />
      </div>
    </section>
  );
}

/* ─── Respostas de IA ───────────────────────────────────── */
const aiResponseTiers = [
  {
    label: "Incluso no plano",
    amount: "50 / mês",
    price: "Grátis",
    note: "renova todo mês, não acumula",
  },
  {
    label: "Pacote adicional",
    amount: "+1.000",
    price: "R$ 200",
    note: "R$ 0,20 por resposta",
  },
  {
    label: "Pacote adicional",
    amount: "+2.000",
    price: "R$ 300",
    note: "R$ 0,15 por resposta",
  },
  {
    label: "Pacote adicional",
    amount: "+6.000",
    price: "R$ 800",
    note: "R$ 0,13 por resposta",
  },
];

function AiResponses() {
  return (
    <div className="mt-14 rounded-card border border-[#EEF2F6] bg-white p-6 shadow-sende-sm md:p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h3 className="flex items-center gap-2 text-xl font-bold text-teal-900">
          <Bot className="h-5 w-5 text-teal-600" />
          Respostas de IA
        </h3>
        <span className="inline-flex w-fit items-center gap-2 rounded-pill bg-teal-50 px-3.5 py-1.5 text-xs font-semibold text-teal-700">
          <Gift className="h-3.5 w-3.5" />
          50 respostas grátis por mês
        </span>
      </div>

      <p className="mt-3 max-w-4xl text-sm leading-relaxed text-ink-soft">
        Toda conta recebe 50 respostas de IA por mês, sem custo — elas renovam
        mensalmente e não acumulam. Quando acabarem, você recarrega por
        pacote, sem mensalidade adicional.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {aiResponseTiers.map((tier) => (
          <div
            key={tier.label + tier.amount}
            className="rounded-xl border border-[#EEF2F6] bg-teal-50/40 p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-600">
              {tier.label}
            </p>
            <p className="mt-2 font-display text-2xl font-extrabold text-teal-900">
              {tier.amount}
            </p>
            <p className="mt-1 text-sm font-bold text-ink">{tier.price}</p>
            <p className="mt-1 text-xs text-ink-faint">{tier.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Créditos de WhatsApp ──────────────────────────────── */
const creditPackages = [
  { price: "R$ 100", credits: "1.000", service: "1.000", marketing: "125" },
  { price: "R$ 300", credits: "3.200", service: "3.200", marketing: "400" },
  { price: "R$ 800", credits: "8.800", service: "8.800", marketing: "1.100" },
  {
    price: "R$ 2.000",
    credits: "23.000",
    service: "23.000",
    marketing: "2.875",
  },
];

function Credits() {
  return (
    <div className="mt-6 rounded-card border border-teal-100 bg-teal-50 p-6 md:p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h3 className="text-xl font-bold text-teal-900">
          Créditos de WhatsApp
        </h3>
        <span className="inline-flex w-fit items-center gap-2 rounded-pill bg-white px-3.5 py-1.5 text-xs font-semibold text-teal-700">
          <Zap className="h-3.5 w-3.5" />
          Recarga via Pix · créditos não expiram
        </span>
      </div>

      <p className="mt-3 max-w-4xl text-sm leading-relaxed text-ink-soft">
        São os envios tarifados pela Meta. Atendimento, utilidade e
        autenticação consomem 1 crédito por mensagem; marketing consome 8
        créditos. Cada resposta da IA consome 1 resposta de IA (do pacote
        acima) + 1 crédito de WhatsApp.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-[#EEF2F6] bg-white">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead className="bg-teal-100">
            <tr>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-teal-700">
                Pacote
              </th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-teal-700">
                Créditos
              </th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-teal-700">
                Atendimento, utilidade e autenticação
              </th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-teal-700">
                ou disparos de marketing
              </th>
            </tr>
          </thead>
          <tbody>
            {creditPackages.map((pack) => (
              <tr key={pack.price} className="border-t border-[#EEF2F6]">
                <td className="px-5 py-4 font-display text-base font-extrabold text-teal-900">
                  {pack.price}
                </td>
                <td className="px-5 py-4 text-sm text-ink-soft">
                  {pack.credits}
                </td>
                <td className="px-5 py-4 text-sm text-ink-soft">
                  {pack.service}
                </td>
                <td className="px-5 py-4 text-sm text-ink-soft">
                  {pack.marketing}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 max-w-4xl text-xs leading-relaxed text-ink-faint">
        Recarga via Pix, créditos não expiram. Tabela sujeita a revisão
        conforme alterações de tarifa da Meta, com aviso prévio de 30 dias.
      </p>
    </div>
  );
}

/* ─── Serviços adicionais ───────────────────────────────── */
const additionalServices = [
  {
    icon: Megaphone,
    name: "Site + campanha",
    price: "R$ 2.000",
    period: "pagamento único",
    desc: "Site profissional e campanha de aquisição configurada para o seu negócio.",
  },
  {
    icon: Bot,
    name: "Fluxo automatizado com IA",
    price: "R$ 1.500",
    period: "por fluxo",
    desc: "Um novo fluxo guiado, desenhado e configurado pela nossa equipe para o seu caso de uso.",
  },
];

function AdditionalServices() {
  return (
    <div className="mt-6 rounded-card border border-[#EEF2F6] bg-white p-6 shadow-sende-sm md:p-8">
      <h3 className="text-xl font-bold text-teal-900">Serviços adicionais</h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {additionalServices.map((service) => {
          const Icon = service.icon;
          return (
            <div
              key={service.name}
              className="flex items-start gap-3 rounded-xl border border-[#EEF2F6] bg-teal-50/40 p-4"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">{service.name}</p>
                <p className="mt-0.5 font-display text-lg font-extrabold text-teal-900">
                  {service.price}{" "}
                  <span className="text-xs font-medium text-ink-faint">
                    {service.period}
                  </span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                  {service.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Programa de indicação ─────────────────────────────── */
const referralTiers = [
  { label: "1º mês", value: "R$ 100", note: "por cliente indicado" },
  {
    label: "A partir do 2º mês",
    value: "20%",
    note: "da mensalidade — R$ 60/mês",
  },
  { label: "Implantação", value: "20%", note: "R$ 160 por implantação" },
  {
    label: "Serviços adicionais",
    value: "20%",
    note: "R$ 400 no site + campanha · R$ 300 por fluxo",
  },
];

function ReferralProgram() {
  return (
    <div className="mt-6 rounded-card bg-teal-900 p-6 text-white md:p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h3 className="flex items-center gap-2 text-xl font-bold text-white">
          <ContactRound className="h-5 w-5 text-teal-200" />
          Programa de indicação
        </h3>
        <span className="inline-flex w-fit items-center gap-2 rounded-pill bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-teal-50">
          <Percent className="h-3.5 w-3.5" />
          Comissão recorrente
        </span>
      </div>

      <p className="mt-3 max-w-4xl text-sm leading-relaxed text-teal-50">
        Indique o Sende para outro negócio e ganhe comissão enquanto o
        cliente indicado continuar ativo.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {referralTiers.map((tier) => (
          <div key={tier.label} className="rounded-xl bg-white/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-200">
              {tier.label}
            </p>
            <p className="mt-2 font-display text-2xl font-extrabold text-white">
              {tier.value}
            </p>
            <p className="mt-1 text-xs text-teal-100">{tier.note}</p>
          </div>
        ))}
      </div>

      <p className="mt-5 text-xs leading-relaxed text-teal-200">
        Não há comissão sobre créditos de WhatsApp nem sobre respostas de IA.
      </p>
    </div>
  );
}

/* ─── CTA Final ─────────────────────────────────────────── */
function CtaFinal() {
  return (
    <section id="cta" className="bg-teal-50 py-20 md:py-24">
      <div className="mx-auto max-w-lg px-6">
        <div className="text-center">
          <MessageCircleMore className="mx-auto mb-4 h-10 w-10 text-teal-500" />
          <h2 className="text-3xl font-bold tracking-tight text-teal-900 md:text-4xl">
            Comece seu teste de 7 dias
          </h2>
          <p className="mt-4 text-base text-ink-soft">
            Preencha o formulário e nossa equipe conecta seu número e configura o
            primeiro agente de IA com você — em até 1 dia útil. Os 7 dias começam
            a contar quando seu número estiver no ar.
          </p>
        </div>
        <TrialForm />
      </div>
    </section>
  );
}

/* ─── Page ──────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <SocialProof />
      <Features />
      <HowItWorks />
      <Pricing />
      <CtaFinal />
    </>
  );
}
