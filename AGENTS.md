# beautyapp

React + Next.js + Tailwind CSS project.

## Development Server

Run the Next.js development server with:

```bash
npm run dev
```

The server listens on all interfaces through `next dev -H 0.0.0.0`.

## Project Structure

- `src/app/layout.tsx` - Next.js root layout; imports `src/index.css` and defines app metadata
- `src/app/page.tsx` - Home route; renders the React app shell
- `src/App.tsx` - Primary client application component
- `src/index.css` - Global CSS entrypoint and Tailwind CSS v4 import
- `src/views/` - Internal app screens used by `src/App.tsx`
- `src/components/` - Shared UI components
- `src/context/` - React context providers and hooks
- `src/data/` - Mock data
- `package.json` - Project dependencies and Next.js scripts
- `next.config.ts` - Next.js configuration
- `postcss.config.mjs` - Tailwind CSS v4 PostCSS integration

## Dependencies

- Runtime: Next.js, React 19, and React DOM 19
- Styling: Tailwind CSS v4 with `@tailwindcss/postcss`
- Build tooling: Next.js, TypeScript, and oxfmt

## Styling

This project uses Tailwind CSS v4 through PostCSS. `src/index.css` imports Tailwind with `@import 'tailwindcss';`. Use Tailwind utility classes directly in JSX and put global CSS or Tailwind v4 theme customization in `src/index.css`.

## Code quality

- Use double quotes for strings containing apostrophes (`"We're here to help"`), or escape them in single-quoted strings. An unescaped apostrophe in a single-quoted string breaks the build.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
