
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { useCurrency } from '../context/CurrencyContext';
import { Plus, Trash2, TrendingDown, AlertTriangle, Edit2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import BudgetModal from '../components/BudgetModal';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BudgetCardSkeleton } from '../components/LoadingSkeleton';

const Budgets = () => {
  const { t } = useTranslation();
  const { formatCurrency, currency: currentCurrency } = useCurrency();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/budgets?month=${selectedMonth}&year=${selectedYear}&currency=${currentCurrency}`);
      setBudgets(response.data);
    } catch (error) {
      toast.error(t('budgets.failedToLoad'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, currentCurrency, t]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets, currentCurrency]);

  const handleDelete = async (id) => {
    if (!window.confirm(t('budgets.deleteConfirm'))) return;

    try {
      await api.delete(`/budgets/${id}`);
      toast.success(t('budgets.budgetDeleted'));
      fetchBudgets();
    } catch (error) {
      toast.error(t('budgets.failedToDelete'));
      console.error(error);
    }
  };

  const handleAdd = () => {
    setEditingBudget(null);
    setShowModal(true);
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingBudget(null);
    fetchBudgets();
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'text-destructive'; // For text/icon, bg handled by Progress class override? No, Progress default is primary.
    // Shadcn Progress uses bg-primary for indicator.
    // I can modify Progress component or just use styles.
    // Progress component accepts className but indicator className is hardcoded?
    // Let's check Progress component. It accepts className on Root. Indicator has className "bg-primary".
    // I need to override indicator color.
    // Shadcn Progress primitive allows `indicatorClassName` via props? No.
    // I will write a custom Logic or just styled div or override styles.
    // Simpler: use the color calculating logic and pass it as indicator color?
    // The shadcn component I wrote: 
    /*
    const Progress = React.forwardRef(({ className, value, ...props }, ref) => (
    <ProgressPrimitive.Root ... >
        <ProgressPrimitive.Indicator className="bg-primary ..." />
    </ProgressPrimitive.Root>
    ))
    */
    // I should modify Progress component to accept indicatorColor if I want varied colors. 
    // OR simply use inline style or class overrides.
    // For now, I'll stick to Primary color progress, but maybe change color based on state?
    // I'll stick to Primary for now, or use `bg-red-500` via a wrapper if I can target the indicator.
    // Actually, I can just use a simple div based progress bar like before if Shadcn progress is too rigid, 
    // OR I can duplicate Shadcn Progress component code here for custom colors.
    // I'll stick to the previous custom progress bar logic but wrapped in cleaner code, or just use Shadcn Progress and accept primary color.
    // Actually, distinct colors (Green/Yellow/Red) are important for Budgets.
    // Use the custom div implementation for now, it's simple and flexible.
    return percentage >= 100 ? 'bg-destructive' : percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500';
  };

  const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + parseFloat(b.spent || 0), 0);
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{t('budgets.title')}</h1>
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <Input
            type="month"
            value={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`}
            onChange={(e) => {
              if (e.target.value) {
                const [year, month] = e.target.value.split('-');
                setSelectedYear(parseInt(year));
                setSelectedMonth(parseInt(month));
              }
            }}
            className="w-full sm:w-auto"
          />
          <Button onClick={handleAdd} className="shrink-0 gap-2">
            <Plus size={16} />
            <span className="hidden sm:inline">{t('budgets.setBudget')}</span>
            <span className="sm:hidden">{t('common.add')}</span>
          </Button>
        </div>
      </div>

      {budgets.length > 0 && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t('budgets.overallBudget')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('budgets.totalBudget')}</p>
                <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('budgets.totalSpent')}</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('budgets.remaining')}</p>
                <p className={`text-2xl font-bold ${totalBudget - totalSpent >= 0 ? 'text-green-600 dark:text-green-500' : 'text-destructive'}`}>
                  {totalBudget - totalSpent >= 0 ? formatCurrency(totalBudget - totalSpent) : '-' + formatCurrency(Math.abs(totalBudget - totalSpent))}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Progress value={Math.min(overallPercentage, 100)} className="h-3" />
              <p className="text-xs text-center text-muted-foreground">{overallPercentage.toFixed(1)}% {t('budgets.used')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => <BudgetCardSkeleton key={i} />)}
          </div>
        ) : budgets.length > 0 ? (
          budgets.map((budget) => {
            const amount = parseFloat(budget.amount || 0);
            const spent = parseFloat(budget.spent || 0);
            const remaining = amount - spent;
            const percentage = amount > 0 ? (spent / amount * 100) : 0;

            return (
              <Card key={budget.id} className="shadow-none border hover:bg-muted/30 transition-colors">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
                        style={{ backgroundColor: budget.category_color }}
                      >
                        {budget.category_name?.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-base">{budget.category_name}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span>{t('budgets.totalBudget')}: {formatCurrency(amount)}</span>
                          <span>{t('budgets.totalSpent')}: {formatCurrency(spent)}</span>
                          <span className={remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}>
                            {t('budgets.remaining')}: {remaining >= 0 ? formatCurrency(remaining) : '-' + formatCurrency(Math.abs(remaining))}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 self-end sm:self-start">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(budget)}>
                        <Edit2 size={16} className="text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(budget.id)}>
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(percentage)}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm font-medium">
                      <span className="text-muted-foreground">{percentage.toFixed(1)}% {t('budgets.used')}</span>
                      {percentage >= 100 && (
                        <span className="text-destructive flex items-center gap-1">
                          <AlertTriangle size={14} />
                          {t('budgets.overBudgetBy')} {formatCurrency(spent - amount)}
                        </span>
                      )}
                      {percentage >= 80 && percentage < 100 && (
                        <span className="text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                          <TrendingDown size={14} />
                          {t('budgets.approachingLimit')}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="py-12 flex flex-col items-center justify-center text-center">
            <Wallet className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
            <p className="text-lg font-medium mb-2">{t('budgets.noBudgets')}</p>
            <Button onClick={handleAdd}>
              <Plus size={16} className="mr-2" />
              {t('budgets.setFirstBudget')}
            </Button>
          </Card>
        )}
      </div>

      {showModal && (
        <BudgetModal
          month={selectedMonth}
          year={selectedYear}
          budget={editingBudget}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default Budgets;
