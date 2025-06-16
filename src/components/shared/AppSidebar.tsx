'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Removed useRouter
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  useSidebar, 
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  UserPlus,
  Search,
  MessageSquareText,
  FileText,
  ScrollText,
  // LogOut, // Removed
  Settings as SettingsIcon, 
  Type, 
  Building, 
  Store, 
  DollarSign, 
  // UserCircle, // Removed
  ChevronDown,
  ClipboardList,
} from 'lucide-react';
import { ROUTES, APP_NAME } from '@/lib/constants';
import { Avatar, AvatarFallback } from '@/components/ui/avatar'; 
// import { Button } from '@/components/ui/button'; // No longer needed for DropdownMenuTrigger
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"; // User profile dropdown removed
import { cn } from '@/lib/utils';
// import { useAuth } from '@/contexts/AuthContext'; // User info no longer displayed
// import { signOut } from 'firebase/auth'; // Logout functionality removed
// import { auth } from '@/lib/firebase'; // Logout functionality removed
// import { useToast } from '@/hooks/use-toast'; // Toast for logout removed

const mainNavItems = [
  { href: ROUTES.DASHBOARD, label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
  { href: ROUTES.PATIENT_ENTRY, label: 'নতুন রোগী ভর্তি', icon: UserPlus },
  { href: ROUTES.PATIENT_SEARCH, label: 'রোগী অনুসন্ধান', icon: Search },
  { href: ROUTES.DICTIONARY, label: 'রোগীর তালিকা', icon: Type }, 
  { href: ROUTES.AI_SUMMARY, label: 'AI অভিযোগ সারাংশ', icon: MessageSquareText },
  { href: ROUTES.DAILY_REPORT, label: 'দৈনিক প্রতিবেদন', icon: FileText },
  { href: ROUTES.SLIP_SEARCH, label: 'পেমেন্ট স্লিপ', icon: ScrollText },
];

const managementNavItems = [
  { href: ROUTES.STORE_MANAGEMENT, label: 'ঔষধ ব্যবস্থাপনা', icon: Store, comingSoon: true },
  { href: ROUTES.PERSONAL_EXPENSES, label: 'ব্যক্তিগত খরচ', icon: DollarSign, comingSoon: true },
];

const utilityNavItems = [
  { href: ROUTES.CLINIC_INFORMATION, label: 'ক্লিনিকের তথ্য', icon: Building },
  { href: ROUTES.APP_SETTINGS, label: 'অ্যাপ সেটিংস', icon: SettingsIcon },
];

interface CollapsibleSidebarSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSidebarSection: React.FC<CollapsibleSidebarSectionProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { state: sidebarState } = useSidebar();
  const isSidebarIconOnly = sidebarState === 'collapsed';

  return (
    <div className="w-full">
      <button
        onClick={() => !isSidebarIconOnly && setIsOpen(!isOpen)}
        className={cn(
          "flex items-center w-full p-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          isSidebarIconOnly && "hidden", 
          isOpen && !isSidebarIconOnly && "bg-sidebar-accent/60"
        )}
        aria-expanded={isOpen}
        aria-controls={`section-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <span className="flex-1 text-left">{title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        id={`section-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className={cn(
          "overflow-hidden",
          !isSidebarIconOnly && "transition-all duration-300 ease-in-out",
          isSidebarIconOnly ? "max-h-none opacity-100 mt-1" : (isOpen ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0") 
        )}
      >
        <div className={cn(!isSidebarIconOnly && "pl-2")}>
           {children}
        </div>
      </div>
    </div>
  );
};


export function AppSidebar() {
  const pathname = usePathname();
  // const { user } = useAuth(); // User info no longer displayed
  // const router = useRouter(); // Logout functionality removed
  // const { toast } = useToast(); // Toast for logout removed
  const { state: sidebarState } = useSidebar();
  const isSidebarIconOnly = sidebarState === 'collapsed';

  // const handleLogout = async () => { // Logout functionality removed
  //   try {
  //     await signOut(auth);
  //     toast({ title: 'লগআউট সফল', description: 'আপনাকে লগইন পৃষ্ঠায় পাঠানো হচ্ছে...' });
  //     router.push('/login');
  //   } catch (error) {
  //     console.error("Logout error:", error);
  //     toast({ title: 'লগআউট ত্রুটি', description: 'লগআউট করার সময় একটি সমস্যা হয়েছে।', variant: 'destructive'});
  //   }
  // };

  // const userDisplay = { // User info no longer displayed
  //   name: user?.displayName || user?.email || "ব্যবহারকারী",
  //   email: user?.email || "ইমেইল নেই",
  //   initials: user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U",
  // };


  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4">
        <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2 group">
          <Avatar className="h-10 w-10 rounded-md bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M12.378 1.602a.75.75 0 00-.756 0L3.75 6.172V12h16.5V6.172L12.378 1.602zM3.75 13.5V18a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75v-4.5H3.75zM15 13.5h-3.75v4.5a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75V13.5H15z"/>
            </svg>
          </Avatar>
          <span className="font-headline text-xl font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            {APP_NAME} 
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-grow px-2 space-y-1">
        <CollapsibleSidebarSection title="প্রধান মেনু" defaultOpen>
          <SidebarMenu>
            {mainNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== ROUTES.DASHBOARD && pathname.startsWith(item.href))}
                  tooltip={{ children: item.label, side: 'right', align: 'center' }}
                >
                  <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </CollapsibleSidebarSection>

        <SidebarSeparator className={cn("my-2", isSidebarIconOnly && "hidden")} />
        
        <CollapsibleSidebarSection title="ব্যবস্থাপনা">
          <SidebarMenu>
            {managementNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{ 
                    children: `${item.label}${item.comingSoon ? ' (শীঘ্রই আসছে)' : ''}`, 
                    side: 'right', 
                    align: 'center' 
                  }}
                  disabled={item.comingSoon}
                  className={item.comingSoon ? 'opacity-60 cursor-not-allowed' : ''}
                >
                  <Link href={item.href} onClick={(e) => item.comingSoon && e.preventDefault()}>
                    <item.icon className="h-5 w-5" />
                    <span>
                      {item.label}
                      {item.comingSoon && <span className="text-xs text-sidebar-foreground/70 ml-1 group-data-[collapsible=icon]:hidden">(শীঘ্রই আসছে)</span>}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </CollapsibleSidebarSection>

        <SidebarSeparator className={cn("my-2", isSidebarIconOnly && "hidden")} />

        <CollapsibleSidebarSection title="ইউটিলিটি">
          <SidebarMenu>
            {utilityNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{ children: item.label, side: 'right', align: 'center' }}
                >
                  <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </CollapsibleSidebarSection>
      </SidebarContent>
      <SidebarFooter className="mt-auto p-2 space-y-2">
        {/* User profile and logout dropdown removed */}
        {/* <SidebarSeparator />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start items-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-auto py-2 px-2"
            >
              <Avatar className="h-8 w-8 mr-0 group-data-[collapsible=icon]:mr-0 group-data-[collapsible=icon]:ml-0.5">
                <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-sm">
                  {userDisplay.initials}
                </AvatarFallback>
              </Avatar>
              <div className="ml-2 text-left group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium">{userDisplay.name}</p>
                <p className="text-xs text-sidebar-foreground/70">{userDisplay.email}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56 mb-1 ml-1 bg-popover border-sidebar-border text-popover-foreground">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userDisplay.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userDisplay.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled asChild>
              <Link href="/#profile-placeholder" className="cursor-not-allowed opacity-50"> 
                <UserCircle className="mr-2 h-4 w-4" />
                <span>প্রোফাইল (শীঘ্রই আসছে)</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={ROUTES.APP_SETTINGS} className="cursor-pointer">
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span>সেটিংস</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>লগআউট</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}

        <div className="text-center text-xs text-sidebar-foreground/60 py-1 group-data-[collapsible=icon]:hidden">
          <p>© {new Date().getFullYear()} {APP_NAME}</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
