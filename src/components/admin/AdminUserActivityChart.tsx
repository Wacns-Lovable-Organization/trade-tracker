import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { format, parseISO } from 'date-fns';

interface UserActivity {
  activity_date: string;
  new_users: number;
  active_devices: number;
}

interface AdminUserActivityChartProps {
  data: UserActivity[];
}

const chartConfig = {
  new_users: {
    label: 'New Users',
    color: 'hsl(var(--primary))',
  },
  active_devices: {
    label: 'Active Devices',
    color: 'hsl(var(--chart-3))',
  },
} as const;

export function AdminUserActivityChart({ data }: AdminUserActivityChartProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      date: format(parseISO(item.activity_date), 'MMM d'),
      new_users: Number(item.new_users) || 0,
      active_devices: Number(item.active_devices) || 0,
    }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No activity data available
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <span>
                    {name === 'new_users' ? 'New Users' : 'Active Devices'}: {Number(value)}
                  </span>
                )}
              />
            }
          />
          <Bar
            dataKey="new_users"
            fill="var(--color-new_users)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="active_devices"
            fill="var(--color-active_devices)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
