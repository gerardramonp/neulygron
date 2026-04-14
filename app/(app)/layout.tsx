import AppNavigation from "@/app/components/AppNavigation";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      <AppNavigation />
      <div className="flex-1 min-h-screen pb-24 md:pb-0 bg-background">
        {children}
      </div>
    </div>
  );
}
