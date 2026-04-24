import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { generateAWB, validatePhone, validateEmail, validatePostalCode, type ServiceType, type TaskPriority } from '@/lib/index';
import { Package, User, MapPin, DollarSign, FileText, Truck, Calendar, AlertCircle } from 'lucide-react';

const deliverySchema = z.object({
  senderName: z.string().min(2, 'Name must be at least 2 characters'),
  senderPhone: z.string().refine(validatePhone, 'Invalid phone number'),
  senderEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  senderStreet: z.string().min(5, 'Street address is required'),
  senderCity: z.string().min(2, 'City is required'),
  senderState: z.string().min(2, 'State is required'),
  senderPostalCode: z.string().refine((val) => validatePostalCode(val), 'Invalid postal code'),
  recipientName: z.string().min(2, 'Name must be at least 2 characters'),
  recipientPhone: z.string().refine(validatePhone, 'Invalid phone number'),
  recipientEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  recipientStreet: z.string().min(5, 'Street address is required'),
  recipientCity: z.string().min(2, 'City is required'),
  recipientState: z.string().min(2, 'State is required'),
  recipientPostalCode: z.string().refine((val) => validatePostalCode(val), 'Invalid postal code'),
  serviceType: z.enum(['standard', 'express', 'same-day', 'next-day', 'economy']),
  codAmount: z.number().min(0).optional(),
  specialInstructions: z.string().optional(),
});

const shipmentSchema = z.object({
  awb: z.string().min(10, 'AWB number is required'),
  description: z.string().min(3, 'Package description is required'),
  weight: z.number().min(0.1, 'Weight must be at least 0.1 kg'),
  length: z.number().min(1, 'Length must be at least 1 cm'),
  width: z.number().min(1, 'Width must be at least 1 cm'),
  height: z.number().min(1, 'Height must be at least 1 cm'),
  value: z.number().min(0, 'Package value must be positive'),
});

const taskAssignmentSchema = z.object({
  title: z.string().min(3, 'Task title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  driverId: z.string().min(1, 'Driver selection is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

type DeliveryFormData = z.infer<typeof deliverySchema>;
type ShipmentFormData = z.infer<typeof shipmentSchema>;
type TaskAssignmentFormData = z.infer<typeof taskAssignmentSchema>;

interface FormProps {
  onSubmit: (data: any) => void;
  defaultValues?: any;
}

export function DeliveryForm({ onSubmit, defaultValues }: FormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
    defaultValues: defaultValues || {
      serviceType: 'standard',
      codAmount: 0,
    },
  });

  const serviceType = watch('serviceType');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Sender Information
          </CardTitle>
          <CardDescription>Enter sender contact and address details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="senderName">Full Name *</Label>
              <Input
                id="senderName"
                {...register('senderName')}
                placeholder="John Doe"
              />
              {errors.senderName && (
                <p className="text-sm text-destructive">{errors.senderName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderPhone">Phone Number *</Label>
              <Input
                id="senderPhone"
                {...register('senderPhone')}
                placeholder="+95 9 123 456 789"
              />
              {errors.senderPhone && (
                <p className="text-sm text-destructive">{errors.senderPhone.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="senderEmail">Email (Optional)</Label>
            <Input
              id="senderEmail"
              type="email"
              {...register('senderEmail')}
              placeholder="sender@example.com"
            />
            {errors.senderEmail && (
              <p className="text-sm text-destructive">{errors.senderEmail.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="senderStreet">Street Address *</Label>
            <Input
              id="senderStreet"
              {...register('senderStreet')}
              placeholder="123 Main Street, Building A"
            />
            {errors.senderStreet && (
              <p className="text-sm text-destructive">{errors.senderStreet.message}</p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="senderCity">City *</Label>
              <Input
                id="senderCity"
                {...register('senderCity')}
                placeholder="Yangon"
              />
              {errors.senderCity && (
                <p className="text-sm text-destructive">{errors.senderCity.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderState">State/Region *</Label>
              <Input
                id="senderState"
                {...register('senderState')}
                placeholder="Yangon Region"
              />
              {errors.senderState && (
                <p className="text-sm text-destructive">{errors.senderState.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderPostalCode">Postal Code *</Label>
              <Input
                id="senderPostalCode"
                {...register('senderPostalCode')}
                placeholder="11181"
              />
              {errors.senderPostalCode && (
                <p className="text-sm text-destructive">{errors.senderPostalCode.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Recipient Information
          </CardTitle>
          <CardDescription>Enter recipient contact and delivery address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipientName">Full Name *</Label>
              <Input
                id="recipientName"
                {...register('recipientName')}
                placeholder="Jane Smith"
              />
              {errors.recipientName && (
                <p className="text-sm text-destructive">{errors.recipientName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientPhone">Phone Number *</Label>
              <Input
                id="recipientPhone"
                {...register('recipientPhone')}
                placeholder="+95 9 987 654 321"
              />
              {errors.recipientPhone && (
                <p className="text-sm text-destructive">{errors.recipientPhone.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Email (Optional)</Label>
            <Input
              id="recipientEmail"
              type="email"
              {...register('recipientEmail')}
              placeholder="recipient@example.com"
            />
            {errors.recipientEmail && (
              <p className="text-sm text-destructive">{errors.recipientEmail.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipientStreet">Street Address *</Label>
            <Input
              id="recipientStreet"
              {...register('recipientStreet')}
              placeholder="456 Oak Avenue, Apartment 2B"
            />
            {errors.recipientStreet && (
              <p className="text-sm text-destructive">{errors.recipientStreet.message}</p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipientCity">City *</Label>
              <Input
                id="recipientCity"
                {...register('recipientCity')}
                placeholder="Mandalay"
              />
              {errors.recipientCity && (
                <p className="text-sm text-destructive">{errors.recipientCity.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientState">State/Region *</Label>
              <Input
                id="recipientState"
                {...register('recipientState')}
                placeholder="Mandalay Region"
              />
              {errors.recipientState && (
                <p className="text-sm text-destructive">{errors.recipientState.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientPostalCode">Postal Code *</Label>
              <Input
                id="recipientPostalCode"
                {...register('recipientPostalCode')}
                placeholder="05011"
              />
              {errors.recipientPostalCode && (
                <p className="text-sm text-destructive">{errors.recipientPostalCode.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Service Details
          </CardTitle>
          <CardDescription>Select service type and payment options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serviceType">Service Type *</Label>
            <Select
              value={serviceType}
              onValueChange={(value) => setValue('serviceType', value as ServiceType)}
            >
              <SelectTrigger id="serviceType">
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard (3-5 days)</SelectItem>
                <SelectItem value="express">Express (1-2 days)</SelectItem>
                <SelectItem value="same-day">Same Day</SelectItem>
                <SelectItem value="next-day">Next Day</SelectItem>
                <SelectItem value="economy">Economy (5-7 days)</SelectItem>
              </SelectContent>
            </Select>
            {errors.serviceType && (
              <p className="text-sm text-destructive">{errors.serviceType.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="codAmount">COD Amount (MMK)</Label>
            <Input
              id="codAmount"
              type="number"
              {...register('codAmount', { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.codAmount && (
              <p className="text-sm text-destructive">{errors.codAmount.message}</p>
            )}
            <p className="text-sm text-muted-foreground">Leave as 0 for prepaid deliveries</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialInstructions">Special Instructions</Label>
            <Textarea
              id="specialInstructions"
              {...register('specialInstructions')}
              placeholder="Any special handling requirements or delivery instructions..."
              rows={3}
            />
            {errors.specialInstructions && (
              <p className="text-sm text-destructive">{errors.specialInstructions.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline">Cancel</Button>
        <Button type="submit">Create Delivery</Button>
      </div>
    </form>
  );
}

export function ShipmentForm({ onSubmit, defaultValues }: FormProps) {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ShipmentFormData>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: defaultValues || {
      awb: generateAWB(),
      weight: 1,
      length: 10,
      width: 10,
      height: 10,
      value: 0,
    },
  });

  const handleGenerateAWB = () => {
    setValue('awb', generateAWB());
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Shipment Details
          </CardTitle>
          <CardDescription>Generate AWB and enter package information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="awb">AWB Number *</Label>
            <div className="flex gap-2">
              <Input
                id="awb"
                {...register('awb')}
                placeholder="BRX12345678901"
                readOnly
              />
              <Button type="button" onClick={handleGenerateAWB} variant="outline">
                Generate
              </Button>
            </div>
            {errors.awb && (
              <p className="text-sm text-destructive">{errors.awb.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Package Description *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Electronics, clothing, documents, etc."
              rows={2}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Package Dimensions
          </CardTitle>
          <CardDescription>Enter weight and dimensions for accurate pricing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg) *</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              {...register('weight', { valueAsNumber: true })}
              placeholder="1.0"
            />
            {errors.weight && (
              <p className="text-sm text-destructive">{errors.weight.message}</p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="length">Length (cm) *</Label>
              <Input
                id="length"
                type="number"
                {...register('length', { valueAsNumber: true })}
                placeholder="10"
              />
              {errors.length && (
                <p className="text-sm text-destructive">{errors.length.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="width">Width (cm) *</Label>
              <Input
                id="width"
                type="number"
                {...register('width', { valueAsNumber: true })}
                placeholder="10"
              />
              {errors.width && (
                <p className="text-sm text-destructive">{errors.width.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm) *</Label>
              <Input
                id="height"
                type="number"
                {...register('height', { valueAsNumber: true })}
                placeholder="10"
              />
              {errors.height && (
                <p className="text-sm text-destructive">{errors.height.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Package Value
          </CardTitle>
          <CardDescription>Declared value for insurance purposes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="value">Declared Value (MMK) *</Label>
            <Input
              id="value"
              type="number"
              {...register('value', { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.value && (
              <p className="text-sm text-destructive">{errors.value.message}</p>
            )}
            <p className="text-sm text-muted-foreground">Used for insurance calculation</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline">Cancel</Button>
        <Button type="submit">Create Shipment</Button>
      </div>
    </form>
  );
}

export function TaskAssignmentForm({ onSubmit, defaultValues }: FormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<TaskAssignmentFormData>({
    resolver: zodResolver(taskAssignmentSchema),
    defaultValues: defaultValues || {
      priority: 'medium',
    },
  });

  const priority = watch('priority');

  const mockDrivers = [
    { id: 'DRV001', name: 'Aung Kyaw', status: 'active' },
    { id: 'DRV002', name: 'Zaw Min', status: 'active' },
    { id: 'DRV003', name: 'Htet Htet', status: 'active' },
    { id: 'DRV004', name: 'Myo Win', status: 'on-leave' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Task Information
          </CardTitle>
          <CardDescription>Create and assign a new task to a driver</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Deliver urgent package to downtown"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Detailed task description, requirements, and any special instructions..."
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Assignment Details
          </CardTitle>
          <CardDescription>Select driver and set priority</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="driverId">Assign to Driver *</Label>
            <Select
              onValueChange={(value) => setValue('driverId', value)}
            >
              <SelectTrigger id="driverId">
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                {mockDrivers.map((driver) => (
                  <SelectItem
                    key={driver.id}
                    value={driver.id}
                    disabled={driver.status !== 'active'}
                  >
                    {driver.name} {driver.status !== 'active' && `(${driver.status})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.driverId && (
              <p className="text-sm text-destructive">{errors.driverId.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority *</Label>
            <Select
              value={priority}
              onValueChange={(value) => setValue('priority', value as TaskPriority)}
            >
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            {errors.priority && (
              <p className="text-sm text-destructive">{errors.priority.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (Optional)</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              {...register('dueDate')}
            />
            {errors.dueDate && (
              <p className="text-sm text-destructive">{errors.dueDate.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Additional Notes
          </CardTitle>
          <CardDescription>Any additional information for the driver</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes, contact information, or special requirements..."
              rows={3}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline">Cancel</Button>
        <Button type="submit">Assign Task</Button>
      </div>
    </form>
  );
}