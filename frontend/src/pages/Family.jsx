
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../context/CurrencyContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Users, Plus, Mail, Shield, Trash2, Settings,
  UserPlus, X, Check, Crown, UserCheck, Eye, AlertTriangle,
  Copy, Link as LinkIcon, Ticket, DollarSign, Target, RotateCw
} from 'lucide-react';
import { clearAuthAndReload } from '../utils/debugAuth';

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import CreateFamilyDialog from '../components/CreateFamilyDialog';
import InviteMemberDialog from '../components/InviteMemberDialog';
import GenerateInviteCodeDialog from '../components/GenerateInviteCodeDialog';
import JoinFamilyDialog from '../components/JoinFamilyDialog';

export default function Family() {
  const { t } = useTranslation();
  const { currency, formatCurrency } = useCurrency();

  const [families, setFamilies] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [familyDetails, setFamilyDetails] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [inviteCodes, setInviteCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [activeTab, setActiveTab] = useState('members');
  const [sharedBudgets, setSharedBudgets] = useState([]);
  const [sharedGoals, setSharedGoals] = useState([]);

  // Dialog states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showGenerateCodeModal, setShowGenerateCodeModal] = useState(false);
  const [showJoinFamilyModal, setShowJoinFamilyModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setAuthError(false);
    try {
      const [familiesRes, invitationsRes] = await Promise.all([
        api.get('/families'),
        api.get('/families/invitations/pending')
      ]);
      setFamilies(familiesRes.data.families);
      setInvitations(invitationsRes.data.invitations);

      if (familiesRes.data.families.length > 0 && !selectedFamily) {
        selectFamily(familiesRes.data.families[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);

      if (error.response?.status === 403 || error.response?.status === 401) {
        setAuthError(true);
        toast.error('Authentication error. Please log in again.');
      } else {
        toast.error(t('family.failedToLoad'));
      }
    } finally {
      setLoading(false);
    }
  };

  const selectFamily = async (familyId) => {
    try {
      const detailsRes = await api.get(`/families/${familyId}`);
      setFamilyDetails(detailsRes.data);
      setSelectedFamily(familyId);

      await fetchSharedData(familyId);

      const userRole = detailsRes.data.currentUserRole;
      if (userRole === 'head' || userRole === 'manager') {
        try {
          const codesRes = await api.get(`/families/${familyId}/invite-codes`);
          setInviteCodes(codesRes.data.inviteCodes || []);
        } catch (error) {
          console.error('Error fetching invite codes:', error);
          setInviteCodes([]);
        }
      } else {
        setInviteCodes([]);
      }
    } catch (error) {
      console.error('Error fetching family details:', error);
      const errorMsg = error.response?.data?.error || 'Failed to load family details';

      if (error.response?.status === 403) {
        toast.error(t('family.accessDenied') || 'Access denied.');
      } else if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error(errorMsg);
      }
    }
  };

  const fetchSharedData = async (familyId) => {
    try {
      const [budgetsRes, goalsRes] = await Promise.all([
        api.get(`/family/${familyId}/budgets?currency=${currency}`),
        api.get(`/family/${familyId}/goals?currency=${currency}`)
      ]);
      setSharedBudgets(budgetsRes.data.budgets || []);
      setSharedGoals(goalsRes.data.goals || []);
    } catch (error) {
      console.error('Error fetching shared data:', error);
      setSharedBudgets([]);
      setSharedGoals([]);
    }
  };

  const handleInvitationResponse = async (familyId, action) => {
    try {
      await api.post(`/families/${familyId}/invitation/${action}`);
      toast.success(action === 'accept' ? t('family.inviteAccepted') : t('family.inviteDeclined'));
      fetchData();
    } catch (error) {
      console.error(`Error ${action}ing invitation:`, error);
      toast.error(t('family.failedToLoad'));
    }
  };

  const handleDeleteFamily = async () => {
    if (!confirm(t('family.deleteConfirm'))) {
      return;
    }

    try {
      await api.delete(`/families/${selectedFamily}`);
      toast.success(t('family.familyDeleted'));
      setSelectedFamily(null);
      setFamilyDetails(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting family:', error);
      toast.error(error.response?.data?.error || t('family.failedToDelete'));
    }
  };

  const handleRemoveMember = async (memberId, isSelf = false) => {
    const confirmMessage = isSelf
      ? t('family.leaveConfirm')
      : t('family.removeConfirm');

    if (!confirm(confirmMessage)) return;

    try {
      const response = await api.delete(`/families/${selectedFamily}/members/${memberId}`);

      if (response.data.self) {
        toast.success(t('family.leftFamily'));
        fetchData();
      } else {
        toast.success(t('family.memberRemoved'));
        selectFamily(selectedFamily);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(error.response?.data?.error || t('family.failedToRemove'));
    }
  };

  const handleChangeRole = async (memberId, newRole) => {
    if (newRole === 'head') {
      if (!confirm(t('family.transferHeadConfirm'))) {
        return;
      }
    }

    try {
      const response = await api.put(`/families/${selectedFamily}/members/${memberId}/role`, {
        role: newRole
      });

      if (response.data.transferred) {
        toast.success(t('family.headTransferred'));
      } else {
        toast.success(t('family.roleUpdated'));
      }

      selectFamily(selectedFamily);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(error.response?.data?.error || t('family.failedToUpdateRole'));
    }
  };

  const handleDeactivateCode = async (codeId) => {
    if (!confirm('Are you sure you want to deactivate this invite code?')) {
      return;
    }

    try {
      await api.delete(`/families/${selectedFamily}/invite-codes/${codeId}`);
      toast.success(t('family.inviteCode.codeDeactivated'));
      selectFamily(selectedFamily);
    } catch (error) {
      console.error('Error deactivating code:', error);
      toast.error(error.response?.data?.error || t('family.inviteCode.failedToDeactivate'));
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(t('family.inviteCode.copied'));
  };

  const handleCopyLink = (code) => {
    const link = `${window.location.origin}/join-family?code=${code}`;
    navigator.clipboard.writeText(link);
    toast.success(t('family.inviteCode.copied'));
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'head': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'manager': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'contributor': return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'observer': return <Eye className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  const getRoleVariant = (role) => {
    switch (role) {
      case 'head': return 'default'; // yellow-ish custom logic or default
      case 'manager': return 'secondary';
      case 'contributor': return 'outline';
      case 'observer': return 'ghost';
      default: return 'outline';
    }
  };

  // Helper for role badges to match original colors but using Badge component
  const RoleBadge = ({ role }) => {
    let classes = "";
    switch (role) {
      case 'head': classes = "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"; break;
      case 'manager': classes = "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"; break;
      case 'contributor': classes = "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"; break;
      case 'observer': classes = "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/30 dark:text-gray-400"; break;
      default: classes = "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }

    return (
      <Badge variant="outline" className={`border-0 ${classes} gap-1`}>
        {getRoleIcon(role)}
        {t(`family.roles.${role}`)}
      </Badge>
    )
  }

  if (loading && families.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Auth Error Banner */}
      {authError && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">
                  Authentication Error
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Your session may have expired. Please log in again.
                </p>
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={clearAuthAndReload}>
              Re-login
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t('family.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('family.subtitle')}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => setShowJoinFamilyModal(true)} variant="outline" className="flex-1 sm:flex-none">
            <UserPlus className="h-4 w-4 mr-2" />
            {t('family.inviteCode.joinFamily')}
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            {t('family.createFamily')}
          </Button>
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              {t('family.invitations')} ({invitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invitations.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between bg-card p-3 rounded-lg border"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {invite.family_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('family.createdBy')} {invite.invited_by_name} - {t(`family.roles.${invite.role}`)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20" onClick={() => handleInvitationResponse(invite.family_id, 'accept')}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleInvitationResponse(invite.family_id, 'decline')}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {families.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <CardContent>
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              {t('family.noFamilies')}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t('family.noFamiliesDesc')}
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              {t('family.createFirstFamily')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Family List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between mb-2 lg:hidden">
              <span className="font-semibold text-muted-foreground">My Families</span>
            </div>
            {families.map((family) => (
              <Card
                key={family.id}
                className={`cursor-pointer transition-all hover:border-primary/50 ${selectedFamily === family.id ? 'border-primary ring-1 ring-primary/20 bg-accent/20' : ''}`}
                onClick={() => selectFamily(family.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="w-full">
                      <h3 className="font-semibold text-lg">{family.name}</h3>
                      {family.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{family.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3 text-xs">
                        <RoleBadge role={family.role} />
                        <Badge variant="secondary" className="font-normal text-muted-foreground">
                          {family.member_count} {t('family.members')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Family Details */}
          {familyDetails && (
            <div className="lg:col-span-2 space-y-6">
              {/* Family Info Card */}
              <Card>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-2xl">{familyDetails.family.name}</CardTitle>
                    {familyDetails.family.description && (
                      <CardDescription className="mt-1">{familyDetails.family.description}</CardDescription>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {t('family.createdBy')} {familyDetails.family.created_by_name}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {['head', 'manager'].includes(familyDetails.currentUserRole) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setShowInviteModal(true)}>
                            <Mail className="h-4 w-4 mr-2" />
                            {t('family.inviteMember')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setShowGenerateCodeModal(true)}>
                            <Ticket className="h-4 w-4 mr-2" />
                            {t('family.inviteCode.generate')}
                          </DropdownMenuItem>
                          {familyDetails.currentUserRole === 'head' && (
                            <DropdownMenuItem onClick={handleDeleteFamily} className="text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t('family.deleteFamily')}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => setShowInviteModal(true)} className="gap-2">
                      <Mail size={14} />
                      {t('family.inviteMember')}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setShowGenerateCodeModal(true)} className="gap-2">
                      <Ticket size={14} />
                      {t('family.inviteCode.generate')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="members">
                    <Users className="h-4 w-4 mr-2" />
                    {t('family.members')}
                    <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1">{familyDetails.members.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="budgets">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Budgets
                    <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1">{sharedBudgets.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="goals">
                    <Target className="h-4 w-4 mr-2" />
                    Goals
                    <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1">{sharedGoals.length}</Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="space-y-4 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('family.members')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {familyDetails.members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                              {member.full_name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium leading-none mb-1">{member.full_name}</p>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                              {member.status === 'pending' && (
                                <Badge variant="outline" className="mt-1 text-xs border-yellow-200 text-yellow-600 bg-yellow-50">
                                  {t('family.inviteCode.pendingInvitation')}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Role Selector/Badge */}
                            {(() => {
                              const roleHierarchy = { 'head': 4, 'manager': 3, 'contributor': 2, 'observer': 1 };
                              const currentLevel = roleHierarchy[familyDetails.currentUserRole];
                              const memberLevel = roleHierarchy[member.role];
                              const canModify = currentLevel > memberLevel;

                              if (!canModify) {
                                return <RoleBadge role={member.role} />;
                              }

                              return (
                                <Select
                                  value={member.role}
                                  onValueChange={(val) => handleChangeRole(member.id, val)}
                                >
                                  <SelectTrigger className="w-[140px] h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {familyDetails.currentUserRole === 'head' && (
                                      <SelectItem value="head">{t('family.roles.head')}</SelectItem>
                                    )}
                                    <SelectItem value="manager">{t('family.roles.manager')}</SelectItem>
                                    <SelectItem value="contributor">{t('family.roles.contributor')}</SelectItem>
                                    <SelectItem value="observer">{t('family.roles.observer')}</SelectItem>
                                  </SelectContent>
                                </Select>
                              );
                            })()}

                            {/* Action Buttons */}
                            {(() => {
                              const roleHierarchy = { 'head': 4, 'manager': 3, 'contributor': 2, 'observer': 1 };
                              const currentLevel = roleHierarchy[familyDetails.currentUserRole];
                              const memberLevel = roleHierarchy[member.role];
                              const isSelf = member.user_id === familyDetails.currentUserId;

                              if (isSelf && member.role !== 'head') {
                                return (
                                  <Button variant="destructive" size="sm" onClick={() => handleRemoveMember(member.id, true)}>
                                    {t('family.leaveFamily')}
                                  </Button>
                                );
                              }

                              if (!isSelf && currentLevel > memberLevel) {
                                return (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemoveMember(member.id, false)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Invite Codes Section within Members tab */}
                  {['head', 'manager'].includes(familyDetails.currentUserRole) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Ticket className="h-5 w-5" />
                          {t('family.inviteCode.title')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {inviteCodes.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground">
                            <p>{t('family.inviteCode.noActiveCodes')}</p>
                            <Button variant="link" onClick={() => setShowGenerateCodeModal(true)}>
                              {t('family.inviteCode.createFirst')}
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {inviteCodes.map((code) => (
                              <div key={code.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <code className="text-lg font-mono font-bold bg-muted px-2 py-0.5 rounded">{code.code}</code>
                                    <Badge variant={code.is_active ? "success" : "secondary"}>
                                      {code.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                    {code.role && <RoleBadge role={code.role} />}
                                  </div>
                                  <div className="text-sm text-muted-foreground flex gap-4">
                                    <span>{t('family.inviteCode.usesCount')}: {code.max_uses ? `${code.uses_count || 0}/${code.max_uses}` : '∞'}</span>
                                    {code.expires_at && <span>Exp: {new Date(code.expires_at).toLocaleDateString()}</span>}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleCopyCode(code.code)}>
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleCopyLink(code.code)}>
                                    <LinkIcon className="h-4 w-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeactivateCode(code.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="budgets" className="pt-4">
                  {sharedBudgets.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {sharedBudgets.map(budget => (
                        <Card key={budget.id}>
                          <CardHeader>
                            <CardTitle className="text-base">{budget.category_name}</CardTitle>
                            <CardDescription>{t('family.sharedBudget')}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="font-bold text-2xl">{formatCurrency(budget.amount)}</p>
                            <p className="text-xs text-muted-foreground mt-1">Period: {budget.period}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>{t('family.noSharedBudgets') || "No shared budgets found."}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="goals" className="pt-4">
                  {sharedGoals.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {sharedGoals.map(goal => (
                        <Card key={goal.id}>
                          <CardHeader>
                            <CardTitle className="text-base">{goal.name}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-end mb-2">
                              <p className="font-bold text-2xl">{formatCurrency(goal.current_amount)}</p>
                              <p className="text-sm text-muted-foreground">of {formatCurrency(goal.target_amount)}</p>
                            </div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%` }}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>{t('family.noSharedGoals') || "No shared goals found."}</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <CreateFamilyDialog
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={fetchData}
      />

      {selectedFamily && (
        <>
          <InviteMemberDialog
            open={showInviteModal}
            onOpenChange={setShowInviteModal}
            familyId={selectedFamily}
            onSuccess={() => selectFamily(selectedFamily)}
          />
          <GenerateInviteCodeDialog
            open={showGenerateCodeModal}
            onOpenChange={setShowGenerateCodeModal}
            familyId={selectedFamily}
            onSuccess={() => selectFamily(selectedFamily)}
          />
        </>
      )}

      <JoinFamilyDialog
        open={showJoinFamilyModal}
        onOpenChange={setShowJoinFamilyModal}
        onSuccess={fetchData}
      />
    </div>
  );
}
