"use client";

import { useEffect, useCallback, useState } from "react";
import { PartialBlock } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";

interface EditorProps {
  initialContent?: string;
  onChange: (content: string) => void;
  onReady?: () => void;
}

export default function Editor({ initialContent, onChange, onReady }: EditorProps) {
  const [isReady, setIsReady] = useState(false);

  const editor = useCreateBlockNote({
    initialContent: undefined,
  });

  // Initialize with content once
  useEffect(() => {
    if (editor && initialContent && !isReady) {
      try {
        const blocks = JSON.parse(initialContent) as PartialBlock[];
        editor.replaceBlocks(editor.document, blocks);
      } catch (e) {
        console.log("Starting with empty editor");
      }
      setIsReady(true);
      onReady?.();
    } else if (editor && !initialContent && !isReady) {
      setIsReady(true);
      onReady?.();
    }
  }, [editor, initialContent, isReady, onReady]);

  const handleChange = useCallback(() => {
    if (editor) {
      const blocks = editor.document;
      onChange(JSON.stringify(blocks));
    }
  }, [editor, onChange]);

  return (
    <BlockNoteView
      editor={editor}
      onChange={handleChange}
      theme="light"
    />
  );
}
