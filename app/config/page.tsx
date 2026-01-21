import { useTranslations } from "next-intl";

export default function ConfigPage() {
  const t = useTranslations("ConfigPage");

  return (
    <main className="min-h-screen bg-background text-foreground font-sans px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            {t("label")}
          </p>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </header>

        <div className="rounded-2xl border border-border bg-card p-6 text-card-foreground">
          <p className="text-sm text-muted-foreground">{t("placeholder")}</p>
        </div>
      </div>
    </main>
  );
}
