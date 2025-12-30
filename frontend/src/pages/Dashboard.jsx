
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../context/CurrencyContext';
import { useDashboardData, useForecast } from '../hooks/useTransactions';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { enUS, vi, es, fr, de, zhCN, ja, ko, pt, ru, uz } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [viewMode, setViewMode] = useState('month'); // 'month', 'last30', 'all'

  const getDateLocale = () => {
    const locales = {
      en: enUS,
      vi: vi,
      es: es,
      fr: fr,
      de: de,
      zh: zhCN,
      ja: ja,
      ko: ko,
      pt: pt,
      ru: ru,
      uz: uz
    };
    return locales[i18n.language] || enUS;
  };

  const getDateRange = () => {
    const today = new Date();
    const locale = getDateLocale();

    switch (viewMode) {
      case 'month':
        return {
          start: format(startOfMonth(today), 'yyyy-MM-dd'),
          end: format(endOfMonth(today), 'yyyy-MM-dd'),
          label: format(today, 'MMMM yyyy', { locale })
        };
      case 'last30':
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return {
          start: format(thirtyDaysAgo, 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd'),
          label: t('dashboard.last30Days')
        };
      case 'all':
        return {
          start: '2020-01-01',
          end: format(today, 'yyyy-MM-dd'),
          label: t('dashboard.allTime')
        };
      default:
        return {
          start: format(startOfMonth(today), 'yyyy-MM-dd'),
          end: format(endOfMonth(today), 'yyyy-MM-dd'),
          label: format(today, 'MMMM yyyy', { locale })
        };
    }
  };

  const dateRange = useMemo(() => getDateRange(), [viewMode]);

  // Use React Query hooks - data is automatically cached!
  const { data: transactions = [], isLoading: transactionsLoading } = useDashboardData(dateRange);
  const { data: forecastData, isLoading: forecastLoading } = useForecast();

  const loading = transactionsLoading || forecastLoading;

  // Calculate stats from cached data
  const stats = useMemo(() => {
    if (!transactions.length) return null;

    let totalIncome = 0;
    let totalExpense = 0;
    const categorySpending = {};

    transactions.forEach(t => {
      const amount = parseFloat(t.amount || 0);

      if (t.type === 'income') {
        totalIncome += amount;
      } else if (t.type === 'expense') {
        totalExpense += amount;

        // Aggregate by category
        const catName = t.category_name || 'Uncategorized';
        if (!categorySpending[catName]) {
          categorySpending[catName] = {
            name: catName,
            category_name: catName,
            color: t.category_color || '#6B7280',
            category_color: t.category_color || '#6B7280',
            icon: t.category_icon || '📦',
            total: 0,
            transaction_count: 0
          };
        }
        categorySpending[catName].total += amount;
        categorySpending[catName].transaction_count += 1;
      }
    });

    // Convert category spending to array and sort
    const topCategories = Object.values(categorySpending)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const savings = totalIncome - totalExpense;

    return {
      month: {
        income: totalIncome,
        expense: totalExpense,
        savings: savings,
        savingsRate: totalIncome > 0
          ? ((savings / totalIncome) * 100).toFixed(1)
          : 0
      },
      topCategories: topCategories,
      recentActivity: {
        transactions: transactions.slice(0, 5)
      }
    };
  }, [transactions]);

  const recentTransactions = useMemo(() =>
    transactions.slice(0, 5),
    [transactions]
  );

  if (loading) {
    return <DashboardSkeleton />;
  }

  // Extract data from computed stats
  const month = stats?.month || {};
  const balance = (month.income || 0) - (month.expense || 0);
  const income = month.income || 0;
  const expense = month.expense || 0;

  // Map top categories from computed stats
  const expenseByCategoryConverted = stats?.topCategories || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('dashboard.greeting', { defaultValue: 'Welcome back,' })} {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('dashboard.overview', { date: format(new Date(), 'PPPP', { locale: getDateLocale() }) })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-muted p-1 rounded-lg">
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                viewMode === 'month' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t('dashboard.thisMonth')}
            </button>
            <button
              onClick={() => setViewMode('last30')}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                viewMode === 'last30' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t('dashboard.last30Days')}
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                viewMode === 'all' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t('dashboard.allTime')}
            </button>
          </div>

          <Button asChild size="sm" className="hidden sm:flex">
            <Link to="/transactions">
              <Plus className="mr-2 h-4 w-4" /> {t('transactions.addTransaction')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.balance')}
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance >= 0 ? formatCurrency(balance) : '-' + formatCurrency(Math.abs(balance))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +20.1% {t('dashboard.fromLastMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.income')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">
              {formatCurrency(income)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +10.5% {t('dashboard.fromLastMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.expenses')}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-500">
              {formatCurrency(expense)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              -4% {t('dashboard.fromLastMonth')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <Card className="hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle>{t('dashboard.expenseBreakdown')}</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseByCategoryConverted.length > 0 ? (
              <>
                <div className="w-full h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseByCategoryConverted}
                        dataKey="total"
                        nameKey="category_name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={50}
                        paddingAngle={2}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {expenseByCategoryConverted.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.category_color || '#8884d8'} strokeWidth={2} className="stroke-background" />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                          color: 'hsl(var(--popover-foreground))'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {expenseByCategoryConverted.map((cat, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.category_color }}
                      ></div>
                      <span className="truncate flex-1">{cat.category_name}</span>
                      <span className="font-medium text-muted-foreground">{formatCurrency(cat.total)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <Wallet className="h-12 w-12 mb-2 opacity-20" />
                <p>{t('dashboard.noExpenseData')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Spending Forecast */}
          {forecastData && forecastData.forecasts && forecastData.forecasts.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold">📈 Next Month Forecast</CardTitle>
                <span className="text-xs text-muted-foreground">Based on last 3 months</span>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 pt-4">
                  {forecastData.forecasts.map((item, index) => {
                    const change = ((item.forecast - item.lastMonth) / item.lastMonth * 100);
                    const isIncreasing = change > 5;
                    const isDecreasing = change < -5;

                    return (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-2 h-8 rounded-full"
                            style={{ backgroundColor: item.category_color }}
                          ></div>
                          <div>
                            <p className="font-medium leading-none">{item.category_name}</p>
                            <p className="text-sm text-muted-foreground mt-1">Last: {formatCurrency(item.lastMonth)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(item.forecast)}</div>
                          <div className={cn(
                            "text-xs font-medium flex items-center justify-end gap-1",
                            change > 0 ? 'text-red-500' : 'text-green-500'
                          )}>
                            {isIncreasing && <TrendingUp size={12} />}
                            {isDecreasing && <TrendingDown size={12} />}
                            {change > 0 ? '+' : ''}{change.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/50">
                    <p className="text-xs text-blue-700 dark:text-blue-300 flex gap-2">
                      <span>💡</span>
                      <span><strong>Tip:</strong> Forecasts range helps you budget better. Large deviations might be one-off expenses.</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Transactions */}
          <Card className="hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('dashboard.recentTransactions')}</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/90">
                <Link to="/transactions" className="flex items-center gap-1">
                  {t('dashboard.viewAll')} <ArrowRight size={16} />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center bg-background border shadow-sm text-lg"
                        >
                          {transaction.type === 'income' ? '↑' : '↓'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{transaction.category_name || t('transactions.uncategorized')}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(transaction.transaction_date), 'MMM dd, yyyy', { locale: getDateLocale() })}
                          </p>
                        </div>
                      </div>
                      <span className={cn(
                        "font-bold text-sm",
                        transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      )}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('dashboard.noTransactions')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Categories */}
      {expenseByCategoryConverted.length > 0 && (
        <Card className="hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle>{t('dashboard.topSpendingCategories')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenseByCategoryConverted.slice(0, 5).map((category) => {
                const percentage = expense > 0 ? (category.total / expense * 100).toFixed(1) : 0;
                return (
                  <div key={category.category_id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{category.category_name}</span>
                      <span className="text-muted-foreground">{formatCurrency(category.total)} ({percentage}%)</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: category.category_color
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
