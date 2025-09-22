
import Footer from "@/components/Footer/Footer";
import Header from "@/components/header/Header";
import type { Metadata } from "next";

// import component

export const metadata: Metadata = {
  title: "Dashboard Module",
  description: "Dashboard Module",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
      <Header />
        {children}
      <Footer />  
    </main>
  );
}