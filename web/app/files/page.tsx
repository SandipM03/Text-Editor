"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, FileText, Trash2, LogOut, Users, Copy, Check } from "lucide-react";

export default function FilesPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading, signOut } = useAuth();
  
  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin");
    }
  }, [authLoading, user, router]);

  const docs = useQuery(api.docs.getDocs, token ? { token } : "skip");
  const orgMembers = useQuery(api.auth.getOrgMembers, token ? { token } : "skip");
  const createDoc = useMutation(api.docs.createDoc);
  const deleteDoc = useMutation(api.docs.deleteDoc);

  const [docName, setDocName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreateDoc = async () => {
    if (!docName.trim() || !token) return;
    setIsLoading(true);
    try {
      const docId = await createDoc({ title: docName.trim(), token });
      setDocName("");
      setIsOpen(false);
      router.push(`/files/${docId}`);
    } catch (error) {
      console.error("Failed to create document:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDoc = async (
    e: React.MouseEvent,
    docId: string
  ) => {
    e.stopPropagation();
    if (!token) return;
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        await deleteDoc({ docId: docId as any, token });
      } catch (err: any) {
        alert(err.message || "Failed to delete");
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/signin");
  };

  const handleCopyCode = async () => {
    if (user?.orgCode) {
      await navigator.clipboard.writeText(user.orgCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Show loading while checking auth
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{user.orgName}</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user.name} {user.role === "admin" && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2">Admin</span>}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Team Dialog */}
            <Dialog open={isTeamOpen} onOpenChange={setIsTeamOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Users className="h-4 w-4" />
                  Team ({orgMembers?.length || 0})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Team Members</DialogTitle>
                  <DialogDescription>
                    Share the invite code with others to join your organization
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  {/* Invite Code */}
                  <div className="bg-muted p-4 rounded-lg">
                    <label className="text-sm font-medium text-muted-foreground">
                      Invite Code
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-2xl font-mono font-bold tracking-wider">
                        {user.orgCode}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopyCode}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Members List */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Members
                    </label>
                    <div className="mt-2 space-y-2">
                      {orgMembers?.map((member) => (
                        <div
                          key={member._id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {member.email}
                            </div>
                          </div>
                          <span className="text-xs bg-background px-2 py-1 rounded">
                            {member.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Create Doc Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Document</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="Document name"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateDoc();
                    }}
                    autoFocus
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateDoc}
                    disabled={!docName.trim() || isLoading}
                  >
                    {isLoading ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {docs === undefined ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-2/3"></div>
                  <div className="h-4 bg-muted rounded w-1/3 mt-2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No documents yet</h2>
            <p className="text-muted-foreground mb-4">
              Create your first document to get started
            </p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Document
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map((doc) => (
              <Card
                key={doc._id}
                className="cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => router.push(`/files/${doc._id}`)}
              >
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{doc.title}</CardTitle>
                        <CardDescription>
                          by {doc.creatorName} • {formatDate(doc.updatedAt)}
                          {doc.lastEditorName && doc.lastEditorName !== doc.creatorName && (
                            <span className="block text-xs">
                              Last edited by {doc.lastEditorName}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDeleteDoc(e, doc._id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
