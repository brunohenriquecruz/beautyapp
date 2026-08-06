# Beauty App

Aplicativo de gestao para negocios de beleza, construido com Next.js, React e Tailwind CSS.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- npm

## Como rodar

Instale as dependencias:

```bash
npm install
```

Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

Abra:

```text
http://localhost:3000
```

## Scripts

- `npm run dev` - inicia o servidor de desenvolvimento do Next.js
- `npm run build` - gera o build de producao
- `npm run start` - inicia o servidor de producao apos o build
- `npm run format` - executa o formatter configurado

## Estrutura

```text
src/
  app/          Rotas e layout do Next.js App Router
  components/   Componentes reutilizaveis
  context/      Contextos e estado global do app
  data/         Dados mockados
  views/        Telas internas renderizadas pelo app
  App.tsx       Shell principal do aplicativo
  index.css     Estilos globais e entrada do Tailwind
```

## Build

Para validar antes de commitar:

```bash
npm run build
```
