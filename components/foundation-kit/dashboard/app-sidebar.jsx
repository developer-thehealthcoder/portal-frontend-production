"use client";

import * as Icons from "lucide-react";
import {
  ArrowLeftRightIcon,
  Check,
  ChevronRight,
  ChevronsUpDown,
  LogOut,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import dynamic from "next/dynamic";
import { use, useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { company } from "@/components/config/company";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axiosInstance from "@/lib/foundation-kit/axiosInstance";
import Cookies from "js-cookie";
import { useTheme } from "next-themes";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../ui/collapsible";
import { Skeleton } from "../../ui/skeleton";
import { SearchForm } from "./search-form";
import useMenu from "./useMenu";
import Link from "next/link";

const UserAvatar = dynamic(
  () =>
    Promise.resolve(({ user }) => (
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarImage
          src={user?.avatar || ""}
          alt={user?.first_name || "User"}
        />
        <AvatarFallback className="rounded-lg">
          {user?.first_name ? user.first_name.charAt(0) : ""}
          {user?.last_name ? user.last_name.charAt(0) : ""}
        </AvatarFallback>
      </Avatar>
    )),
  { ssr: false }
);

const UserProfile = dynamic(
  () =>
    Promise.resolve(({ user, userInstitutions }) => (
      <>
        <UserAvatar user={user} />
        <div className="grid flex-1 text-left text-sm leading-tight">
          <div className="truncate font-semibold">
            {user?.first_name} {user?.last_name}
          </div>
          <div className="truncate text-xs">{user?.email}</div>
          <div className="text-xs text-gray-400">
            {
              userInstitutions?.find(
                (institution) =>
                  institution.id === Cookies.get("selectedInstitution")
              )?.name
            }
          </div>
        </div>
      </>
    )),
  { ssr: false }
);

async function fetchUserInstitutions() {
  try {
    const { data } = await axiosInstance.get(
      "/dashboard/current-user-institutions/"
    );
    return data?.institutions;
  } catch (error) {
    console.error("Error fetching institutions:", error);
    return [];
  }
}
const fetchUserInstitutionsPromise = fetchUserInstitutions();

export function AppSidebar() {
  const { setTheme } = useTheme();
  const { push } = useRouter();
  const userDetails = Cookies.get("userDetails");
  const user = userDetails ? JSON.parse(userDetails) : null;
  const userInstitutions = use(fetchUserInstitutionsPromise);
  const [institutionDropdownOpen, setInstitutionDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const pathname = usePathname();
  const { data: menu, isLoading: isMenuLoading } = useMenu();

  // Add static "Check Logs" link under Automation menu
  const augmentedMenu = useMemo(() => {
    if (!menu) return [];
    return menu.map((item) => {
      if (item.name?.toLowerCase() === "automation") {
        const subMenu = item.sub_menu || [];
        const hasLogs = subMenu.some(
          (sub) => sub.url === "/agent-logs" || sub.name === "Check Logs"
        );
        return {
          ...item,
          sub_menu: hasLogs
            ? subMenu
            : [
                ...subMenu,
                {
                  name: "AI Agent Logs",
                  url: "/agent-logs",
                },
              ],
        };
      }
      return item;
    });
  }, [menu]);

  return (
    <>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white">
                <Image
                  src={company.logo}
                  alt="logo"
                  width={36}
                  height={36}
                  className="rounded-lg shadow-xl"
                />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">{company.name}</span>
                <span className="">{company.description}</span>
              </div>
            </SidebarMenuButton>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SearchForm />
            <SidebarGroupContent>
              <SidebarMenu>
                {isMenuLoading ? (
                  <div className="space-y-2 p-2">
                    <Skeleton className="h-7 w-full" />
                    <div className="ps-4 space-y-2">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  </div>
                ) : menu?.length === 0 ? (
                  <div className="space-y-2 p-2">
                    <div className="font-semibold">No menu found</div>
                    <div className="text-sm">
                      Please contact your administrator to assign a user group
                      to your account.
                    </div>
                  </div>
                ) : (
                  menu?.map((item) => (
                    <Collapsible
                      key={item.name}
                      asChild
                      defaultOpen={true}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.name}>
                            {item.icon &&
                              Icons[item.icon] &&
                              React.createElement(Icons[item.icon])}
                            <span>{item.name}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.sub_menu?.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.name}>
                                <SidebarMenuSubButton
                                  className={`${
                                    pathname === subItem.url
                                      ? "bg-gray-200 dark:bg-gray-700"
                                      : ""
                                  } hover:bg-gray-100 dark:hover:bg-gray-800`}
                                  asChild
                                >
                                  <Link href={subItem.url}>
                                    <span>{subItem.name}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
                  >
                    <UserProfile
                      user={user}
                      userInstitutions={userInstitutions}
                    />
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <UserProfile user={user} />
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userInstitutions?.length > 1 && (
                    <>
                      <DropdownMenuGroup>
                        <DropdownMenu
                          open={institutionDropdownOpen}
                          onOpenChange={setInstitutionDropdownOpen}
                        >
                          <DropdownMenuTrigger asChild>
                            <div className="flex items-center gap-2 ps-2 text-sm py-1.5 cursor-pointer hover:bg-gray-100 hover:dark:bg-gray-800 rounded">
                              <ArrowLeftRightIcon className="h-[1rem] w-[1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                              Switch Institution
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {userInstitutions?.map((institution) => (
                              <DropdownMenuItem
                                key={institution.id}
                                onClick={() => {
                                  Cookies.set(
                                    "selectedInstitution",
                                    institution.id
                                  );
                                  setInstitutionDropdownOpen(false);
                                  push("/");
                                }}
                              >
                                {Cookies.get("selectedInstitution") ===
                                institution.id ? (
                                  <Check />
                                ) : (
                                  <span className="w-4" />
                                )}
                                {institution.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuGroup>
                    <DropdownMenu
                      open={themeDropdownOpen}
                      onOpenChange={setThemeDropdownOpen}
                    >
                      <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-2 ps-2 text-sm py-1.5 cursor-pointer hover:bg-gray-100 hover:dark:bg-gray-800 rounded">
                          <Sun className="h-[1rem] w-[1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-gray-600" />
                          <Moon className="absolute h-[1rem] w-[1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-gray-600" />
                          <span className="sr-only">Toggle theme</span>{" "}
                          Preferences
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setTheme("light");
                            setThemeDropdownOpen(false);
                          }}
                        >
                          Light
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setTheme("dark");
                            setThemeDropdownOpen(false);
                          }}
                        >
                          Dark
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setTheme("system");
                            setThemeDropdownOpen(false);
                          }}
                        >
                          System
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/settings">
                      <Settings />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => {
                      Cookies.remove("accessToken");
                      Cookies.remove("refreshToken");
                      Cookies.remove("tokenType");
                      Cookies.remove("userDetails");
                      Cookies.remove("selectedInstitution");
                      push("/login");
                    }}
                  >
                    <LogOut />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
