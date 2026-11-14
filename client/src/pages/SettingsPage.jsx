import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateWorkspace, uploadWorkspaceLogo } from '../store/workspaceSlice';
import { uploadAvatar } from '../store/authSlice';
import { 
  User, 
  Building, 
  Bell, 
  Palette, 
  Shield, 
  Save, 
  AlertTriangle, 
  Lock, 
  Smartphone,
  CheckCircle2,
  UploadCloud
} from 'lucide-react';
import { mockCurrentUser, mockWorkspaces } from '../services/mockData';
import { 
  Button, 
  Input, 
  PasswordInput, 
  Textarea, 
  Select, 
  Checkbox, 
  RadioGroup, 
  Tabs, 
  Avatar, 
  ConfirmationDialog, 
  useToast 
} from '../components/ui';

export const SettingsPage = () => {
  const toast = useToast();
  const dispatch = useDispatch();
  const avatarInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const { currentWorkspace } = useSelector((state) => state.workspace);
  const { user: authUser } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('profile');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Profile Form State
  const [profileName, setProfileName] = useState(mockCurrentUser.name);
  const [profileEmail, setProfileEmail] = useState(mockCurrentUser.email);
  const [profileTitle, setProfileTitle] = useState(mockCurrentUser.designation);
  const [profileBio, setProfileBio] = useState('Lead Product Architect focusing on B2B SaaS interfaces and high-performance design systems.');

  // Workspace Settings State
  const [wsName, setWsName] = useState(currentWorkspace?.name || mockWorkspaces[0].name);
  const [wsSlug, setWsSlug] = useState(currentWorkspace?.slug || mockWorkspaces[0].slug);
  const [wsDesc, setWsDesc] = useState(currentWorkspace?.description || mockWorkspaces[0].description);

  useEffect(() => {
    if (authUser) {
      setProfileName(authUser.name || mockCurrentUser.name);
      setProfileEmail(authUser.email || mockCurrentUser.email);
      if (authUser.designation) setProfileTitle(authUser.designation);
    }
  }, [authUser]);

  useEffect(() => {
    if (currentWorkspace) {
      setWsName(currentWorkspace.name || '');
      setWsSlug(currentWorkspace.slug || '');
      setWsDesc(currentWorkspace.description || '');
    }
  }, [currentWorkspace]);

  // Handlers for file uploads
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setIsUploadingAvatar(true);
    try {
      await dispatch(uploadAvatar(formData)).unwrap();
      toast.success('Avatar Updated', 'Profile photo updated successfully.');
    } catch (err) {
      toast.error('Avatar Upload Failed', err);
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    const wsId = currentWorkspace?._id || currentWorkspace?.id;
    if (!file || !wsId) return;

    const formData = new FormData();
    formData.append('logo', file);

    setIsUploadingLogo(true);
    try {
      await dispatch(uploadWorkspaceLogo({ workspaceId: wsId, formData })).unwrap();
      toast.success('Logo Updated', 'Workspace logo updated successfully.');
    } catch (err) {
      toast.error('Logo Upload Failed', err);
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  // Notification Preferences
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [mentionsOnly, setMentionsOnly] = useState(false);

  // Theme & Appearance
  const [density, setDensity] = useState('comfortable');

  // Security
  const [twoFactor, setTwoFactor] = useState(false);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    toast.success('Profile Saved', 'Your user account details were updated.');
  };

  const handleSaveWorkspace = async (e) => {
    e.preventDefault();
    if (currentWorkspace?._id) {
      try {
        await dispatch(
          updateWorkspace({
            workspaceId: currentWorkspace._id,
            data: { name: wsName, description: wsDesc },
          })
        );
        toast.success('Workspace Updated', 'Workspace configuration saved successfully.');
        return;
      } catch (err) {
        toast.error('Failed to Update', err.message);
        return;
      }
    }
    toast.success('Workspace Updated', 'Workspace configuration saved successfully.');
  };

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    toast.success('Preferences Updated', 'Notification rules updated.');
  };

  const tabsConfig = [
    { id: 'profile', label: 'Profile Settings', icon: <User className="w-4 h-4" /> },
    { id: 'workspace', label: 'Workspace Settings', icon: <Building className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'security', label: 'Security & 2FA', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-charcoal">Account &amp; Workspace Settings</h1>
        <p className="text-xs text-charcoal-secondary mt-1">
          Customize your profile, configure organization policies, and manage security settings.
        </p>
      </div>

      {/* Tabs navigation */}
      <Tabs
        variant="line"
        tabs={tabsConfig}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* 1. Profile Settings Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-xl border border-border p-6 shadow-card space-y-6">
          <div className="flex items-center gap-5 pb-6 border-b border-border">
            <Avatar name={profileName} src={authUser?.avatar} size="xl" status="online" />
            <div className="space-y-1.5">
              <h3 className="font-heading font-bold text-sm text-charcoal">Profile Photo</h3>
              <p className="text-xs text-charcoal-secondary">
                Upload a personalized avatar image (JPG, PNG, WebP up to 10MB).
              </p>
              <input
                type="file"
                ref={avatarInputRef}
                accept="image/*"
                className="hidden"
                data-testid="avatar-file-input"
                onChange={handleAvatarUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={isUploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
              >
                {isUploadingAvatar ? 'Uploading...' : 'Change Photo'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="set-name"
              label="Full Name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              required
            />
            <Input
              id="set-email"
              label="Work Email"
              type="email"
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              required
            />
            <div className="sm:col-span-2">
              <Input
                id="set-title"
                label="Job Designation / Title"
                value={profileTitle}
                onChange={(e) => setProfileTitle(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Textarea
                id="set-bio"
                label="Bio &amp; Expertise"
                rows={3}
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      )}

      {/* 2. Workspace Settings Tab */}
      {activeTab === 'workspace' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveWorkspace} className="bg-white rounded-xl border border-border p-6 shadow-card space-y-6">
            <div>
              <h3 className="font-heading font-bold text-base text-charcoal">Workspace Information</h3>
              <p className="text-xs text-charcoal-secondary mt-0.5">
                Organization details visible to all workspace collaborators.
              </p>
            </div>

            <div className="flex items-center gap-5 pb-4 border-b border-border">
              <div className="w-16 h-16 rounded-xl bg-forest/10 border border-border flex items-center justify-center overflow-hidden shrink-0">
                {currentWorkspace?.logo ? (
                  <img src={currentWorkspace.logo} alt="Workspace Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building className="w-8 h-8 text-forest" />
                )}
              </div>
              <div className="space-y-1.5">
                <h4 className="font-heading font-bold text-sm text-charcoal">Workspace Logo</h4>
                <p className="text-xs text-charcoal-secondary">
                  Custom organization branding displayed in the navigation sidebar.
                </p>
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/*"
                  className="hidden"
                  data-testid="workspace-logo-input"
                  onChange={handleLogoUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={isUploadingLogo}
                  onClick={() => logoInputRef.current?.click()}
                >
                  {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                id="ws-name"
                label="Workspace Display Name"
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                required
              />
              <Input
                id="ws-slug"
                label="URL Slug"
                value={wsSlug}
                onChange={(e) => setWsSlug(e.target.value)}
                helperText="Permanent web identifier: teamflow.io/w/teamflow-hq"
                required
              />
              <Textarea
                id="ws-desc"
                label="Workspace Mission / Scope"
                rows={3}
                value={wsDesc}
                onChange={(e) => setWsDesc(e.target.value)}
              />
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
                Save Workspace Settings
              </Button>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl border border-status-danger/30 p-6 shadow-card space-y-4">
            <div>
              <h3 className="font-heading font-bold text-base text-status-danger flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Danger Zone
              </h3>
              <p className="text-xs text-charcoal-secondary mt-1">
                Irreversible actions that will permanently delete this workspace and all associated project data.
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialog(true)}
              >
                Delete This Workspace
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Notifications Tab */}
      {activeTab === 'notifications' && (
        <form onSubmit={handleSaveNotifications} className="bg-white rounded-xl border border-border p-6 shadow-card space-y-6">
          <div>
            <h3 className="font-heading font-bold text-base text-charcoal">Email &amp; In-App Notifications</h3>
            <p className="text-xs text-charcoal-secondary mt-0.5">
              Control when and how you receive alerts about tasks and sprint events.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <Checkbox
              id="notif-email"
              label="Real-time Task Assignment Emails"
              description="Notify immediately whenever you are assigned or unassigned from a task."
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
            />
            <Checkbox
              id="notif-digest"
              label="Weekly Productivity Digest"
              description="Receive an analytical summary of completed sprint work every Monday morning."
              checked={weeklyDigest}
              onChange={(e) => setWeeklyDigest(e.target.checked)}
            />
            <Checkbox
              id="notif-mentions"
              label="Only Notify for Direct Mentions"
              description="Suppress general project updates and only alert when explicitly tagged with @name."
              checked={mentionsOnly}
              onChange={(e) => setMentionsOnly(e.target.checked)}
            />
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button type="submit" variant="primary" size="md">
              Save Notification Preferences
            </Button>
          </div>
        </form>
      )}

      {/* 4. Appearance Tab */}
      {activeTab === 'appearance' && (
        <div className="bg-white rounded-xl border border-border p-6 shadow-card space-y-6">
          <div>
            <h3 className="font-heading font-bold text-base text-charcoal">Interface Density &amp; Typography</h3>
            <p className="text-xs text-charcoal-secondary mt-0.5">
              Strictly formatted to TeamFlow B2B Design Direction.
            </p>
          </div>

          <div className="space-y-4">
            <RadioGroup
              name="density"
              label="Information Density"
              value={density}
              onChange={setDensity}
              options={[
                { label: 'Comfortable', value: 'comfortable', description: 'Balanced padding and standard line heights' },
                { label: 'Compact', value: 'compact', description: 'Higher data density for fast table scanning' },
              ]}
            />
          </div>

          <div className="p-4 bg-ivory rounded-lg border border-border flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-charcoal block">Design Palette</span>
              <span className="text-charcoal-secondary">Warm Ivory (#F7F6F2) + Forest Green (#173F35)</span>
            </div>
            <span className="font-semibold text-forest flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active Palette
            </span>
          </div>
        </div>
      )}

      {/* 5. Security & 2FA Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-xl border border-border p-6 shadow-card space-y-6">
          <div>
            <h3 className="font-heading font-bold text-base text-charcoal">Security &amp; Credentials</h3>
            <p className="text-xs text-charcoal-secondary mt-0.5">
              Protect your account with robust credentials and multi-factor authentication.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); toast.success('Password Updated', 'Your account credentials were changed.'); }} className="space-y-4 max-w-md">
            <PasswordInput id="sec-curr" label="Current Password" required />
            <PasswordInput id="sec-new" label="New Password" placeholder="At least 8 characters" required />
            <Button type="submit" variant="primary" size="sm">
              Change Password
            </Button>
          </form>

          <div className="pt-6 border-t border-border flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-heading font-bold text-xs text-charcoal flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-forest" />
                Two-Factor Authentication (2FA)
              </h4>
              <p className="text-xs text-charcoal-secondary">
                Require an authenticator app code on login for enhanced security.
              </p>
            </div>
            <Button
              variant={twoFactor ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => {
                setTwoFactor(!twoFactor);
                toast.info('2FA Toggled', twoFactor ? '2FA disabled.' : '2FA activated.');
              }}
            >
              {twoFactor ? 'Disable 2FA' : 'Enable 2FA'}
            </Button>
          </div>
        </div>
      )}

      {/* Delete Workspace Confirmation */}
      <ConfirmationDialog
        isOpen={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={() => {
          setDeleteDialog(false);
          toast.error('Workspace Deleted', 'The workspace has been removed.');
        }}
        title="Delete Workspace Permanently"
        message="This action will delete all projects, Kanban cards, and member associations in this workspace. This cannot be undone."
        confirmText="Yes, Permanently Delete"
        variant="destructive"
      />
    </div>
  );
};

export default SettingsPage;
