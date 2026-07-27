'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

interface AdminAnalyticsChartsProps {
  topBrands: { brand: string; count: number }[];
  listingsByStatus: { live: number; ended: number; upcoming: number };
}

const BRAND_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];
const STATUS_COLORS = {
  live: '#10B981',
  ended: '#6B7280',
  upcoming: '#3B82F6',
};

export function AdminAnalyticsCharts({ topBrands, listingsByStatus }: AdminAnalyticsChartsProps) {
  const statusData = [
    { name: 'Live Auctions', value: listingsByStatus.live, color: STATUS_COLORS.live },
    { name: 'Ended', value: listingsByStatus.ended, color: STATUS_COLORS.ended },
    { name: 'Upcoming', value: listingsByStatus.upcoming, color: STATUS_COLORS.upcoming },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top 5 Brands Bar Chart */}
      <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-foreground">
          Top 5 Brands by Inventory Count
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topBrands} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="brand" stroke="#888888" fontSize={11} tickLine={false} />
              <YAxis stroke="#888888" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                itemStyle={{ color: '#10B981' }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {topBrands.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Auction Status Distribution Pie Chart */}
      <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-foreground">
          Listings Breakdown by Status
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`status-cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
