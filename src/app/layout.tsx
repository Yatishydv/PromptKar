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
import { ThemePreviewProvider } from "@/lib/theme-preview-context";

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
    default: "PromptKar | Best AI Prompts & Templates",
  },
  description: "Discover the best AI prompts and templates. PromptKar is the top destination to find, copy, and share high-quality artificial intelligence prompts.",
  keywords: [
    "best AI prompts",
    "AI prompts",
    "buy AI prompts",
    "AI prompt templates",
    "AI prompt generator"
  ],
  authors: [{ name: "PromptKar Team" }],
  creator: "PromptKar",
  publisher: "PromptKar",
  metadataBase: new URL("https://www.promptkar.site"),
  openGraph: {
    title: "PromptKar | Best AI Prompts",
    description: "Discover the best AI prompts and templates. PromptKar is the top destination to find, copy, and share high-quality artificial intelligence prompts.",
    url: "https://www.promptkar.site",
    siteName: "PromptKar",
    images: [
      {
        url: "/og-image.png", // Recommended: Create this image in public/
        width: 1200,
        height: 630,
        alt: "PromptKar - Best AI Prompts",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PromptKar | Best AI Prompts",
    description: "Discover the best AI prompts and templates. PromptKar is the top destination to find, copy, and share high-quality artificial intelligence prompts.",
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
        {/* SEO Hidden Keywords for Class Assignment */}
        <div style={{ display: "none" }} aria-hidden="true">
          <h1>Best AI Prompts</h1>
          <h2>Best AI Prompts Marketplace</h2>
          <p>Best AI Prompts, Best AI Prompts, Best AI Prompts, Best AI Prompts, Best AI Prompts.</p>
          <p>If you are looking for the best AI prompts, you have found the ultimate library of best AI prompts. We offer the best AI prompts for all your needs. Download the best AI prompts today.</p>
        </div>
        <AuthProvider>
          <SystemProvider>
            <ThemePreviewProvider>
            <ThemeWrapper>
              <div className="flex flex-col min-h-screen bg-slate-50/50 selection:bg-indigo-100 selection:text-indigo-900">
                {/* Top Navigation */}
                <Navbar />
                
                <div className="flex flex-1">
                  {/* Sidebar - Hidden on small screens, fixed on large */}
                  <div className="hidden lg:block border-r border-slate-100 bg-card sticky top-[64px] h-[calc(100vh-64px)] overflow-y-auto no-scrollbar">
                    <Sidebar />
                  </div>

                  {/* Main Scrollable Area */}
                  <main className="flex-1 min-w-0 bg-slate-50/50">
                    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-20">
                      {children}
                    </div>
                    <Footer />
                  </main>
                </div>
              </div>
              <Toaster position="top-right" />
            </ThemeWrapper>
            </ThemePreviewProvider>
          </SystemProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
