// Autores do blog. Use a chave no campo `author` do post (ex.: author: fabricio).
export type Author = {
  name: string;
  role: string;
  bio: string;
  avatar?: string;
  linkedin?: string;
};

export const authors: Record<string, Author> = {
  fabricio: {
    name: "Fabricio Rezende",
    role: "Fundador da GlobalSix",
    bio: "Mais de 20 anos em tecnologia, liderando projetos de sistemas sob medida, automação e inteligência artificial para empresas e o setor público.",
    avatar: "",
    linkedin: "",
  },
  equipe: {
    name: "Equipe GlobalSix",
    role: "Tecnologia e Inovação",
    bio: "Conteúdo sobre desenvolvimento de sistemas, inteligência artificial e automação, direto de quem implementa esses projetos no dia a dia.",
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
