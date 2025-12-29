
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ticket } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

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

const GenerateInviteCodeDialog = ({ open, onOpenChange, familyId, onSuccess }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        max_uses: '',
        expires_in_days: '',
        role: 'contributor'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const maxUses = formData.max_uses ? parseInt(formData.max_uses) : null;
        const expiresInDays = formData.expires_in_days ? parseInt(formData.expires_in_days) : null;

        try {
            await api.post(`/families/${familyId}/invite-codes`, {
                max_uses: maxUses,
                expires_in_days: expiresInDays,
                role: formData.role
            });

            const message = maxUses || expiresInDays
                ? t('family.inviteCode.codeGenerated')
                : `Unlimited invite code created! ♾️`;
            toast.success(message);

            onSuccess();
            onOpenChange(false);
            setFormData({ max_uses: '', expires_in_days: '', role: 'contributor' });
        } catch (error) {
            console.error('Error generating invite code:', error);
            toast.error(error.response?.data?.error || t('family.inviteCode.failedToGenerate'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('family.inviteCode.generate')}</DialogTitle>
                    <DialogDescription>
                        Create an invite code that users can enter to join your family.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="max_uses">{t('family.inviteCode.maxUses')}</Label>
                            <Input
                                id="max_uses"
                                type="number"
                                min="0"
                                value={formData.max_uses}
                                onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                                placeholder="Unlimited"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expires_in_days">{t('family.inviteCode.expiresInDays')}</Label>
                            <Input
                                id="expires_in_days"
                                type="number"
                                min="0"
                                value={formData.expires_in_days}
                                onChange={(e) => setFormData({ ...formData, expires_in_days: e.target.value })}
                                placeholder="Unlimited"
                            />
                        </div>
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
                    </div>

                    <DialogFooter className="gap-2 sm:justify-end">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? t('common.generating') : t('common.generate')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default GenerateInviteCodeDialog;
