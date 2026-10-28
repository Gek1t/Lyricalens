---
name: dexie-local-first
description: Best practices and code patterns for IndexedDB with Dexie.js in React. Covers reactive state via useLiveQuery, schema versioning and migrations, optimistic offline-first state mutations, and query performance tuning.
---

# Dexie.js Local-First Architecture Guide

## Core Principles
1. **IndexedDB as Single Source of Truth**: UI components bind directly to Dexie via `useLiveQuery`. Do not duplicate database state in global stores (e.g. Redux/Zustand).
2. **Schema & Indexing**:
   - Primary key: `++id` (auto-increment) or `id` (UUID).
   - Compound indices: `[word+status]`, `createdAt`.
3. **Reactive Query Binding**:
   ```typescript
   import { useLiveQuery } from 'dexie-react-hooks';
   import { db } from './db';

   const words = useLiveQuery(() => db.words.orderBy('createdAt').reverse().toArray());
   ```
4. **Offline-First Optimistic Mutations**: Always write to IndexedDB first; background sync processes changes asynchronously.
