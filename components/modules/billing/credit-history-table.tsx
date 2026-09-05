'use client';

import { Zap } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { BillingCreditTransaction } from '@/types/database';
import { TX_TYPE_META } from './billing-constants';

export interface CreditHistoryTableProps {
  transactions: BillingCreditTransaction[] | undefined;
}

export function CreditHistoryTable({ transactions }: CreditHistoryTableProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
        <Zap className="h-8 w-8 text-muted-foreground/50" />
        <h4 className="mt-2 text-sm font-medium text-foreground">No credit transactions</h4>
        <p className="text-xs text-muted-foreground">Transactions will appear as AI generations occur or credits are granted.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Credits</TableHead>
            <TableHead>Balance After</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => {
            const meta = TX_TYPE_META[tx.type] ?? TX_TYPE_META.grant;
            const Icon = meta.icon;
            const isPositive = tx.amount > 0;

            return (
              <TableRow key={tx.id}>
                <TableCell>
                  <span className={cn('inline-flex items-center gap-1 text-xs font-medium', meta.color)}>
                    <Icon className="h-3.5 w-3.5" />
                    {meta.label}
                  </span>
                </TableCell>
                <TableCell className="capitalize text-xs text-foreground">
                  {tx.credit_type}
                </TableCell>
                <TableCell className="text-xs font-mono font-semibold">
                  <span className={isPositive ? 'text-emerald-600' : 'text-orange-600'}>
                    {isPositive ? `+${tx.amount}` : tx.amount}
                  </span>
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">
                  {tx.balance_after ?? '—'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                  {tx.description || 'Quota adjustment'}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {new Date(tx.created_at).toLocaleString([], {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
