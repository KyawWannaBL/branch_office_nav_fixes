import { useMemo, useState } from 'react';
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
  MapPin,
  Activity,
} from 'lucide-react';

import {
  ROUTE_PATHS,
  formatCurrency,
  Delivery,
  Receipt,
  DeliveryStatus,
  PaymentStatus,
  Deliveryman,
  getStatusColor,
  getStatusLabel,
} from '@/lib/index';
import {
  mockDeliveries,
  mockReceipts,
  mockDeliverymen,
} from '@/data/index';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard, MetricGrid } from '@/components/Stats';
import {
  DeliveryTrendChart,
  RevenueChart,
  StatusDistributionChart,
  FleetActivityChart,
} from '@/components/Charts';
import { DataTable, Column } from '@/components/DataTable';
import { MapView } from '@/components/MapView';

type TimeRange = 'today' | 'week' | 'month';

function calculateDeliveryMetrics(deliveries: Delivery[]) {
  const total = deliveries.length;
  const delivered = deliveries.filter((d) => d.status === DeliveryStatus.DELIVERED).length;
  const failed = deliveries.filter((d) =>
    [DeliveryStatus.FAILED, DeliveryStatus.RETURNED, DeliveryStatus.CANCELLED].includes(d.status)
  ).length;
  const inTransit = deliveries.filter((d) =>
    [
      DeliveryStatus.PICKED_UP,
      DeliveryStatus.IN_TRANSIT,
      DeliveryStatus.OUT_FOR_DELIVERY,
    ].includes(d.status)
  ).length;
  const pending = deliveries.filter((d) => d.status === DeliveryStatus.PENDING).length;

  const successRate = total ? Math.round((delivered / total) * 100) : 0;
  const onTimeRate = successRate;

  return {
    total,
    delivered,
    failed,
    inTransit,
    pending,
    successRate,
    onTimeRate,
  };
}

function calculateRevenue(receipts: Receipt[]) {
  const totalRevenue = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  const codCollected = receipts
    .filter((receipt) => receipt.status === PaymentStatus.PAID)
    .reduce((sum, receipt) => sum + receipt.amount, 0);
  const pendingCod = receipts
    .filter((receipt) => receipt.status !== PaymentStatus.PAID)
    .reduce((sum, receipt) => sum + receipt.amount, 0);

  return {
    totalRevenue,
    codCollected,
    pendingCod,
  };
}

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('today');

  const deliveries = mockDeliveries;
  const receipts = mockReceipts;
  const drivers = mockDeliverymen;
  const warehouses: any[] = [];

  const metrics = useMemo(() => calculateDeliveryMetrics(deliveries), [deliveries]);
  const revenue = useMemo(() => calculateRevenue(receipts), [receipts]);
  const activeDrivers = useMemo(
    () => drivers.filter((driver: Deliveryman) => driver.status === 'active'),
    [drivers]
  );

  const kpiMetrics = [
    {
      title: 'Total Deliveries',
      value: metrics.total,
      change: 12.5,
      icon: <Package className="w-5 h-5" />,
      trend: 'up' as const,
    },
    {
      title: 'On-Time Rate',
      value: `${metrics.onTimeRate}%`,
      change: 2.3,
      icon: <Clock className="w-5 h-5" />,
      trend: 'up' as const,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(revenue.totalRevenue),
      change: 18.7,
      icon: <DollarSign className="w-5 h-5" />,
      trend: 'up' as const,
    },
    {
      title: 'Active Drivers',
      value: activeDrivers.length,
      change: 0,
      icon: <Users className="w-5 h-5" />,
      trend: 'up' as const,
    },
  ];

  const recentDeliveries = deliveries.slice(0, 5);

  const deliveryColumns: Column<Delivery>[] = [
    {
      id: 'wayNumber',
      header: 'Way Number',
      accessor: 'wayNumber',
      cell: (row: Delivery) => (
        <span className="font-mono text-sm font-medium">{row.wayNumber}</span>
      ),
    },
    {
      id: 'recipientName',
      header: 'Recipient',
      accessor: 'recipientName',
      cell: (row: Delivery) => (
        <div>
          <div className="font-medium">{row.recipientName}</div>
          <div className="text-sm text-muted-foreground">{row.recipientPhone}</div>
        </div>
      ),
    },
    {
      id: 'merchantName',
      header: 'Merchant',
      accessor: 'merchantName',
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      cell: (row: Delivery) => (
        <Badge className={getStatusColor(row.status)}>
          {getStatusLabel(row.status)}
        </Badge>
      ),
    },
    {
      id: 'deliveryFee',
      header: 'Fee',
      accessor: 'deliveryFee',
      cell: (row: Delivery) => formatCurrency(row.deliveryFee),
    },
  ];

  const deliveryTrendData =
  deliveries.length > 0
    ? deliveries.slice(0, 7).map((delivery, index) => ({
        date:
          delivery.createdAt ||
          new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toISOString(),
        deliveries: index + 1,
        completed: delivery.status === DeliveryStatus.DELIVERED ? index + 1 : index,
        failed:
          delivery.status === DeliveryStatus.FAILED ||
          delivery.status === DeliveryStatus.RETURNED ||
          delivery.status === DeliveryStatus.CANCELLED
            ? 1
            : 0,
      }))
    : Array.from({ length: 7 }, (_, index) => ({
        date: new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toISOString(),
        deliveries: 0,
        completed: 0,
        failed: 0,
      }));

  const revenueData =
    receipts.length > 0
      ? receipts.slice(0, 5).map((receipt) => ({
          service: receipt.merchantName,
          revenue: receipt.amount,
          deliveries: receipt.deliveryCount,
        }))
      : [{ service: 'No Data', revenue: 0, deliveries: 0 }];

  const statusData = [
    { status: 'Delivered', count: metrics.delivered, color: 'hsl(var(--chart-3))' },
    { status: 'In Transit', count: metrics.inTransit, color: 'hsl(var(--primary))' },
    { status: 'Pending', count: metrics.pending, color: 'hsl(var(--accent))' },
    { status: 'Failed', count: metrics.failed, color: 'hsl(var(--destructive))' },
  ];

  const fleetData = [
    { time: '00:00', active: 0, idle: drivers.length },
    { time: '08:00', active: activeDrivers.length, idle: Math.max(drivers.length - activeDrivers.length, 0) },
    { time: '12:00', active: activeDrivers.length, idle: Math.max(drivers.length - activeDrivers.length, 0) },
    { time: '16:00', active: activeDrivers.length, idle: Math.max(drivers.length - activeDrivers.length, 0) },
    { time: '20:00', active: 0, idle: drivers.length },
  ];

  return (
    <div className="min-h-screen bg-background">
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
                  <Link to={ROUTE_PATHS.DELIVERYMEN}>
                    <Users className="w-5 h-5 mr-2" />
                    View Drivers
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
            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)} className="w-full">
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
            <MetricGrid>
              {kpiMetrics.map((metric) => (
                <StatsCard
                  key={metric.title}
                  title={metric.title}
                  value={metric.value}
                  change={metric.change}
                  icon={metric.icon}
                  trend={metric.trend}
                />
              ))}
            </MetricGrid>
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
                  <CardDescription>Daily delivery performance overview</CardDescription>
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
                    Revenue by Merchant
                  </CardTitle>
                  <CardDescription>Revenue breakdown from receipts</CardDescription>
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
                  <CardDescription>Drivers and deliveries with available coordinates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] rounded-lg overflow-hidden border border-border">
                    <MapView
                      deliveries={deliveries}
                      drivers={activeDrivers as any}
                      warehouses={warehouses as any}
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
                  <CardDescription>Driver utilization overview</CardDescription>
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
                  Recent Deliveries
                </CardTitle>
                <CardDescription>Latest deliveries and their current status</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable columns={deliveryColumns} data={recentDeliveries} searchable />
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