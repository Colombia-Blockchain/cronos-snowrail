import type { Metadata } from "next";
import { Providers } from "../components/providers";
import { Navbar } from "../components/navbar";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Cronos x402 Agentic Treasury",
  description: "Autonomous Agentic Treasury on Cronos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/30 to-slate-950 text-white font-sans">
        <Providers>
          <Navbar />
          <main className="pt-20 w-full">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

