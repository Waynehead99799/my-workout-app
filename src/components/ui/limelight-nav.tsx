"use client";

import React, { cloneElement, useLayoutEffect, useRef, useState } from "react";

const DefaultHomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);

const DefaultCompassIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
  </svg>
);

const DefaultBellIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

export type NavItem = {
  id: string | number;
  icon: React.ReactElement<{ className?: string }>;
  label?: string;
  onClick?: () => void;
  isPrimaryAction?: boolean;
};

const defaultNavItems: NavItem[] = [
  { id: "default-home", icon: <DefaultHomeIcon />, label: "Home" },
  { id: "default-explore", icon: <DefaultCompassIcon />, label: "Explore" },
  { id: "default-notifications", icon: <DefaultBellIcon />, label: "Notifications" },
];

type LimelightNavProps = {
  items?: NavItem[];
  defaultActiveIndex?: number;
  activeIndex?: number;
  onTabChange?: (index: number) => void;
  className?: string;
  limelightClassName?: string;
  iconContainerClassName?: string;
  iconClassName?: string;
};

export const LimelightNav = ({
  items = defaultNavItems,
  defaultActiveIndex = 0,
  activeIndex,
  onTabChange,
  className = "",
  limelightClassName = "",
  iconContainerClassName = "",
  iconClassName = "",
}: LimelightNavProps) => {
  const [internalActiveIndex, setInternalActiveIndex] = useState(defaultActiveIndex);
  const [isReady, setIsReady] = useState(false);
  const navItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const limelightRef = useRef<HTMLDivElement | null>(null);
  const currentIndex = activeIndex ?? internalActiveIndex;

  useLayoutEffect(() => {
    if (items.length === 0) {
      return;
    }
    // Don't move limelight to primary action (floating button) — it looks disconnected
    if (items[currentIndex]?.isPrimaryAction) {
      if (!isReady) {
        setTimeout(() => setIsReady(true), 50);
      }
      return;
    }
    const limelight = limelightRef.current;
    const activeItem = navItemRefs.current[currentIndex];
    if (limelight && activeItem) {
      const newLeft = activeItem.offsetLeft + activeItem.offsetWidth / 2 - limelight.offsetWidth / 2;
      limelight.style.left = `${newLeft}px`;
      if (!isReady) {
        setTimeout(() => setIsReady(true), 50);
      }
    }
  }, [currentIndex, isReady, items]);

  if (items.length === 0) {
    return null;
  }

  const handleItemClick = (index: number, itemOnClick?: () => void) => {
    if (activeIndex === undefined) {
      setInternalActiveIndex(index);
    }
    onTabChange?.(index);
    itemOnClick?.();
  };

  return (
    <nav
      className={`relative inline-flex h-14 w-full items-center rounded-2xl bg-transparent px-1.5 text-foreground ${className}`}
    >
      {items.map(({ id, icon, label, onClick, isPrimaryAction }, index) => (
        <button
          key={id}
          ref={(el) => {
            navItemRefs.current[index] = el;
          }}
          type="button"
          className={`relative z-20 flex h-full flex-1 items-center justify-center px-2 ${iconContainerClassName}`}
          onClick={() => handleItemClick(index, onClick)}
          aria-label={label}
        >
          {isPrimaryAction ? (
            <span className="flex h-11 w-11 shrink-0 -translate-y-2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/35">
              {cloneElement(icon, {
                className: `h-7 w-7 shrink-0 opacity-100 ${icon.props.className ?? ""} ${iconClassName}`,
              })}
            </span>
          ) : (
            cloneElement(icon, {
              className: `h-6 w-6 transition-all duration-200 ease-out ${
                currentIndex === index ? "opacity-100" : "opacity-40"
              } ${icon.props.className ?? ""} ${iconClassName}`,
            })
          )}
        </button>
      ))}

      <div
        ref={limelightRef}
        className={`absolute top-0 z-10 h-[4px] w-10 rounded-full bg-primary shadow-[0_40px_14px_var(--primary)] ${
          isReady ? "transition-[left] duration-400 ease-in-out" : ""
        } ${limelightClassName}`}
        style={{ left: "-999px" }}
      >
        <div className="pointer-events-none absolute left-[-30%] top-[4px] h-12 w-[160%] bg-gradient-to-b from-primary/30 to-transparent [clip-path:polygon(5%_100%,25%_0,75%_0,95%_100%)]" />
      </div>
    </nav>
  );
};
