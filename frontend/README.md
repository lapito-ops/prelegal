# Prelegal frontend

Next.js (App Router, TypeScript, Tailwind) app for drafting Common Paper
agreements: chat with the AI, watch the live preview, download a PDF.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # static export to out/, served by the backend
npm test
npm run lint
```

`../catalog.json` and the Standard Terms in `../templates/` are read at build
time, so run commands from this directory inside the repository checkout.

## Layout

- `src/lib/draft.ts` — draft data model and helpers that build the cover page content
- `src/lib/terms.ts` — parser for the Standard Terms markdown
- `src/lib/loadDocuments.ts` — build-time loader for the catalog and templates
- `src/lib/chat.ts` — client for `POST /api/chat`
- `src/app/page.tsx` — fake login page (any credentials), routes to `/draft/`
- `src/app/draft/page.tsx` — document creator page
- `src/components/DraftCreator.tsx` — client state, download handling
- `src/components/DraftChat.tsx` — AI chat
- `src/components/DraftPreview.tsx` — HTML preview of the agreement
- `src/components/DraftPdf.tsx` — `@react-pdf/renderer` version, loaded on demand
