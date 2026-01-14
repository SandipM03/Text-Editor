"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Users } from "lucide-react";

// Dynamically import Editor with SSR disabled
const Editor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[500px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
});

// Debounce hook for auto-saving
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function DocEditorPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.docsId as Id<"docs">;

  const doc = useQuery(api.docs.getDocById, { docId });
  const updateContent = useMutation(api.docs.updateDocContent);
  const updateTitle = useMutation(api.docs.updateDocTitle);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Initialize title when doc loads
  useEffect(() => {
    if (doc) {
      setTitle(doc.title);
    }
  }, [doc]);

  // Handle content changes from editor
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  // Debounced content for auto-save
  const debouncedContent = useDebounce(content, 1000);

  // Track last saved content to prevent infinite loop
  const [lastSavedContent, setLastSavedContent] = useState<string | null>(null);

  // Auto-save content
  useEffect(() => {
    // Only save if content is different from what we last saved
    if (
      debouncedContent &&
      isEditorReady &&
      doc &&
      debouncedContent !== lastSavedContent
    ) {
      const saveContent = async () => {
        setIsSaving(true);
        try {
          await updateContent({
            docId,
            content: debouncedContent,
          });
          setLastSavedContent(debouncedContent);
          setLastSaved(new Date());
        } catch (error) {
          console.error("Failed to save:", error);
        } finally {
          setIsSaving(false);
        }
      };
      saveContent();
    }
  }, [debouncedContent, docId, updateContent, isEditorReady, doc, lastSavedContent]);

  // Handle title update
  const handleTitleBlur = async () => {
    if (title !== doc?.title) {
      await updateTitle({ docId, title });
    }
  };

  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/files")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="text-xl font-semibold border-none shadow-none focus-visible:ring-0 w-auto"
              placeholder="Untitled Document"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Collaborative</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {isSaving ? (
                <span className="flex items-center gap-1">
                  <Save className="h-4 w-4 animate-pulse" />
                  Saving...
                </span>
              ) : lastSaved ? (
                <span>Saved</span>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Editor */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="min-h-[500px] bg-white dark:bg-zinc-900 rounded-lg border shadow-sm">
          <Editor
            initialContent={doc.content || undefined}
            onChange={handleContentChange}
            onReady={() => setIsEditorReady(true)}
          />
        </div>
      </main>
    </div>
  );
}

