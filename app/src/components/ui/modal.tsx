"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Modal — controlled native <dialog> wrapper.
 * Caller owns open state. Renders nothing in the trigger slot; the parent decides
 * how to open the modal (e.g. an Edit button + setState).
 */
export interface ModalProps extends React.HTMLAttributes<HTMLDialogElement> {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  contentClassName?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  className,
  contentClassName,
  children,
  ...rest
}: ModalProps) {
  const ref = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "rounded-md border-[1.5px] border-hairline-light bg-surface-card text-ink",
        "w-[calc(100%-2rem)] max-w-md p-0 m-auto",
        "backdrop:bg-black/40 backdrop:backdrop-blur-sm",
        "open:animate-in",
        className,
      )}
      {...rest}
    >
      <div className={cn("p-5 space-y-4", contentClassName)}>
        {(title || description) && (
          <header className="space-y-1">
            {title && <h2 className="heading-md text-ink">{title}</h2>}
            {description && (
              <p className="caption-md text-mute-light">{description}</p>
            )}
          </header>
        )}
        {children}
      </div>
    </dialog>
  );
}
