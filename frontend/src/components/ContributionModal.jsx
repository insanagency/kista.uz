
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { useCurrency } from '../context/CurrencyContext';
import { format } from "date-fns";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoneyInput } from "@/components/ui/money-input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"

const ContributionModal = ({ goal, onClose }) => {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const [isWithdraw, setIsWithdraw] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    currency: goal.currency || currency || 'USD',
    contribution_date: new Date().toISOString().split('T')[0],
    note: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const endpoint = isWithdraw ? 'withdraw' : 'contribute';
      await api.post(`/goals/${goal.id}/${endpoint}`, formData);
      toast.success(t(isWithdraw ? 'goals.withdrawSuccess' : 'goals.contributeSuccess'));
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || t('common.error'));
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{goal.icon}</span>
            <span>{goal.name}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={!isWithdraw ? "default" : "outline"}
              onClick={() => setIsWithdraw(false)}
              className={`flex-1 gap-2 ${!isWithdraw ? 'bg-green-600 hover:bg-green-700' : ''}`}
            >
              <Plus size={16} />
              {t('goals.add')}
            </Button>
            <Button
              type="button"
              variant={isWithdraw ? "default" : "outline"}
              onClick={() => setIsWithdraw(true)}
              className={`flex-1 gap-2 ${isWithdraw ? 'bg-red-600 hover:bg-red-700' : ''}`}
            >
              <Minus size={16} />
              {t('goals.withdraw')}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>{t('common.amount')}</Label>
            <MoneyInput
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              placeholder={isWithdraw ? `Max: ${goal.current_amount}` : ''}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('common.date')}</Label>
            <DatePicker
              date={formData.contribution_date ? new Date(formData.contribution_date) : undefined}
              setDate={(date) => setFormData({ ...formData, contribution_date: date ? format(date, 'yyyy-MM-dd') : '' })}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('common.note')}</Label>
            <Textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={3}
              placeholder={t('goals.notePlaceholder')}
            />
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              className={isWithdraw ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {t(isWithdraw ? 'goals.confirmWithdraw' : 'goals.confirmAdd')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContributionModal;
