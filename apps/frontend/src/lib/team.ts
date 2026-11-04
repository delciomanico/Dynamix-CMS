export interface Member {
  name: string;
  role: string;
  bio: string;
  github?: string;   // username
  linkedin?: string; // URL completo
  stack?: string[];
  photo?: string;    // ex: '/team/delcio.jpg' (colocar em public/team/)
}

export const team: Member[] = [
  { name: 'Delcio Manico', role: 'Developer', bio: 'Criador do Dynamix-CMS: produto, API, dashboard e infraestrutura.', github: 'delciomanico', stack: ['React', 'NestJS', 'PostgreSQL', 'Prisma', 'MinIO', 'Docker'] },
];
