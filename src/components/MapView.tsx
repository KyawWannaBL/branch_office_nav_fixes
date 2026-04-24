import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Warehouse, Truck, Package, AlertCircle } from 'lucide-react';
import { Delivery, Employee, Warehouse as WarehouseType } from '@/lib/index';
import { mockShipments } from '@/data/index';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { springPresets } from '@/lib/motion';

interface MapViewProps {
  deliveries?: Delivery[];
  drivers?: Employee[];
  warehouses?: WarehouseType[];
}

interface MapMarker {
  id: string;
  type: 'delivery' | 'driver' | 'warehouse';
  lat: number;
  lng: number;
  label: string;
  status?: string;
  data?: any;
}

export function MapView({ deliveries = [], drivers = [], warehouses = [] }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 16.8661, lng: 96.1951 });
  const [zoom, setZoom] = useState(12);

  const markers: MapMarker[] = [
    ...deliveries.map(delivery => {
      const shipment = mockShipments.find(s => s.id === delivery.shipmentId);
      if (!shipment?.recipient.address.coordinates) return null;
      return {
        id: delivery.id,
        type: 'delivery' as const,
        lat: shipment.recipient.address.coordinates.lat,
        lng: shipment.recipient.address.coordinates.lng,
        label: shipment.awb,
        status: delivery.status,
        data: { delivery, shipment },
      };
    }).filter(Boolean) as MapMarker[],
    ...drivers.map(driver => {
      if (!driver.currentLocation) return null;
      return {
        id: driver.id,
        type: 'driver' as const,
        lat: driver.currentLocation.lat,
        lng: driver.currentLocation.lng,
        label: driver.name,
        status: driver.status,
        data: driver,
      };
    }).filter(Boolean) as MapMarker[],
    ...warehouses.map(warehouse => {
      if (!warehouse.address.coordinates) return null;
      return {
        id: warehouse.id,
        type: 'warehouse' as const,
        lat: warehouse.address.coordinates.lat,
        lng: warehouse.address.coordinates.lng,
        label: warehouse.name,
        status: warehouse.status,
        data: warehouse,
      };
    }).filter(Boolean) as MapMarker[],
  ];

  const getMarkerColor = (marker: MapMarker): string => {
    if (marker.type === 'warehouse') return 'bg-accent';
    if (marker.type === 'driver') return 'bg-primary';
    
    switch (marker.status) {
      case 'delivered':
        return 'bg-chart-3';
      case 'in-transit':
      case 'out-for-delivery':
        return 'bg-primary';
      case 'failed':
        return 'bg-destructive';
      default:
        return 'bg-muted';
    }
  };

  const getMarkerIcon = (marker: MapMarker) => {
    switch (marker.type) {
      case 'warehouse':
        return <Warehouse className="w-4 h-4" />;
      case 'driver':
        return <Truck className="w-4 h-4" />;
      case 'delivery':
        return <Package className="w-4 h-4" />;
    }
  };

  const calculateMapPosition = (lat: number, lng: number) => {
    const latOffset = (lat - mapCenter.lat) * 100 * zoom;
    const lngOffset = (lng - mapCenter.lng) * 100 * zoom;
    return {
      top: `${50 - latOffset}%`,
      left: `${50 + lngOffset}%`,
    };
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 2, 20));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 2, 8));
  const handleRecenter = () => {
    if (markers.length > 0) {
      const avgLat = markers.reduce((sum, m) => sum + m.lat, 0) / markers.length;
      const avgLng = markers.reduce((sum, m) => sum + m.lng, 0) / markers.length;
      setMapCenter({ lat: avgLat, lng: avgLng });
    }
  };

  useEffect(() => {
    if (markers.length > 0 && mapCenter.lat === 16.8661 && mapCenter.lng === 96.1951) {
      handleRecenter();
    }
  }, [markers.length]);

  return (
    <div className="relative w-full h-full min-h-[600px] bg-muted/30 rounded-xl overflow-hidden">
      <div
        ref={mapRef}
        className="absolute inset-0 bg-gradient-to-br from-muted/50 via-background to-muted/50"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      >
        {markers.map((marker) => {
          const position = calculateMapPosition(marker.lat, marker.lng);
          return (
            <motion.div
              key={marker.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={position}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={springPresets.gentle}
              whileHover={{ scale: 1.2 }}
              onClick={() => setSelectedMarker(marker)}
            >
              <div
                className={`
                  ${getMarkerColor(marker)}
                  text-white rounded-full p-2 shadow-lg
                  border-2 border-background
                  transition-all duration-200
                  ${selectedMarker?.id === marker.id ? 'ring-4 ring-ring' : ''}
                `}
              >
                {getMarkerIcon(marker)}
              </div>
              {marker.type === 'driver' && (
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-chart-3 rounded-full border-2 border-background"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <Button
          size="icon"
          variant="secondary"
          onClick={handleZoomIn}
          className="shadow-lg"
        >
          +
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={handleZoomOut}
          className="shadow-lg"
        >
          -
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={handleRecenter}
          className="shadow-lg"
        >
          <Navigation className="w-4 h-4" />
        </Button>
      </div>

      <div className="absolute top-4 left-4 flex gap-4 z-10">
        <Card className="p-3 shadow-lg">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Active Drivers ({drivers.filter(d => d.status === 'active').length})</span>
          </div>
        </Card>
        <Card className="p-3 shadow-lg">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-chart-3" />
            <span className="text-muted-foreground">Delivered ({deliveries.filter(d => d.status === 'delivered').length})</span>
          </div>
        </Card>
        <Card className="p-3 shadow-lg">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-muted-foreground">Warehouses ({warehouses.length})</span>
          </div>
        </Card>
      </div>

      {selectedMarker && (
        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md z-20"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={springPresets.gentle}
        >
          <Card className="p-4 shadow-2xl">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`${getMarkerColor(selectedMarker)} text-white rounded-full p-2`}>
                  {getMarkerIcon(selectedMarker)}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedMarker.label}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{selectedMarker.type}</p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelectedMarker(null)}
              >
                ×
              </Button>
            </div>

            {selectedMarker.type === 'delivery' && selectedMarker.data && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="secondary" className="capitalize">
                    {selectedMarker.data.delivery.status.replace('-', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Recipient</span>
                  <span className="text-sm font-medium">{selectedMarker.data.shipment.recipient.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Address</span>
                  <span className="text-sm font-medium text-right max-w-[200px] truncate">
                    {selectedMarker.data.shipment.recipient.address.street}
                  </span>
                </div>
                {selectedMarker.data.shipment.codAmount && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">COD Amount</span>
                    <span className="text-sm font-medium">
                      MMK {selectedMarker.data.shipment.codAmount.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {selectedMarker.type === 'driver' && selectedMarker.data && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="secondary" className="capitalize">
                    {selectedMarker.data.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Vehicle</span>
                  <span className="text-sm font-medium">
                    {selectedMarker.data.vehicleAssignment?.licensePlate || 'N/A'}
                  </span>
                </div>
                {selectedMarker.data.performance && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Success Rate</span>
                      <span className="text-sm font-medium">
                        {selectedMarker.data.performance.successRate}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Deliveries</span>
                      <span className="text-sm font-medium">
                        {selectedMarker.data.performance.totalDeliveries}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {selectedMarker.type === 'warehouse' && selectedMarker.data && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <Badge variant="secondary" className="capitalize">
                    {selectedMarker.data.type.replace('-', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Capacity</span>
                  <span className="text-sm font-medium">
                    {selectedMarker.data.capacity.current} / {selectedMarker.data.capacity.total} {selectedMarker.data.capacity.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant={selectedMarker.data.status === 'operational' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {selectedMarker.data.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Contact</span>
                  <span className="text-sm font-medium">{selectedMarker.data.contactPerson.phone}</span>
                </div>
              </div>
            )}

            <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>
                {selectedMarker.lat.toFixed(4)}, {selectedMarker.lng.toFixed(4)}
              </span>
            </div>
          </Card>
        </motion.div>
      )}

      {markers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Card className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold mb-1">No Data Available</h3>
            <p className="text-sm text-muted-foreground">
              No deliveries, drivers, or warehouses to display on the map
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}