
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Users, UserCheck, TrendingUp, Database, Shield, Search, Lock, Trash2,
  DollarSign, Target, Repeat, FolderOpen, Eye, X, Crown, UserCircle, RefreshCw
} from 'lucide-react';

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const Admin = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  // Dialog states
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, [pagination.page, search]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search
        }
      });
      setUsers(response.data.users);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (error) {
      toast.error(t('admin.failedToLoadUsers') || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = async (userId, newRole) => {
    if (!confirm(t('admin.confirmRoleChange') || `Change role to ${newRole}?`)) {
      return;
    }

    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(t('admin.roleUpdated') || 'Role updated successfully');
      fetchUsers();
    } catch (error) {
      const message = error.response?.data?.error || t('admin.failedToUpdateRole') || 'Failed to update role';
      toast.error(message);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error(t('admin.passwordTooShort') || 'Password must be at least 6 characters');
      return;
    }

    try {
      await api.post(`/admin/users/${selectedUser.id}/reset-password`, { newPassword });
      toast.success(t('admin.passwordReset') || 'Password reset successfully');
      setShowResetModal(false);
      setNewPassword('');
      setSelectedUser(null);
    } catch (error) {
      const message = error.response?.data?.error || t('admin.failedToResetPassword') || 'Failed to reset password';
      toast.error(message);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(t('admin.confirmDelete') || `Are you sure you want to delete ${userName}? This cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success(t('admin.userDeleted') || 'User deleted successfully');
      fetchUsers();
      fetchStats();
    } catch (error) {
      const message = error.response?.data?.error || t('admin.failedToDeleteUser') || 'Failed to delete user';
      toast.error(message);
    }
  };

  const fetchUserDetails = async (userId) => {
    setLoadingDetails(true);
    setShowDetailsModal(true);
    try {
      const response = await api.get(`/admin/users/${userId}/details`);
      setUserDetails(response.data);
    } catch (error) {
      toast.error(t('admin.failedToLoadDetails') || 'Failed to load user details');
      setShowDetailsModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'head': return <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case 'manager': return <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'contributor': return <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'observer': return <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
      default: return null;
    }
  };

  const getRoleBadgeColor = (role) => {
    // Just return standard variants or custom via classes for Badge
    return "outline";
  };

  // Custom RoleBadge helper
  const RoleBadge = ({ role, className }) => {
    let classes = "";
    switch (role) {
      case 'head': classes = "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700"; break;
      case 'manager': classes = "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700"; break;
      case 'contributor': classes = "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-300 dark:border-green-700"; break;
      case 'observer': classes = "bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700"; break;
      default: classes = "";
    }
    return (
      <Badge variant="outline" className={`${classes} gap-1 ${className}`}>
        {getRoleIcon(role)}
        {t(`family.roles.${role}`) || role}
      </Badge>
    );
  }

  if (user?.role !== 'admin' && user?.role !== 'mod') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="mx-auto text-destructive mb-4" size={64} />
          <h2 className="text-2xl font-bold mb-2">
            {t('admin.accessDenied') || 'Access Denied'}
          </h2>
          <p className="text-muted-foreground">
            {t('admin.adminOnly') || 'This page is only accessible to administrators and moderators.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="text-primary" size={32} />
            {t('admin.title') || 'Admin Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('admin.subtitle') || 'Manage users and system settings'}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.totalUsers') || 'Total Users'}</p>
                <p className="text-3xl font-bold mt-1">{stats.total_users}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.admin_users} admin · {stats.mod_users || 0} mod
                </p>
              </div>
              <Users className="text-blue-500" size={32} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.newUsers30d') || 'New Users (30d)'}</p>
                <p className="text-3xl font-bold mt-1 text-green-600 dark:text-green-400">{stats.new_users_30d}</p>
              </div>
              <TrendingUp className="text-green-500" size={32} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.totalTransactions') || 'Transactions'}</p>
                <p className="text-3xl font-bold mt-1 text-purple-600 dark:text-purple-400">{stats.total_transactions}</p>
              </div>
              <Database className="text-purple-500" size={32} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Status</p>
                <p className="text-2xl font-bold mt-1">All Systems</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1 flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Operational
                </p>
              </div>
              <Shield className="text-muted-foreground" size={32} />
            </CardContent>
          </Card>

          {/* More stats if needed */}
        </div>
      )}

      {/* User Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('admin.userManagement') || 'User Management'}</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                placeholder={t('admin.searchUsers') || 'Search users...'}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.user') || 'User'}</TableHead>
                <TableHead>{t('admin.role') || 'Role'}</TableHead>
                <TableHead>{t('admin.joined') || 'Joined'}</TableHead>
                <TableHead className="text-right">{t('admin.actions') || 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    {t('common.loading') || 'Loading...'}
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    {t('admin.noUsers') || 'No users found'}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{u.full_name}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={u.role || 'user'}
                        onValueChange={(val) => handleRoleToggle(u.id, val)}
                        disabled={u.id === user.id || user?.role !== 'admin'}
                      >
                        <SelectTrigger className="w-[110px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="mod">Mod</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => fetchUserDetails(u.id)} title={t('admin.viewDetails')}>
                          <Eye size={16} className="text-purple-600" />
                        </Button>
                        {(user?.role === 'admin' || (user?.role === 'mod' && u.role === 'user')) && (
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(u); setShowResetModal(true); }} title={t('admin.resetPassword')}>
                            <Lock size={16} className="text-blue-600" />
                          </Button>
                        )}
                        {user?.role === 'admin' && (
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id, u.full_name)} disabled={u.id === user.id} title={t('admin.deleteUser')}>
                            <Trash2 size={16} className="text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between py-4">
              <div className="text-sm text-muted-foreground">
                {t('admin.showing') || 'Showing'} {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} {t('admin.of') || 'of'} {pagination.total}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  {t('admin.previous') || 'Previous'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  {t('admin.next') || 'Next'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showDetailsModal} onOpenChange={(open) => { setShowDetailsModal(open); if (!open) setUserDetails(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="text-primary" size={24} />
              {userDetails?.user?.full_name}
            </DialogTitle>
            <DialogDescription>
              {t('admin.userDetails') || 'User Details'}
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : userDetails ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('admin.accountInfo')}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('admin.email')}</Label>
                    <p className="font-medium">{userDetails.user.email}</p>
                  </div>
                  <div>
                    <Label>{t('admin.systemRole')}</Label>
                    <p className="font-medium capitalize">{userDetails.user.role}</p>
                  </div>
                  <div>
                    <Label>{t('admin.currency')}</Label>
                    <p className="font-medium">{userDetails.user.currency}</p>
                  </div>
                  <div>
                    <Label>{t('admin.joined')}</Label>
                    <p className="font-medium">{new Date(userDetails.user.created_at).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('admin.statistics')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                      { label: 'Transactions', count: userDetails.user.transaction_count, color: 'text-purple-600' },
                      { label: 'Categories', count: userDetails.user.category_count, color: 'text-orange-600' },
                      { label: 'Budgets', count: userDetails.user.budget_count, color: 'text-indigo-600' },
                      { label: 'Goals', count: userDetails.user.goal_count, color: 'text-cyan-600' },
                      { label: 'Recurring', count: userDetails.user.recurring_count, color: 'text-teal-600' }
                    ].map((item, idx) => (
                      <div key={idx} className="text-center p-3 rounded bg-muted/30">
                        <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Family Memberships */}
              {userDetails.families && userDetails.families.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('admin.familyMemberships')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {userDetails.families.map((family) => {
                      const familyMembers = userDetails.familyMembers.find(
                        fm => fm.family_id === family.family_id
                      );
                      return (
                        <div key={family.family_id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{family.family_name}</h4>
                            <Badge variant="outline">{family.family_role}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{family.family_description}</p>

                          {familyMembers && familyMembers.members.length > 0 && (
                            <div className="text-sm">
                              <p className="font-medium mb-2">{t('admin.familyMembers')}:</p>
                              <div className="flex flex-wrap gap-2">
                                {familyMembers.members.map(m => (
                                  <Badge key={m.id} variant="secondary">
                                    {m.full_name}
                                    <span className="text-xs opacity-70 ml-1">({m.role})</span>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}

        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.resetPassword')}</DialogTitle>
            <DialogDescription>
              {t('admin.resetPasswordFor')} {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>{t('admin.newPassword')}</Label>
            <Input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetModal(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleResetPassword}>{t('admin.resetPassword')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
