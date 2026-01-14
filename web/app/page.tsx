import Link from "next/link";
import { FileText, Users, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            Collaborative Docs
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Create and edit documents in real-time with your team. 
            Experience seamless collaboration with our powerful text editor.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-8 py-4 text-lg font-semibold text-primary hover:bg-primary/10 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-card rounded-xl p-6 shadow-sm border">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Collaboration</h3>
            <p className="text-muted-foreground">
              Multiple users can edit the same document simultaneously. 
              Changes sync instantly across all connected users.
            </p>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-sm border">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Rich Text Editing</h3>
            <p className="text-muted-foreground">
              Powered by BlockNote editor with support for headings, lists, 
              code blocks, and more.
            </p>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-sm border">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Auto-Save</h3>
            <p className="text-muted-foreground">
              Never lose your work. Documents are automatically saved 
              as you type with real-time sync to the cloud.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Ready to start collaborating?
          </p>
          <Link
            href="/signup"
            className="text-primary font-semibold hover:underline"
          >
            Create an account →
          </Link>
        </div>
      </div>
    </div>
  );
}
