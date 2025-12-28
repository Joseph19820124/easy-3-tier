# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Build for production
npm run lint     # Run ESLint
npm start        # Start production server
```

## Architecture

This is a 3-tier Todo application:

```
Next.js (Vercel) → Google Apps Script (REST API) → Google Sheets (Database)
```

**Data Flow:**
- Frontend calls `lib/api.ts` functions which POST to the GAS endpoint
- GAS (`gas/Code.gs`) parses the action type and performs CRUD on the Sheet
- All API calls use `Content-Type: text/plain` with JSON body (GAS requirement)

**Key Files:**
- `lib/api.ts` - All backend communication; uses `NEXT_PUBLIC_GAS_URL` env var
- `gas/Code.gs` - Backend logic; `SHEET_ID` constant must match your Google Sheet
- `types/todo.ts` - Shared `Todo` and `ApiResponse<T>` types

**Component Hierarchy:**
```
page.tsx → TodoList (state management) → TodoItem, AddTodo, TodoModal
```

## Features

- **Todo CRUD**: Create, read, update, delete todos
- **Description**: Each todo has optional description field; click todo to open edit modal
- **Due Date**: Optional due date with overdue highlighting (red when past due)
- **Priority**: Three levels (high/medium/low) with color-coded badges
- **Search**: Filter todos by title or description (case-insensitive, real-time)
- **Filter**: View all/active/completed todos
- **Sort**: Sort by newest, oldest, due date, or priority
- **Toggle**: Mark todos complete/incomplete
- **Clear Completed**: Bulk delete all completed todos

**Data Model (Google Sheet columns):**
```
id | title | completed | createdAt | description | dueDate | priority
```

## Environment Setup

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_GAS_URL` to your deployed Google Apps Script Web App URL.

## Google Apps Script Deployment

When modifying `gas/Code.gs`:
1. Deploy as Web App with "Anyone" access
2. After changes, create a new deployment (not edit existing) to get updated URL
3. Update `NEXT_PUBLIC_GAS_URL` if deployment URL changes

**Schema Migration:**
When adding new fields to the data model, run `initializeSheet()` in GAS editor to auto-update missing header columns in Google Sheets.
