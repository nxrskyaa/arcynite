import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-display"
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "Arcynite",
  description: "A colorful Arc Testnet onboarding city with quests, badges, agents, and Arc Flock Rally."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} ${nunito.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
