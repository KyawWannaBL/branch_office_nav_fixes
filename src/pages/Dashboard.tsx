import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Plus,
  UserPlus,
  MapPin,
  Activity,
} from 'lucide-react';
import type { Shipment } from '@/lib/index';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROUTE_PATHS, calculateDeliveryMetrics, calculateRevenue, formatCurrency } from '@/lib/index';
import { mockShipments, mockDeliveries, mockEmployees, mockWarehouses } from '@/data/index';
import { StatsGrid, StatusBadge } from '@/components/Stats';
import { DeliveryTrendChart, RevenueChart, StatusDistributionChart, FleetActivityChart } from '@/components/Charts';
import { DataTable, Column } from '@/components/DataTable';
import { MapView } from '@/components/MapView';

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  const metrics = calculateDeliveryMetrics(mockDeliveries);
  const revenue = calculateRevenue(mockDeliveries, mockShipments);
  const activeDrivers = mockEmployees.filter(e => e.role === 'driver' && e.status === 'active');

  const kpiMetrics = [
    {
      title: 'Total Deliveries',
      value: metrics.total,
      trend: 12.5,
      icon: <Package className="w-5 h-5" />,
      unit: 'deliveries',
      description: 'All time deliveries',
    },
    {
      title: 'On-Time Rate',
      value: `${metrics.onTimeRate}%`,
      trend: 2.3,
      icon: <Clock className="w-5 h-5" />,
      description: 'Delivered within SLA',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(revenue.totalRevenue),
      trend: 18.7,
      icon: <DollarSign className="w-5 h-5" />,
      description: 'This month',
    },
    {
      title: 'Active Drivers',
      value: activeDrivers.length,
      trend: 0,
      icon: <Users className="w-5 h-5" />,
      unit: 'drivers',
      description: 'Currently on duty',
    },
  ];

  const recentShipments = mockShipments.slice(0, 5);

  const shipmentColumns: Column<Shipment>[] = [
    {
      id: 'awb',
      header: 'AWB',
      accessor: 'awb',
      cell: (row: Shipment) => (
        <span className="font-mono text-sm font-bold text-emerald-400">{row.awb}</span>
      ),
    },
    {
      id: 'recipient',
      header: 'Recipient',
      accessor: 'recipient',
      cell: (row: Shipment) => (
        <div>
          <div className="font-bold text-white">{row.recipient.name}</div>
          <div className="text-xs text-slate-400">{row.recipient.phone}</div>
        </div>
      ),
    },
    {
      id: 'serviceType',
      header: 'Service',
      accessor: 'serviceType',
      cell: (row: Shipment) => (
        <span className="capitalize text-slate-300">{row.serviceType.replace('-', ' ')}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      cell: (row: Shipment) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      id: 'codAmount',
      header: 'COD Amount',
      accessor: 'codAmount',
      cell: (row: Shipment) => (
        <span className="font-medium text-white">
          {row.codAmount ? formatCurrency(row.codAmount) : '-'}
        </span>
      ),
    },
  ];

  const deliveryTrendData = [
    { date: 'Mon', deliveries: 145, completed: 138 },
    { date: 'Tue', deliveries: 168, completed: 162 },
    { date: 'Wed', deliveries: 192, completed: 185 },
    { date: 'Thu', deliveries: 178, completed: 171 },
    { date: 'Fri', deliveries: 205, completed: 198 },
    { date: 'Sat', deliveries: 156, completed: 149 },
    { date: 'Sun', deliveries: 134, completed: 128 },
  ];

  const revenueData = [
    { service: 'Express', revenue: 2800000, deliveries: 350 },
    { service: 'Same Day', revenue: 1920000, deliveries: 160 },
    { service: 'Standard', revenue: 1750000, deliveries: 350 },
    { service: 'Next Day', revenue: 1500000, deliveries: 150 },
    { service: 'Economy', revenue: 900000, deliveries: 300 },
  ];

  // FIXED: Removed hsl(var(--xxx)) variables, injected standard hex colors so Recharts can render properly
  const statusData = [
    { status: 'Delivered', count: metrics.delivered, color: '#10b981' }, // Emerald 500
    { status: 'In Transit', count: Math.floor(metrics.pending * 0.6), color: '#3b82f6' }, // Blue 500
    { status: 'Pending', count: Math.floor(metrics.pending * 0.3), color: '#f59e0b' }, // Amber 500
    { status: 'Failed', count: metrics.failed, color: '#ef4444' }, // Red 500
    { status: 'Other', count: Math.floor(metrics.pending * 0.1), color: '#64748b' }, // Slate 500
  ];

  const fleetData = [
    { time: '00:00', active: 8, idle: 16 },
    { time: '04:00', active: 12, idle: 12 },
    { time: '08:00', active: 20, idle: 4 },
    { time: '12:00', active: 22, idle: 2 },
    { time: '16:00', active: 18, idle: 6 },
    { time: '20:00', active: 14, idle: 10 },
  ];

  return (
    <div className="w-full">
      <div className="mx-auto max-w-7xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white">Dashboard</h1>
              <p className="text-sm font-medium text-slate-400 mt-1">
                Real-time overview of your delivery operations
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="default" className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20">
                <Link to={ROUTE_PATHS.CREATE_DELIVERY}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Delivery
                </Link>
              </Button>
              <Button asChild variant="outline" size="default" className="border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 font-bold rounded-xl">
                <Link to={ROUTE_PATHS.SUPERVISOR}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign Task
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3 bg-white/5 border border-white/10 p-1 rounded-xl">
              <TabsTrigger value="today" className="rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-bold">Today</TabsTrigger>
              <TabsTrigger value="week" className="rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-bold">This Week</TabsTrigger>
              <TabsTrigger value="month" className="rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-bold">This Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <StatsGrid metrics={kpiMetrics} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-[#020817] border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Delivery Trends
                </CardTitle>
                <CardDescription className="text-slate-400">Daily delivery performance over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <DeliveryTrendChart data={deliveryTrendData} height={300} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-[#020817] border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Revenue by Service
                </CardTitle>
                <CardDescription className="text-slate-400">Revenue breakdown by service type</CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueChart data={revenueData} height={300} />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="bg-[#020817] border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  Fleet Activity Map
                </CardTitle>
                <CardDescription className="text-slate-400">Real-time driver locations and delivery routes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] rounded-xl overflow-hidden border border-white/10">
                  <MapView
                    deliveries={mockDeliveries}
                    drivers={activeDrivers}
                    warehouses={mockWarehouses}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-6"
          >
            <Card className="bg-[#020817] border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Package className="w-5 h-5 text-blue-400" />
                  Status Distribution
                </CardTitle>
                <CardDescription className="text-slate-400">Current delivery status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <StatusDistributionChart data={statusData} height={250} />
              </CardContent>
            </Card>

            <Card className="bg-[#020817] border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Fleet Activity
                </CardTitle>
                <CardDescription className="text-slate-400">Vehicle utilization over 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <FleetActivityChart data={fleetData} height={200} />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="bg-[#020817] border-white/10 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Package className="w-5 h-5 text-emerald-400" />
                Recent Shipments
              </CardTitle>
              <CardDescription className="text-slate-400">Latest shipments and their current status</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={shipmentColumns}
                data={recentShipments}
                searchable
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="bg-[#020817] border-white/10 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-400">Success Rate</p>
                  <p className="text-3xl font-black mt-2 text-white">{metrics.successRate}%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#020817] border-white/10 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-400">COD Collected</p>
                  <p className="text-3xl font-black mt-2 text-white">{formatCurrency(revenue.codCollected)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#020817] border-white/10 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-400">Pending COD</p>
                  <p className="text-3xl font-black mt-2 text-white">{formatCurrency(revenue.pendingCod)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#020817] border-white/10 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-400">Failed Deliveries</p>
                  <p className="text-3xl font-black mt-2 text-white">{metrics.failed}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}