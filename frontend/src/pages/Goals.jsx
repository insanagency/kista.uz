
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import api from '../lib/api';
import { useCurrency } from '../context/CurrencyContext';
import { Target, Plus } from 'lucide-react';
import GoalModal from '../components/GoalModal';
import GoalCard from '../components/GoalCard';
import ContributionModal from '../components/ContributionModal';
import { GoalCardSkeleton } from '../components/LoadingSkeleton';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Goals = () => {
  const { t } = useTranslation();
  const { formatCurrency, currency: currentCurrency, convertAmount } = useCurrency();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'

  useEffect(() => {
    fetchGoals();
  }, [filter, currentCurrency]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { is_completed: filter === 'completed' } : {};
      const response = await api.get('/goals', { params });
      setGoals(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('❌ Error fetching goals:', error);
      setGoals([]);
      if (error.response?.status !== 404) {
        toast.error(t('goals.failedToLoad'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('goals.deleteConfirm'))) return;

    try {
      await api.delete(`/goals/${id}`);
      toast.success(t('goals.deleteSuccess'));
      fetchGoals();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setShowGoalModal(true);
  };

  const handleAdd = () => {
    setEditingGoal(null);
    setShowGoalModal(true);
  };

  const handleContribute = (goal) => {
    setSelectedGoal(goal);
    setShowContributionModal(true);
  };

  const handleModalClose = () => {
    setShowGoalModal(false);
    setShowContributionModal(false);
    setEditingGoal(null);
    setSelectedGoal(null);
    fetchGoals();
  };

  // Calculate overall stats with currency conversion
  const stats = goals.reduce(
    (acc, goal) => {
      const target = convertAmount(parseFloat(goal.target_amount), goal.currency);
      const current = convertAmount(parseFloat(goal.current_amount), goal.currency);
      acc.totalTarget += target;
      acc.totalSaved += current;
      if (goal.is_completed) acc.completedCount++;
      return acc;
    },
    { totalTarget: 0, totalSaved: 0, completedCount: 0 }
  );

  const overallProgress = stats.totalTarget > 0 ? (stats.totalSaved / stats.totalTarget) * 100 : 0;

  const filteredGoals = goals.filter(goal => {
    if (filter === 'all') return true;
    if (filter === 'active') return !goal.is_completed;
    if (filter === 'completed') return goal.is_completed;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Target className="text-primary" />
          {t('goals.title')}
        </h1>
        <Button onClick={handleAdd} className="gap-2 w-full sm:w-auto">
          <Plus size={16} />
          <span>{t('goals.addGoal')}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm font-medium text-muted-foreground">{t('goals.totalGoals')}</p>
            <p className="text-2xl font-bold mt-2">{goals.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm font-medium text-muted-foreground">{t('goals.completed')}</p>
            <p className="text-2xl font-bold mt-2">{stats.completedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm font-medium text-muted-foreground">{t('goals.overallProgress')}</p>
            <p className="text-2xl font-bold mt-2">{overallProgress.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
        <Button
          variant={filter === 'all' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-background shadow-sm hover:bg-background' : ''}
        >
          {t('common.all')}
        </Button>
        <Button
          variant={filter === 'active' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('active')}
          className={filter === 'active' ? 'bg-background shadow-sm hover:bg-background' : ''}
        >
          {t('goals.active')}
        </Button>
        <Button
          variant={filter === 'completed' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('completed')}
          className={filter === 'completed' ? 'bg-background shadow-sm hover:bg-background' : ''}
        >
          {t('goals.completed')}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <GoalCardSkeleton key={i} />)}
        </div>
      ) : filteredGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onContribute={handleContribute}
              formatCurrency={formatCurrency}
              convertAmount={convertAmount}
              currentCurrency={currentCurrency}
            />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <Target className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('goals.noGoals')}</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Set savings goals like "New Laptop" or "Vacation" and track your progress!
          </p>
          <Button onClick={handleAdd}>
            <Plus size={16} className="mr-2" />
            {t('goals.createFirst')}
          </Button>
        </Card>
      )}

      {/* Modals */}
      {showGoalModal && (
        <GoalModal
          goal={editingGoal}
          onClose={handleModalClose}
        />
      )}

      {showContributionModal && selectedGoal && (
        <ContributionModal
          goal={selectedGoal}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default Goals;
