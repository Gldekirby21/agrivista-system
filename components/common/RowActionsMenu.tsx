"use client";

import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

interface RowAction {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}

interface RowActionsMenuProps {
  label: string;
  actions: (RowAction | false | null | undefined)[];
}

export function RowActionsMenu({ label, actions }: RowActionsMenuProps) {
  const items = actions.filter((action): action is RowAction => Boolean(action));
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const initialFocus = useRef(0);
  const id = useId();

  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !menuRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const menu = menuRef.current.getBoundingClientRect();
    setPosition({
      left: Math.max(8, Math.min(trigger.right - menu.width, window.innerWidth - menu.width - 8)),
      top: Math.max(8, trigger.bottom + menu.height + 8 <= window.innerHeight
        ? trigger.bottom + 4 : trigger.top - menu.height - 4),
    });
    const buttons = menuRef.current.querySelectorAll<HTMLElement>("[role='menuitem']");
    buttons[initialFocus.current === -1 ? buttons.length - 1 : 0]?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent | FocusEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) setOpen(false);
    };
    const dismiss = () => setOpen(false);
    const scroll = (event: Event) => {
      if (!(event.target instanceof Node) || !menuRef.current?.contains(event.target)) dismiss();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", scroll, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("scroll", scroll, true);
    };
  }, [open]);

  if (!items.length) return <span className="text-slate-400" aria-label="No available actions">—</span>;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Actions for ${label}`}
        title={`Actions for ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded p-0 align-middle leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600"
        onClick={() => { initialFocus.current = 0; setOpen(!open); }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            initialFocus.current = event.key === "ArrowUp" ? -1 : 0;
            setOpen(true);
          } else if (event.key === "Escape") close();
        }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          id={id}
          role="menu"
          aria-label={`Actions for ${label}`}
          style={position}
          className="fixed z-[60] w-52 max-w-[calc(100vw-16px)] max-h-[calc(100vh-16px)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
          onKeyDown={(event) => {
            const buttons = Array.from(menuRef.current?.querySelectorAll<HTMLElement>("[role='menuitem']") || []);
            const current = buttons.indexOf(document.activeElement as HTMLElement);
            let next = current;
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              close(true);
              return;
            }
            if (event.key === "Tab") {
              // Restore the row's tab position, then allow native Tab navigation.
              close(true);
              return;
            }
            if (event.key === "ArrowDown") next = (current + 1) % buttons.length;
            else if (event.key === "ArrowUp") next = (current - 1 + buttons.length) % buttons.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = buttons.length - 1;
            else return;
            event.preventDefault();
            buttons[next]?.focus();
          }}
        >
          {items.map((item) => {
            const className = `flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium outline-none ${item.danger
              ? "text-red-600 hover:bg-red-50 focus:bg-red-50"
              : "text-slate-700 hover:bg-slate-100 focus:bg-slate-100"}`;
            const content = <><span aria-hidden="true" className="shrink-0">{item.icon}</span>{item.label}</>;
            const select = () => { close(true); item.onClick?.(); };
            return item.href ? (
              <Link key={item.label} href={item.href} role="menuitem" tabIndex={-1} className={className} onClick={select}>{content}</Link>
            ) : (
              <button key={item.label} type="button" role="menuitem" tabIndex={-1} className={className} onClick={select}>{content}</button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}
