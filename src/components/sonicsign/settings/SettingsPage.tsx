'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Shield,
  Bell,
  Palette,
  Save,
  Camera,
  Monitor,
  Moon,
  Sun,
  Smartphone,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { mockUser } from '@/data/mock';
import type { NotificationSettings, AppearanceSettings } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';

type SettingsSection = 'profile' | 'security' | 'notifications' | 'appearance';

const sectionNav: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

const mockSessions = [
  {
    id: 'sess_001',
    device: 'MacBook Pro — Chrome',
    location: 'San Francisco, CA',
    lastActive: 'Now',
    current: true,
  },
  {
    id: 'sess_002',
    device: 'iPhone 15 — Safari',
    location: 'San Francisco, CA',
    lastActive: '2 hours ago',
    current: false,
  },
];

const contentVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const contentTransition = {
  duration: 0.25,
  ease: [0.25, 0.46, 0.45, 0.94],
};

export default function SettingsPage() {
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const { toast } = useToast();

  // Profile state
  const [profileName, setProfileName] = useState(mockUser.name);
  const [profileOrg, setProfileOrg] = useState(mockUser.organization || '');

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailOnSignature: true,
    emailOnRejection: true,
    emailOnExpiry: false,
    weeklyDigest: true,
  });

  // Appearance state
  const [appearance, setAppearance] = useState<AppearanceSettings>({
    theme: 'light',
    compactMode: false,
    fontSize: 'medium',
  });

  const handleSaveProfile = () => {
    toast({
      title: 'Profile updated',
      description: 'Your profile changes have been saved.',
    });
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your new passwords match.',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast({
      title: 'Password changed',
      description: 'Your password has been updated successfully.',
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: 'Notifications updated',
      description: 'Your notification preferences have been saved.',
    });
  };

  const handleSaveAppearance = () => {
    toast({
      title: 'Appearance updated',
      description: 'Your appearance settings have been saved.',
    });
  };

  const handleToggle2FA = (enabled: boolean) => {
    setTwoFactorEnabled(enabled);
    toast({
      title: enabled ? '2FA enabled' : '2FA disabled',
      description: enabled
        ? 'Two-factor authentication has been enabled for your account.'
        : 'Two-factor authentication has been disabled.',
    });
  };

  const handleSignOutAll = () => {
    toast({
      title: 'Signed out',
      description: 'You have been signed out of all other devices.',
    });
  };

  const updateNotification = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-1 mb-6">
        <h1 className="text-2xl text-page-title text-sonic-text">
          Settings
        </h1>
        <p className="text-sm text-body text-sonic-text-secondary mt-1">
          Manage your account preferences and configuration
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1">
        {/* Sidebar Navigation (Desktop) / Top Tabs (Mobile) */}
        {isMobile ? (
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg overflow-x-auto">
            {sectionNav.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap',
                    activeSection === section.id
                      ? 'bg-white text-sonic-text shadow-sm'
                      : 'text-sonic-text-secondary hover:text-sonic-text'
                  )}
                >
                  <Icon className="size-3.5" />
                  {section.label}
                </button>
              );
            })}
          </div>
        ) : (
          <nav className="w-52 shrink-0">
            <div className="flex flex-col gap-1">
              {sectionNav.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all text-left',
                      activeSection === section.id
                        ? 'bg-sonic-secondary text-sonic-primary'
                        : 'text-sonic-text-secondary hover:bg-muted/50 hover:text-sonic-text'
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="size-4" />
                      {section.label}
                    </span>
                    <ChevronRight
                      className={cn(
                        'size-3.5 transition-opacity',
                        activeSection === section.id
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeSection === 'profile' && (
              <motion.div
                key="profile"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={contentTransition}
              >
                <ProfileSection
                  profileName={profileName}
                  setProfileName={setProfileName}
                  profileOrg={profileOrg}
                  setProfileOrg={setProfileOrg}
                  onSave={handleSaveProfile}
                />
              </motion.div>
            )}
            {activeSection === 'security' && (
              <motion.div
                key="security"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={contentTransition}
              >
                <SecuritySection
                  currentPassword={currentPassword}
                  setCurrentPassword={setCurrentPassword}
                  newPassword={newPassword}
                  setNewPassword={setNewPassword}
                  confirmPassword={confirmPassword}
                  setConfirmPassword={setConfirmPassword}
                  twoFactorEnabled={twoFactorEnabled}
                  onToggle2FA={handleToggle2FA}
                  onChangePassword={handleChangePassword}
                  onSignOutAll={handleSignOutAll}
                />
              </motion.div>
            )}
            {activeSection === 'notifications' && (
              <motion.div
                key="notifications"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={contentTransition}
              >
                <NotificationsSection
                  notifications={notifications}
                  updateNotification={updateNotification}
                  onSave={handleSaveNotifications}
                />
              </motion.div>
            )}
            {activeSection === 'appearance' && (
              <motion.div
                key="appearance"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={contentTransition}
              >
                <AppearanceSection
                  appearance={appearance}
                  setAppearance={setAppearance}
                  onSave={handleSaveAppearance}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Section ─────────────────────────────────────────────────────

function ProfileSection({
  profileName,
  setProfileName,
  profileOrg,
  setProfileOrg,
  onSave,
}: {
  profileName: string;
  setProfileName: (v: string) => void;
  profileOrg: string;
  setProfileOrg: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <Card className="border-sonic-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-section-title">Profile Information</CardTitle>
        <CardDescription>
          Update your personal information and organization details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <Avatar className="size-16 border-2 border-sonic-border">
            <AvatarFallback className="bg-sonic-secondary text-sonic-primary text-lg font-semibold">
              {profileName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline" size="sm" className="border-sonic-border gap-1.5">
              <Camera className="size-3.5" />
              Change Avatar
            </Button>
            <p className="text-xs text-sonic-text-secondary mt-1.5">
              JPG, PNG or GIF. Max 2MB.
            </p>
          </div>
        </div>

        <Separator className="bg-sonic-border" />

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name" className="text-label text-sonic-text">
              Full Name
            </Label>
            <Input
              id="profile-name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="border-sonic-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email" className="text-label text-sonic-text">
              Email
            </Label>
            <Input
              id="profile-email"
              value={mockUser.email}
              disabled
              className="border-sonic-border bg-muted/30"
            />
            <p className="text-xs text-sonic-text-secondary">
              Contact support to change your email address
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-org" className="text-label text-sonic-text">
              Organization
            </Label>
            <Input
              id="profile-org"
              value={profileOrg}
              onChange={(e) => setProfileOrg(e.target.value)}
              className="border-sonic-border"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-label text-sonic-text">Role</Label>
            <Input
              value={mockUser.role.charAt(0).toUpperCase() + mockUser.role.slice(1)}
              disabled
              className="border-sonic-border bg-muted/30 capitalize"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={onSave}
            className="bg-sonic-primary hover:bg-sonic-primary/90 text-white text-button"
          >
            <Save className="size-4" />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Security Section ─────────────────────────────────────────────────────

function SecuritySection({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  twoFactorEnabled,
  onToggle2FA,
  onChangePassword,
  onSignOutAll,
}: {
  currentPassword: string;
  setCurrentPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  twoFactorEnabled: boolean;
  onToggle2FA: (v: boolean) => void;
  onChangePassword: () => void;
  onSignOutAll: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card className="border-sonic-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-section-title">Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password" className="text-label text-sonic-text">
              Current Password
            </Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="border-sonic-border max-w-md"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-label text-sonic-text">
                New Password
              </Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="border-sonic-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-label text-sonic-text">
                Confirm New Password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="border-sonic-border"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={onChangePassword}
              variant="outline"
              className="border-sonic-border text-button"
            >
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="border-sonic-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-section-title">Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex items-center justify-center size-10 rounded-lg',
                  twoFactorEnabled ? 'bg-emerald-50' : 'bg-muted/50'
                )}
              >
                <Shield
                  className={cn(
                    'size-5',
                    twoFactorEnabled ? 'text-emerald-500' : 'text-sonic-text-secondary'
                  )}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-sonic-text">
                  Authenticator App
                </p>
                <p className="text-xs text-sonic-text-secondary">
                  {twoFactorEnabled
                    ? 'Two-factor authentication is enabled'
                    : 'Use an authenticator app for verification codes'}
                </p>
              </div>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={onToggle2FA}
            />
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card className="border-sonic-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-section-title">Active Sessions</CardTitle>
          <CardDescription>
            Manage your active sessions across devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockSessions.map((session, index) => (
            <div key={session.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-9 rounded-lg bg-muted/50">
                    {session.device.includes('iPhone') ? (
                      <Smartphone className="size-4 text-sonic-text-secondary" />
                    ) : (
                      <Monitor className="size-4 text-sonic-text-secondary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-sonic-text">
                      {session.device}
                      {session.current && (
                        <span className="ml-2 text-xs font-medium text-sonic-success bg-emerald-50 px-1.5 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-sonic-text-secondary">
                      {session.location} · {session.lastActive}
                    </p>
                  </div>
                </div>
              </div>
              {index < mockSessions.length - 1 && (
                <Separator className="mt-4 bg-sonic-border" />
              )}
            </div>
          ))}
          <div className="pt-2">
            <Button
              variant="outline"
              className="border-sonic-border text-sonic-danger hover:text-sonic-danger hover:bg-red-50 text-button"
              onClick={onSignOutAll}
            >
              <LogOut className="size-4" />
              Sign Out of All Devices
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Notifications Section ────────────────────────────────────────────────

function NotificationsSection({
  notifications,
  updateNotification,
  onSave,
}: {
  notifications: NotificationSettings;
  updateNotification: (key: keyof NotificationSettings, value: boolean) => void;
  onSave: () => void;
}) {
  const toggles: { key: keyof NotificationSettings; label: string; description: string }[] = [
    {
      key: 'emailOnSignature',
      label: 'Document Signed',
      description: 'Receive an email when a document is signed by a recipient',
    },
    {
      key: 'emailOnRejection',
      label: 'Document Rejected',
      description: 'Receive an email when a document is rejected by a recipient',
    },
    {
      key: 'emailOnExpiry',
      label: 'Signature Request Expired',
      description: 'Receive an email when a signature request expires',
    },
    {
      key: 'weeklyDigest',
      label: 'Weekly Digest',
      description: 'Get a weekly summary of all your document activity',
    },
  ];

  return (
    <Card className="border-sonic-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-section-title">Email Notifications</CardTitle>
        <CardDescription>
          Choose which email notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {toggles.map((toggle, index) => (
          <div key={toggle.key}>
            <div className="flex items-center justify-between py-3">
              <div className="pr-4">
                <p className="text-sm font-medium text-sonic-text">
                  {toggle.label}
                </p>
                <p className="text-xs text-sonic-text-secondary mt-0.5">
                  {toggle.description}
                </p>
              </div>
              <Switch
                checked={notifications[toggle.key]}
                onCheckedChange={(checked) =>
                  updateNotification(toggle.key, checked)
                }
              />
            </div>
            {index < toggles.length - 1 && (
              <Separator className="bg-sonic-border" />
            )}
          </div>
        ))}
        <div className="flex justify-end pt-4">
          <Button
            onClick={onSave}
            className="bg-sonic-primary hover:bg-sonic-primary/90 text-white text-button"
          >
            <Save className="size-4" />
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Appearance Section ───────────────────────────────────────────────────

function AppearanceSection({
  appearance,
  setAppearance,
  onSave,
}: {
  appearance: AppearanceSettings;
  setAppearance: React.Dispatch<React.SetStateAction<AppearanceSettings>>;
  onSave: () => void;
}) {
  const themeOptions: { value: 'light' | 'dark' | 'system'; label: string; icon: React.ElementType }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  const fontSizeOptions: { value: 'small' | 'medium' | 'large'; label: string }[] = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
  ];

  return (
    <div className="space-y-6">
      {/* Theme Selector */}
      <Card className="border-sonic-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-section-title">Theme</CardTitle>
          <CardDescription>
            Choose how SonicSign looks on your device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 max-w-sm">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = appearance.theme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() =>
                    setAppearance((prev) => ({ ...prev, theme: option.value }))
                  }
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                    isSelected
                      ? 'border-sonic-primary bg-sonic-secondary'
                      : 'border-sonic-border hover:border-sonic-primary/30 hover:bg-muted/30'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center size-10 rounded-lg transition-colors',
                      isSelected ? 'bg-sonic-primary/10' : 'bg-muted/50'
                    )}
                  >
                    <Icon
                      className={cn(
                        'size-5',
                        isSelected ? 'text-sonic-primary' : 'text-sonic-text-secondary'
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isSelected ? 'text-sonic-primary' : 'text-sonic-text'
                    )}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Display Options */}
      <Card className="border-sonic-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-section-title">Display</CardTitle>
          <CardDescription>
            Customize the display and readability settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Compact Mode */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-sonic-text">
                Compact Mode
              </p>
              <p className="text-xs text-sonic-text-secondary mt-0.5">
                Reduce padding and spacing for denser layouts
              </p>
            </div>
            <Switch
              checked={appearance.compactMode}
              onCheckedChange={(checked) =>
                setAppearance((prev) => ({ ...prev, compactMode: checked }))
              }
            />
          </div>

          <Separator className="bg-sonic-border" />

          {/* Font Size */}
          <div className="space-y-3">
            <Label className="text-label text-sonic-text">
              Font Size
            </Label>
            <RadioGroup
              value={appearance.fontSize}
              onValueChange={(value) =>
                setAppearance((prev) => ({
                  ...prev,
                  fontSize: value as 'small' | 'medium' | 'large',
                }))
              }
              className="flex gap-2"
            >
              {fontSizeOptions.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all',
                    appearance.fontSize === option.value
                      ? 'border-sonic-primary bg-sonic-secondary'
                      : 'border-sonic-border hover:border-sonic-primary/30'
                  )}
                >
                  <RadioGroupItem value={option.value} className="sr-only" />
                  <span
                    className={cn(
                      'text-sm font-medium',
                      appearance.fontSize === option.value
                        ? 'text-sonic-primary'
                        : 'text-sonic-text'
                    )}
                    style={
                      option.value === 'small'
                        ? { fontSize: '12px' }
                        : option.value === 'large'
                          ? { fontSize: '16px' }
                          : { fontSize: '14px' }
                    }
                  >
                    {option.label}
                  </span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={onSave}
              className="bg-sonic-primary hover:bg-sonic-primary/90 text-white text-button"
            >
              <Save className="size-4" />
              Save Appearance
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
