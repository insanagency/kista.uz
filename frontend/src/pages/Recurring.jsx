
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../lib/api';
import { useCurrency } from '../context/CurrencyContext';
import { Repeat, Plus, Edit2, Trash2, Calendar, AlertCircle } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";

const Recurring = () => {
  const { t } = useTranslation();
  const { currency, formatAmount } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const [recurring, setRecurring] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [filterActive, setFilterActive] = useState('all');

  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    currency: currency,
    category_id: '',
    description: '',
    frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });

  useEffect(() => {
    fetchRecurring();
    fetchCategories();
  }, [currency]);

  // Handle URL edit param
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && recurring.length > 0) {
      const recToEdit = recurring.find(r => r.id === parseInt(editId));
      if (recToEdit) {
        openModal(recToEdit);
      }
    }
  }, [searchParams, recurring]);

  const fetchRecurring = async () => {
    try {
      const response = await api.get('/recurring');
      setRecurring(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('❌ Error fetching recurring:', error);
      setRecurring([]);
      if (error.response?.status !== 404 && error.response?.status !== 502) {
        toast.error(t('common.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      setCategories([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!formData.type || !formData.amount || !formData.frequency || !formData.start_date) {
        toast.error('Please fill all required fields');
        return;
      }

      const submitData = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        currency: formData.currency || 'USD',
        frequency: formData.frequency,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        description: formData.description || '',
      };

      if (editingRecurring) {
        await api.put(`/recurring/${editingRecurring.id}`, submitData);
        toast.success(t('recurring.recurringUpdated'));
      } else {
        await api.post('/recurring', submitData);
        toast.success(t('recurring.recurringCreated'));
      }

      setModalOpen(false);
      setSearchParams({}); // Clear URL params
      resetForm();
      fetchRecurring();
    } catch (error) {
      console.error('❌ Recurring error:', error);
      const errorMsg = error.response?.data?.errors
        ? error.response.data.errors.map(e => `${e.param}: ${e.msg}`).join(', ')
        : error.response?.data?.error || t('common.error');

      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('recurring.recurringDeleted'))) return;

    try {
      await api.delete(`/recurring/${id}`);
      toast.success(t('recurring.recurringDeleted'));
      fetchRecurring();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await api.patch(`/recurring/${id}/toggle`);
      toast.success(currentStatus ? 'Deactivated' : 'Activated');
      fetchRecurring();
    } catch (error) {
      toast.error(error.response?.data?.error || t('common.error'));
    }
  };

  const openModal = (rec = null) => {
    if (rec) {
      setEditingRecurring(rec);
      setFormData({
        type: rec.type,
        amount: rec.amount,
        currency: rec.currency,
        category_id: rec.category_id ? rec.category_id.toString() : '',
        description: rec.description || '',
        frequency: rec.frequency,
        start_date: rec.start_date,
        end_date: rec.end_date || '',
      });
    } else {
      resetForm();
    }
    setModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'expense',
      amount: '',
      currency: currency,
      category_id: '',
      description: '',
      frequency: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
    });
    setEditingRecurring(null);
  };

  const filteredRecurring = Array.isArray(recurring) ? recurring.filter(rec => {
    if (filterActive === 'active') return rec.is_active;
    if (filterActive === 'inactive') return !rec.is_active;
    return true;
  }) : [];

  const filteredCategories = Array.isArray(categories) ? categories.filter(cat => cat.type === formData.type) : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Repeat className="text-primary" />
            {t('recurring.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('recurring.willCreateOn')} {t('recurring.nextOccurrence').toLowerCase()}
          </p>
        </div>
        <Button onClick={() => openModal()} className="gap-2 w-full sm:w-auto">
          <Plus size={16} />
          {t('recurring.addRecurring')}
        </Button>
      </div>

      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
        <Button
          variant={filterActive === 'all' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setFilterActive('all')}
          className={filterActive === 'all' ? 'bg-background shadow-sm hover:bg-background' : ''}
        >
          {t('common.all')}
        </Button>
        <Button
          variant={filterActive === 'active' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setFilterActive('active')}
          className={filterActive === 'active' ? 'bg-background shadow-sm hover:bg-background' : ''}
        >
          {t('recurring.active')}
        </Button>
        <Button
          variant={filterActive === 'inactive' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setFilterActive('inactive')}
          className={filterActive === 'inactive' ? 'bg-background shadow-sm hover:bg-background' : ''}
        >
          {t('recurring.inactive')}
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredRecurring.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <p className="text-muted-foreground">{t('transactions.noTransactions')}</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRecurring.map((rec) => (
            <Card key={rec.id} className={`transition-opacity ${!rec.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={rec.type === 'income' ? 'default' : 'destructive'} className={rec.type === 'income' ? 'bg-green-600 hover:bg-green-700' : ''}>
                        {t(`transactions.${rec.type}`)}
                      </Badge>
                      <Badge variant="secondary">
                        {t(`recurring.${rec.frequency}`)}
                      </Badge>
                      <Badge variant={rec.is_active ? 'outline' : 'secondary'} className={rec.is_active ? 'text-green-600 border-green-200' : ''}>
                        {rec.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold">
                        {formatAmount(rec.amount, rec.currency)}
                      </h3>
                      {rec.category_name && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <span className="text-xs">📁</span> {rec.category_name}
                        </p>
                      )}
                    </div>

                    {rec.description && (
                      <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                        {rec.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{t('recurring.nextOccurrence')}: <span className="font-medium text-foreground">{new Date(rec.next_occurrence).toLocaleDateString()}</span></span>
                      </div>
                      {rec.end_date && (
                        <span>End: {new Date(rec.end_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col gap-2 self-end sm:self-start">
                    <div className="flex items-center gap-2 mr-2 sm:mr-0 sm:mb-2">
                      <Switch
                        checked={rec.is_active}
                        onCheckedChange={() => handleToggle(rec.id, rec.is_active)}
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => openModal(rec)}>
                      <Edit2 size={16} className="text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(rec.id)}>
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRecurring ? t('recurring.editRecurring') : t('recurring.addRecurring')}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('transactions.type')}</Label>
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
                  variant={formData.type === 'expense' ? 'destructive' : 'outline'}
                  onClick={() => setFormData({ ...formData, type: 'expense', category_id: '' })}
                >
                  {t('transactions.expense')}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>{t('transactions.amount')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('transactions.transactionCurrency')}</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(val) => setFormData({ ...formData, currency: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="UZS">UZS</SelectItem>
                    {/* Add more currencies as needed */}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('recurring.frequency')}</Label>
              <Select
                value={formData.frequency}
                onValueChange={(val) => setFormData({ ...formData, frequency: val })}
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>{t('transactions.category')}</Label>
              <Select
                value={formData.category_id}
                onValueChange={(val) => setFormData({ ...formData, category_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('transactions.uncategorized')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  {filteredCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('recurring.startDate')}</Label>
                <DatePicker
                  date={formData.start_date ? new Date(formData.start_date) : undefined}
                  setDate={(date) => setFormData({ ...formData, start_date: date ? format(date, 'yyyy-MM-dd') : '' })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('recurring.endDate')}</Label>
                <DatePicker
                  date={formData.end_date ? new Date(formData.end_date) : undefined}
                  setDate={(date) => setFormData({ ...formData, end_date: date ? format(date, 'yyyy-MM-dd') : '' })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('transactions.description')}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('transactions.addNote')}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                {editingRecurring ? t('common.save') : t('transactions.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recurring;
