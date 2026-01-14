"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/lib/auth";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users } from "lucide-react";

// Dynamically import Editor with SSR disabled
const Editor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[500px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
});

export default function DocEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const docId = params.docsId as Id<"docs">;

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin");
    }
  }, [authLoading, user, router]);

  const doc = useQuery(
    api.docs.getDocById, 
    token ? { docId, token } : "skip"
  );
  const updateTitle = useMutation(api.docs.updateDocTitle);

  const [title, setTitle] = useState("");

  // Initialize title when doc loads
  useEffect(() => {
    if (doc) {
      setTitle(doc.title);
    }
  }, [doc]);

  // Handle title update
  const handleTitleBlur = async () => {
    if (title !== doc?.title && token) {
      await updateTitle({ docId, title, token });
    }
  };

  // Show loading while checking auth
  if (authLoading || !user || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
          </div>
        </div>
      </header>

      {/* Editor */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="min-h-[500px] bg-white dark:bg-zinc-900 rounded-lg border shadow-sm p-4">
          <Editor docId={docId} token={token} />
        </div>
      </main>
    </div>
  );
}

