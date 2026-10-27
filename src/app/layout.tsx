import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ComeCorre",
  description: "O que comer neste cardápio, dado o seu treino de hoje e de amanhã.",
  appleWebApp: { capable: true, title: "ComeCorre", statusBarStyle: "default" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1f8a4c" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <main>
          {children}
          <p className="aviso">Orientação geral, não substitui nutricionista ou médico.</p>
        </main>
      </body>
    </html>
  );
}
