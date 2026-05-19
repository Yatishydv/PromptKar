import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/auth-context";
import { SystemProvider } from "@/lib/system-context";
import { Toaster } from "react-hot-toast";
import { ThemeWrapper } from "@/components/layout/ThemeWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | PromptKar",
    default: "PromptKar | Discover, Share & Improve AI Prompts",
  },
  description: "The ultimate social platform for AI prompt engineering. Discover, share, and improve your best prompts for ChatGPT, Midjourney, Claude, and more.",
  keywords: [
    "prompt engineering",
    "ai prompt engineering",
    "ai prompts",
    "prompt generator",
    "best ai prompts",
    "prompt engineering course",
    "ai image generator prompts",
    "ai writing prompts"
  ],
  authors: [{ name: "PromptKar Team" }],
  creator: "PromptKar",
  publisher: "PromptKar",
  metadataBase: new URL("https://promptkar.site"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PromptKar | Discover, Share & Improve AI Prompts",
    description: "Join the ultimate community for AI prompt engineering. Share and discover the best prompts for AI models.",
    url: "https://promptkar.site",
    siteName: "PromptKar",
    images: [
      {
        url: "/og-image.png", // Recommended: Create this image in public/
        width: 1200,
        height: 630,
        alt: "PromptKar - AI Prompt Engineering Community",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PromptKar | Discover, Share & Improve AI Prompts",
    description: "Join the ultimate community for AI prompt engineering. Share and discover the best prompts for AI models.",
    images: ["/og-image.png"],
    creator: "@promptkar",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/faviconlogo.png",
    shortcut: "/faviconlogo.png",
    apple: "/faviconlogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <SystemProvider>
            <ThemeWrapper>
              <div className="flex flex-col h-screen bg-slate-50/50 selection:bg-indigo-100 selection:text-indigo-900">
                {/* Top Navigation */}
                <Navbar />
                
                <div className="flex flex-1 overflow-hidden">
                  {/* Sidebar - Hidden on small screens, fixed on large */}
                  <div className="hidden lg:block border-r border-slate-100 bg-white">
                    <Sidebar />
                  </div>

                  {/* Main Scrollable Area */}
                  <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-50/50 scroll-smooth">
                    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-20">
                      {children}
                    </div>
                    <Footer />
                  </main>
                </div>
              </div>
              <Toaster position="top-right" />
            </ThemeWrapper>
          </SystemProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
