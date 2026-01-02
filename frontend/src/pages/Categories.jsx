
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { Plus, Pencil, Trash2, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import CategoryModal from '../components/CategoryModal';
import { CardSkeleton } from '../components/LoadingSkeleton';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal } from "lucide-react";

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
      <Tabs defaultValue="all" value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="grid w-full sm:w-[400px] grid-cols-3">
          <TabsTrigger value="all">{t('categories.all')} ({categories.length})</TabsTrigger>
          <TabsTrigger value="income">{t('categories.income')} ({incomeCount})</TabsTrigger>
          <TabsTrigger value="expense">{t('categories.expense')} ({expenseCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Categories Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCategories.map((category) => (
              <Card
                key={category.id}
                className="hover:shadow-md transition-all"
              >
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarFallback
                        style={{ backgroundColor: category.color, color: 'white' }}
                        className="font-bold"
                      >
                        {category.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <h3 className="font-semibold text-sm truncate max-w-[120px]">{category.name}</h3>
                      <Badge
                        variant="secondary"
                        className={`w-fit mt-1 text-[10px] h-5 px-1.5 font-normal ${category.type === 'income'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                      >
                        {category.type === 'income' ? t('categories.income') : t('categories.expense')}
                      </Badge>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(category)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>{t('categories.edit')}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(category.id)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>{t('categories.delete')}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="py-12 flex flex-col items-center justify-center text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
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
