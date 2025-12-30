
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { useCurrency } from '../context/CurrencyContext';
import { Calendar, Download, TrendingUp, TrendingDown, FileText, FileSpreadsheet, ChevronDown, Wallet } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { toast } from 'sonner';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DatePicker } from "@/components/ui/date-picker";

const Reports = () => {
  const { t } = useTranslation();
  const { formatCurrency, currency } = useCurrency();
  const [dateRange, setDateRange] = useState({
    start_date: format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'),
    end_date: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [dateRange, currency]);

  const fetchReports = async () => {
    try {
      setLoading(true);

      const [transactionsRes, trendsRes] = await Promise.all([
        api.get('/transactions', {
          params: {
            start_date: dateRange.start_date,
            end_date: dateRange.end_date,
            limit: 1000,
            display_currency: currency,
            _t: Date.now()
          }
        }),
        api.get(`/reports/trends?months=6&currency=${currency}`)
      ]);

      const transactionsData = transactionsRes.data;
      const transactions = transactionsData.transactions || transactionsData || [];

      let totalIncome = 0;
      let totalExpense = 0;
      const categoryBreakdown = { income: {}, expense: {} };

      transactions.forEach(t => {
        const amount = parseFloat(t.amount || 0);
        const catName = t.category_name || 'Uncategorized';

        if (t.type === 'income') {
          totalIncome += amount;
          if (!categoryBreakdown.income[catName]) {
            categoryBreakdown.income[catName] = {
              category_id: t.category_id,
              category_name: catName,
              category_color: t.category_color || '#6B7280',
              category_icon: t.category_icon || '📦',
              total: 0,
              transaction_count: 0
            };
          }
          categoryBreakdown.income[catName].total += amount;
          categoryBreakdown.income[catName].transaction_count += 1;
        } else if (t.type === 'expense') {
          totalExpense += amount;
          if (!categoryBreakdown.expense[catName]) {
            categoryBreakdown.expense[catName] = {
              category_id: t.category_id,
              category_name: catName,
              category_color: t.category_color || '#6B7280',
              category_icon: t.category_icon || '📦',
              total: 0,
              transaction_count: 0
            };
          }
          categoryBreakdown.expense[catName].total += amount;
          categoryBreakdown.expense[catName].transaction_count += 1;
        }
      });

      const overviewData = {
        totals: {
          income: totalIncome,
          expense: totalExpense,
          balance: totalIncome - totalExpense
        },
        byCategory: {
          income: Object.values(categoryBreakdown.income).sort((a, b) => b.total - a.total),
          expense: Object.values(categoryBreakdown.expense).sort((a, b) => b.total - a.total)
        }
      };

      setOverview(overviewData);
      setTrends(trendsRes.data);
    } catch (error) {
      toast.error(t('reports.failedToLoad'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get(
        `/reports/export?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(t('reports.reportExported'));
    } catch (error) {
      toast.error(t('reports.failedToExport'));
      console.error(error);
    }
  };

  const handleExportPDF = async () => {
    try {
      const toastId = toast.loading(t('reports.generatingPDF'));

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Header
      pdf.setFontSize(20);
      pdf.setFont(undefined, 'bold');
      pdf.text('Financial Report', pageWidth / 2, 20, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Period: ${dateRange.start_date} to ${dateRange.end_date}`, pageWidth / 2, 28, { align: 'center' });
      pdf.text(`Currency: ${currency}`, pageWidth / 2, 34, { align: 'center' });

      // Summary
      let yPos = 45;
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Summary', 15, yPos);

      yPos += 8;
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Total Income: ${formatCurrency(income)}`, 20, yPos);
      yPos += 6;
      pdf.text(`Total Expenses: ${formatCurrency(expense)}`, 20, yPos);
      yPos += 6;
      pdf.text(`Net Balance: ${formatCurrency(balance)}`, 20, yPos);

      // Expense Breakdown
      if (expenseByCategory.length > 0) {
        yPos += 12;
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('Top Expense Categories', 15, yPos);

        yPos += 8;
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');

        expenseByCategory.slice(0, 10).forEach((cat, index) => {
          const percentage = ((cat.total / expense) * 100).toFixed(1);
          pdf.text(`${index + 1}. ${cat.category_name}: ${formatCurrency(cat.total)} (${percentage}%)`, 20, yPos);
          yPos += 6;

          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = 20;
          }
        });
      }

      pdf.save(`financial-report-${Date.now()}.pdf`);

      toast.dismiss(toastId);
      toast.success(t('reports.pdfExportSuccess'));
    } catch (error) {
      console.error('PDF export error:', error);
      toast.dismiss(toastId);
      toast.error(t('reports.pdfExportFailed'));
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const income = overview?.totals?.income || 0;
  const expense = overview?.totals?.expense || 0;
  const balance = overview?.totals?.balance || 0;
  const incomeByCategory = overview?.byCategory?.income || [];
  const expenseByCategory = overview?.byCategory?.expense || [];
  const trendsConverted = trends;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('reports.title')}</h1>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full sm:w-auto gap-2">
              <Download size={16} />
              <span>{t('common.export')}</span>
              <ChevronDown size={14} className="opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExport} className="gap-2">
              <FileSpreadsheet size={16} className="text-green-600" />
              <div className="flex flex-col">
                <span>{t('reports.exportCSV')}</span>
                <span className="text-xs text-muted-foreground">Spreadsheet format</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF} className="gap-2">
              <FileText size={16} className="text-red-600" />
              <div className="flex flex-col">
                <span>{t('reports.exportPDF')}</span>
                <span className="text-xs text-muted-foreground">Printable report</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar size={18} className="text-muted-foreground" />
            {t('reports.dateRange')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('reports.startDate')}</Label>
              <DatePicker
                date={dateRange.start_date ? new Date(dateRange.start_date) : undefined}
                setDate={(date) => setDateRange({ ...dateRange, start_date: date ? format(date, 'yyyy-MM-dd') : '' })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('reports.endDate')}</Label>
              <DatePicker
                date={dateRange.end_date ? new Date(dateRange.end_date) : undefined}
                setDate={(date) => setDateRange({ ...dateRange, end_date: date ? format(date, 'yyyy-MM-dd') : '' })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-1">
              <p className="text-lg font-semibold text-foreground">{t('reports.totalIncome')}</p>
              <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-full text-green-600 dark:text-green-400">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-500 break-all">{formatCurrency(income)}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-1">
              <p className="text-lg font-semibold text-foreground">{t('reports.totalExpenses')}</p>
              <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-full text-red-600 dark:text-red-400">
                <TrendingDown className="h-6 w-6" />
              </div>
            </div>
            <p className="text-3xl font-bold text-red-600 dark:text-red-500 break-all">{formatCurrency(expense)}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-1">
              <p className="text-lg font-semibold text-foreground">
                {t('reports.netBalance')}
              </p>
              <div className={`p-3 rounded-full ${balance >= 0 ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'}`}>
                <Wallet className="h-6 w-6" />
              </div>
            </div>
            <p className={`text-3xl font-bold break-all ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
              {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.monthlyTrends')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trendsConverted} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs text-muted-foreground" />
              <YAxis className="text-xs text-muted-foreground" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name={t('reports.income')} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} name={t('reports.expense')} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="balance" stroke="#3B82F6" strokeWidth={2} name={t('reports.balance')} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.incomeByCategory')}</CardTitle>
          </CardHeader>
          <CardContent>
            {incomeByCategory?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={incomeByCategory}
                      dataKey="total"
                      nameKey="category_name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius + 25;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text x={x} y={y} fill="var(--foreground)" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs">
                            {formatCurrency(incomeByCategory[index].total)}
                          </text>
                        );
                      }}
                    >
                      {incomeByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.category_color} strokeWidth={2} stroke="var(--background)" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
                      itemStyle={{ color: 'var(--foreground)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-6 space-y-3">
                  {incomeByCategory.map((cat) => (
                    <div key={cat.category_id} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: cat.category_color }}
                        ></div>
                        <span className="font-medium">{cat.category_name}</span>
                      </div>
                      <span className="font-semibold">{formatCurrency(cat.total)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileSpreadsheet className="w-12 h-12 mb-4 opacity-20" />
                <p>{t('reports.noIncomeData')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.expensesByCategory')}</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseByCategory?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={expenseByCategory} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="category_name" type="category" width={100} className="text-xs" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
                      itemStyle={{ color: 'var(--foreground)' }}
                      cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                    />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]} name={t('reports.amount')}>
                      {expenseByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.category_color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-6 space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {expenseByCategory.map((cat) => {
                    const percentage = (cat.total / expense * 100).toFixed(1);
                    return (
                      <div key={cat.category_id} className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full shadow-sm"
                              style={{ backgroundColor: cat.category_color }}
                            ></div>
                            <span className="font-medium">{cat.category_name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold block">{formatCurrency(cat.total)}</span>
                            <span className="text-xs text-muted-foreground">{percentage}%</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${percentage}%`, backgroundColor: cat.category_color }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileSpreadsheet className="w-12 h-12 mb-4 opacity-20" />
                <p>{t('reports.noExpenseData')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
