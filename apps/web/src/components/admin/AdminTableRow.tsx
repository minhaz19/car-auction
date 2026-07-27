'use client';

import { ReactNode } from 'react';

interface AdminTableRowProps {
  children: ReactNode;
  className?: string;
}

export function AdminTableRow({ children, className = '' }: AdminTableRowProps) {
  return (
    <tr className={`border-b border-border/60 hover:bg-muted/30 transition-colors text-xs ${className}`}>
      {children}
    </tr>
  );
}

export function AdminTableHeaderCell({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-3 text-left font-extrabold text-muted-foreground uppercase tracking-wider text-[10px]">
      {children}
    </th>
  );
}

export function AdminTableCell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 font-medium text-foreground ${className}`}>{children}</td>;
}
