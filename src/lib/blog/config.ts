// Configurações centrais do blog. Ajuste aqui nome, URL e CTA.
export const blogConfig = {
  siteName: "Sende",
  blogTitle: "Blog Sende",
  description:
    "Atendimento, vendas e automação no WhatsApp: guias práticos, novidades da API oficial e o que está mudando no mercado.",
  // Defina NEXT_PUBLIC_SITE_URL na Vercel (ex.: https://sende.app.br)
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "https://sende.app.br").replace(/\/$/, ""),
  basePath: "/blog",
  locale: "pt_BR",
  cta: {
    title: "Coloque seu WhatsApp para trabalhar por você",
    text: "API oficial da Meta, multiatendimento, campanhas e chatbot com IA em uma só plataforma.",
    label: "Falar com especialista",
    href: "/#cta",
  },
};

export const absoluteUrl = (path = "") => `${blogConfig.siteUrl}${path}`;
