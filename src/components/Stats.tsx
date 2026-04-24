import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DeliveryStatus, getStatusColor, formatStatus } from "@/lib/index";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon?: React.ReactNode;
  unit?: string;
  description?: string;
}

export function MetricCard({ title, value, trend, icon, unit, description }: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return <Minus className="w-4 h-4" />;
    return trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return "text-muted-foreground";
    return trend > 0 ? "text-chart-3" : "text-destructive";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold tracking-tight">
                {value}
                {unit && <span className="text-lg font-normal text-muted-foreground ml-1">{unit}</span>}
              </h3>
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend !== undefined && (
              <div className={cn("flex items-center gap-1 mt-2 text-sm font-medium", getTrendColor())}>
                {getTrendIcon()}
                <span>{Math.abs(trend)}%</span>
                <span className="text-xs text-muted-foreground font-normal">
                  vs last period
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

interface StatsGridProps {
  metrics: Array<{
    title: string;
    value: string | number;
    trend?: number;
    icon?: React.ReactNode;
    unit?: string;
    description?: string;
  }>;
  columns?: 2 | 3 | 4;
}

export function StatsGrid({ metrics, columns = 4 }: StatsGridProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className={cn("grid gap-6", gridCols)}>
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}

interface StatusBadgeProps {
  status: DeliveryStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export function StatusBadge({ status, size = "md", showIcon = false }: StatusBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  }[size];

  const statusIcons: Record<DeliveryStatus, string> = {
    'pending': '⏳',
    'assigned': '📋',
    'picked-up': '📦',
    'in-transit': '🚚',
    'out-for-delivery': '🚗',
    'delivered': '✅',
    'failed': '❌',
    'cancelled': '🚫',
    'returned': '↩️',
  };

  return (
    <Badge
      className={cn(
        "font-medium rounded-full transition-all duration-200",
        getStatusColor(status),
        sizeClasses
      )}
    >
      {showIcon && <span className="mr-1">{statusIcons[status]}</span>}
      {formatStatus(status)}
    </Badge>
  );
}

interface CompactMetricProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}

export function CompactMetric({ label, value, icon, color = "text-primary" }: CompactMetricProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      {icon && (
        <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg bg-background", color)}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-lg font-semibold tracking-tight">{value}</p>
      </div>
    </div>
  );
}

interface ProgressMetricProps {
  label: string;
  value: number;
  max: number;
  unit?: string;
  color?: string;
}

export function ProgressMetric({ label, value, max, unit, color = "bg-primary" }: ProgressMetricProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">
          {value}{unit} / {max}{unit}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {percentage.toFixed(1)}% capacity
      </p>
    </div>
  );
}
