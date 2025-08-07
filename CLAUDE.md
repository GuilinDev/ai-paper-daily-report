# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
npm install        # Install dependencies
npm run dev        # Start development server (Vite)
npm run build      # Build for production
npm run lint       # Run ESLint
npm run preview    # Preview production build

# Supabase Edge Functions deployment
supabase functions deploy send-email
supabase functions deploy arxiv-proxy
supabase functions deploy test-email
```

## Architecture Overview

This is an AI Paper Daily Report system that automatically fetches, analyzes, and distributes research papers from arXiv. The system consists of three main layers:

1. **Frontend**: React + TypeScript + Tailwind CSS SPA with routing
   - `/` - Public homepage for subscriptions
   - `/admin` - Admin panel with Supabase auth

2. **Backend Services**: 
   - **Supabase**: PostgreSQL database + authentication + Edge Functions
   - **Netlify Functions**: Alternative serverless functions for daily tasks
   
3. **External APIs**:
   - **ArXiv API**: Paper data source (proxied through Supabase Edge Functions)
   - **Google Gemini API**: AI analysis and summarization
   - **Email Services**: Resend/SendGrid/Mailjet for distribution

## Key Service Pipeline

The daily task follows this critical flow:

```
ArxivService.fetchPapers() → GeminiService.analyzeAndFilter() → EmailService.sendReport()
```

- **ArxivService** (`src/services/arxiv.ts`): Fetches papers via Supabase proxy at `/functions/v1/arxiv-proxy`
- **GeminiService** (`src/services/gemini.ts`): Batch processes papers (5 per batch) with Gemini 2.5 Flash model
- **EmailService** (`src/services/email.ts`): Sends via Supabase proxy at `/functions/v1/send-email`

All services use singleton pattern with `getInstance()` methods and require configuration passed from AdminPanel component.

## Database Structure

Core tables (defined in `supabase/migrations/`):
- **papers**: Stores analyzed papers with AI relevance scores
- **daily_reports**: Generated report content
- **subscribers**: Email list with active status
- **config**: System configuration key-value pairs

All tables have RLS enabled with policies for anonymous read and authenticated write.

## Environment Configuration

Required environment variables:
```bash
VITE_SUPABASE_URL=<your_supabase_url>
VITE_SUPABASE_ANON_KEY=<your_anon_key>
```

API keys for Gemini and email services are stored in the database config table and managed through the admin panel.

## Deployment

**Netlify** (Frontend + Functions):
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- API routes redirect from `/api/*` to `/.netlify/functions/*`

**Supabase Edge Functions**:
```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy
```

## Important Architectural Patterns

1. **Proxy Pattern**: All external API calls go through Supabase Edge Functions to handle CORS and authentication
2. **Batch Processing**: Gemini processes papers in batches of 5 with 1-second delays to respect rate limits
3. **Fallback Mechanisms**: Email service has simulation mode when domain verification fails
4. **State Management**: Admin panel manages all configuration state and passes it down to services