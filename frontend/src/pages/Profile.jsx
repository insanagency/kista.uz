
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Save, Eye, EyeOff, Shield } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const Profile = () => {
  const { user, setUser } = useAuth();
  const { t } = useTranslation();
  const API_URL = import.meta.env.VITE_API_URL;

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Show password toggles
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Loading states
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    // Fetch full profile data from backend
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}/profile`);
        setProfileData(response.data);

        // Update user in context with created_at
        const updatedUser = { ...user, created_at: response.data.created_at };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        email: user.email || ''
      });
      fetchProfile();
    }
  }, [user?.id]); // Only re-run if user ID changes

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      const response = await axios.put(`${API_URL}/profile`, profileForm);

      // Update user in context and localStorage
      const updatedUser = response.data.user;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      toast.success(t('profile.updateSuccess') || 'Profile updated successfully!');
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || t('profile.updateError') || 'Failed to update profile';
      toast.error(message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('profile.passwordMismatch') || 'Passwords do not match');
      return;
    }

    // Validate password length
    if (passwordForm.newPassword.length < 6) {
      toast.error(t('profile.passwordTooShort') || 'Password must be at least 6 characters');
      return;
    }

    // Check if user is OAuth user (Google login)
    const isOAuthUser = user?.oauth_provider && user.oauth_provider !== 'local';

    // Only require current password for non-OAuth users
    if (!isOAuthUser && !passwordForm.currentPassword) {
      toast.error(t('profile.currentPasswordRequired') || 'Current password is required');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await axios.put(`${API_URL}/profile/change-password`, passwordForm);

      const message = response.data.message + (response.data.note ? '\n' + response.data.note : '');
      toast.success(message);

      // Reset password form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // If OAuth user just set password, update user context
      if (isOAuthUser) {
        const updatedUser = { ...user, oauth_provider: 'local' };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || t('profile.passwordChangeError') || 'Failed to change password';
      toast.error(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('profile.title') || 'Profile Settings'}</h1>
          <p className="text-muted-foreground">
            {t('profile.subtitle') || 'Manage your account settings and preferences'}
          </p>
        </div>

        {/* Admin/Mod Button - Only visible to admin and mod users */}
        {(user?.role === 'admin' || user?.role === 'mod') && (
          <Button asChild variant="default" className="shadow-sm">
            <Link to="/admin" className="flex items-center gap-2">
              <Shield size={16} />
              <span>{user?.role === 'admin' ? 'Admin Dashboard' : 'Moderator Panel'}</span>
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {t('profile.personalInfo') || 'Personal Information'}
            </CardTitle>
            <CardDescription>
              Update your personal details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">{t('profile.fullName') || 'Full Name'}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="full_name"
                    className="pl-9"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    placeholder={t('profile.fullNamePlaceholder') || 'Enter your full name'}
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('profile.email') || 'Email Address'}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-9"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder={t('profile.emailPlaceholder') || 'Enter your email'}
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={isUpdatingProfile} className="w-full">
                {isUpdatingProfile && <Save className="mr-2 h-4 w-4 animate-spin" />}
                {!isUpdatingProfile && <Save className="mr-2 h-4 w-4" />}
                {isUpdatingProfile ? (t('profile.updating') || 'Updating...') : (t('profile.updateProfile') || 'Update Profile')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              {t('profile.changePassword') || 'Change Password'}
            </CardTitle>
            <CardDescription>
              Ensure your account is secure with a strong password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Show info for OAuth users */}
              {user?.oauth_provider && user.oauth_provider !== 'local' && (
                <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground flex items-center gap-2 border">
                  ℹ️ {t('profile.oauthPasswordInfo') || 'You logged in with Google. You can set a password below to also login with email.'}
                </div>
              )}

              {/* Only show current password field for non-OAuth users who have a password */}
              {(!user?.oauth_provider || user.oauth_provider === 'local') && (
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{t('profile.currentPassword') || 'Current Password'}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? 'text' : 'password'}
                      className="pl-9 pr-9"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* New Password field - available for everyone */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('profile.newPassword') || 'New Password'}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? 'text' : 'password'}
                    className="pl-9 pr-9"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder={user?.oauth_provider && user.oauth_provider !== 'local'
                      ? (t('profile.setPasswordPlaceholder') || 'Set your password')
                      : '••••••••'
                    }
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[0.8rem] text-muted-foreground">
                  {t('profile.passwordRequirement') || 'At least 6 characters'}
                </p>
              </div>

              {/* Confirm Password field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('profile.confirmPassword') || 'Confirm New Password'}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    className="pl-9 pr-9"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={isChangingPassword} className="w-full" variant="secondary">
                {isChangingPassword && <Lock className="mr-2 h-4 w-4 animate-spin" />}
                {!isChangingPassword && <Lock className="mr-2 h-4 w-4" />}
                {isChangingPassword ? (t('profile.changing') || 'Changing...') : (t('profile.changePasswordBtn') || 'Change Password')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('profile.accountInfo') || 'Account Information'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
              <span className="text-muted-foreground">
                {t('profile.accountCreated') || 'Account Created:'}
              </span>
              <span className="font-medium">
                {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString() : 'Loading...'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
              <span className="text-muted-foreground">
                {t('profile.userId') || 'User ID:'}
              </span>
              <span className="font-mono">
                #{user?.id || 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
