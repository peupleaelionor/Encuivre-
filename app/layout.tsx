import type { Metadata } from "next";
import "./globals.css";
import { MobileBar, Sidebar } from "@/components/nav";

export const metadata: Metadata = {
  title: "EN CUIVRE OS",
  description:
    "CEO operating system pour le négoce de cuivre et d'alliages : le système se souvient, classe, calcule et alerte — le PDG négocie, décide et signe.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
        <MobileBar />
      </body>
    </html>
  );
}
