
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation'; // useRouter might still be used for other nav
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
  ChevronDown,
  Home,
  UserPlus,
  Search,
  ListChecks,
  MessageSquareText,
  FileText,
  ScrollText,
  Archive,
  DollarSign,
  Building2,
  Settings,
  // LogIn, LogOut, UserCircle, // Removed auth-related icons
} from 'lucide-react';
import { ROUTES, APP_NAME } from '@/lib/constants';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
// Auth-related imports are no longer needed here
// import { useAuth } from '@/contexts/AuthContext';
// import { auth } from '@/lib/firebase';
// import { signOut } from 'firebase/auth';
// import { Button } from '@/components/ui/button';
// import { useToast } from '@/hooks/use-toast';

const mainNavItems = [
  { href: ROUTES.DASHBOARD, label: 'ড্যাশবোর্ড', icon: Home, theme: 'theme6' },
  { href: ROUTES.PATIENT_ENTRY, label: 'নতুন রোগী ভর্তি', icon: UserPlus, theme: 'theme1' },
  { href: ROUTES.PATIENT_SEARCH, label: 'রোগী অনুসন্ধান', icon: Search, theme: 'theme2' },
  { href: ROUTES.DICTIONARY, label: 'রোগীর তালিকা', icon: ListChecks, theme: 'theme3' },
  { href: ROUTES.AI_SUMMARY, label: 'AI অভিযোগ সারাংশ', icon: MessageSquareText, theme: 'theme4' },
  { href: ROUTES.DAILY_REPORT, label: 'দৈনিক প্রতিবেদন', icon: FileText, theme: 'theme5' },
  { href: ROUTES.SLIP_SEARCH, label: 'পেমেন্ট স্লিপ', icon: ScrollText, theme: 'theme6' },
];

const managementNavItems = [
  { href: ROUTES.STORE_MANAGEMENT, label: 'ঔষধ ব্যবস্থাপনা', icon: Archive, comingSoon: true },
  { href: ROUTES.PERSONAL_EXPENSES, label: 'ব্যক্তিগত খরচ', icon: DollarSign, comingSoon: true },
];

const utilityNavItems = [
  { href: ROUTES.CLINIC_INFORMATION, label: 'ক্লিনিকের তথ্য', icon: Building2 },
  { href: ROUTES.APP_SETTINGS, label: 'অ্যাপ সেটিংস', icon: Settings },
];

interface CollapsibleSidebarSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  headerClassName?: string;
}

const CollapsibleSidebarSection: React.FC<CollapsibleSidebarSectionProps> = ({ title, children, defaultOpen = false, headerClassName }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { state: sidebarState } = useSidebar();
  const isSidebarIconOnly = sidebarState === 'collapsed';

  return (
    <div className="w-full">
      <button
        onClick={() => !isSidebarIconOnly && setIsOpen(!isOpen)}
        className={cn(
          "flex items-center w-full p-2 rounded-md text-sidebar-foreground text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          "transition-colors duration-150",
          isSidebarIconOnly && "hidden",
          isOpen && !isSidebarIconOnly && "bg-sidebar-accent/60",
          !isOpen && headerClassName,
          isOpen ? "hover:bg-sidebar-accent/70" : (headerClassName ? "" : "hover:bg-sidebar-accent"),
          headerClassName
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
  // const router = useRouter(); // Potentially still used
  const { state: sidebarState, setOpenMobile } = useSidebar();
  const isSidebarIconOnly = sidebarState === 'collapsed';
  // const { user, loading } = useAuth(); // Auth not used for UI elements here anymore
  // const { toast } = useToast(); // Toast not used for sign out anymore
  const [logoSrc, setLogoSrc] = useState("/icons/icon.png");

  // const handleSignOut = async () => { ... }; // Sign out logic removed

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className={cn(
        "p-4 flex items-center",
        isSidebarIconOnly ? "justify-center" : "justify-start"
      )}>
        <Link href={ROUTES.DASHBOARD} className="flex items-center">
          <Avatar className="h-10 w-10 rounded-md bg-sidebar-primary/20 text-sidebar-primary-foreground flex items-center justify-center p-1 border border-sidebar-primary/50">
            <Image
              src={logoSrc}
              alt={`${APP_NAME} Logo`}
              width={32}
              height={32}
              className="object-contain"
              data-ai-hint="clinic health logo"
              onError={() => {
                setLogoSrc("https://placehold.co/32x32.png?text=TAN");
              }}
            />
          </Avatar>
          {!isSidebarIconOnly && (
             <span className="ml-3 text-lg font-semibold text-sidebar-foreground font-headline">{APP_NAME}</span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-grow px-2 space-y-1">
        <CollapsibleSidebarSection title="প্রধান মেনু" defaultOpen headerClassName="sidebar-section-header-main">
          <SidebarMenu>
            {mainNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== ROUTES.DASHBOARD && pathname.startsWith(item.href))}
                  tooltip={{ children: item.label, side: 'right', align: 'center' }}
                  onClick={() => setOpenMobile(false)}
                  data-menu-item-theme={item.theme || undefined}
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

        <CollapsibleSidebarSection title="ব্যবস্থাপনা" headerClassName="sidebar-section-header-management">
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
                  onClick={() => setOpenMobile(false)}
                >
                  <Link href={item.href} >
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

        <CollapsibleSidebarSection title="ইউটিলিটি" headerClassName="sidebar-section-header-utility">
          <SidebarMenu>
            {utilityNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{ children: item.label, side: 'right', align: 'center' }}
                  onClick={() => setOpenMobile(false)}
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

      {/* Removed User Info and Sign Out/In button section from footer */}
      <div className={cn("p-2 border-t border-sidebar-border h-10", isSidebarIconOnly && "hidden")}>
        {/* Content can be added here if needed later, like a simple status */}
      </div>


      <SidebarFooter className="p-2 pt-1">
        <div className="text-center text-xs text-sidebar-foreground/60 py-1 group-data-[collapsible=icon]:hidden">
          <p>© {new Date().getFullYear()} {APP_NAME}</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
