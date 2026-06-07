# Learning Platform Web

A React + Vite frontend for an online learning platform. The application provides
role-based workspaces for admins, teachers, and students, including course
management, lesson authoring, media asset handling, course enrollment, lesson
playback, and learning progress tracking.

This repository is designed as a practical frontend portfolio project. It shows
how to build a typed React application with routing, authentication, API
integration, reusable UI components, role-aware navigation, and production-ready
static deployment.

## Online Demo

Demo app:

```text
https://learning-platform-web.pages.dev/login
```

Demo accounts:

```text
admin@example.com
teacher@example.com
student@example.com
```

Demo password for all three accounts:

```text
ChangeMe123!
```

These credentials are for the public demo environment only. Do not reuse them in
production or in private deployments. Demo data may be reset periodically.

## Features

- JWT login, registration UI, token persistence, and automatic token refresh
- Protected routes with authenticated workspace access
- Role-aware console for ADMIN, TEACHER, and STUDENT workflows
- Dashboard overview for courses, lessons, users, and media assets
- Course creation, editing, publishing, enrollment, and progress views
- Lesson management with ordering, publishing, markdown content, and media slots
- Media asset library with upload, preview, binding, and signed access URLs
- Student learning experience with course browsing and lesson playback
- Settings overview for profile, system, and media storage metadata
- Reusable component layer built with Radix UI, Tailwind CSS, and lucide icons
- Cloudflare Pages compatible SPA routing via `public/_redirects`

## Tech Stack

- React 19
- TypeScript 6
- Vite 8
- React Router 7
- TanStack Query 5
- Axios
- Tailwind CSS 4
- Radix UI / shadcn-style components
- lucide-react
- Sonner
- ESLint

## Project Structure

```text
src
├── pages          Route-level pages for dashboard, courses, lessons, learning, and settings
├── features       Domain modules for auth, courses, lessons, files, learning, and dashboard
├── components     Shared layout and reusable UI components
├── lib            API client and shared utilities
├── assets         App images and static imports
├── App.tsx        Route definitions and protected-route wiring
└── main.tsx       React application entry point
```

## Local Quick Start

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The app starts on the Vite local URL, usually:

```text
http://localhost:5173
```

By default, local API requests under `/api` are proxied to the backend at:

```text
http://localhost:8080
```

The backend should be running before using authenticated app features.

## Backend API

Backend repository:

```text
https://github.com/lucasxie-dev/learning-platform-backend
```

For local development, the Vite proxy in `vite.config.ts` forwards `/api` to the
Spring Boot backend:

```text
/api -> http://localhost:8080
```

For deployed environments, set `VITE_API_BASE_URL` to the backend origin:

```bash
VITE_API_BASE_URL=https://your-api-domain.example.com
```

When the frontend and backend are hosted on different origins, the backend or
reverse proxy must allow CORS for the frontend origin.

## Available Scripts

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run ESLint:

```bash
npm run lint
```

Preview the production build locally:

```bash
npm run preview
```

## Deployment

The app is a static Vite build and can be deployed to Cloudflare Pages, Netlify,
Vercel, Nginx, or any static hosting service.

Build output:

```text
dist
```

Cloudflare Pages settings:

```text
Build command: npm run build
Build output directory: dist
```

The repository includes `public/_redirects` so direct navigation to SPA routes
such as `/dashboard`, `/courses`, and `/learn/courses/1` can fall back to
`/index.html`.

## Configuration Notes

Production deployments should set:

```bash
VITE_API_BASE_URL=https://your-api-domain.example.com
```

Recommended deployment checks:

- Use HTTPS for both frontend and backend
- Configure backend CORS for the frontend domain
- Keep demo credentials out of private or production deployments
- Disable public registration in controlled demo environments if needed
- Verify media playback URLs include the correct backend public base URL
