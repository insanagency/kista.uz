
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check } from 'lucide-react';
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
  DialogFooter,
} from "@/components/ui/dialog"

const COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#06B6D4', '#14B8A6', '#F97316', '#84CC16',
  '#6366F1', '#A855F7', '#F43F5E', '#64748B', '#FF69B4',
  '#FF6347', '#FFD700', '#00CED1', '#9370DB', '#20B2AA'
];

const CategoryModal = ({ category, onClose }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    color: COLORS[0],
    icon: 'folder'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        type: category.type,
        color: category.color,
        icon: category.icon
      });
    }
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (category) {
        await api.put(`/categories/${category.id}`, formData);
        toast.success(t('categories.categoryUpdated'));
      } else {
        await api.post('/categories', formData);
        toast.success(t('categories.categoryCreated'));
      }

      onClose();
    } catch (error) {
      toast.error(category ? t('categories.failedToUpdate') : t('categories.failedToCreate'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {category ? t('categories.editCategory') : t('categories.addCategory')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('categories.name')}</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder={t('categories.categoryName')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('categories.type')}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.type === 'income' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, type: 'income' })}
                disabled={!!category}
                className={`flex-1 ${formData.type === 'income' ? 'bg-green-600 hover:bg-green-700' : ''}`}
              >
                {t('categories.income')}
              </Button>
              <Button
                type="button"
                variant={formData.type === 'expense' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, type: 'expense' })}
                disabled={!!category}
                className={`flex-1 ${formData.type === 'expense' ? 'bg-red-600 hover:bg-red-700' : ''}`}
              >
                {t('categories.expense')}
              </Button>
            </div>
            {category && (
              <p className="text-xs text-muted-foreground">{t('categories.typeCannotChange')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('categories.color')}</Label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full transition-all hover:scale-110 flex items-center justify-center ${formData.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                    }`}
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {formData.color === color && <Check className="text-white w-4 h-4" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('categories.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('categories.saving') : (category ? t('categories.update') : t('categories.create'))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryModal;
