# DPI Summit Fieldbook

A private fieldbook for DPI Summit ecosystem mapping with an AI4Inclusion lens.

## Features

- **Dashboard** - Track key metrics and priority actors
- **Actor Management** - Add, filter, and view detailed actor profiles
- **Intelligence Enrichment** - Automated profile enrichment with GPT-4
- **Import** - Parse actors from DPI Summit website
- **Reflection** - Daily reflection prompts for capturing insights
- **Export** - Export to JSON or Markdown for further analysis

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or use the [Vercel web interface](https://vercel.com) to import your GitHub repository.

## Tech Stack

- **Next.js 16** - App Router with TypeScript
- **Tailwind CSS** - Styling
- **React Hot Toast** - Notifications
- **Lucide Icons** - Icons
- **localStorage** - Client-side data persistence

## Data Model

All actor data is stored in the browser's localStorage, ensuring complete privacy and offline functionality. No backend database required.

## Future Enhancements

- Connect to DPI Summit API for real-time actor data
- LLM-powered intelligence extraction
- Collaboration features
- Advanced analytics dashboard

---

Built for tracking ecosystem relationships at the DPI Summit with a focus on AI4Inclusion and AI4X opportunities.
