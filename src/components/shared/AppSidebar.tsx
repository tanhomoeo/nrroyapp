
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
  ListChecks, // Changed from ListAlt to a more suitable Lucide icon
  MessageSquareText,
  FileText,
  ScrollText,
  Archive, // For Store Management
  DollarSign, // For Personal Expenses
  Building2, // For Clinic Information
  Settings, // For App Settings
} from 'lucide-react';
import { ROUTES, APP_NAME } from '@/lib/constants';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { href: ROUTES.DASHBOARD, label: 'ড্যাশবোর্ড', icon: Home },
  { href: ROUTES.PATIENT_ENTRY, label: 'নতুন রোগী ভর্তি', icon: UserPlus },
  { href: ROUTES.PATIENT_SEARCH, label: 'রোগী অনুসন্ধান', icon: Search },
  { href: ROUTES.DICTIONARY, label: 'রোগীর তালিকা', icon: ListChecks },
  { href: ROUTES.AI_SUMMARY, label: 'AI অভিযোগ সারাংশ', icon: MessageSquareText },
  { href: ROUTES.DAILY_REPORT, label: 'দৈনিক প্রতিবেদন', icon: FileText },
  { href: ROUTES.SLIP_SEARCH, label: 'পেমেন্ট স্লিপ', icon: ScrollText },
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
  const { state: sidebarState } = useSidebar();
  const isSidebarIconOnly = sidebarState === 'collapsed';

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className={cn(
        "p-4 flex items-center",
        isSidebarIconOnly ? "justify-center" : "justify-start"
      )}>
        <Link href={ROUTES.DASHBOARD} className="flex items-center">
          <Avatar className="h-10 w-10 rounded-md bg-sidebar-primary/20 text-sidebar-primary-foreground flex items-center justify-center p-1 border border-sidebar-primary/50">
            {/* The app logo will still try to load from public/icons/app-logo.svg */}
            {/* Please ensure public/icons/app-logo.svg exists for it to display */}
            <Image
              src="/icons/app-logo.svg"
              alt={`${APP_NAME} Logo`}
              width={32}
              height={32}
              className="object-contain"
              data-ai-hint="clinic health logo"
              onError={(e) => {
                // Fallback or hide if image fails to load, e.g., e.currentTarget.style.display = 'none';
                console.warn('App logo failed to load from public/icons/app-logo.svg');
              }}
            />
          </Avatar>
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
        <div className="text-center text-xs text-sidebar-foreground/60 py-1 group-data-[collapsible=icon]:hidden">
          <p>© {new Date().getFullYear()} {APP_NAME}</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
