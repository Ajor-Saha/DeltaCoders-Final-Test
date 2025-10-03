import ThemeProviderWrapper from "@/components/header/ThemeProviderWrapper";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  title: "StudyFlow - AI-Powered Educational Learning Platform",
  description:
    "StudyFlow revolutionizes education with AI-powered personalized learning experiences. Create adaptive learning paths, generate intelligent content, track progress, and get real-time AI assistance for effective and engaging education.",
  keywords: [
    "AI Education",
    "Personalized Learning",
    "Educational Technology",
    "Adaptive Learning",
    "AI Tutoring",
    "StudyFlow",
    "Online Learning",
    "Educational Platform",
    "AI-Generated Content",
    "Learning Analytics",
    "Interactive Learning",
    "Educational AI",
  ],
  openGraph: {
    title: "StudyFlow - AI-Powered Educational Learning Platform",
    description:
      "Transform your learning experience with StudyFlow's AI-driven personalized education platform. Adaptive learning paths, intelligent content generation, and real-time AI assistance.",
    url: "https://study-flow.taskforges.com",
    type: "website",
    images: [
      {
        url: "https://drive.google.com/uc?id=1vmNdUL9q3mmBusgQ15y-td0gXRc_2c5R", // Replace with actual image URL
        width: 1200,
        height: 630,
        alt: "StudyFlow AI-Powered Educational Learning Platform",
      },
    ],
    siteName: "StudyFlow",
  },
  alternates: {
    canonical: "https://study-flow.taskforges.com",
  },
  twitter: {
    card: "summary_large_image",
    site: "@StudyFlow", // Replace with your Twitter handle
    title: "StudyFlow - AI-Powered Educational Learning Platform",
    description:
      "Revolutionize your education with AI-driven personalized learning. Adaptive paths, intelligent content generation, and 24/7 AI tutoring support.",
    images: ["https://drive.google.com/uc?id=1vmNdUL9q3mmBusgQ15y-td0gXRc_2c5R"], // Replace with actual image URL
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          rel="icon"
          href="/icon?<generated>"
          type="image/<generated>"
          sizes="<generated>"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* <ThemeProvider attribute="class" defaultTheme="system" enableSystem> */}
        <ThemeProviderWrapper>
          <main >{children}</main>
          {/* {children} */}
          <Toaster />
        </ThemeProviderWrapper>

        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
