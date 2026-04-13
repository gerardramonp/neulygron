"use client";

import { Suspense, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { safeInternalRedirectPath } from "@/lib/auth/safe-redirect";
import { MIXPANEL_EVENTS, trackEvent } from "@/lib/analytics/mixpanel";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postLoginPath = safeInternalRedirectPath(
    searchParams.get("callbackUrl"),
    "/",
  );

  const [formState, setFormState] = useState<LoginInput>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange =
    (field: keyof LoginInput) => (event: ChangeEvent<HTMLInputElement>) => {
      setFormState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse(formState);
    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message ?? "Check the form and try again";
      setError(firstError);
      return;
    }

    setIsSubmitting(true);
    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    trackEvent(MIXPANEL_EVENTS.USER_SIGNED_IN, { provider: "credentials" });

    router.push(postLoginPath);
    router.refresh();
  };

  const handleGoogleSignIn = () => {
    trackEvent(MIXPANEL_EVENTS.USER_SIGNED_IN, { provider: "google" });
    signIn("google", { callbackUrl: postLoginPath });
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Use your credentials or continue with Google.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
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
            autoComplete="current-password"
            required
            value={formState.password}
            onChange={handleChange("password")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>Sign in</span>
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
        Need an account?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <Suspense
        fallback={
          <div className="flex w-full max-w-md items-center justify-center rounded-lg border border-border bg-card p-12 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
