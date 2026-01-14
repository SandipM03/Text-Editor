"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Building2, Users } from "lucide-react";

type SignupMode = "choose" | "create-org" | "join-org";

export default function SignUpPage() {
  const router = useRouter();
  const { signUpWithOrg, signUpJoinOrg, user, isLoading } = useAuth();
  const [mode, setMode] = useState<SignupMode>("choose");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push("/files");
    }
  }, [isLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "create-org") {
        if (!orgName.trim()) {
          setError("Organization name is required");
          setIsSubmitting(false);
          return;
        }
        await signUpWithOrg(email, name, password, orgName);
      } else if (mode === "join-org") {
        if (!orgCode.trim()) {
          setError("Organization code is required");
          setIsSubmitting(false);
          return;
        }
        await signUpJoinOrg(email, name, password, orgCode);
      }
      router.push("/files");
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mode === "choose") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Get Started</CardTitle>
            <CardDescription>
              Create a new organization or join an existing one
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex items-center gap-4"
              onClick={() => setMode("create-org")}
            >
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Create Organization</div>
                <div className="text-sm text-muted-foreground">
                  Start a new team and invite others
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex items-center gap-4"
              onClick={() => setMode("join-org")}
            >
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Join Organization</div>
                <div className="text-sm text-muted-foreground">
                  I have an invite code from my team
                </div>
              </div>
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/signin" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              {mode === "create-org" ? (
                <Building2 className="h-6 w-6 text-primary" />
              ) : (
                <Users className="h-6 w-6 text-primary" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl">
            {mode === "create-org" ? "Create Organization" : "Join Organization"}
          </CardTitle>
          <CardDescription>
            {mode === "create-org"
              ? "Set up your team workspace"
              : "Join your team's workspace"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            
            {mode === "create-org" ? (
              <div className="space-y-2">
                <label htmlFor="orgName" className="text-sm font-medium">
                  Organization Name
                </label>
                <Input
                  id="orgName"
                  type="text"
                  placeholder="My Team"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label htmlFor="orgCode" className="text-sm font-medium">
                  Organization Code
                </label>
                <Input
                  id="orgCode"
                  type="text"
                  placeholder="ABC123"
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                  required
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  Get this code from your team admin
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Your Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Sign Up"}
            </Button>
            <div className="flex items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
              <span className="text-muted-foreground">|</span>
              <Link href="/signin" className="text-primary hover:underline">
                Already have an account?
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
