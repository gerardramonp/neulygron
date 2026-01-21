import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("HomePage");

  return (
    <main className="min-h-screen bg-background text-foreground font-sans px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            This page demonstrates Tailwind utilities mapped to CSS variables
            that switch with light/dark.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card text-card-foreground p-6">
            <h2 className="font-semibold mb-2">Card surface</h2>
            <p className="text-sm text-muted-foreground">
              Uses <span className="font-mono">bg-card</span>,
              <span className="font-mono">text-card-foreground</span>, and
              <span className="font-mono">border-border</span>.
            </p>
          </div>

          <div className="rounded-lg p-6 bg-muted border border-border">
            <h2 className="font-semibold mb-2">Muted block</h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono">bg-muted</span> and
              <span className="font-mono">text-muted-foreground</span> for
              secondary content.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-md bg-primary text-primary-foreground px-3 py-2 hover:opacity-90">
              Primary
            </button>
            <button className="rounded-md bg-secondary text-secondary-foreground px-3 py-2 hover:opacity-90">
              Secondary
            </button>
            <button className="rounded-md bg-accent text-accent-foreground px-3 py-2 hover:opacity-90">
              Accent
            </button>
            <button className="rounded-md bg-destructive text-destructive-foreground px-3 py-2 hover:opacity-90">
              Destructive
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Form controls</h2>
          <div className="space-y-2">
            <label className="text-sm">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </section>

        <footer className="text-xs text-muted-foreground">
          Toggle theme using the switch in the corner.
        </footer>
      </div>
    </main>
  );
}
