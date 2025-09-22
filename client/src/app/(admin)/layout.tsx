import { AppSidebar } from "@/components/admin/app-sidebar";
import { BreadcrumbComponent } from "@/components/admin/breadcrump-component";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
      <SidebarProvider >
        <AppSidebar />
        <SidebarInset>
          <BreadcrumbComponent />{" "}
          {/* Now using the Breadcrumb as a client component */}
          {children}
        </SidebarInset>
      </SidebarProvider>
    </main>
  );
}
