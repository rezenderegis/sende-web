import type { Metadata } from 'next'
import { Inter, Sora } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/layout/toaster'

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
