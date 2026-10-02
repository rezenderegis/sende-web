import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowDown,
  Code2,
  Sparkles,
  Compass,
  ExternalLink,
  Search,
  Target,
  Activity,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react'
import GlobalSixNav from '@/components/globalsix/nav'
import GlobalSixFooter from '@/components/globalsix/footer'
import GlobalSixWhatsAppFloat from '@/components/globalsix/whatsapp-float'
import GlobalSixLeadForm from '@/components/globalsix/lead-form'

export const metadata: Metadata = {
  title: 'GlobalSix Technology — Sistemas, IA e o Sende',
  description:
    'GlobalSix é uma empresa de tecnologia especializada em sistemas sob medida, inteligência artificial e consultoria em projetos. Conheça também o Sende, nosso CRM conversacional para WhatsApp.',
}

/* ─── Hero ──────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-16 sm:pt-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#8257E5]/10 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 h-[420px] w-[420px] rounded-full bg-[#8257E5]/[0.07] blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 sm:px-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-1.5 text-xs font-semibold text-black/60">
            <Sparkles className="h-3.5 w-3.5 text-[#8257E5]" />
            Tecnologia · Automação · Inteligência Artificial
          </span>

          <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            <span className="text-black">GlobalSix</span>
            <br />
            <span className="text-[#8257E5]">Technology</span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-black/60">
            Somos uma empresa de tecnologia especializada em oferecer soluções inovadoras para
            impulsionar negócios. Desenvolvemos sistemas e aplicativos sob medida, implementamos
            inteligência artificial, criamos funis de vendas e landing pages, e apoiamos projetos
            tecnológicos com consultoria estratégica — unindo inovação, eficiência e inteligência
            digital.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="#contato"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#8257E5] px-7 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#6f45cc]"
            >
              Agendar diagnóstico gratuito
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#servicos"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-black/15 px-7 py-3.5 text-sm font-semibold text-black/70 transition-colors hover:bg-black/5"
            >
              Ver o que fazemos
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap gap-2">
            {['Sistemas sob medida', 'Inteligência Artificial', 'Landing Pages', 'Funis de Vendas', 'Consultoria'].map(
              (item) => (
                <li
                  key={item}
                  className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-xs font-semibold text-black/70"
                >
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>

        <div className="flex justify-center lg:justify-end">
          <Link
            href="#produtos"
            className="group flex h-56 w-56 shrink-0 flex-col items-center justify-center gap-2 rounded-full bg-[#8257E5] text-center text-white shadow-xl shadow-[#8257E5]/25 transition-transform hover:scale-[1.03] sm:h-64 sm:w-64"
          >
            <span className="text-xl font-bold leading-tight sm:text-2xl">
              Nossos
              <br />
              Produtos
            </span>
            <ArrowDown className="mt-2 h-5 w-5 transition-transform group-hover:translate-y-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ─── Serviços ──────────────────────────────────────────── */
const services = [
  {
    icon: Code2,
    title: 'Desenvolvimento de Sistemas',
    desc: 'Projetamos e desenvolvemos aplicativos móveis, landing pages e sistemas corporativos sob medida. Nossas soluções combinam usabilidade, desempenho e escalabilidade para apoiar o crescimento da sua empresa.',
  },
  {
    icon: Sparkles,
    title: 'Inteligência Artificial',
    desc: 'Desenvolvemos agentes de IA e soluções de automação que aprimoram a tomada de decisões, otimizam fluxos de trabalho e aumentam a eficiência — de chatbots a modelos preditivos.',
  },
  {
    icon: Compass,
    title: 'Consultoria em Projetos',
    desc: 'Apoiamos o planejamento, a estratégia e a execução de projetos tecnológicos, incluindo a estruturação de aplicativos Android e iOS, alinhados aos objetivos do seu negócio.',
  },
]

function Services() {
  return (
    <section id="servicos" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="mb-14 max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8257E5]">Serviços</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-black sm:text-4xl">
            Nossos serviços
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <div
                key={service.title}
                className="rounded-3xl border border-black/5 bg-[#F5F4F2] p-8 transition-shadow hover:shadow-lg hover:shadow-black/5"
              >
                <div className="mb-5 inline-flex rounded-2xl bg-[#8257E5]/10 p-3 text-[#8257E5]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-black">{service.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-black/60">{service.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─── Produtos ──────────────────────────────────────────── */
function Products() {
  return (
    <section id="produtos" className="bg-[#F5F4F2] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="mb-14 max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8257E5]">Produtos</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-black sm:text-4xl">
            Nossos produtos
          </h2>
        </div>

        {/* Sende — carro-chefe */}
        <div className="relative overflow-hidden rounded-3xl bg-black p-8 text-white sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#8257E5]/30 blur-3xl" />
          <span className="relative inline-flex items-center gap-2 rounded-full bg-[#8257E5] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            Principal produto
          </span>
          <h3 className="relative mt-4 font-display text-2xl font-extrabold sm:text-3xl">Sende</h3>
          <p className="relative mt-3 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
            O Sende é o nosso CRM conversacional para WhatsApp: atende clientes com inteligência
            artificial, organiza conversas em um inbox único, dispara campanhas segmentadas e
            automatiza cobrança, recompra e lembretes — tudo isso 24 horas por dia, mesmo quando
            sua equipe não está online.
          </p>
          <Link
            href="/"
            className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-white/90"
          >
            Conhecer o Sende
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <ProductCard
            name="ExpressBot"
            href="https://www.expressbot.com.br"
            desc="Ferramenta de automação para WhatsApp com inteligência artificial que aprende a partir dos materiais da sua empresa para realizar vendas e oferecer atendimento ao cliente, com conversas personalizadas que podem aumentar as conversões em até 70%."
          />
          <ProductCard
            name="Posteter"
            href="https://www.posteter.com.br"
            desc="Aplicativo fácil de usar que permite a empresas locais criar panfletos e posts profissionais em poucos segundos — com modelos prontos, QR Codes e compartilhamento integrado no WhatsApp e Instagram, ajudando a aumentar as vendas em até 30%."
          />
        </div>
      </div>
    </section>
  )
}

function ProductCard({ name, href, desc }: { name: string; href: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white p-8">
      <h3 className="font-display text-lg font-bold text-black">{name}</h3>
      <p className="mt-3 text-sm leading-relaxed text-black/60">{desc}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#8257E5] hover:text-[#6f45cc]"
      >
        {href.replace('https://www.', '')}
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  )
}

/* ─── Números ───────────────────────────────────────────── */
const stats = [
  { label: 'Clientes', value: '+20' },
  { label: 'Projetos', value: '+200' },
  { label: 'Experiência', value: '7 anos' },
  { label: 'Satisfação', value: '100%' },
]

function Stats() {
  return (
    <section id="sobre" className="bg-black py-16 text-white sm:py-20">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-[#B399F0]">
          Sobre nós
        </p>
        <h2 className="mt-3 text-center font-display text-2xl font-extrabold sm:text-3xl">
          Alguns dos nossos números
        </h2>

        <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-4xl font-extrabold text-[#B399F0] sm:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm font-medium text-white/50">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Processo ──────────────────────────────────────────── */
const process = [
  {
    icon: Search,
    title: 'Levantamento de Informações',
    desc: 'Entendemos seu negócio, seus objetivos e os desafios atuais antes de propor qualquer solução.',
  },
  {
    icon: Target,
    title: 'Definição de Indicadores',
    desc: 'Estabelecemos metas claras e mensuráveis para acompanhar o sucesso do projeto desde o início.',
  },
  {
    icon: Activity,
    title: 'Execução e Monitoramento',
    desc: 'Colocamos a solução em prática e acompanhamos os resultados de perto, ajustando o que for preciso.',
  },
]

function Process() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="mb-14 max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8257E5]">Execução</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-black sm:text-4xl">
            Nosso processo
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {process.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="relative pl-14">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#8257E5] text-sm font-bold text-white">
                  {i + 1}
                </div>
                <Icon className="mb-3 h-5 w-5 text-[#8257E5]" />
                <h3 className="font-display text-base font-bold text-black">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-black/60">{step.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─── Contato ───────────────────────────────────────────── */
function Contact() {
  return (
    <section id="contato" className="bg-[#F5F4F2] py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8257E5]">Contato</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-black sm:text-4xl">
            Vamos conversar sobre o seu projeto
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-black/60">
            Preencha o formulário ou fale direto pelo WhatsApp. Agendamos um diagnóstico gratuito
            para entender o seu desafio.
          </p>

          <div className="mt-8 space-y-4">
            <p className="flex items-center gap-3 text-sm text-black/70">
              <Mail className="h-4 w-4 text-[#8257E5]" />
              comercial@globalsix.com
            </p>
            <p className="flex items-center gap-3 text-sm text-black/70">
              <Phone className="h-4 w-4 text-[#8257E5]" />
              +55 61 99276-6811
            </p>
            <p className="flex items-center gap-3 text-sm text-black/70">
              <MapPin className="h-4 w-4 text-[#8257E5]" />
              Brasília-DF, Brasil
            </p>
          </div>
        </div>

        <GlobalSixLeadForm />
      </div>
    </section>
  )
}

/* ─── Page ──────────────────────────────────────────────── */
export default function GlobalSixPage() {
  return (
    <div className="min-h-screen bg-[#F5F4F2] text-black">
      <GlobalSixNav />
      <Hero />
      <Services />
      <Products />
      <Stats />
      <Process />
      <Contact />
      <GlobalSixFooter />
      <GlobalSixWhatsAppFloat />
    </div>
  )
}
