// Configurações centrais do blog da GlobalSix. Ajuste aqui nome, URL e CTA.
export const blogConfig = {
  siteName: "GlobalSix",
  blogTitle: "Blog GlobalSix",
  description:
    "Sistemas sob medida, inteligência artificial e automação: guias práticos pra quem quer tirar um projeto de tecnologia do papel.",
  // Defina NEXT_PUBLIC_GLOBALSIX_SITE_URL na Vercel (ex.: https://www.globalsix.com.br)
  siteUrl: (process.env.NEXT_PUBLIC_GLOBALSIX_SITE_URL || "https://www.globalsix.com.br").replace(/\/$/, ""),
  basePath: "/blog",
  locale: "pt_BR",
  cta: {
    title: "Tem um projeto de tecnologia em mente?",
    text: "Sistemas sob medida, agentes de IA e automação. Agende um diagnóstico gratuito com a GlobalSix.",
    label: "Falar com a GlobalSix",
    href: "/globalsix#contato",
  },
};

export const absoluteUrl = (path = "") => `${blogConfig.siteUrl}${path}`;
