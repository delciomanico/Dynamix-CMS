import { BLOG_COMPONENT, BLOG_FIELDS } from '../../common/blog';
import type { SiteSeed } from '../types';

/**
 * Blog de demonstração do próprio Dynamix (projeto `dynamix`, tipo BLOG): serve de artigos de teste
 * para ver a página pública (/blog) e o editor. O corpo é Markdown (títulos, listas, citações, código…).
 */
export const dynamixSeed: SiteSeed = {
  project: 'dynamix',
  name: 'Blog Dynamix',
  description: 'Ideias, novidades e guias sobre conteúdo dinâmico.',
  kind: 'BLOG',
  components: [
    {
      slug: BLOG_COMPONENT, name: 'Artigos', description: 'Artigos do blog, do mais recente para o mais antigo.',
      fields: BLOG_FIELDS.map((f) => ({ ...f })),
      rows: [
        {
          slug: 'bem-vindo-ao-blog', title: 'Bem-vindo ao blog do Dynamix', author: 'Delcio Manico', category: 'Novidades',
          excerpt: 'Cada artigo que lês aqui foi escrito no dashboard e chega à página através da API pública.',
          body: 'Este blog é a melhor demonstração do produto: **não há ficheiros de artigos no código**. Cada texto vive no CMS, como conteúdo de um componente.\n\n## Como funciona\n\nO frontend pede a lista à API pública e desenha a página. Se editares um artigo no dashboard, a alteração aparece aqui *sem novo deploy*.\n\n- Escreves no editor, com pré-visualização\n- Guardas como rascunho\n- Publicas quando estiver pronto\n\n> Mantém o teu frontend. Controla o teu conteúdo.\n\nVamos usar este espaço para partilhar novidades, decisões técnicas e guias.',
        },
        {
          slug: 'como-funciona-um-componente', title: 'Como funciona um componente', author: 'Delcio Manico', category: 'Guias',
          excerpt: 'Um componente descreve os campos de um tipo de conteúdo. A partir dele nascem o formulário e o endpoint público.',
          body: 'Um componente é só uma **lista de campos**: título, texto, imagem, data, referência para outro conteúdo…\n\n## Do componente à API\n\nPara cada componente existe um formulário no dashboard e um endpoint público:\n\n```\nGET /api/v1/public/{projeto}/content/{componente}\n```\n\nSó aparece na API o que estiver **publicado**.\n\n### Tipos de campo\n\n1. Texto e texto longo\n2. Imagem e ficheiro\n3. Número, data e booleano\n4. JSON, para estruturas aninhadas\n\nÉ assim que este blog funciona: um componente com título, resumo, corpo, autor e categoria. Podes ver mais na [página do projeto](https://github.com/delciomanico).',
        },
        {
          slug: 'mantem-o-teu-frontend', title: 'Mantém o teu frontend', author: 'Delcio Manico', category: 'Ideias',
          excerpt: 'Não precisas de reconstruir o site para teres conteúdo dinâmico: basta trocar textos fixos por chamadas à API.',
          body: 'A promessa do Dynamix é simples: **mantém o teu frontend** e ganha controlo sobre o conteúdo.\n\nEm vez de reescreveres o site num CMS monolítico, ligas só as secções que queres tornar editáveis. O resto continua exatamente como está.\n\n---\n\n## Por onde começar\n\n- Escolhe **uma** secção, por exemplo as notícias\n- Cria o componente com os campos de que precisas\n- Troca o texto fixo por um `fetch` à API\n\nDepois é ir crescendo ao teu ritmo.',
        },
        {
          slug: 'escrever-bons-artigos', title: 'Dicas para escrever bons artigos', author: 'Equipa Dynamix', category: 'Escrita',
          excerpt: 'Títulos claros, parágrafos curtos e uma ideia por artigo. Um pequeno guia para quem está a começar.',
          body: 'Escrever online é diferente de escrever em papel. Quem lê está a meio de outras coisas.\n\n## Três regras simples\n\n1. **Um título que promete algo.** Diz ao leitor o que vai ganhar.\n2. **Parágrafos curtos.** Três ou quatro linhas chegam.\n3. **Uma ideia por artigo.** Se tens duas, escreve dois artigos.\n\n> Escreve como falas e depois corta metade.\n\n## Estruturar com títulos\n\nUsa `##` para secções e `###` para subsecções. Ajudam quem lê na diagonal — e quem usa leitores de ecrã.\n\n### Listas\n\n- Servem para itens paralelos\n- Não abuses delas\n- Mistura com parágrafos',
        },
        {
          slug: 'rascunho-de-exemplo', title: 'Artigo longo de exemplo', author: 'Equipa Dynamix', category: 'Testes',
          excerpt: 'Um artigo mais extenso para testar a leitura: títulos, listas, citações, código e ligações.',
          body: 'Este artigo existe para testar como a página lida com **texto longo**.\n\n## Primeira secção\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. *Excepteur sint occaecat* cupidatat non proident.\n\n## Segunda secção\n\n> A simplicidade é a sofisticação máxima.\n\nSunt in culpa qui officia deserunt mollit anim id est laborum. Veja o [repositório](https://github.com/delciomanico) para mais detalhes.\n\n### Código\n\n```\nconst posts = await fetch(`${API}/public/dynamix/content/posts`).then((r) => r.json());\n```\n\n### Lista\n\n- Primeiro ponto\n- Segundo ponto com `código inline`\n- Terceiro ponto\n\n## Conclusão\n\nSe consegues ler isto até ao fim sem esforço, o estilo de leitura está bom.',
        },
      ],
    },
  ],
};
