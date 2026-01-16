import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google"; // Import fonts
import { Providers } from "../components/providers";
import { Navbar } from "../components/navbar";
import "../styles/globals.css";

// Configure fonts
const outfit = Outfit({ 
  subsets: ["latin"], 
  variable: '--font-outfit',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"], 
  variable: '--font-space-grotesk',
  display: 'swap',
});

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
    <html lang="en" className={`${outfit.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen bg-obsidian-950 font-sans text-white overflow-x-hidden selection:bg-brand-500/30 selection:text-brand-200">
        
        {/* Dynamic Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-obsidian-800 via-obsidian-950 to-obsidian-950 opacity-100"></div>
          
          {/* Floating Orbs - Refined for elegance */}
          <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-brand-600/10 rounded-full blur-[120px] mix-blend-screen animate-float" style={{ animationDuration: '25s' }}></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-accent-600/10 rounded-full blur-[100px] mix-blend-screen animate-float" style={{ animationDuration: '30s', animationDelay: '5s' }}></div>
          <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] bg-electric-500/5 rounded-full blur-[80px] mix-blend-overlay animate-pulse-subtle"></div>
          
          {/* Noise Texture Overlay */}
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          <Providers>
            <Navbar />
            <main className="flex-grow pt-24 px-4 sm:px-6 w-full max-w-[1600px] mx-auto">
              {children}
            </main>
            {/* Optional Footer could go here */}
          </Providers>
        </div>
      </body>
    </html>
  );
}

