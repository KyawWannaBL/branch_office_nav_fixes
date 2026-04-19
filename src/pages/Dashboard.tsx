import { useState, useEffect } from 'react';
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
import type { Shipment, DeliveryStatus } from '@/lib/index';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROUTE_PATHS, calculateDeliveryMetrics, calculateRevenue, formatCurrency } from '@/lib/index';
import { mockShipments, mockDeliveries, mockEmployees, mockWarehouses } from '@/data/index';
import { MetricCard, StatsGrid, StatusBadge } from '@/components/Stats';
import { DeliveryTrendChart, RevenueChart, StatusDistributionChart, FleetActivityChart } from '@/components/Charts';
import { DataTable, Column } from '@/components/DataTable';
import { MapView } from '@/components/MapView';
import { IMAGES } from '@/assets/images';

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
        <span className="font-mono text-sm font-medium">{row.awb}</span>
      ),
    },
    {
      id: 'recipient',
      header: 'Recipient',
      accessor: 'recipient',
      cell: (row: Shipment) => (
        <div>
          <div className="font-medium">{row.recipient.name}</div>
          <div className="text-sm text-muted-foreground">{row.recipient.phone}</div>
        </div>
      ),
    },
    {
      id: 'serviceType',
      header: 'Service',
      accessor: 'serviceType',
      cell: (row: Shipment) => (
        <span className="capitalize">{row.serviceType.replace('-', ' ')}</span>
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
      cell: (row: Shipment) => row.codAmount ? formatCurrency(row.codAmount) : '-',
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

  const statusData = [
    { status: 'Delivered', count: metrics.delivered, color: 'hsl(var(--chart-3))' },
    { status: 'In Transit', count: Math.floor(metrics.pending * 0.6), color: 'hsl(var(--primary))' },
    { status: 'Pending', count: Math.floor(metrics.pending * 0.3), color: 'hsl(var(--accent))' },
    { status: 'Failed', count: metrics.failed, color: 'hsl(var(--destructive))' },
    { status: 'Other', count: Math.floor(metrics.pending * 0.1), color: 'hsl(var(--muted))' },
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
    <div className="min-h-screen bg-background">
      <div
        className="absolute inset-0 z-0 opacity-30"
        style={{
          backgroundImage: `url(${IMAGES.SCREENSHOT_10951})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/70" />

      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                  Real-time overview of your delivery operations
                </p>
              </div>
              <div className="flex gap-3">
                <Button asChild size="lg">
                  <Link to={ROUTE_PATHS.CREATE_DELIVERY}>
                    <Plus className="w-5 h-5 mr-2" />
                    Create Delivery
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to={ROUTE_PATHS.SUPERVISOR}>
                    <UserPlus className="w-5 h-5 mr-2" />
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
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Delivery Trends
                  </CardTitle>
                  <CardDescription>Daily delivery performance over the past week</CardDescription>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-chart-4" />
                    Revenue by Service
                  </CardTitle>
                  <CardDescription>Revenue breakdown by service type</CardDescription>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Fleet Activity Map
                  </CardTitle>
                  <CardDescription>Real-time driver locations and delivery routes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] rounded-lg overflow-hidden border border-border">
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-chart-3" />
                    Status Distribution
                  </CardTitle>
                  <CardDescription>Current delivery status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <StatusDistributionChart data={statusData} height={250} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Fleet Activity
                  </CardTitle>
                  <CardDescription>Vehicle utilization over 24 hours</CardDescription>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Recent Shipments
                </CardTitle>
                <CardDescription>Latest shipments and their current status</CardDescription>
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
            <Card className="bg-gradient-to-br from-chart-3/10 to-chart-3/5 border-chart-3/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <p className="text-3xl font-bold mt-2">{metrics.successRate}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-chart-3/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-chart-3" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">COD Collected</p>
                    <p className="text-3xl font-bold mt-2">{formatCurrency(revenue.codCollected)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-chart-4/10 to-chart-4/5 border-chart-4/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending COD</p>
                    <p className="text-3xl font-bold mt-2">{formatCurrency(revenue.pendingCod)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-chart-4/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-chart-4" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Failed Deliveries</p>
                    <p className="text-3xl font-bold mt-2">{metrics.failed}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}