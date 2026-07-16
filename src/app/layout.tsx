import type { Metadata } from 'next'
import { Inter, Sora } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/layout/toaster'

const GTM_ID = 'GTM-PTFHPN96'
const GAD_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600'],
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  weight: ['700', '800'],
})

export const metadata: Metadata = {
  title: 'Sende — CRM Conversacional para WhatsApp',
  description: 'Gerencie conversas, broadcasts e automações de WhatsApp em um único lugar.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${sora.variable}`}>
      <body className={inter.className}>
        {/* GTM noscript — deve ficar logo após <body> */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        {/* GTM script — carrega no <head> via next/script */}
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>

        {GAD_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GAD_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GAD_ID}');
              `}
            </Script>
          </>
        )}
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
