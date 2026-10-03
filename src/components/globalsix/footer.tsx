import { Mail, Phone, MapPin } from 'lucide-react'

export default function GlobalSixFooter() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-14 sm:px-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div className="space-y-3">
            <span className="font-display text-lg font-extrabold text-white">GlobalSix</span>
            <p className="max-w-xs text-sm leading-relaxed text-white/50">
              Sistemas sob medida, inteligência artificial e o{' '}
              <a
                href="https://sende.app.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#B399F0] hover:text-white transition-colors"
              >
                Sende
              </a>
              , nosso CRM conversacional para WhatsApp.
            </p>
          </div>

          <div className="space-y-3 text-sm text-white/50">
            <p className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#8257E5]" />
              comercial@globalsix.com
            </p>
            <p className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#8257E5]" />
              +55 61 99379-6669 · +1 408 675-9015
            </p>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#8257E5]" />
              St. de Clubes Esportivos Sul, Trecho 2, Conj. 32 — Asa Sul, Brasília-DF, 70200-002
            </p>
          </div>

          <div className="space-y-3 text-sm text-white/50">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/30">
              Estados Unidos
            </p>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#8257E5]" />
              10731 Surrey Green Ln, Apt 402 — Matthews, North Carolina, 28105
            </p>
            <p className="text-xs text-white/30">CNPJ 53.843.384/0001-70</p>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/30">
          © {new Date().getFullYear()} GlobalSix Technology. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
