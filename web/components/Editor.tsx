"use client";

import { useBlockNoteSync } from "@convex-dev/prosemirror-sync/blocknote";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useRef } from "react";

interface EditorProps {
  docId: Id<"docs">;
  token: string;
}

export default function Editor({ docId, token }: EditorProps) {
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return sync.editor ? (
    <BlockNoteView editor={sync.editor} theme="light" />
  ) : (
    <div className="min-h-[500px] flex items-center justify-center">
      <p className="text-muted-foreground">Initializing editor...</p>
    </div>
  );
}
