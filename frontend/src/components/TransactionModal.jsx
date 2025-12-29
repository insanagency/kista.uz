
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../context/CurrencyContext';
import { Plus } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"

const TransactionModal = ({ transaction, categories: initialCategories, onClose }) => {
  const { t } = useTranslation();
  const { currency: userCurrency } = useCurrency();
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    currency: userCurrency || 'USD',
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
    category_id: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState(initialCategories);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringData, setRecurringData] = useState({
    frequency: 'monthly',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: ''
  });

  useEffect(() => {
    if (transaction) {
      const date = transaction.transaction_date ?
        format(new Date(transaction.transaction_date), 'yyyy-MM-dd') :
        format(new Date(), 'yyyy-MM-dd');

      setFormData({
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency || 'USD',
        transaction_date: date,
        category_id: transaction.category_id ? String(transaction.category_id) : '',
        description: transaction.description || ''
      });
    }
  }, [transaction]);

  const filteredCategories = categories.filter(cat => cat.type === formData.type);

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

  const validateForm = () => {
    const amount = parseFloat(formData.amount);
    if (!formData.amount) return false;
    if (isNaN(amount) || amount <= 0) return false;
    if (amount > 999999999999.99) return false;
    if (!formData.transaction_date) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please check your input');
      return;
    }

    setLoading(true);

    try {
      const amount = parseFloat(formData.amount);
      const data = {
        type: formData.type,
        amount: amount,
        currency: formData.currency,
        transaction_date: formData.transaction_date,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        description: formData.description || ''
      };

      if (transaction) {
        await api.put(`/transactions/${transaction.id}`, data);
        toast.success(t('transactions.transactionUpdated'));
      } else {
        await api.post('/transactions', data);
        toast.success(t('transactions.transactionCreated'));

        if (isRecurring) {
          try {
            await api.post('/recurring', {
              ...data,
              frequency: recurringData.frequency,
              start_date: recurringData.startDate,
              end_date: recurringData.endDate || null
            });
            toast.success(t('recurring.recurringCreated'));
            setTimeout(() => window.location.reload(), 1000);
          } catch (recurError) {
            console.error('Failed to create recurring:', recurError);
            toast.error('Transaction created but recurring failed');
          }
        } else {
          onClose(); // Only close if not reloading
        }
      }
      if (!isRecurring) onClose();
    } catch (error) {
      console.error('Transaction error:', error);
      const msg = error.response?.data?.error || t('transactions.failedToCreate');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddCategory = async () => {
    if (!quickAddName.trim()) {
      toast.error(t('categories.name') + ' is required');
      return;
    }
    try {
      const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
      const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      const response = await api.post('/categories', {
        name: quickAddName,
        type: formData.type,
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction ? t('transactions.editTransaction') : t('transactions.addTransaction')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant={formData.type === 'income' ? 'default' : 'outline'}
              className={formData.type === 'income' ? 'bg-green-600 hover:bg-green-700' : ''}
              onClick={() => setFormData({ ...formData, type: 'income', category_id: '' })}
            >
              {t('transactions.income')}
            </Button>
            <Button
              type="button"
              variant={formData.type === 'expense' ? 'default' : 'outline'}
              className={formData.type === 'expense' ? 'bg-red-600 hover:bg-red-700' : ''}
              onClick={() => setFormData({ ...formData, type: 'expense', category_id: '' })}
            >
              {t('transactions.expense')}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label>{t('transactions.amount')}</Label>
              <Input
                type="number"
                step="any"
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



          <div className="space-y-2">
            <Label>{t('transactions.date')}</Label>
            <DatePicker
              date={formData.transaction_date ? new Date(formData.transaction_date) : undefined}
              setDate={(date) => setFormData({ ...formData, transaction_date: date ? format(date, 'yyyy-MM-dd') : '' })}
            />
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
                <SelectValue placeholder={t('transactions.uncategorized')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uncategorized">Uncategorized</SelectItem>
                {/* Shadcn Select Item value must be string. category.id is usually int. */}
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('transactions.description')}</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('transactions.addNote')}
            />
          </div>

          {!transaction && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) => setIsRecurring(checked)}
                />
                <Label htmlFor="recurring" className="cursor-pointer">
                  {t('recurring.makeRecurring')}
                </Label>
              </div>

              {isRecurring && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-muted rounded-md mt-2">
                  <div className="space-y-1">
                    <Label className="text-xs">{t('recurring.frequency')}</Label>
                    <Select
                      value={recurringData.frequency}
                      onValueChange={(val) => setRecurringData({ ...recurringData, frequency: val })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">{t('recurring.daily')}</SelectItem>
                        <SelectItem value="weekly">{t('recurring.weekly')}</SelectItem>
                        <SelectItem value="monthly">{t('recurring.monthly')}</SelectItem>
                        <SelectItem value="yearly">{t('recurring.yearly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('recurring.startDate')}</Label>
                    <Input
                      type="date"
                      value={recurringData.startDate}
                      onChange={(e) => setRecurringData({ ...recurringData, startDate: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('transactions.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('transactions.saving') : (transaction ? t('transactions.update') : t('transactions.create'))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionModal;
