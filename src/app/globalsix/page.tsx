import type { Metadata } from 'next'
import GlobalSixLeadForm from '@/components/globalsix/lead-form'

export const metadata: Metadata = {
  title: 'GlobalSix — Diagnóstico gratuito',
  description: 'Sistemas sob medida, automação de TI e o Sende. Agende um diagnóstico gratuito com a GlobalSix.',
}

export default function GlobalSixPage() {
  return (
    <div className="min-h-screen bg-[#F2F2F0] text-black">
      <header className="px-6 py-6 sm:px-10">
        <span className="font-display text-xl font-extrabold text-black">GlobalSix</span>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 pb-20 sm:px-10 lg:grid-cols-2 lg:items-start lg:gap-16">
        <div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl">
            <span className="text-black">GlobalSix</span>
            <br />
            <span className="text-[#8257E5]">Technology</span>
          </h1>

          <p className="mt-6 max-w-md text-sm leading-relaxed text-black/60 sm:text-base">
            Somos uma empresa de tecnologia especializada em desenvolvimento de sistemas sob medida,
            automação de TI e, através do Sende, em CRM conversacional para WhatsApp. Transformamos
            ideias em resultados unindo inovação, eficiência e inteligência digital.
          </p>

          <ul className="mt-8 flex flex-wrap gap-2">
            {['Sistemas sob medida', 'Automação de TI', 'Sende (CRM WhatsApp)'].map((item) => (
              <li
                key={item}
                className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-xs font-semibold text-black/70"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:mt-4">
          <GlobalSixLeadForm />
        </div>
      </main>
    </div>
  )
}
