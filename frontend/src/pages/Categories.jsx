
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { Plus, Pencil, Trash2, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import CategoryModal from '../components/CategoryModal';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Categories = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      toast.error(t('categories.failedToLoad'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('categories.deleteConfirm'))) return;

    try {
      await api.delete(`/categories/${id}`);
      toast.success(t('categories.categoryDeleted'));
      fetchCategories();
    } catch (error) {
      toast.error(t('categories.failedToDelete'));
      console.error(error);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingCategory(null);
    fetchCategories();
  };

  const filteredCategories = filter === 'all'
    ? categories
    : categories.filter(cat => cat.type === filter);

  const incomeCount = categories.filter(cat => cat.type === 'income').length;
  const expenseCount = categories.filter(cat => cat.type === 'expense').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{t('categories.title')}</h1>
        <Button onClick={handleAdd} className="gap-2 w-full sm:w-auto">
          <Plus size={16} />
          <span>{t('categories.addCategory')}</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm font-medium text-muted-foreground">{t('categories.totalCategories')}</p>
            <p className="text-3xl font-bold mt-2">{categories.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm font-medium text-muted-foreground">{t('categories.incomeCategories')}</p>
            <p className="text-3xl font-bold mt-2">{incomeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm font-medium text-muted-foreground">{t('categories.expenseCategories')}</p>
            <p className="text-3xl font-bold mt-2">{expenseCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
        <Button
          variant={filter === 'all' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-background shadow-sm hover:bg-background' : ''}
        >
          {t('categories.all')} ({categories.length})
        </Button>
        <Button
          variant={filter === 'income' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('income')}
          className={filter === 'income' ? 'bg-background shadow-sm hover:bg-background' : ''}
        >
          {t('categories.income')} ({incomeCount})
        </Button>
        <Button
          variant={filter === 'expense' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('expense')}
          className={filter === 'expense' ? 'bg-background shadow-sm hover:bg-background' : ''}
        >
          {t('categories.expense')} ({expenseCount})
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCategories.map((category) => (
              <Card
                key={category.id}
                className="hover:shadow-md transition-all border-l-4"
                style={{ borderLeftColor: category.color }}
              >
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base truncate max-w-[120px]">{category.name}</h3>
                      <Badge
                        variant="secondary"
                        className={`mt-1 text-xs font-normal ${category.type === 'income'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                      >
                        {category.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                      onClick={() => handleEdit(category)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-600"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="py-12 flex flex-col items-center justify-center text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
            <p className="text-muted-foreground mb-4">{t('categories.noCategories')}</p>
            {filter === 'all' && (
              <Button onClick={handleAdd}>
                <Plus size={16} className="mr-2" />
                {t('categories.addCategory')}
              </Button>
            )}
          </Card>
        )}
      </div>

      {showModal && (
        <CategoryModal
          category={editingCategory}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default Categories;
