"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Axios } from "@/config/axios";
import { env } from "@/config/env";
import useAuthStore from "@/store/store";
import {
  Bot,
  Building2,
  FolderKanban,
  GalleryVerticalEnd,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  List,
  Minus,
  Plus,
  PlusCircle,
  SettingsIcon,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type * as React from "react";
import { NavUser } from "./nav-user";

// Sidebar Data
const sidebarData = {
  navMain: [

    {
      title: "Subject",
      url: "/dashboard/subjects",
      icon: <FolderKanban size={20} />,
      items: [
        {
          title: "Add Subject",
          url: "/dashboard/subjects",
          icon: <PlusCircle size={16} />,
        },
        {
          title: "All Subjects",
          url: "/dashboard/subjects",
          icon: <List size={16} />,
        },
        {
          title: "Manage Subject",
          url: "/project/manage-project",
          icon: <LayoutGrid size={16} />,
        },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: <SettingsIcon size={20} />,
      items: [
        {
          title: "Account",
          url: "/settings/account-manage",
          icon: <UserCog size={16} />,
        },
        {
          title: "Company Manage",
          url: "/settings/company-manage",
          icon: <Building2 size={16} />,
        },
        {
          title: "Password Manage",
          url: "/settings/password-manage",
          icon: <KeyRound size={16} />,
        },
      ],
    },
    {
      title: "AI Support",
      url: "/dashboard/ai-tutor",
      icon: <Bot size={20} />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname(); // Get the current page path

  const handleSignOut = async () => {
    try {
      const response = await Axios.post(
        `${env.BACKEND_BASE_URL}/api/auth/signout`
      );
      if (response.data.success) {
        logout();
        router.push("/sign-in");
      } else {
        throw new Error("Failed to sign out");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Sidebar {...props}
    className="[&>[data-sidebar=sidebar]]:bg-slate-100
    dark:[&>[data-sidebar=sidebar]]:bg-[#191919]
    [&>[data-sidebar=sidebar]]:text-gray-800
    dark:[&>[data-sidebar=sidebar]]:text-white"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">TaskForge</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <Link
            href="/dashboard"
            className="text-sm px-2 py-2 flex items-center gap-2 dark:bg-[#191919] dark:hover:bg-gray-800"
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarMenu>
            {sidebarData.navMain.map((item, index) => (
              item.items?.length ? (
                <Collapsible
                  key={item.title}
                  defaultOpen={pathname.startsWith(item.url)}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        {item.icon && <span className="mr-2">{item.icon}</span>}
                        {item.title}
                        <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                        <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                            >
                              <a
                                href={subItem.url}
                                className="flex items-center gap-2"
                              >
                                {subItem.icon && <span>{subItem.icon}</span>}
                                {subItem.title}
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <a href={item.url} className="flex items-center gap-2">
                      {item.icon && <span className="mr-2">{item.icon}</span>}
                      {item.title}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: user?.firstName || null,
            email: user?.email || null,
            avatar: user?.avatar || undefined,
          }}
          onSignOut={handleSignOut}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
