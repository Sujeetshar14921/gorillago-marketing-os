'use client';

import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { BillingInvoice } from '@/types/database';
import { INVOICE_STATUS_META } from './billing-constants';

export interface InvoicesTableProps {
  invoices: BillingInvoice[] | undefined;
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  if (!invoices || invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
        <FileText className="h-8 w-8 text-muted-foreground/50" />
        <h4 className="mt-2 text-sm font-medium text-foreground">No invoices yet</h4>
        <p className="text-xs text-muted-foreground">Invoices will be recorded automatically when payments are fulfilled.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Billing Period</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Receipt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((inv) => {
            const status = INVOICE_STATUS_META[inv.status] ?? INVOICE_STATUS_META.paid;
            return (
              <TableRow key={inv.id}>
                <TableCell className="font-mono text-xs font-medium text-foreground">
                  {inv.stripe_invoice_id || inv.id.slice(0, 8).toUpperCase()}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(inv.paid_at || inv.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {inv.period_start ? new Date(inv.period_start).toLocaleDateString() : '—'} –{' '}
                  {inv.period_end ? new Date(inv.period_end).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell className="text-xs font-semibold text-foreground">
                  ${inv.amount.toFixed(2)} {inv.currency}
                </TableCell>
                <TableCell>
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', status.color)}>
                    {status.label}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {inv.invoice_url ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs gap-1"
                      onClick={() => window.open(inv.invoice_url || '', '_blank')}
                    >
                      <Download className="h-3 w-3" /> View
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground font-mono">Verified</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
