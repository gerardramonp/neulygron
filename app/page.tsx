"use client";

import { useState, type ChangeEvent, type DragEvent, useRef } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function Home() {
  const t = useTranslations("HomePage");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFile = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setFileError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    if (file.type !== "application/pdf") {
      setSelectedFile(null);
      setFileError(t("errors.invalidType"));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setSelectedFile(file);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    processFile(file);
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const nextTarget = event.relatedTarget;
    if (nextTarget && event.currentTarget.contains(nextTarget as Node)) {
      return;
    }
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    processFile(file);
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10 font-sans text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            {t("label")}
          </p>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </header>

        <section className="rounded-xl border border-dashed border-border/70 bg-card/40 p-6">
          <label
            htmlFor="expenses-file"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed bg-background/60 px-6 py-10 text-center transition hover:border-primary hover:bg-background ${isDragging ? "border-primary bg-primary/5" : "border-primary/50"}`}
          >
            <div className="space-y-2">
              <p className="text-base font-medium text-foreground">
                {t("uploadLabel")}
              </p>
              <p className="text-sm text-muted-foreground">{t("uploadHint")}</p>
            </div>
            <span className="text-sm font-semibold text-primary">
              {t("uploadCta")}
            </span>
            <input
              id="expenses-file"
              type="file"
              accept="application/pdf"
              className="sr-only"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </label>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("uploadHelper")}
          </p>

          {fileError ? (
            <p className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {fileError}
            </p>
          ) : null}

          {selectedFile ? (
            <div className="mt-4 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
              <p className="font-medium text-foreground">
                {t("selectedFileLabel")}
              </p>
              <p className="break-all text-muted-foreground">
                {selectedFile.name}
              </p>
            </div>
          ) : null}
        </section>

        {selectedFile ? (
          <Button className="w-full self-start md:w-auto">
            {t("classifyButton")}
          </Button>
        ) : null}
      </div>
    </main>
  );
}
