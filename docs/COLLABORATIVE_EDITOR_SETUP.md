# Collaborative Text Editor Setup with Convex + BlockNote

A complete guide to adding real-time collaborative text editing to any project using Convex ProseMirror Sync and BlockNote.

## Prerequisites

- Node.js 18+
- A Convex project (run `npm create convex` if you don't have one)
- React 18+ or Next.js 13+

---

## Step 1: Install Dependencies

```bash
npm install @convex-dev/prosemirror-sync @blocknote/core @blocknote/react @blocknote/mantine @mantine/core @mantine/hooks
```

Or with pnpm:
```bash
pnpm add @convex-dev/prosemirror-sync @blocknote/core @blocknote/react @blocknote/mantine @mantine/core @mantine/hooks
```

---

## Step 2: Configure Convex Component

Create or update `convex/convex.config.ts` (must be inside the `convex/` folder):

```typescript
// convex/convex.config.ts
import { defineApp } from "convex/server";
import prosemirrorSync from "@convex-dev/prosemirror-sync/convex.config.js";

const app = defineApp();
app.use(prosemirrorSync);

export default app;
```

---

## Step 3: Create Sync API

Create `convex/prosemirror.ts` to expose the sync API:

```typescript
// convex/prosemirror.ts
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";
import { components } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Create ProsemirrorSync instance
// Use your document table ID type, e.g., Id<"docs"> or just string
const prosemirrorSync = new ProsemirrorSync<Id<"docs">>(
  components.prosemirrorSync
);

// Export the sync API functions
export const {
  getSnapshot,
  submitSnapshot,
  latestVersion,
  getSteps,
  submitSteps,
} = prosemirrorSync.syncApi({
  // Optional: Add authorization checks
  // async checkRead(ctx, docId) {
  //   // Verify user can read this document
  // },
  // async checkWrite(ctx, docId) {
  //   // Verify user can write to this document
  // },
  // async onSnapshot(ctx, docId, snapshot, version) {
  //   // Called when a snapshot is saved (useful for search indexing)
  // },
});

// Export for server-side document creation
export { prosemirrorSync };
```

---

## Step 4: Create the Editor Component

Create a client-side editor component:

```tsx
// components/Editor.tsx
"use client"; // Required for Next.js App Router

import { useBlockNoteSync } from "@convex-dev/prosemirror-sync/blocknote";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useRef } from "react";

interface EditorProps {
  docId: Id<"docs">; // Your document ID type
}

export default function Editor({ docId }: EditorProps) {
  const sync = useBlockNoteSync(api.prosemirror, docId);
  const hasCreatedRef = useRef(false);

  // Create initial document if it doesn't exist
  useEffect(() => {
    if (!sync.isLoading && sync.editor === null && !hasCreatedRef.current) {
      hasCreatedRef.current = true;
      sync.create({ type: "doc", content: [] });
    }
  }, [sync.isLoading, sync.editor, sync]);

  if (sync.isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return sync.editor ? (
    <BlockNoteView editor={sync.editor} theme="light" />
  ) : (
    <div className="min-h-[500px] flex items-center justify-center">
      <p className="text-gray-500">Initializing editor...</p>
    </div>
  );
}
```

---

## Step 5: Configure Next.js (if using Next.js)

Update `next.config.ts` to disable React Strict Mode (required for BlockNote with React 19):

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // BlockNote doesn't support StrictMode with React 19
  reactStrictMode: false,
};

export default nextConfig;
```

---

## Step 6: Use the Editor in Your Page

### Option A: Dynamic Import (Recommended for Next.js)

```tsx
// app/editor/[id]/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

// Dynamic import to avoid SSR issues
const Editor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
  loading: () => <div>Loading editor...</div>,
});

export default function EditorPage() {
  const params = useParams();
  const docId = params.id as Id<"docs">;

  return (
    <div className="container mx-auto p-4">
      <Editor docId={docId} />
    </div>
  );
}
```

### Option B: Direct Import (for non-Next.js)

```tsx
// src/pages/EditorPage.tsx
import Editor from "./components/Editor";

export default function EditorPage({ docId }: { docId: string }) {
  return <Editor docId={docId} />;
}
```

---

## Step 7: Deploy Convex Functions

Run the Convex dev command to deploy your functions and mount the component:

```bash
npx convex dev
```

You should see: `✔ Remounted component prosemirrorSync.`

---

## Optional: Document CRUD Operations

Create documents in your Convex mutations (don't create prosemirror doc here - let the client do it):

```typescript
// convex/docs.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new document (metadata only)
export const createDoc = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const docId = await ctx.db.insert("docs", {
      title: args.title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // The prosemirror document will be created by the client
    // via sync.create() when the editor first loads
    
    return docId;
  },
});

// Get all documents
export const getDocs = query({
  handler: async (ctx) => {
    return await ctx.db.query("docs").order("desc").collect();
  },
});

// Get a single document
export const getDocById = query({
  args: { docId: v.id("docs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.docId);
  },
});
```

---

## Optional: Add Authorization

Add auth checks to protect your documents:

```typescript
// convex/prosemirror.ts
export const {
  getSnapshot,
  submitSnapshot,
  latestVersion,
  getSteps,
  submitSteps,
} = prosemirrorSync.syncApi({
  async checkRead(ctx, docId) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    
    const doc = await ctx.db.get(docId);
    if (!doc) {
      throw new Error("Document not found");
    }
    
    // Add your authorization logic
    // e.g., check if user owns the doc or is in the same org
  },

  async checkWrite(ctx, docId) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    
    // Add write authorization logic
  },

  async onSnapshot(ctx, docId, snapshot, version) {
    // Update document metadata when content changes
    await ctx.db.patch(docId, {
      updatedAt: Date.now(),
    });
  },
});
```

---

## Schema Example

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  docs: defineTable({
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Optional: add owner, orgId, etc. for authorization
    ownerId: v.optional(v.string()),
  }),
});
```

---

## Troubleshooting

### Error: "Child component does not export submitSnapshot"
- **Cause**: `convex.config.ts` is in the wrong location or component not deployed
- **Fix**: Ensure `convex.config.ts` is inside the `convex/` folder, then run `npx convex dev`

### Error: "StrictMode" issues with React 19
- **Cause**: BlockNote doesn't support React 19 StrictMode
- **Fix**: Set `reactStrictMode: false` in `next.config.ts`

### Hydration errors in Next.js
- **Cause**: Server/client mismatch with the editor
- **Fix**: Use `dynamic()` import with `ssr: false`

### Document not syncing
- **Cause**: Document wasn't created in prosemirror sync
- **Fix**: Ensure `sync.create()` is called when `sync.editor === null`

---

## Features Included

| Feature | Status |
|---------|--------|
| Real-time collaboration | ✅ |
| Conflict resolution (OT) | ✅ |
| Persistent storage | ✅ |
| Multiple simultaneous editors | ✅ |
| Rich text formatting | ✅ |
| Undo/Redo | ✅ |

## Features Requiring Additional Setup

| Feature | Notes |
|---------|-------|
| Cursor presence | Requires Yjs awareness or custom implementation |
| Comments | Custom implementation needed |
| Version history | Use prosemirror snapshots/steps data |

---

## Package Versions (Tested)

```json
{
  "@convex-dev/prosemirror-sync": "^0.2.0",
  "@blocknote/core": "^0.46.1",
  "@blocknote/mantine": "^0.46.1",
  "@blocknote/react": "^0.46.1",
  "@mantine/core": "^8.3.12",
  "@mantine/hooks": "^8.3.12",
  "convex": "^1.31.4"
}
```

---

## Resources

- [Convex ProseMirror Sync GitHub](https://github.com/get-convex/prosemirror-sync)
- [BlockNote Documentation](https://www.blocknotejs.org/docs)
- [Convex Documentation](https://docs.convex.dev)
- [Stack Post: Add a Collaborative Editor](https://stack.convex.dev/add-a-collaborative-document-editor-to-your-app)
