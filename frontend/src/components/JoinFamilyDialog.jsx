
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus } from 'lucide-react';
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

const JoinFamilyDialog = ({ open, onOpenChange, onSuccess }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!code.trim()) {
            toast.error('Please enter an invite code');
            setLoading(false);
            return;
        }

        try {
            const response = await api.post('/families/join', { code: code.trim() });
            toast.success(response.data.message || t('family.inviteCode.joinSuccess'));
            onSuccess();
            onOpenChange(false);
            setCode('');
        } catch (error) {
            console.error('Error joining family:', error);
            const errorMsg = error.response?.data?.error || t('family.inviteCode.failedToJoin');
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('family.inviteCode.joinFamily')}</DialogTitle>
                    <DialogDescription>
                        Enter the invite code you received to join a family workspace.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">{t('family.inviteCode.enterCode')}</Label>
                        <Input
                            id="code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                            placeholder="e.g. ABC123XYZ"
                            className="text-center text-lg tracking-widest uppercase font-mono"
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:justify-end">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                            {loading ? t('common.joining') : t('family.join')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default JoinFamilyDialog;
