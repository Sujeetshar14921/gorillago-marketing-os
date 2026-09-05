'use client';

import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface DataPoint {
  label: string;
  value: number;
}

interface BarChartCardProps {
  title: string;
  data: DataPoint[];
  height?: number;
  color?: string;
}

export function BarChartCard({
  title,
  data,
  height = 240,
  color = 'hsl(var(--chart-2))',
}: BarChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'hsl(var(--popover-foreground))',
            }}
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
            labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
          />
          <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} name="Engagement" />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
