
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

const InviteMemberDialog = ({ open, onOpenChange, familyId, onSuccess }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        role: 'contributor'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post(`/families/${familyId}/invite`, formData);
            toast.success(t('family.inviteSent'));
            onSuccess();
            onOpenChange(false);
            setFormData({ email: '', role: 'contributor' });
        } catch (error) {
            console.error('Error sending invitation:', error);
            toast.error(error.response?.data?.error || t('family.failedToInvite'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('family.inviteMember')}</DialogTitle>
                    <DialogDescription>
                        Invite a new member to your family via email.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">{t('common.email')} *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            placeholder="member@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">{t('family.role')}</Label>
                        <Select
                            value={formData.role}
                            onValueChange={(val) => setFormData({ ...formData, role: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="manager">{t('family.roles.manager')}</SelectItem>
                                <SelectItem value="contributor">{t('family.roles.contributor')}</SelectItem>
                                <SelectItem value="observer">{t('family.roles.observer')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                            {formData.role === 'manager' && t('family.inviteCode.managerRoleDescription')}
                            {formData.role === 'contributor' && t('family.inviteCode.contributorRoleDescription')}
                            {formData.role === 'observer' && t('family.inviteCode.observerRoleDescription')}
                        </p>
                    </div>

                    <DialogFooter className="gap-2 sm:justify-end">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? t('common.sending') : t('family.sendInvite')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default InviteMemberDialog;
