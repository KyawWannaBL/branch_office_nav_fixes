import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Bell, Globe, Moon, Sun, Key, Shield, Copy, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { springPresets, fadeInUp } from '@/lib/motion';
import type { EmployeeRole } from '@/lib/index';
import { IMAGES } from '@/assets/images';

const ROLE_LABELS: Record<EmployeeRole, string> = {
  'super-admin': 'Super Administrator',
  'admin': 'Administrator',
  'branch-office': 'Branch Office',
  'supervisor': 'Supervisor',
  'wayplan-manager': 'Wayplan Manager',
  'driver': 'Driver',
  'rider': 'Rider',
  'warehouse-staff': 'Warehouse Staff',
  'customer-service': 'Customer Service',
  'data-entry': 'Data Entry',
  'marketing': 'Marketing',
  'hr-admin': 'HR Administrator',
  'finance': 'Finance',
  'merchant': 'Merchant',
  'customer': 'Customer',
};

const PORTAL_ACCESS_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/supervisor': 'Supervisor Portal',
  '/driver': 'Driver Portal',
  '/warehouse': 'Warehouse Portal',
  '/customer-service': 'Customer Service',
  '/create-delivery': 'Create Delivery',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
};

export default function Settings() {
  const { user, logout, canAccessPortal } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+95 9 123 456 789',
    employeeNumber: 'EMP-2026-001',
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    email: user?.preferences.notifications.email ?? true,
    push: user?.preferences.notifications.push ?? true,
    sms: user?.preferences.notifications.sms ?? false,
    deliveryUpdates: true,
    taskAssignments: true,
    systemAlerts: true,
    weeklyReports: false,
  });

  const [language, setLanguage] = useState<'en' | 'mm'>(user?.preferences.language || 'en');
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(user?.preferences.theme || 'auto');

  const mockApiKey = 'brx_live_sk_1234567890abcdefghijklmnopqrstuvwxyz';

  const handleSaveProfile = async () => {
    setSaveStatus('saving');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleSaveNotifications = async () => {
    setSaveStatus('saving');
    await new Promise(resolve => setTimeout(resolve, 800));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleSaveLanguage = async () => {
    setSaveStatus('saving');
    await new Promise(resolve => setTimeout(resolve, 600));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(mockApiKey);
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  const handleGenerateNewKey = async () => {
    setSaveStatus('saving');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const accessiblePortals = Object.entries(PORTAL_ACCESS_LABELS).filter(([path]) => 
    canAccessPortal(path as any)
  );

  return (
    <div className="min-h-screen bg-background relative">
      <div
        className="absolute inset-0 z-0 opacity-30"
        style={{
          backgroundImage: `url(${IMAGES.SCREENSHOT_6534_2})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/70" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springPresets.gentle}
        className="relative z-10 container mx-auto px-4 py-8 max-w-6xl"
      >
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Settings</h1>
          <p className="text-muted-foreground text-lg">
            Manage your account preferences and system configuration
          </p>
        </div>

        {saveStatus === 'saved' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6"
          >
            <Alert className="bg-chart-3/10 border-chart-3">
              <CheckCircle2 className="h-4 w-4 text-chart-3" />
              <AlertDescription className="text-chart-3">
                Settings saved successfully
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {saveStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6"
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to save settings. Please try again.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Language</span>
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <span className="hidden sm:inline">Theme</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Permissions</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">API Keys</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        placeholder="your.email@britium.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="+95 9 XXX XXX XXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employeeNumber">Employee Number</Label>
                      <Input
                        id="employeeNumber"
                        value={profileData.employeeNumber}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Role</Label>
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-sm">
                          {user ? ROLE_LABELS[user.role] : 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Branch</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {user?.branchId || 'Not assigned'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Last Login</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setProfileData({
                      name: user?.name || '',
                      email: user?.email || '',
                      phone: '+95 9 123 456 789',
                      employeeNumber: 'EMP-2026-001',
                    })}>
                      Reset
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={saveStatus === 'saving'}>
                      {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose how you want to receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notif">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        id="email-notif"
                        checked={notificationPrefs.email}
                        onCheckedChange={(checked) => setNotificationPrefs({ ...notificationPrefs, email: checked })}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="push-notif">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive push notifications in browser
                        </p>
                      </div>
                      <Switch
                        id="push-notif"
                        checked={notificationPrefs.push}
                        onCheckedChange={(checked) => setNotificationPrefs({ ...notificationPrefs, push: checked })}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sms-notif">SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via SMS
                        </p>
                      </div>
                      <Switch
                        id="sms-notif"
                        checked={notificationPrefs.sms}
                        onCheckedChange={(checked) => setNotificationPrefs({ ...notificationPrefs, sms: checked })}
                      />
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold">Notification Types</h4>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="delivery-updates">Delivery Updates</Label>
                          <p className="text-sm text-muted-foreground">
                            Status changes and delivery confirmations
                          </p>
                        </div>
                        <Switch
                          id="delivery-updates"
                          checked={notificationPrefs.deliveryUpdates}
                          onCheckedChange={(checked) => setNotificationPrefs({ ...notificationPrefs, deliveryUpdates: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="task-assignments">Task Assignments</Label>
                          <p className="text-sm text-muted-foreground">
                            New tasks and assignment updates
                          </p>
                        </div>
                        <Switch
                          id="task-assignments"
                          checked={notificationPrefs.taskAssignments}
                          onCheckedChange={(checked) => setNotificationPrefs({ ...notificationPrefs, taskAssignments: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="system-alerts">System Alerts</Label>
                          <p className="text-sm text-muted-foreground">
                            Important system notifications and alerts
                          </p>
                        </div>
                        <Switch
                          id="system-alerts"
                          checked={notificationPrefs.systemAlerts}
                          onCheckedChange={(checked) => setNotificationPrefs({ ...notificationPrefs, systemAlerts: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="weekly-reports">Weekly Reports</Label>
                          <p className="text-sm text-muted-foreground">
                            Performance summaries and analytics
                          </p>
                        </div>
                        <Switch
                          id="weekly-reports"
                          checked={notificationPrefs.weeklyReports}
                          onCheckedChange={(checked) => setNotificationPrefs({ ...notificationPrefs, weeklyReports: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveNotifications} disabled={saveStatus === 'saving'}>
                      {saveStatus === 'saving' ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="language" className="space-y-6">
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <Card>
                <CardHeader>
                  <CardTitle>Language Settings</CardTitle>
                  <CardDescription>
                    Choose your preferred language for the interface
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label htmlFor="language-select">Interface Language</Label>
                    <Select value={language} onValueChange={(value: 'en' | 'mm') => setLanguage(value)}>
                      <SelectTrigger id="language-select" className="w-full md:w-[300px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="mm">Myanmar (မြန်မာ)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Changes will take effect immediately across all portals
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">Regional Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date Format</Label>
                        <Select defaultValue="dd/mm/yyyy">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                            <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                            <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Time Format</Label>
                        <Select defaultValue="24h">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                            <SelectItem value="24h">24-hour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Select defaultValue="asia/yangon">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asia/yangon">Asia/Yangon (GMT+6:30)</SelectItem>
                            <SelectItem value="asia/bangkok">Asia/Bangkok (GMT+7)</SelectItem>
                            <SelectItem value="asia/singapore">Asia/Singapore (GMT+8)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select defaultValue="mmk">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mmk">MMK (Kyat)</SelectItem>
                            <SelectItem value="usd">USD (Dollar)</SelectItem>
                            <SelectItem value="thb">THB (Baht)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveLanguage} disabled={saveStatus === 'saving'}>
                      {saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="theme" className="space-y-6">
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <Card>
                <CardHeader>
                  <CardTitle>Theme Settings</CardTitle>
                  <CardDescription>
                    Customize the appearance of your dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label>Color Theme</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => setTheme('light')}
                        className={`relative flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all hover:border-primary ${
                          theme === 'light' ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <Sun className="h-8 w-8" />
                        <div className="text-center">
                          <p className="font-semibold">Light</p>
                          <p className="text-xs text-muted-foreground">Bright and clear</p>
                        </div>
                        {theme === 'light' && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </button>

                      <button
                        onClick={() => setTheme('dark')}
                        className={`relative flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all hover:border-primary ${
                          theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <Moon className="h-8 w-8" />
                        <div className="text-center">
                          <p className="font-semibold">Dark</p>
                          <p className="text-xs text-muted-foreground">Easy on the eyes</p>
                        </div>
                        {theme === 'dark' && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </button>

                      <button
                        onClick={() => setTheme('auto')}
                        className={`relative flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all hover:border-primary ${
                          theme === 'auto' ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <Sun className="h-6 w-6" />
                          <Moon className="h-6 w-6" />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">Auto</p>
                          <p className="text-xs text-muted-foreground">Follows system</p>
                        </div>
                        {theme === 'auto' && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">Display Options</h4>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Compact Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Reduce spacing for more content
                        </p>
                      </div>
                      <Switch defaultChecked={false} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Animations</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable smooth transitions and effects
                        </p>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>High Contrast</Label>
                        <p className="text-sm text-muted-foreground">
                          Increase contrast for better visibility
                        </p>
                      </div>
                      <Switch defaultChecked={false} />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveLanguage} disabled={saveStatus === 'saving'}>
                      {saveStatus === 'saving' ? 'Saving...' : 'Save Theme'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <Card>
                <CardHeader>
                  <CardTitle>Portal Access Permissions</CardTitle>
                  <CardDescription>
                    View your role-based access to different portals
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Current Role</Label>
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-base px-4 py-2">
                          {user ? ROLE_LABELS[user.role] : 'Unknown'}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Accessible Portals</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {accessiblePortals.map(([path, label]) => (
                          <div
                            key={path}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                          >
                            <CheckCircle2 className="h-5 w-5 text-chart-3" />
                            <span className="font-medium">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Permissions</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {user?.permissions.map((permission) => (
                          <div
                            key={permission}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <span className="font-mono">{permission}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Contact your administrator to request additional permissions or role changes.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <Card>
                <CardHeader>
                  <CardTitle>API Keys Management</CardTitle>
                  <CardDescription>
                    Manage API keys for integrations and external access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {user?.role === 'admin' ? (
                    <>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Live API Key</Label>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 relative">
                              <Input
                                type={showApiKey ? 'text' : 'password'}
                                value={mockApiKey}
                                readOnly
                                className="font-mono text-sm pr-20"
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setShowApiKey(!showApiKey)}
                                  className="h-7 w-7 p-0"
                                >
                                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCopyApiKey}
                                  className="h-7 w-7 p-0"
                                >
                                  {apiKeyCopied ? <CheckCircle2 className="h-4 w-4 text-chart-3" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Keep this key secure. Do not share it publicly.
                          </p>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Key Information</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Created</p>
                              <p className="font-medium">January 15, 2026</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Last Used</p>
                              <p className="font-medium">2 hours ago</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Status</p>
                              <Badge variant="secondary" className="bg-chart-3/10 text-chart-3">
                                Active
                              </Badge>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Rate Limit</p>
                              <p className="font-medium">1000 requests/hour</p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <Label className="text-sm font-medium">API Endpoints</Label>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">GET</Badge>
                              <code className="text-muted-foreground">/api/v1/shipments</code>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">POST</Badge>
                              <code className="text-muted-foreground">/api/v1/deliveries</code>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">PUT</Badge>
                              <code className="text-muted-foreground">/api/v1/manifests/:id</code>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={handleGenerateNewKey}>
                          Generate New Key
                        </Button>
                        <Button variant="destructive">
                          Revoke Key
                        </Button>
                      </div>

                      <Alert>
                        <Key className="h-4 w-4" />
                        <AlertDescription>
                          Generating a new key will invalidate the current one. Update all integrations before revoking.
                        </AlertDescription>
                      </Alert>
                    </>
                  ) : (
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        API key management is only available for administrators. Contact your system admin for API access.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-between items-center">
          <Button variant="outline" onClick={logout}>
            Sign Out
          </Button>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </motion.div>
    </div>
  );
}