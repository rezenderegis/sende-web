import Link from 'next/link'
import Image from 'next/image'
import {
  SprayCan,
  Hammer,
  Sparkles,
  ShieldCheck,
  Wrench,
  Car,
  MessageCircleMore,
  MapPin,
  Phone,
  BadgeCheck,
  Clock3,
} from 'lucide-react'
import { isLandingPageActive } from '@/lib/landing-pages'
import LandingPageUnavailable from '@/components/landing-pages/unavailable'

const WA_NUMBER = '5562999007445'
const WA_LINK = (msg: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`

/* ─── Hero ──────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-16 sm:pt-24">
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/sf-pintura/hero-fachada.jpg"
          alt="Fachada da SF Funilaria e Pintura Automotiva"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/50 to-black/85" />
        <div className="absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full bg-[#F5C451]/10 blur-3xl" />
        <div className="absolute -bottom-40 left-0 h-[380px] w-[380px] rounded-full bg-[#F5C451]/[0.06] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center sm:px-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white/70">
          <Car className="h-3.5 w-3.5 text-[#F5C451]" />
          Funilaria &amp; Pintura Automotiva
        </span>

        <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl">
          Bem-vindo à
          <br />
          <span className="bg-gradient-to-r from-[#F5C451] to-[#D4932A] bg-clip-text text-transparent">
            SF Funilaria e Pintura Automotiva
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/60">
          Oferecemos soluções completas para quem busca restaurar a beleza e a integridade do
          veículo. Atuamos com funilaria, pintura automotiva e polimento cristalizado, garantindo
          resultados de alta qualidade — do retoque mais simples à reparação de grandes danos.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={WA_LINK('Olá! Gostaria de um orçamento na SF Funilaria e Pintura Automotiva.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#F5C451] to-[#D4932A] px-7 py-3.5 text-sm font-bold text-black shadow-lg shadow-[#F5C451]/20 transition-opacity hover:opacity-90"
          >
            Fale no nosso WhatsApp
            <MessageCircleMore className="h-4 w-4" />
          </a>
          <Link
            href="#servicos"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/5"
          >
            Ver serviços
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ─── Serviços ──────────────────────────────────────────── */
const services = [
  {
    icon: Wrench,
    title: 'Funilaria',
    desc: 'Reparo de lataria e estrutura do veículo, do amassado simples à reparação de grandes danos.',
  },
  {
    icon: SprayCan,
    title: 'Pintura Automotiva',
    desc: 'Pintura com acabamento de fábrica, incluindo retoque localizado e pintura completa.',
  },
  {
    icon: Sparkles,
    title: 'Polimento Cristalizado',
    desc: 'Recupera o brilho da pintura e protege a superfície contra desgaste do dia a dia.',
  },
  {
    icon: Hammer,
    title: 'Martelinho de Ouro',
    desc: 'Remove amassados sem precisar repintar, preservando a pintura original do carro.',
  },
  {
    icon: ShieldCheck,
    title: 'Recuperação de Parachoque',
    desc: 'Reparo e repintura de parachoques danificados, com acabamento idêntico ao original.',
  },
]

function Services() {
  return (
    <section id="servicos" className="bg-[#0A0A0A] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="mb-14 max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F5C451]">Serviços</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            O que fazemos
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <div
                key={service.title}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition-colors hover:bg-white/[0.05]"
              >
                <div className="mb-5 inline-flex rounded-2xl bg-[#F5C451]/10 p-3 text-[#F5C451]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-white">{service.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{service.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─── Nossa Oficina ─────────────────────────────────────── */
const diferenciais = [
  { icon: BadgeCheck, text: 'Orçamento sem compromisso' },
  { icon: ShieldCheck, text: 'Garantia nos serviços realizados' },
  { icon: Clock3, text: 'Prazo combinado com você' },
  { icon: Sparkles, text: 'Acabamento de qualidade' },
]

function Oficina() {
  return (
    <section id="oficina" className="bg-black py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F5C451]">
              Nossa Oficina
            </p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Cuidado de verdade com o seu carro
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">
              Trabalhamos pra devolver seu veículo com a mesma qualidade de fábrica — sem
              atalho, sem enrolação. Cada serviço é combinado com você antes de começar.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {diferenciais.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.text}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <Icon className="mb-3 h-5 w-5 text-[#F5C451]" />
                  <p className="text-sm font-semibold text-white/80">{item.text}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-3xl sm:col-span-1 sm:aspect-[4/5]">
            <Image
              src="/sf-pintura/escritorio.jpg"
              alt="Escritório da SF Funilaria e Pintura Automotiva"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-3xl">
            <Image
              src="/sf-pintura/cabine-entrada.jpg"
              alt="Entrada da cabine de pintura da oficina"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-3xl">
            <Image
              src="/sf-pintura/fachada-noite.jpg"
              alt="Fachada da oficina à noite"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Onde Estamos ──────────────────────────────────────── */
function OndeEstamos() {
  return (
    <section id="onde-estamos" className="bg-[#0A0A0A] py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-6 text-center sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F5C451]">
          Onde Estamos
        </p>
        <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Venha nos visitar
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          Peça nossa localização exata e horário de funcionamento direto pelo WhatsApp — te
          mandamos a rota na hora.
        </p>
        <a
          href={WA_LINK('Olá! Qual o endereço da oficina?')}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/5"
        >
          <MapPin className="h-4 w-4 text-[#F5C451]" />
          Pedir localização no WhatsApp
        </a>
      </div>
    </section>
  )
}

/* ─── Contato ───────────────────────────────────────────── */
function Contato() {
  return (
    <section id="contato" className="bg-black py-20 sm:py-24">
      <div className="mx-auto max-w-2xl px-6 text-center sm:px-10">
        <MessageCircleMore className="mx-auto mb-4 h-10 w-10 text-[#F5C451]" />
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Peça seu orçamento agora
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          Fale direto com a gente pelo WhatsApp e receba um orçamento sem compromisso pro seu
          veículo.
        </p>

        <a
          href={WA_LINK('Olá! Gostaria de um orçamento na SF Funilaria e Pintura Automotiva.')}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#F5C451] to-[#D4932A] px-8 py-4 text-sm font-bold text-black shadow-lg shadow-[#F5C451]/20 transition-opacity hover:opacity-90"
        >
          <MessageCircleMore className="h-4 w-4" />
          Fale no nosso WhatsApp
        </a>

        <p className="mt-5 flex items-center justify-center gap-2 text-sm text-white/50">
          <Phone className="h-4 w-4 text-[#F5C451]" />
          (62) 99900-7445
        </p>
      </div>
    </section>
  )
}

/* ─── Page ──────────────────────────────────────────────── */
export default async function SfPinturaPage() {
  if (!(await isLandingPageActive('sf-pintura'))) return <LandingPageUnavailable />

  return (
    <>
      <Hero />
      <Services />
      <Oficina />
      <OndeEstamos />
      <Contato />
    </>
  )
}
