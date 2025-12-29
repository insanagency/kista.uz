
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { useCurrency } from '../context/CurrencyContext';
import { format } from "date-fns";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker";

const ICONS = ['🎯', '🏠', '🚗', '✈️', '💍', '📚', '💰', '🎓', '🏖️', '🎮', '📱', '⌚', '🎸', '🏋️', '🎨'];
const PRIORITIES = ['low', 'medium', 'high'];
const SUPPORTED_CURRENCIES = ['UZS', 'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'KRW', 'VND', 'THB', 'SGD', 'MYR', 'IDR', 'PHP', 'INR', 'AUD', 'CAD'];

const GoalModal = ({ goal, onClose }) => {
  const { t } = useTranslation();
  const { currency } = useCurrency();

  const [formData, setFormData] = useState({
    name: goal?.name || '',
    target_amount: goal?.target_amount || '',
    currency: goal?.currency || currency || 'USD',
    deadline: goal?.deadline || '',
    category: goal?.category || '',
    icon: goal?.icon || '🎯',
    priority: goal?.priority || 'medium',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const submitData = {
        ...formData,
        deadline: formData.deadline || null,
        category: formData.category || null,
      };

      if (goal) {
        await api.put(`/goals/${goal.id}`, submitData);
        toast.success(t('goals.updateSuccess'));
      } else {
        await api.post('/goals', submitData);
        toast.success(t('goals.createSuccess'));
      }
      onClose();
    } catch (error) {
      console.error('Goal submit error:', error.response?.data);
      const errorMsg = error.response?.data?.errors
        ? error.response.data.errors.map(e => e.msg).join(', ')
        : error.response?.data?.error || t('common.error');
      toast.error(errorMsg);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {goal ? t('goals.editGoal') : t('goals.newGoal')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('goals.name')} *</Label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('goals.targetAmount')} *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('goals.currency') || t('common.currency') || 'Currency'}</Label>
              <Select
                value={formData.currency}
                onValueChange={(val) => setFormData({ ...formData, currency: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((curr) => (
                    <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('goals.deadline')}</Label>
            <DatePicker
              date={formData.deadline ? new Date(formData.deadline) : undefined}
              setDate={(date) => setFormData({ ...formData, deadline: date ? format(date, 'yyyy-MM-dd') : '' })}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('goals.category')}</Label>
            <Input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder={t('goals.categoryPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('goals.icon')}</Label>
            <div className="grid grid-cols-8 gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`text-xl p-2 rounded-md border transition-all hover:bg-muted ${formData.icon === icon
                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                    : 'border-input'
                    }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('goals.priorityLabel')}</Label>
            <div className="flex gap-2">
              {PRIORITIES.map((priority) => (
                <Button
                  key={priority}
                  type="button"
                  variant={formData.priority === priority ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, priority })}
                  className={`flex-1 ${formData.priority === priority ? 'bg-primary' : ''}`}
                >
                  {t(`goals.priority.${priority}`)}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {goal ? t('common.update') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GoalModal;
