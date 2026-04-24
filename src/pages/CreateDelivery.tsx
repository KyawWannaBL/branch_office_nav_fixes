import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Upload, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeliveryForm } from '@/components/Forms';
import { MetricCard, CompactMetric } from '@/components/Stats';
import { ROUTE_PATHS, generateAWB, type Shipment } from '@/lib/index';
import { springPresets, fadeInUp, staggerContainer, staggerItem } from '@/lib/motion';
import { IMAGES } from '@/assets/images';

type FormStep = 'details' | 'review' | 'success';

export default function CreateDelivery() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<FormStep>('details');
  const [formData, setFormData] = useState<Partial<Shipment> | null>(null);
  const [awbNumber, setAwbNumber] = useState<string>('');

  const handleFormSubmit = (data: any) => {
    setFormData(data);
    setCurrentStep('review');
  };

  const handleConfirmDelivery = () => {
    const newAwb = generateAWB();
    setAwbNumber(newAwb);
    setCurrentStep('success');

    setTimeout(() => {
      navigate(ROUTE_PATHS.DASHBOARD);
    }, 3000);
  };

  const handleBackToForm = () => {
    setCurrentStep('details');
  };

  const handleCreateAnother = () => {
    setCurrentStep('details');
    setFormData(null);
    setAwbNumber('');
  };

  const steps = [
    { id: 'details', label: 'Delivery Details', icon: Package },
    { id: 'review', label: 'Review & Confirm', icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-background to-accent/5 border-b border-border">
        <div className="absolute inset-0 opacity-30">
          <img
            src={IMAGES.SCREENSHOT_1487_2}
            alt="Delivery Background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/70" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springPresets.gentle}
          >
            <h1 className="text-4xl font-bold text-foreground mb-3">
              Create New Delivery
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Fill in the delivery details below to create a new shipment. You can also upload bulk deliveries via CSV.
            </p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
          >
            <motion.div variants={staggerItem}>
              <CompactMetric
                label="Today's Deliveries"
                value={47}
                icon={<Package className="w-4 h-4" />}
                color="text-primary"
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <CompactMetric
                label="Pending Pickup"
                value={12}
                icon={<Package className="w-4 h-4" />}
                color="text-chart-4"
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <CompactMetric
                label="In Transit"
                value={35}
                icon={<Package className="w-4 h-4" />}
                color="text-accent"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep !== 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springPresets.gentle}
            className="mb-8"
          >
            {/* Step Indicator */}
            <div className="flex items-center justify-center space-x-4">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;

                return (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : isCompleted
                          ? 'bg-chart-3 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <StepIcon className="w-5 h-5" />
                      <span className="font-medium">{step.label}</span>
                    </div>
                    {index < steps.length - 1 && (
                      <ArrowRight className="w-5 h-5 mx-2 text-muted-foreground" />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Form Step */}
        {currentStep === 'details' && (
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={springPresets.gentle}
          >
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
                <CardDescription>
                  Enter sender and recipient details, package information, and service preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DeliveryForm onSubmit={handleFormSubmit} defaultValues={formData} />
              </CardContent>
            </Card>

            {/* Bulk Upload Option */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springPresets.gentle, delay: 0.2 }}
              className="mt-6"
            >
              <Card className="border-dashed border-2 hover:border-primary transition-colors">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-accent rounded-lg">
                      <Upload className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Bulk Upload</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload multiple deliveries at once using CSV file
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="lg">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload CSV
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Review Step */}
        {currentStep === 'review' && formData && (
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={springPresets.gentle}
          >
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Review Delivery Details</CardTitle>
                <CardDescription>
                  Please review the information below before confirming the delivery
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sender Information */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Sender Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium text-foreground">{formData.sender?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium text-foreground">{formData.sender?.phone}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium text-foreground">
                        {formData.sender?.address.street}, {formData.sender?.address.city},{' '}
                        {formData.sender?.address.state} {formData.sender?.address.postalCode}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recipient Information */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Recipient Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium text-foreground">{formData.recipient?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium text-foreground">{formData.recipient?.phone}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium text-foreground">
                        {formData.recipient?.address.street}, {formData.recipient?.address.city},{' '}
                        {formData.recipient?.address.state} {formData.recipient?.address.postalCode}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Package Details */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Package Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Weight</p>
                      <p className="font-medium text-foreground">{formData.packageDetails?.weight} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dimensions</p>
                      <p className="font-medium text-foreground">
                        {formData.packageDetails?.dimensions.length} x{' '}
                        {formData.packageDetails?.dimensions.width} x{' '}
                        {formData.packageDetails?.dimensions.height} cm
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Value</p>
                      <p className="font-medium text-foreground">MMK {formData.packageDetails?.value?.toLocaleString()}</p>
                    </div>
                    <div className="md:col-span-3">
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="font-medium text-foreground">{formData.packageDetails?.description}</p>
                    </div>
                  </div>
                </div>

                {/* Service Details */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Service Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Service Type</p>
                      <p className="font-medium text-foreground capitalize">
                        {formData.serviceType?.replace('-', ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Method</p>
                      <p className="font-medium text-foreground uppercase">{formData.paymentMethod}</p>
                    </div>
                    {formData.codAmount && (
                      <div>
                        <p className="text-sm text-muted-foreground">COD Amount</p>
                        <p className="font-medium text-foreground">MMK {formData.codAmount.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {formData.specialInstructions && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">Special Instructions</h3>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-foreground">{formData.specialInstructions}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-border">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleBackToForm}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Edit
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleConfirmDelivery}
                  >
                    Confirm & Create Delivery
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Success Step */}
        {currentStep === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springPresets.bouncy}
            className="flex items-center justify-center min-h-[60vh]"
          >
            <Card className="max-w-2xl w-full shadow-2xl">
              <CardContent className="p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ ...springPresets.bouncy, delay: 0.2 }}
                  className="inline-flex items-center justify-center w-24 h-24 bg-chart-3 rounded-full mb-6"
                >
                  <CheckCircle className="w-12 h-12 text-white" />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springPresets.gentle, delay: 0.3 }}
                  className="text-3xl font-bold text-foreground mb-3"
                >
                  Delivery Created Successfully!
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springPresets.gentle, delay: 0.4 }}
                  className="text-lg text-muted-foreground mb-8"
                >
                  Your delivery has been created and is ready for processing.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springPresets.gentle, delay: 0.5 }}
                  className="p-6 bg-muted/50 rounded-lg mb-8"
                >
                  <p className="text-sm text-muted-foreground mb-2">AWB Number</p>
                  <p className="text-2xl font-bold text-primary">{awbNumber}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springPresets.gentle, delay: 0.6 }}
                  className="flex items-center justify-center space-x-4"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleCreateAnother}
                  >
                    Create Another
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => navigate(ROUTE_PATHS.DASHBOARD)}
                  >
                    Go to Dashboard
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}