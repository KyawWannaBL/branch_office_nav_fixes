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
  Truck,
  AlertCircle,
  FileText,
} from 'lucide-react';

import {
  ROUTE_PATHS,
  formatCurrency,
  type Delivery,
  type Receipt,
  DeliveryStatus,
  PaymentStatus,
  type Deliveryman,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard, MetricGrid } from '@/components/Stats';
import { DataTable, type Column } from '@/components/DataTable';

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

function EmptyState({
  title,
  description,
  ctaLabel,
  ctaTo,
}: {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaTo?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
      <AlertCircle className="mb-4 h-10 w-10 text-muted-foreground" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
      {ctaLabel && ctaTo ? (
        <Button asChild className="mt-6">
          <Link to={ctaTo}>{ctaLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('today');

  const deliveries = mockDeliveries;
  const receipts = mockReceipts;
  const drivers = mockDeliverymen;

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
      change: 0,
      icon: <Package className="h-5 w-5" />,
      trend: 'up' as const,
    },
    {
      title: 'On-Time Rate',
      value: `${metrics.onTimeRate}%`,
      change: 0,
      icon: <Clock className="h-5 w-5" />,
      trend: 'up' as const,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(revenue.totalRevenue),
      change: 0,
      icon: <DollarSign className="h-5 w-5" />,
      trend: 'up' as const,
    },
    {
      title: 'Active Drivers',
      value: activeDrivers.length,
      change: 0,
      icon: <Users className="h-5 w-5" />,
      trend: 'up' as const,
    },
  ];

  const recentDeliveries = deliveries.slice(0, 5);
  const recentReceipts = receipts.slice(0, 5);

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

  const receiptColumns: Column<Receipt>[] = [
    {
      id: 'receiptNumber',
      header: 'Receipt',
      accessor: 'receiptNumber',
      cell: (row: Receipt) => (
        <span className="font-mono text-sm font-medium">{row.receiptNumber}</span>
      ),
    },
    {
      id: 'merchantName',
      header: 'Merchant',
      accessor: 'merchantName',
    },
    {
      id: 'amount',
      header: 'Amount',
      accessor: 'amount',
      cell: (row: Receipt) => formatCurrency(row.amount),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      cell: (row: Receipt) => (
        <Badge className={getStatusColor(row.status)}>
          {getStatusLabel(row.status)}
        </Badge>
      ),
    },
  ];

  const hasData =
    deliveries.length > 0 || receipts.length > 0 || drivers.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="relative z-10">
        <div className="container mx-auto space-y-8 px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
                <p className="mt-2 text-muted-foreground">
                  Operational overview for deliveries, finance, and driver activity.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to={ROUTE_PATHS.CREATE_DELIVERY}>
                    <Plus className="mr-2 h-5 w-5" />
                    Create Delivery
                  </Link>
                </Button>

                <Button asChild variant="outline" size="lg">
                  <Link to={ROUTE_PATHS.DELIVERYMEN}>
                    <Truck className="mr-2 h-5 w-5" />
                    View Drivers
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
          >
            <Tabs
              value={timeRange}
              onValueChange={(v) => setTimeRange(v as TimeRange)}
              className="w-full"
            >
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
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

          {!hasData ? (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Production-Safe Empty State</CardTitle>
                  <CardDescription>
                    This dashboard is running without seeded mock data. Connect live
                    Supabase data or create records from the app to populate this view.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmptyState
                    title="No operational data available yet"
                    description="The app is now stable, but your current repository exports empty arrays for deliveries, receipts, and drivers. Once real records are loaded, this dashboard will populate automatically."
                    ctaLabel="Create first delivery"
                    ctaTo={ROUTE_PATHS.CREATE_DELIVERY}
                  />
                </CardContent>
              </Card>
            </motion.div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Recent Deliveries
                  </CardTitle>
                  <CardDescription>
                    Latest delivery records and current shipment state.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentDeliveries.length > 0 ? (
                    <DataTable columns={deliveryColumns} data={recentDeliveries} searchable />
                  ) : (
                    <EmptyState
                      title="No deliveries yet"
                      description="Create a delivery to start tracking way numbers, recipients, status, and fee collection."
                      ctaLabel="Create Delivery"
                      ctaTo={ROUTE_PATHS.CREATE_DELIVERY}
                    />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.25 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Driver Snapshot
                  </CardTitle>
                  <CardDescription>
                    Quick view of currently active drivers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeDrivers.length > 0 ? (
                    activeDrivers.slice(0, 5).map((driver) => (
                      <div
                        key={driver.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">{driver.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {driver.vehicleType} • {driver.assignedZone}
                          </p>
                        </div>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="No active drivers"
                      description="Driver records are empty right now. Add live driver data to show active fleet status."
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Receipt Snapshot
                  </CardTitle>
                  <CardDescription>
                    Paid and pending receipt totals.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="mt-1 text-2xl font-bold">
                      {formatCurrency(revenue.totalRevenue)}
                    </p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">COD Collected</p>
                    <p className="mt-1 text-xl font-semibold text-green-600">
                      {formatCurrency(revenue.codCollected)}
                    </p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Pending COD</p>
                    <p className="mt-1 text-xl font-semibold text-amber-600">
                      {formatCurrency(revenue.pendingCod)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Recent Receipts
                </CardTitle>
                <CardDescription>
                  Financial records for recently generated receipts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentReceipts.length > 0 ? (
                  <DataTable columns={receiptColumns} data={recentReceipts} searchable />
                ) : (
                  <EmptyState
                    title="No receipts yet"
                    description="Receipt data is currently empty. Once paid or pending receipts exist, they will appear here."
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.35 }}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            <Card className="border-chart-3/20 bg-gradient-to-br from-chart-3/10 to-chart-3/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <p className="mt-2 text-3xl font-bold">{metrics.successRate}%</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-3/20">
                    <TrendingUp className="h-6 w-6 text-chart-3" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">In Transit</p>
                    <p className="mt-2 text-3xl font-bold">{metrics.inTransit}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-chart-4/20 bg-gradient-to-br from-chart-4/10 to-chart-4/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
                    <p className="mt-2 text-3xl font-bold">{metrics.pending}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-4/20">
                    <Clock className="h-6 w-6 text-chart-4" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/20 bg-gradient-to-br from-destructive/10 to-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Failed</p>
                    <p className="mt-2 text-3xl font-bold">{metrics.failed}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20">
                    <TrendingDown className="h-6 w-6 text-destructive" />
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