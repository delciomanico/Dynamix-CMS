# Dynamix-CMS --- Visão Geral do Produto e Arquitetura

> **Transformar websites estáticos em websites dinâmicos, sem precisar
> reconstruir o frontend.**

O Dynamix-CMS é uma plataforma de gestão de conteúdos orientada a
projetos. O utilizador mantém o website que já possui, define as
estruturas de conteúdo de que precisa, gere os respetivos dados através
da plataforma e disponibiliza-os ao frontend por meio de uma API
pública.

O produto não pretende ser um construtor de websites nem um CMS
tradicional acoplado a um tema. A sua função é fornecer uma camada de
gestão e distribuição de conteúdos independente da tecnologia utilizada
no frontend.

------------------------------------------------------------------------

## 1. Posicionamento do produto

A comunicação do Dynamix-CMS deve assentar em três ideias:

-   **Keep your website.** Não precisas reconstruir o teu website.
-   **Manage your content.** Regista componentes e gere os conteúdos
    através da plataforma.
-   **Make it dynamic.** Consome os conteúdos através de endpoints
    públicos.

### 1.1 Proposta de valor

O utilizador pode transformar um website inicialmente estático num
website alimentado por conteúdos dinâmicos, sem reescrever o frontend.

O website continua responsável pela apresentação visual. O Dynamix-CMS
passa a ser responsável pela estrutura, gestão, publicação e
disponibilização dos conteúdos.

### 1.2 Princípios do produto

1.  Independência do frontend: a plataforma não deve depender de React,
    Next.js, Vue, Angular ou outra tecnologia específica.
2.  Estruturas personalizadas: cada projeto pode definir os seus
    próprios componentes e campos.
3.  Separação entre conteúdo e apresentação: a plataforma gere dados; o
    website decide como os apresentar.
4.  API-first: os conteúdos publicados devem ser acessíveis através de
    contratos HTTP documentados.
5.  Segurança por projeto: dados, credenciais, domínios e permissões
    devem respeitar o isolamento entre projetos.
6.  Evolução gradual: começar com um monólito modular e evoluir apenas
    quando existir necessidade comprovada.

------------------------------------------------------------------------

## 2. Visão geral do funcionamento

O funcionamento da plataforma assenta em quatro elementos:

1.  **Website:** frontend que o utilizador já possui.
2.  **Componentes:** estruturas que definem os campos e tipos de
    conteúdo que o website espera receber.
3.  **Conteúdos:** registos criados e geridos pelo utilizador com base
    nas estruturas definidas.
4.  **API pública:** interface através da qual o website consulta os
    conteúdos publicados.

### 2.1 Exemplo de utilização

Imagina que uma empresa possui um website desenvolvido em HTML, CSS e
JavaScript. O website apresenta:

-   Uma secção Hero.
-   Uma secção de serviços.
-   Uma secção de projetos.
-   Uma secção de testemunhos.
-   Uma secção de contactos.

Sem um CMS, alterar o título do Hero ou adicionar um serviço pode exigir
alterações ao código ou aos ficheiros do website.

Com o Dynamix-CMS:

  Website                    Dynamix-CMS
  -------------------------- ----------------------------
  Apresenta o Hero           Gere o conteúdo do Hero
  Apresenta os serviços      Regista e gere os serviços
  Apresenta os projetos      Gere os projetos
  Apresenta os testemunhos   Gere os testemunhos

O frontend consulta a API para obter os conteúdos atualizados. Assim, o
utilizador pode alterar e publicar informação sem modificar o código do
website.

### 2.2 Independência tecnológica

O Dynamix-CMS deverá funcionar com qualquer frontend que consiga fazer
pedidos HTTP e interpretar respostas JSON, incluindo:

-   HTML, CSS e JavaScript.
-   React.
-   Next.js.
-   Vue.
-   Angular.
-   Aplicações móveis.
-   Outros sistemas que consumam APIs REST.

A plataforma não precisa de conhecer a tecnologia utilizada para
renderizar os conteúdos.

------------------------------------------------------------------------

## 3. Estrutura funcional da plataforma

A plataforma será organizada em módulos com responsabilidades bem
definidas.

### 3.1 Workspace e Websites

O Workspace é o espaço de trabalho de uma pessoa ou organização. Nele
podem existir vários projetos, cada um associado a um website.

Exemplo:

**Workspace: Monarca**

-   Website institucional.
-   Portfolio pessoal.
-   Website da empresa.
-   Landing page de um produto.

Cada projeto deverá possuir:

-   Nome.
-   Identificador único.
-   Descrição.
-   URL do frontend.
-   Domínios associados.
-   Configuração de CORS.
-   Estado do projeto.
-   Ambientes de desenvolvimento e produção, numa fase adequada.

A separação por projeto é essencial para impedir que conteúdos ou
credenciais de um website sejam utilizados indevidamente por outro.

### 3.2 Component Builder

Este é um dos módulos centrais do produto.

O utilizador cria componentes que representam estruturas de conteúdo
existentes no website. Um componente não é necessariamente um elemento
visual criado dentro do Dynamix-CMS; é uma definição de dados que o
frontend sabe apresentar.

Exemplo de componente: `Hero`.

  Campo         Tipo       Obrigatório
  ------------- ---------- -------------
  title         Text       Sim
  subtitle      Textarea   Não
  image         Image      Não
  button_text   Text       Não
  button_url    URL        Não
  active        Boolean    Sim

Exemplo de componente: `Service`.

  Campo         Tipo        Obrigatório
  ------------- ----------- -------------
  title         Text        Sim
  description   Rich Text   Sim
  icon          Image       Não
  price         Number      Não
  active        Boolean     Sim

#### Tipos de campos iniciais

-   Text.
-   Textarea.
-   Rich Text.
-   Number.
-   Boolean.
-   Image.
-   File.
-   URL.
-   Email.
-   Date.
-   Select.
-   Multi-select.
-   Reference.

Cada campo deverá permitir configurar:

-   Nome apresentado ao utilizador.
-   Identificador técnico (slug ou key).
-   Tipo.
-   Obrigatoriedade.
-   Valor padrão.
-   Descrição ou instruções.
-   Regras de validação.
-   Opções, quando aplicável.

**Decisão arquitetural:** os componentes devem ser estruturas dinâmicas,
e não modelos de dados programados individualmente. Não deve ser
necessário desenvolver um módulo específico para Hero, outro para
Serviços e outro para Projetos. O utilizador define essas estruturas
através da plataforma.

### 3.3 Content Manager

Depois de criar um componente, o utilizador poderá criar e gerir
registos de conteúdo com base nos campos definidos.

Exemplo:

Componente: `Service`

Conteúdos:

1.  Desenvolvimento Web.
2.  Automação Empresarial.
3.  Inteligência Artificial.
4.  Consultoria Tecnológica.

Cada entrada de conteúdo deverá possuir:

-   Identificador.
-   Slug, quando aplicável.
-   Valores dos campos definidos pelo componente.
-   Estado.
-   Data de criação.
-   Data de atualização.
-   Data de publicação.

#### Estados dos conteúdos

-   **Draft:** conteúdo em preparação; não é disponibilizado na API
    pública.
-   **Published:** conteúdo publicado e elegível para consulta pública.
-   **Archived:** conteúdo arquivado e indisponível na API pública.

O utilizador poderá criar, editar, publicar, despublicar e arquivar
conteúdos. A plataforma deverá permitir visualizar os dados antes da
publicação.

### 3.4 Media Library

Biblioteca centralizada para gerir imagens e ficheiros utilizados nos
conteúdos.

Funcionalidades previstas:

-   Upload de imagens.
-   Upload de documentos.
-   Organização por pastas ou coleções.
-   Pesquisa de ficheiros.
-   Pré-visualização de imagens.
-   Informação sobre tamanho, formato e data de upload.
-   Identificação de ficheiros utilizados.
-   Eliminação segura de ficheiros não utilizados.

O armazenamento dos ficheiros deverá ser separado da base de dados.
Poderá ser utilizado MinIO ou outro serviço compatível com S3. A base de
dados guardará os metadados e as referências aos ficheiros.

### 3.5 API Manager

O API Manager disponibiliza os conteúdos publicados aos websites e
aplicações externas.

Cada projeto terá identificadores e endpoints próprios.

Exemplos ilustrativos:

``` http
GET /api/v1/public/{project}/components
```

Consulta os componentes disponibilizados pelo projeto.

``` http
GET /api/v1/public/{project}/content/services
```

Consulta os serviços publicados.

``` http
GET /api/v1/public/{project}/content/services/{slug}
```

Consulta um serviço específico.

``` http
GET /api/v1/public/{project}/content/projects
```

Consulta os projetos publicados.

#### Funcionalidades da API

-   Endpoints públicos de leitura.
-   Respostas em JSON.
-   Filtros.
-   Pesquisa.
-   Paginação.
-   Ordenação.
-   Consulta por slug ou identificador.
-   Cache.
-   Limitação de requisições.
-   Documentação dos endpoints.
-   Respostas e erros consistentes.

A API pública deverá devolver apenas conteúdos publicados e autorizados
para exposição pública. O modelo de permissões deve permitir controlar
quais componentes e conteúdos podem ser consultados publicamente.

#### Exemplo de resposta JSON

``` json
{
  "data": [
    {
      "id": "srv_001",
      "slug": "desenvolvimento-web",
      "title": "Desenvolvimento Web",
      "description": "Criamos soluções digitais.",
      "image": "https://cdn.example.com/service.jpg"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

O frontend não precisa de conhecer a forma como os dados são
armazenados. Precisa apenas de consumir o contrato disponibilizado pela
API.

### 3.6 API Keys e Segurança

Cada projeto deverá possuir credenciais adequadas às operações que
realiza. É fundamental distinguir o acesso público de leitura do acesso
administrativo.

#### Public API

-   Permite consultar conteúdos publicados e autorizados.
-   Não deve exigir uma chave secreta de administração no frontend
    público.
-   Deve respeitar as regras de publicação, visibilidade, CORS e rate
    limiting.

#### Management API

-   Permite operações administrativas, como criar, atualizar, publicar
    ou eliminar conteúdos.
-   Exige autenticação e autorização.
-   Deve verificar as permissões do utilizador e o acesso ao projeto.

#### Funcionalidades de segurança

-   Gestão e revogação de API Keys.
-   Armazenamento seguro de credenciais.
-   Configuração de domínios autorizados.
-   CORS por projeto.
-   Rate limiting.
-   Registo de atividades.
-   Controlo de permissões.
-   Proteção contra acesso entre projetos.
-   Validação dos dados recebidos.

**Regra fundamental:** nunca colocar uma chave secreta de administração
no JavaScript executado no navegador. CORS não substitui autenticação
nem autorização.

### 3.7 Dashboard e Analytics

O Dashboard deverá apresentar uma visão geral do projeto e da utilização
da plataforma.

Indicadores iniciais:

-   Total de componentes.
-   Total de conteúdos.
-   Conteúdos publicados.
-   Conteúdos em rascunho.
-   Requisições à API.
-   Atividade recente.
-   Estado dos serviços.

Numa fase posterior, poderão ser adicionados:

-   Consumo por endpoint.
-   Evolução das requisições.
-   Respostas com erro.
-   Alertas de limites.
-   Utilização de armazenamento.
-   Relatórios por projeto.

------------------------------------------------------------------------

## 4. Arquitetura técnica proposta

### 4.1 Abordagem arquitetural

Para o primeiro lançamento, recomenda-se uma arquitetura de **Monólito
Modular**.

Não há necessidade de começar com microserviços. O produto deve primeiro
validar os seus fluxos, modelo de dados e utilização real. Um monólito
modular permite separar responsabilidades sem introduzir prematuramente
a complexidade operacional de vários serviços independentes.

### 4.2 Stack tecnológica

  Camada                       Tecnologia proposta
  ---------------------------- ----------------------
  Frontend                     Next.js + TypeScript
  Backend                      NestJS
  Base de dados                PostgreSQL
  ORM                          Prisma
  Cache                        Redis
  Armazenamento de ficheiros   MinIO / S3
  Autenticação                 JWT + OAuth Google
  Documentação da API          Swagger / OpenAPI
  Infraestrutura               Docker

Estas tecnologias constituem uma proposta inicial. A escolha final
deverá ser confirmada durante a especificação técnica.

### 4.3 Diagrama lógico

``` text
                         UTILIZADOR
                             |
                             v
                    DYNAMIX-CMS DASHBOARD
                          Next.js
                             |
                             v
                         NESTJS API
                             |
             +---------------+---------------+
             |               |               |
             v               v               v
         AUTH MODULE    CONTENT MODULE    API MODULE
             |               |               |
             |          +----+----+          |
             |          |         |          |
             |          v         v          |
             |     COMPONENTS  CONTENTS      |
             |          |         |          |
             +----------+---------+----------+
                             |
                             v
                         POSTGRESQL
                             |
                       +-----+-----+
                       |           |
                       v           v
                     REDIS       MINIO
                     Cache       Media
                             |
                             v
                      PUBLIC REST API
                             |
                             v
                    WEBSITE DO CLIENTE
```

### 4.4 Organização dos módulos NestJS

``` text
src/
├── auth/
├── users/
├── workspaces/
├── projects/
├── components/
├── contents/
├── media/
├── publishing/
├── public-api/
├── api-keys/
├── domains/
├── analytics/
├── activity-logs/
├── billing/
└── common/
```

Cada módulo deverá possuir responsabilidades próprias, evitando a
mistura de regras de negócio. A estrutura interna de cada módulo poderá
ser organizada em controllers, services, DTOs, entities ou repositories,
conforme as convenções definidas no projeto.

------------------------------------------------------------------------

## 5. Modelo inicial da base de dados

A modelação deve suportar estruturas de conteúdo personalizadas por
projeto.

### 5.1 Entidades principais

  Entidade          Responsabilidade
  ----------------- ---------------------------------------
  User              Utilizadores da plataforma
  Workspace         Espaço de trabalho
  WorkspaceMember   Membros e permissões do Workspace
  Project           Website ou aplicação associada
  Component         Estrutura de conteúdo
  ComponentField    Campos definidos para cada componente
  ContentEntry      Registo de conteúdo
  MediaAsset        Ficheiros e imagens
  ApiKey            Credenciais de integração
  Domain            Domínios associados e autorizados
  ActivityLog       Histórico de atividades
  ApiRequestLog     Estatísticas e registo de requisições

### 5.2 Relações simplificadas

``` text
User
  |
  v
Workspace
  |
  +---- WorkspaceMember
  |
  +---- Project
          |
          +---- Component
          |       |
          |       +---- ComponentField
          |
          +---- ContentEntry
          |
          +---- MediaAsset
          |
          +---- ApiKey
          |
          +---- Domain
```

### 5.3 Conteúdo dinâmico com JSONB

A entidade `ContentEntry` deverá guardar os valores dos campos de forma
flexível, provavelmente utilizando JSONB no PostgreSQL.

Exemplo ilustrativo:

``` json
{
  "title": "Desenvolvimento Web",
  "description": "Criamos soluções digitais.",
  "price": 150000,
  "active": true,
  "image": "media_001"
}
```

Desta forma, quando um utilizador criar um componente com campos
personalizados, não será necessário criar uma tabela física nova para
cada tipo de conteúdo.

A aplicação deverá validar os valores recebidos de acordo com a
definição de campos do componente. A flexibilidade do JSONB não elimina
a necessidade de validação, integridade e controlo de versões das
estruturas.

------------------------------------------------------------------------

## 6. Experiência de utilização e fluxo principal

O fluxo inicial de utilização deverá ser simples:

1.  O utilizador cria uma conta.
2.  Cria um Workspace.
3.  Regista um website ou projeto.
4.  Cria os componentes necessários.
5.  Define os campos de cada componente.
6.  Regista os conteúdos.
7.  Publica os conteúdos.
8.  Consulta a documentação da API.
9.  Integra os endpoints no frontend existente.

### 6.1 Exemplo de integração JavaScript

``` javascript
async function loadServices() {
  const response = await fetch(
    "https://api.dynamix-cms.com/api/v1/public/my-website/content/services"
  );

  if (!response.ok) {
    throw new Error("Não foi possível carregar os serviços.");
  }

  const result = await response.json();

  return result.data;
}
```

O website passa a apresentar os serviços devolvidos pelo Dynamix-CMS.

Quando o utilizador atualizar um serviço na plataforma e publicar as
alterações, o website poderá apresentar os novos dados sem precisar de
modificar o código, respeitando o comportamento de cache configurado.

------------------------------------------------------------------------

## 7. MVP --- Âmbito da primeira versão

Não se recomenda desenvolver todas as funcionalidades de uma só vez. O
primeiro objetivo é provar que o Dynamix-CMS consegue transformar um
website estático num website alimentado por conteúdo dinâmico, sem
reconstruir o frontend.

### 7.1 Prioridades

  Prioridade   Funcionalidade
  ------------ ---------------------------------------
  P0           Registo e autenticação
  P0           Workspace e projetos
  P0           Criação de componentes personalizados
  P0           Definição de campos
  P0           Gestão de conteúdos
  P0           Publicação e despublicação
  P0           API pública REST
  P0           Documentação dos endpoints
  P0           Credenciais administrativas seguras
  P1           Media Library
  P1           CORS e gestão de domínios
  P1           Pesquisa e filtros
  P1           Histórico de atividades
  P2           Analytics avançado
  P2           Colaboração em equipa
  P2           Versionamento de conteúdos
  P2           Planos e faturação

-   **P0:** indispensável para o primeiro produto funcional.
-   **P1:** evolução próxima, após validar o fluxo principal.
-   **P2:** funcionalidades posteriores, conforme procura e necessidades
    reais.

### 7.2 Critério de sucesso do MVP

O MVP estará funcional quando for possível:

1.  Criar um projeto.
2.  Definir um componente com campos personalizados.
3.  Criar conteúdos com base nesse componente.
4.  Publicar esses conteúdos.
5.  Consultá-los através de um endpoint público.
6.  Integrar o endpoint num website externo.
7.  Alterar o conteúdo no Dashboard e verificar a atualização no website
    sem alterar o frontend.

------------------------------------------------------------------------

## 8. Funcionalidade diferenciadora: Integration Guide

O **Integration Guide** deverá ajudar o utilizador a ligar os conteúdos
geridos no Dynamix-CMS ao website existente.

Depois de criar um componente, por exemplo `Services`, a plataforma
poderá gerar automaticamente:

-   URL do endpoint.
-   Exemplo de resposta JSON.
-   Exemplos de integração em JavaScript.
-   Exemplos para React.
-   Exemplos para Next.js.
-   Instruções para integrar o componente no website.
-   Informação sobre filtros, paginação e parâmetros disponíveis.

Numa fase posterior, esta funcionalidade poderá evoluir para geração
automática de SDKs.

O objetivo é reduzir a dificuldade de integração, sobretudo para
utilizadores que não desenvolveram originalmente a plataforma.

------------------------------------------------------------------------

## 9. Decisões de produto e arquitetura

As seguintes decisões são recomendações iniciais e deverão ser
confirmadas durante a especificação funcional e técnica.

  -----------------------------------------------------------------------
  Questão                             Recomendação
  ----------------------------------- -----------------------------------
  Vários websites por utilizador?     Sim

  Vários utilizadores por Workspace?  Sim, com permissões

  Componentes personalizados?         Sim

  Campos personalizados?              Sim

  Conteúdos armazenados em JSONB?     Sim, com validação

  API pública sem autenticação?       Sim, apenas leitura de conteúdos
                                      publicados e autorizados

  API administrativa protegida?       Sim

  Suporte a imagens e ficheiros?      Sim

  Multi-idioma?                       Preparar a arquitetura e
                                      implementar posteriormente

  Versionamento de conteúdos?         Fase posterior

  Microserviços desde o início?       Não; começar com monólito modular
  -----------------------------------------------------------------------

### 9.1 Separação entre componente de conteúdo e componente visual

Esta distinção é fundamental.

O utilizador não deve ser obrigado a criar componentes visuais dentro do
Dynamix-CMS. O frontend já existe e continua a ser responsável pela
apresentação.

Exemplo:

-   No frontend React existe um componente visual chamado `HeroSection`.
-   No Dynamix-CMS existe uma estrutura de conteúdo chamada `Hero`.
-   O frontend consulta o endpoint correspondente.
-   Os dados devolvidos são utilizados pelo `HeroSection` para
    renderizar a página.

A ligação entre os dois é feita através do contrato da API, não através
de dependência direta entre os códigos.

------------------------------------------------------------------------

## 10. Etapas de desenvolvimento

O desenvolvimento deverá ser dividido em quatro grandes etapas.

### Etapa 1 --- Product Definition

Definir:

-   Requisitos funcionais e não funcionais.
-   Regras de negócio.
-   Casos de utilização.
-   Perfis de utilizador.
-   Permissões.
-   Fluxos principais.
-   Critérios de aceitação.
-   Limites do MVP.

**Resultado esperado:** especificação funcional aprovada.

### Etapa 2 --- Database & Backend Architecture

Definir:

-   Modelo de dados.
-   Entidades e relações.
-   Estratégia de armazenamento dinâmico.
-   Contratos da API.
-   Autenticação e autorização.
-   Isolamento entre Workspaces e projetos.
-   Organização dos módulos NestJS.
-   Estratégia de cache.
-   Segurança e validação.

**Resultado esperado:** arquitetura técnica e contratos de API
documentados.

### Etapa 3 --- Dashboard & Frontend

Desenvolver:

-   Autenticação.
-   Workspaces e projetos.
-   Component Builder.
-   Content Manager.
-   Publicação.
-   API Manager.
-   Documentação e Integration Guide.

**Resultado esperado:** Dashboard funcional para gerir conteúdos e
projetos.

### Etapa 4 --- Integration & Testing

Realizar:

-   Integração com um website real.
-   Testes dos endpoints.
-   Testes de publicação e despublicação.
-   Testes de permissões e isolamento.
-   Testes de segurança.
-   Testes de desempenho.
-   Verificação do comportamento de cache.

**Resultado esperado:** MVP validado com um frontend externo.

------------------------------------------------------------------------

## 11. Próximos passos

Antes de começar a programar, é necessário transformar esta visão numa
especificação funcional completa.

A primeira parte deverá aprofundar o modelo de Workspace, Project,
Component e ContentEntry, porque estas entidades sustentam praticamente
todo o produto.

Ordem recomendada:

1.  Definir os perfis de utilizador e permissões.
2.  Definir o ciclo de vida de Workspace e Project.
3.  Especificar o Component Builder e os tipos de campos.
4.  Especificar o Content Manager e o processo de publicação.
5.  Definir os contratos da API pública e administrativa.
6.  Modelar a base de dados.
7.  Definir os critérios de aceitação do MVP.

> **Princípio orientador:** o Dynamix-CMS não constrói o website do
> utilizador. Dá-lhe uma forma de gerir os dados que o website
> apresenta, mantendo o frontend independente e disponibilizando os
> conteúdos através de uma API.
