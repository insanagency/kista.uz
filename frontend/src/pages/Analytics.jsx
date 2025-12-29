
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../context/CurrencyContext';
import api from '../lib/api';
import {
  TrendingUp, TrendingDown, AlertTriangle, Calendar,
  Activity, Zap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function Analytics() {
  const { t } = useTranslation();
  const { currency, formatCurrency } = useCurrency();

  const [anomalies, setAnomalies] = useState(null);
  const [yoyData, setYoyData] = useState(null);
  const [velocity, setVelocity] = useState(null);
  const [patterns, setPatterns] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllAnalytics();
  }, [currency]);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      const [anomaliesRes, yoyRes, velocityRes, patternsRes] = await Promise.all([
        api.get(`/trends/anomalies?currency=${currency}&period=3`),
        api.get(`/trends/yoy-comparison?currency=${currency}`),
        api.get(`/trends/velocity?currency=${currency}&period=30`),
        api.get(`/trends/patterns?currency=${currency}&period=6`)
      ]);

      setAnomalies(anomaliesRes.data);
      setYoyData(yoyRes.data);
      setVelocity(velocityRes.data);
      setPatterns(patternsRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t('analytics.title')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('analytics.subtitle')}
        </p>
      </div>

      <Tabs defaultValue="anomalies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="anomalies" className="group">
            <AlertTriangle className="mr-2 h-4 w-4" />
            {t('analytics.anomalies')}
          </TabsTrigger>
          <TabsTrigger value="yoy">
            <Calendar className="mr-2 h-4 w-4" />
            {t('analytics.yearOverYear')}
          </TabsTrigger>
          <TabsTrigger value="velocity">
            <Zap className="mr-2 h-4 w-4" />
            {t('analytics.velocity')}
          </TabsTrigger>
          <TabsTrigger value="patterns">
            <Activity className="mr-2 h-4 w-4" />
            {t('analytics.patterns')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="anomalies" className="space-y-4">
          {anomalies && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('analytics.spendingAnomalies')}</CardTitle>
                  <Badge variant="outline">{anomalies.period}</Badge>
                </div>
                <CardDescription>{t('analytics.anomaliesDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                {anomalies.anomalies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('analytics.noAnomaliesDetected')}
                  </div>
                ) : (
                  <>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 rounded-lg bg-card border shadow-sm">
                        <p className="text-sm text-muted-foreground">{t('analytics.totalAnomalies')}</p>
                        <p className="text-2xl font-bold text-destructive">{anomalies.anomaliesFound}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-card border shadow-sm">
                        <p className="text-sm text-muted-foreground">{t('analytics.totalTransactions')}</p>
                        <p className="text-2xl font-bold">{anomalies.totalTransactions}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-card border shadow-sm">
                        <p className="text-sm text-muted-foreground">{t('analytics.anomalyRate')}</p>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
                          {((anomalies.anomaliesFound / anomalies.totalTransactions) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {anomalies.anomalies.map((anomaly) => (
                        <div
                          key={anomaly.id}
                          className={`p-4 rounded-lg border flex flex-col sm:flex-row justify-between gap-4 ${anomaly.severity === 'high'
                            ? 'border-destructive/20 bg-destructive/5'
                            : 'border-yellow-500/20 bg-yellow-500/5'
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full mt-1 ${anomaly.severity === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500'
                              }`}>
                              <AlertTriangle size={18} />
                            </div>
                            <div>
                              <h4 className="font-semibold">{anomaly.description || 'Transaction'}</h4>
                              <p className="text-sm text-muted-foreground">{anomaly.category} • {new Date(anomaly.date).toLocaleDateString()}</p>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm">
                                <span className="font-medium">{formatCurrency(anomaly.amount)}</span>
                                <span className="text-muted-foreground">
                                  {anomaly.deviationPercent}% {t('analytics.aboveAverage')}
                                </span>
                                <span className="text-muted-foreground hidden sm:inline">•</span>
                                <span className="text-muted-foreground">
                                  {t('analytics.avg')}: {formatCurrency(anomaly.averageForCategory)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="self-start">
                            <Badge variant={anomaly.severity === 'high' ? 'destructive' : 'secondary'}>
                              {t(`analytics.${anomaly.severity}`)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="yoy" className="space-y-4">
          {yoyData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{yoyData.totals.currentYear.year} {t('analytics.yearlyTotal')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('analytics.income')}</span>
                      <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(yoyData.totals.currentYear.income)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('analytics.expense')}</span>
                      <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(yoyData.totals.currentYear.expense)}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t">
                      <span className="font-medium">{t('analytics.net')}</span>
                      <span className={`font-bold ${yoyData.totals.currentYear.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(yoyData.totals.currentYear.net)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>{yoyData.totals.lastYear.year} {t('analytics.yearlyTotal')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('analytics.income')}</span>
                      <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(yoyData.totals.lastYear.income)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('analytics.expense')}</span>
                      <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(yoyData.totals.lastYear.expense)}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t">
                      <span className="font-medium">{t('analytics.net')}</span>
                      <span className={`font-bold ${yoyData.totals.lastYear.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(yoyData.totals.lastYear.net)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{t('analytics.monthlyComparison')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={yoyData.comparison}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
                        itemStyle={{ color: 'var(--foreground)' }}
                      />
                      <Legend />
                      <Bar
                        dataKey="currentYear.expense"
                        fill="#10b981"
                        name={`${yoyData.totals.currentYear.year} Expense`}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="lastYear.expense"
                        fill="#3b82f6"
                        name={`${yoyData.totals.lastYear.year} Expense`}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="velocity" className="space-y-4">
          {velocity && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">{t('analytics.dailyAverage')}</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(velocity.averageDaily)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">{t('analytics.monthlyProjection')}</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(velocity.projectedMonthly)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">{t('analytics.velocityTrend')}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {velocity.velocity.trend === 'increasing' ? (
                        <TrendingUp className="h-5 w-5 text-red-500" />
                      ) : velocity.velocity.trend === 'decreasing' ? (
                        <TrendingDown className="h-5 w-5 text-green-500" />
                      ) : (
                        <Activity className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="text-lg font-semibold capitalize">
                        {t(`analytics.${velocity.velocity.trend}`)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">{t('analytics.change7d')}</p>
                    <p className={`text-2xl font-bold ${parseFloat(velocity.velocity.change) > 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                      }`}>
                      {velocity.velocity.change}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{t('analytics.dailySpendingTrend')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={velocity.dailySpending.slice().reverse()}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
                        itemStyle={{ color: 'var(--foreground)' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#3b82f6"
                        fill="#93c5fd"
                        fillOpacity={0.2}
                        name={t('analytics.spending')}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          {patterns && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{t('analytics.weekdayVsWeekend')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50">
                      <p className="text-sm text-muted-foreground mb-1">{t('analytics.weekdayAverage')}</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(patterns.weekdayVsWeekend.weekday.average)}</p>
                      <p className="text-xs text-muted-foreground mt-2">{patterns.weekdayVsWeekend.weekday.count} {t('analytics.transactions')}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/50">
                      <p className="text-sm text-muted-foreground mb-1">{t('analytics.weekendAverage')}</p>
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(patterns.weekdayVsWeekend.weekend.average)}</p>
                      <p className="text-xs text-muted-foreground mt-2">{patterns.weekdayVsWeekend.weekend.count} {t('analytics.transactions')}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted text-sm">
                    <span className="font-semibold">{t('analytics.pattern')}: </span>
                    <span className="capitalize">{patterns.weekdayVsWeekend.pattern.replace('_', ' ')}</span>
                    {patterns.weekdayVsWeekend.difference && (
                      <span className="text-muted-foreground ml-2">
                        • {t('analytics.weekendHigher')} {patterns.weekdayVsWeekend.difference}% {
                          parseFloat(patterns.weekdayVsWeekend.difference) > 0 ? t('analytics.higher') : t('analytics.lower')
                        } {t('analytics.thanWeekday')}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('analytics.spendingByPeriod')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/50">
                      <p className="text-sm text-muted-foreground mb-1">{t('analytics.earlyMonth')}</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(patterns.monthlyPeriods.earlyMonth.average)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{patterns.monthlyPeriods.earlyMonth.count} {t('analytics.transactions')}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/50">
                      <p className="text-sm text-muted-foreground mb-1">{t('analytics.midMonth')}</p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(patterns.monthlyPeriods.midMonth.average)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{patterns.monthlyPeriods.midMonth.count} {t('analytics.transactions')}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/50">
                      <p className="text-sm text-muted-foreground mb-1">{t('analytics.lateMonth')}</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(patterns.monthlyPeriods.lateMonth.average)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{patterns.monthlyPeriods.lateMonth.count} {t('analytics.transactions')}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted text-sm">
                    <span className="font-semibold">{t('analytics.pattern')}: </span>
                    <span className="capitalize">{patterns.monthlyPeriods.pattern.replace('_', ' ')}</span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
