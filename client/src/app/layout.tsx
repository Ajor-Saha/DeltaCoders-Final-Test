import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import ThemeProviderWrapper from "@/components/header/ThemeProviderWrapper";

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
  title: "Company Task Management System",
  description:
    "Streamline task assignments, track progress, and improve team productivity with our Company Task Management System. Manage employees, projects, and deadlines efficiently.",
  keywords: [
    "Task Management",
    "Project Tracking",
    "Employee Management",
    "Team Collaboration",
    "Task Automation",
    "Company Workflow",
  ],
  openGraph: {
    title: "Company Task Management System",
    description:
      "Enhance workplace efficiency with our powerful task management system. Assign tasks, monitor deadlines, and optimize productivity effortlessly.",
    url: "https://your-company-task-management.com", // Replace with your actual website URL
    type: "website",
    images: [
      {
        url: "https://your-company-task-management.com/banner.jpg", // Replace with actual image URL
        width: 1200,
        height: 630,
        alt: "Company Task Management System banner",
      },
    ],
    siteName: "Company Task Management",
  },
  alternates: {
    canonical: "https://your-company-task-management.com", // Replace with actual canonical URL
  },
  twitter: {
    card: "summary_large_image",
    site: "@CompanyTaskMgmt", // Replace with your Twitter handle
    title: "Company Task Management System",
    description:
      "Boost productivity with our all-in-one task management system. Track projects, assign tasks, and improve team collaboration.",
    images: ["https://your-company-task-management.com/banner.jpg"], // Replace with actual image URL
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
