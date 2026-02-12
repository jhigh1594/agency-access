"use client";

import { cn } from "@/lib/utils";
import Link, { LinkProps } from "next/link";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
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
  const { open, setOpen, animate } = useSidebar();
  return (
    <m.div
      className={cn(
        "h-full py-4 hidden md:flex md:flex-col bg-card border-r border-border w-[250px] max-w-[250px] flex-shrink-0 relative",
        className
      )}
      animate={{
        width: animate ? (open ? "250px" : "60px") : "250px",
        paddingLeft: open ? "1rem" : "0.5rem",
        paddingRight: open ? "1rem" : "0.5rem",
      }}
      transition={{
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      {...(props as any)}
    >
      {/* Collapse/Expand Button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "absolute top-4 -right-3 z-10 p-1.5 rounded-full bg-card border border-border shadow-sm hover:bg-accent transition-colors",
          "flex items-center justify-center"
        )}
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
      >
        <m.div
          animate={{
            rotate: open ? 0 : 180,
          }}
          transition={{ duration: 0.2 }}
        >
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </m.div>
      </button>
      {children}
    </m.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-card border-b border-border w-full"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <Menu
            className="text-foreground cursor-pointer"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <m.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-background p-10 z-[100] flex flex-col justify-between",
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-foreground cursor-pointer"
                onClick={() => setOpen(!open)}
              >
                <X />
              </div>
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
  const { open, animate } = useSidebar();
  const pathname = usePathname();
  const isActive = pathname === link.href;
  
  return (
    <m.div
      animate={{
        paddingLeft: open ? "0" : "0",
        paddingRight: open ? "0.5rem" : "0",
      }}
      transition={{
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="rounded-lg"
    >
      <Link
        href={link.href as any}
        className={cn(
          "flex items-center group/sidebar rounded-lg transition-colors w-full",
          "hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60",
          isActive && "bg-neutral-200 dark:bg-neutral-700",
          open ? "justify-start pl-3 py-2" : "justify-center px-4 py-3",
          className
        )}
        {...props}
      >
        <m.div
          animate={{
            marginRight: open ? "0.5rem" : "0",
          }}
          transition={{
            duration: 0.3,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            height: "24px",
            width: "24px",
          }}
        >
          {link.icon}
        </m.div>
        <m.div
          animate={{
            width: animate ? (open ? "180px" : "0px") : "180px",
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          transition={{
            width: {
              duration: 0.3,
              ease: [0.25, 0.1, 0.25, 1],
            },
            opacity: {
              duration: 0.25,
              ease: [0.25, 0.1, 0.25, 1],
              delay: open ? 0.08 : 0,
            },
          }}
          className="overflow-hidden"
        >
          <span
            className={cn(
              "text-base font-sans group-hover/sidebar:translate-x-1 transition duration-150 whitespace-nowrap inline-block !p-0 !m-0",
              isActive ? "text-foreground font-medium" : "text-muted-foreground"
            )}
          >
            {link.label}
          </span>
        </m.div>
      </Link>
    </m.div>
  );
};
