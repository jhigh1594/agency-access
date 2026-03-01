"use client";

import { cn } from "@/lib/utils";
import Link, { LinkProps } from "next/link";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { Menu, X, ChevronLeft } from "lucide-react";
import { usePathname } from "next/navigation";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(true);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof m.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof m.div>) => {
  const { open, setOpen } = useSidebar();
  return (
    <div
      className={cn(
        "relative hidden h-full flex-shrink-0 border-r border-paper/20 bg-ink py-4 text-paper md:flex md:flex-col",
        open ? "w-[250px] px-4" : "w-[72px] px-2",
        className
      )}
      {...(props as any)}
    >
      {/* Collapse/Expand Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "absolute -right-3 top-4 z-10 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-paper/30 bg-ink text-paper shadow-sm transition-colors",
          "hover:bg-paper/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        )}
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        aria-expanded={open}
      >
        <span
          className={cn(
            "transition-transform duration-200 motion-reduce:transition-none",
            open ? "rotate-0" : "rotate-180"
          )}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </span>
      </button>
      {children}
    </div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  const prefersReducedMotion = useReducedMotion();
  const mobileMenuPanelId = "mobile-sidebar-panel";

  return (
    <>
      <div
        className={cn(
          "flex min-h-[56px] w-full flex-row items-center justify-between border-b border-paper/20 bg-ink px-4 py-2 text-paper md:hidden"
        )}
        {...props}
      >
        <div className="z-20 flex w-full justify-end">
          <button
            type="button"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md transition-colors hover:bg-paper/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-controls={mobileMenuPanelId}
            aria-expanded={open}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <AnimatePresence>
          {open && (
            <m.div
              id={mobileMenuPanelId}
              role="dialog"
              aria-modal="true"
              aria-label="Sidebar navigation"
              initial={prefersReducedMotion ? false : { x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={prefersReducedMotion ? { x: 0, opacity: 1 } : { x: "-100%", opacity: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.25,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed inset-0 z-[100] flex h-full w-full flex-col justify-between bg-ink p-6 text-paper",
                className
              )}
            >
              <button
                type="button"
                className="absolute right-6 top-6 z-50 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md transition-colors hover:bg-paper/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                onClick={() => setOpen(!open)}
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
              {children}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
  props?: LinkProps<any>;
}) => {
  const { open } = useSidebar();
  const pathname = usePathname();
  const isActive =
    pathname === link.href ||
    (link.href !== "/" && pathname?.startsWith(`${link.href}/`));

  return (
    <div className="rounded-lg">
      <Link
        href={link.href as any}
        aria-label={link.label}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group/sidebar flex w-full items-center rounded-lg transition-colors",
          "hover:bg-paper/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
          isActive && "bg-paper/15",
          open ? "justify-start pl-3 py-2" : "justify-center px-4 py-3",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "flex h-6 w-6 flex-shrink-0 items-center justify-center transition-colors",
            open && "mr-2",
            isActive ? "text-paper" : "text-paper/70 group-hover/sidebar:text-paper"
          )}
        >
          {link.icon}
        </div>
        <div
          className="overflow-hidden"
        >
          <span
            aria-hidden={!open}
            className={cn(
              "inline-block origin-left whitespace-nowrap !m-0 !p-0 font-sans text-base transition-all duration-200 motion-reduce:transition-none",
              open ? "translate-x-0 scale-x-100 opacity-100" : "-translate-x-2 scale-x-0 opacity-0",
              isActive
                ? "font-medium text-paper"
                : "text-paper/70 group-hover/sidebar:translate-x-1 group-hover/sidebar:text-paper"
            )}
          >
            {link.label}
          </span>
        </div>
      </Link>
    </div>
  );
};
