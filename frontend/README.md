# Prelegal frontend

Next.js (App Router, TypeScript, Tailwind) app for drafting a Common Paper
Mutual NDA: fill in the form, watch the live preview, download a PDF.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
npm run lint
```

The Standard Terms are read at build time from `../templates/Mutual-NDA.md`,
so run commands from this directory inside the repository checkout.

## Layout

- `src/lib/nda.ts` — form data model and helpers that build the cover page content
- `src/lib/terms.ts` — parser for the Standard Terms markdown
- `src/lib/loadStandardTerms.ts` — server-side loader for the template file
- `src/components/NdaCreator.tsx` — client state, download handling
- `src/components/NdaForm.tsx` — the input form
- `src/components/NdaPreview.tsx` — HTML preview of the agreement
- `src/components/NdaPdf.tsx` — `@react-pdf/renderer` version, loaded on demand
