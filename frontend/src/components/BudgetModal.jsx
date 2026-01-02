
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../context/CurrencyContext';
import { Plus } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoneyInput } from "@/components/ui/money-input"
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

const BudgetModal = ({ month, year, budget = null, onClose }) => {
  const { t } = useTranslation();
  const { currency: userCurrency } = useCurrency();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    category_id: budget?.category_id ? String(budget.category_id) : '',
    amount: budget?.amount || '',
    currency: budget?.currency || userCurrency || 'USD',
    month: month,
    year: year
  });
  const [loading, setLoading] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');

  const CURRENCIES = [
    { code: 'UZS', name: 'Uzbekistan Som', symbol: 'so\'m' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'KRW', name: 'Korean Won', symbol: '₩' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (userCurrency && !budget) {
      setFormData(prev => ({ ...prev, currency: userCurrency }));
    }
  }, [userCurrency, budget]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories?type=expense');
      setCategories(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        category_id: parseInt(formData.category_id),
        amount: parseFloat(formData.amount),
        input_currency: formData.currency,
        month: formData.month,
        year: formData.year
      };

      if (budget) {
        await api.put(`/budgets/${budget.id}`, data);
        toast.success(t('budgets.budgetUpdated'));
      } else {
        await api.post('/budgets', data);
        toast.success(t('budgets.budgetSet'));
      }
      onClose();
    } catch (error) {
      console.error('Budget operation error:', error);
      toast.error(error.response?.data?.error || t('budgets.failedToSet'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddCategory = async () => {
    if (!quickAddName.trim()) {
      toast.error(t('categories.nameRequired'));
      return;
    }
    try {
      const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
      const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      const response = await api.post('/categories', {
        name: quickAddName,
        type: 'expense',
        color: randomColor,
        icon: 'folder'
      });
      const newCategory = response.data;
      setCategories([...categories, newCategory]);
      setFormData({ ...formData, category_id: String(newCategory.id) });
      setQuickAddName('');
      setShowQuickAdd(false);
      toast.success(t('categories.categoryCreated'));
    } catch (error) {
      toast.error(t('categories.failedToCreate'));
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {budget ? t('budgets.editBudget') : t('budgets.setBudget')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('budgets.monthYear') || 'Month & Year'}</Label>
            <div className="flex gap-2">
              <Input
                type="month"
                value={`${formData.year}-${String(formData.month).padStart(2, '0')}`}
                onChange={(e) => {
                  if (e.target.value) {
                    const [year, month] = e.target.value.split('-');
                    setFormData({
                      ...formData,
                      year: parseInt(year),
                      month: parseInt(month)
                    });
                  }
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t('budgets.selectMonthYear') || 'Select month and year for this budget'}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>{t('transactions.category')}</Label>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-xs flex items-center gap-1"
                onClick={() => setShowQuickAdd(!showQuickAdd)}
              >
                <Plus size={14} /> {t('categories.addCategory')}
              </Button>
            </div>

            {showQuickAdd && (
              <div className="flex gap-2 p-2 bg-muted rounded-md mb-2">
                <Input
                  value={quickAddName}
                  onChange={(e) => setQuickAddName(e.target.value)}
                  placeholder={t('categories.categoryName')}
                  className="h-8 text-sm"
                />
                <Button size="sm" type="button" onClick={handleQuickAddCategory}>
                  {t('common.save')}
                </Button>
              </div>
            )}

            <Select
              value={formData.category_id}
              onValueChange={(val) => setFormData({ ...formData, category_id: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('common.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t('budgets.onlyExpenseCategories')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('budgets.budgetAmount')}</Label>
              <MoneyInput
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('common.currency')}</Label>
              <Select
                value={formData.currency}
                onValueChange={(val) => setFormData({ ...formData, currency: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(curr => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">{t('budgets.inputCurrencyNote')}</p>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('budgets.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('categories.saving') : t('budgets.setBudget')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetModal;
