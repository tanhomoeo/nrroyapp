
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { ROUTES, APP_NAME } from '@/lib/constants';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { href: ROUTES.DASHBOARD, label: 'ড্যাশবোর্ড', icon: Home, theme: 'theme1' },
  { href: ROUTES.PATIENT_ENTRY, label: 'নতুন রোগী ভর্তি', icon: UserPlus, theme: 'theme2' },
  { href: ROUTES.PATIENT_SEARCH, label: 'রোগী অনুসন্ধান', icon: Search, theme: 'theme3' },
  { href: ROUTES.DICTIONARY, label: 'রোগীর তালিকা', icon: ListChecks, theme: 'theme4' },
  { href: ROUTES.AI_SUMMARY, label: 'AI অভিযোগ সারাংশ', icon: MessageSquareText, theme: 'theme5' },
  { href: ROUTES.DAILY_REPORT, label: 'দৈনিক প্রতিবেদন', icon: FileText, theme: 'theme6' },
  { href: ROUTES.SLIP_SEARCH, label: 'পেমেন্ট স্লিপ', icon: ScrollText, theme: 'theme1' }, // Re-using themes
];

const managementNavItems = [
  { href: ROUTES.STORE_MANAGEMENT, label: 'ঔষধ ব্যবস্থাপনা', icon: Archive, comingSoon: true, theme: 'theme4' },
  { href: ROUTES.PERSONAL_EXPENSES, label: 'ব্যক্তিগত খরচ', icon: DollarSign, comingSoon: true, theme: 'theme5' },
];

const utilityNavItems = [
  { href: ROUTES.CLINIC_INFORMATION, label: 'ক্লিনিকের তথ্য', icon: Building2, theme: 'theme6' },
  { href: ROUTES.APP_SETTINGS, label: 'অ্যাপ সেটিংস', icon: Settings, theme: 'theme1' },
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
          "flex items-center w-full p-2 rounded-md text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          "transition-colors duration-150",
          isSidebarIconOnly && "hidden",
          // Use the new subtle header style from globals.css
          !isOpen && "sidebar-collapsible-section-header", 
          // When open, remove specific background, let items define style
          isOpen && !isSidebarIconOnly && "sidebar-collapsible-section-header border-t-0 mt-0 pt-2", // Adjust open style
           isOpen ? "hover:bg-sidebar-accent/20" : "hover:text-[hsl(var(--sidebar-section-header-text)/0.8)]"
        )}
        aria-expanded={isOpen}
        aria-controls={`section-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <span className="flex-1 text-left text-[hsl(var(--sidebar-section-header-text))]">{title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200 text-[hsl(var(--sidebar-section-header-text))]",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        id={`section-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className={cn(
          "overflow-hidden",
          !isSidebarIconOnly && "transition-all duration-300 ease-in-out",
          // Add padding when open and not icon-only to indent items slightly
          isSidebarIconOnly ? "max-h-none opacity-100" : (isOpen ? "max-h-[500px] opacity-100 mt-1 pl-1" : "max-h-0 opacity-0")
        )}
      >
        <div className={cn(!isSidebarIconOnly && "pl-1")}> {/* Further indent content */}
           {children}
        </div>
      </div>
    </div>
  );
};

export function AppSidebar() {
  const pathname = usePathname();
  const { state: sidebarState, setOpenMobile } = useSidebar();
  const isSidebarIconOnly = sidebarState === 'collapsed';
  const [logoSrc, setLogoSrc] = useState("/icons/icon.png");


  const renderNavItems = (items: typeof mainNavItems) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href || (item.href !== ROUTES.DASHBOARD && pathname.startsWith(item.href))}
            tooltip={{ children: item.label, side: 'right', align: 'center' }}
            onClick={() => setOpenMobile(false)}
            data-menu-item-theme={item.theme || undefined} // Apply theme
          >
            <Link href={item.href}>
              <item.icon className="h-5 w-5" />
              <span>
                {item.label}
                {(item as any).comingSoon && <span className="text-xs text-sidebar-primary-foreground/70 ml-1 group-data-[collapsible=icon]:hidden">(শীঘ্রই আসছে)</span>}
              </span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className={cn(
        "p-4 flex items-center border-b border-sidebar-border", // Added bottom border
        isSidebarIconOnly ? "justify-center" : "justify-start"
      )}>
        <Link href={ROUTES.DASHBOARD} className="flex items-center">
          <Avatar className="h-10 w-10 rounded-lg bg-sidebar-primary/10 text-sidebar-primary-foreground flex items-center justify-center p-1 border border-sidebar-primary/30 shadow-sm">
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
             <span className="ml-3 text-xl font-bold text-sidebar-foreground font-headline tracking-tight">{APP_NAME}</span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-grow px-2 space-y-0"> {/* Reduced space-y */}
        <CollapsibleSidebarSection title="প্রধান মেনু" defaultOpen>
          {renderNavItems(mainNavItems)}
        </CollapsibleSidebarSection>

        <SidebarSeparator className={cn("my-1", isSidebarIconOnly && "hidden")} />

        <CollapsibleSidebarSection title="ব্যবস্থাপনা">
          {renderNavItems(managementNavItems as typeof mainNavItems)}
        </CollapsibleSidebarSection>

        <SidebarSeparator className={cn("my-1", isSidebarIconOnly && "hidden")} />

        <CollapsibleSidebarSection title="ইউটিলিটি">
          {renderNavItems(utilityNavItems as typeof mainNavItems)}
        </CollapsibleSidebarSection>
      </SidebarContent>

      <div className={cn("p-2 border-t border-sidebar-border h-10", isSidebarIconOnly && "hidden")}>
        {/* Footer content can be added here if needed */}
      </div>

      <SidebarFooter className="p-2 pt-1 border-t border-sidebar-border">
        <div className="text-center text-xs text-sidebar-foreground/60 py-1 group-data-[collapsible=icon]:hidden">
          <p>© {new Date().getFullYear()} {APP_NAME}</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

    