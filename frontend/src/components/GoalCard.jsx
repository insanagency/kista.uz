
import { Edit2, Trash2, Plus, Calendar, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { differenceInDays } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const GoalCard = ({ goal, onEdit, onDelete, onContribute, formatCurrency, convertAmount, currentCurrency }) => {
  const { t } = useTranslation();

  // Convert amounts to display currency
  const targetAmount = convertAmount(goal.target_amount, goal.currency);
  const currentAmount = convertAmount(goal.current_amount, goal.currency);

  const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
  const remaining = targetAmount - currentAmount;

  const daysUntilDeadline = goal.deadline
    ? differenceInDays(new Date(goal.deadline), new Date())
    : null;



  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">{goal.icon || '🎯'}</span>
              <h3 className="font-semibold">{goal.name}</h3>
            </div>
            {goal.category && (
              <p className="text-sm text-muted-foreground">{goal.category}</p>
            )}
          </div>
          <Badge variant={goal.priority === 'high' ? 'destructive' : 'secondary'}>
            {t(`goals.priority.${goal.priority}`)}
          </Badge>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {formatCurrency(currentAmount, currentCurrency)} / {formatCurrency(targetAmount, currentCurrency)}
            </span>
            <span className="font-medium">{Math.min(progress, 100).toFixed(1)}%</span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-2" />
        </div>

        {/* Stats */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('goals.remaining')}:</span>
            <span className="font-medium">
              {remaining > 0 ? formatCurrency(remaining, currentCurrency) : t('goals.achieved')}
            </span>
          </div>
          {goal.deadline && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar size={14} />
                {t('goals.deadline')}:
              </span>
              <span className={cn(
                "font-medium",
                daysUntilDeadline < 0 ? "text-destructive" : "text-foreground"
              )}>
                {daysUntilDeadline < 0 ? t('goals.overdue') :
                  daysUntilDeadline === 0 ? t('goals.today') :
                    `${daysUntilDeadline} ${t('goals.daysLeft')}`}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {!goal.is_completed && (
            <Button
              onClick={() => onContribute(goal)}
              className="flex-1 gap-1"
              size="sm"
            >
              <Plus size={16} />
              {t('goals.addFunds')}
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEdit(goal)}
            className="h-9 w-9"
          >
            <Edit2 size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(goal.id)}
            className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalCard;
