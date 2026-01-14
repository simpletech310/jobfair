import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
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
          {/* Navigation Sidebar (Desktop) / Drawer (Mobile) */}
          <div className="flex min-h-screen">
            <Navigation />

            {/* Main Content Area - Offset by sidebar width on desktop */}
            <div className="flex-1 md:ml-64 w-full">
              {children}
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
