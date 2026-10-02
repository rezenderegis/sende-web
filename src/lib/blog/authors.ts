// Autores do blog. Use a chave no campo `author` do post (ex.: author: fabricio).
export type Author = {
  name: string;
  role: string;
  bio: string;
  avatar?: string; // URL ou caminho em /public. Se vazio, mostra as iniciais.
  linkedin?: string;
};

export const authors: Record<string, Author> = {
  fabricio: {
    name: "Fabricio Rezende",
    role: "Fundador da Sende",
    bio: "Mais de 20 anos em tecnologia e governança de TI no setor público e financeiro. Lidera produtos digitais bancários e fundou a Sende para levar a API oficial do WhatsApp a empresas e órgãos públicos.",
    avatar: "",
    linkedin: "",
  },
  equipe: {
    name: "Equipe Sende",
    role: "Produto e Atendimento",
    bio: "Notícias da plataforma, novidades da API oficial do WhatsApp e boas práticas de quem atende clientes todos os dias.",
  },
};

export const getAuthor = (key?: string): Author => authors[key ?? ""] ?? authors.equipe;

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
