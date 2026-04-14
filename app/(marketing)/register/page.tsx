"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";
import { MIXPANEL_EVENTS, trackEvent } from "@/lib/analytics/mixpanel";

export default function RegisterPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<RegisterInput>({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange =
    (field: keyof RegisterInput) => (event: ChangeEvent<HTMLInputElement>) => {
      setFormState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = registerSchema.safeParse(formState);

    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message ?? "Please review the form";
      setError(firstError);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? "Unable to create account");
        return;
      }

      trackEvent(MIXPANEL_EVENTS.USER_SIGNED_UP, { provider: "credentials" });

      const signInResult = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });

      if (!signInResult?.error) {
        trackEvent(MIXPANEL_EVENTS.USER_SIGNED_IN, { provider: "credentials" });
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
    trackEvent(MIXPANEL_EVENTS.USER_SIGNED_UP, { provider: "google" });
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Create an account</h1>
          <p className="text-sm text-muted-foreground">
            Register with your email or continue with Google.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={formState.name}
              onChange={handleChange("name")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={formState.email}
              onChange={handleChange("email")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={formState.password}
              onChange={handleChange("password")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Create account</span>
          </Button>
        </form>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
            <span className="flex-1 border-t border-border" />
            or
            <span className="flex-1 border-t border-border" />
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
          >
            Continue with Google
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
