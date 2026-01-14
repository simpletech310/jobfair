import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Job Fair | The Future of Work",
  description: "Video-first job marketplace for modern professionals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${inter.variable} antialiased selection:bg-cyan-500/30 selection:text-cyan-200`}
      >
        <AuthProvider>
          <Navbar />
          <div className="min-h-screen pt-20">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
