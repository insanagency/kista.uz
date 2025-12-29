
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { useCurrency } from '../context/CurrencyContext';
import { Plus, Pencil, Trash2, Filter, Download, Repeat, Calendar, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { enUS, vi, es, fr, de, zhCN, ja, ko, pt, ru } from 'date-fns/locale';
import toast from 'react-hot-toast';
import TransactionModal from '../components/TransactionModal';
import { TableSkeleton, ListSkeleton } from '../components/LoadingSkeleton';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge"; // Need badge? I'll simulate or use div for now. Badge component not created yet. I'll use div with class.

const Transactions = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { formatCurrency, currency } = useCurrency();

  const getDateLocale = () => {
    const locales = { en: enUS, vi: vi, es: es, fr: fr, de: de, zh: zhCN, ja: ja, ko: ko, pt: pt, ru: ru };
    return locales[i18n.language] || enUS;
  };
  const [viewMode, setViewMode] = useState('transactions'); // 'transactions' or 'recurring'
  const [transactions, setTransactions] = useState([]);
  const [recurringList, setRecurringList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    type: '',
    category_id: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters change
    fetchTransactions();
    fetchCategories();
    if (viewMode === 'recurring') {
      fetchRecurring();
    }
  }, [filters, currency, viewMode]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNew: () => viewMode === 'transactions' && handleAdd(),
    onRecurring: () => setViewMode('recurring'),
    onClose: () => setShowModal(false),
  });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value);
      });

      params.append('display_currency', currency);

      const response = await api.get(`/transactions?${params}`);
      const data = response.data;
      setTransactions(data.transactions || data || []);
    } catch (error) {
      toast.error(t('transactions.failedToLoad'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRecurring = async () => {
    try {
      setLoading(true);
      const response = await api.get('/recurring');
      setRecurringList(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching recurring:', error);
      setRecurringList([]);
      if (error.response?.status !== 404 && error.response?.status !== 502) {
        toast.error('Failed to load recurring transactions');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('transactions.deleteConfirm'))) return;

    try {
      await api.delete(`/transactions/${id}`);
      toast.success(t('transactions.transactionDeleted'));
      fetchTransactions();
    } catch (error) {
      toast.error(t('transactions.failedToDelete'));
      console.error(error);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingTransaction(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingTransaction(null);
    fetchTransactions();
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`/reports/export?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(t('transactions.exportedSuccess') || 'Transactions exported');
    } catch (error) {
      toast.error(t('transactions.failedToExport') || 'Failed to export');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header with Tab Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('transactions.title')}</h1>
          <div className="flex bg-muted p-1 rounded-lg">
            <button
              onClick={() => setViewMode('transactions')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'transactions'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              📊 {t('transactions.title')}
            </button>
            <button
              onClick={() => setViewMode('recurring')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'recurring'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              🔁 {t('recurring.title')}
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          {viewMode === 'transactions' && (
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download size={16} />
              <span className="hidden sm:inline">{t('transactions.exportCSV')}</span>
              <span className="sm:hidden">Export</span>
            </Button>
          )}
          <Button onClick={handleAdd} className="gap-2">
            <Plus size={16} />
            <span>{viewMode === 'transactions' ? t('transactions.addTransaction') : t('recurring.addRecurring')}</span>
          </Button>
        </div>
      </div>

      {/* Filters - Only show for transactions view */}
      {viewMode === 'transactions' && (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4 text-muted-foreground">
              <Filter size={20} />
              <h2 className="text-base font-semibold text-foreground">{t('transactions.filters')}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Select
                value={filters.type}
                onValueChange={(val) => setFilters({ ...filters, type: val === 'all' ? '' : val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('transactions.allTypes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('transactions.allTypes')}</SelectItem>
                  <SelectItem value="income">{t('transactions.income')}</SelectItem>
                  <SelectItem value="expense">{t('transactions.expense')}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.category_id}
                onValueChange={(val) => setFilters({ ...filters, category_id: val === 'all' ? '' : val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('transactions.allCategories')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('transactions.allCategories')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                placeholder={t('transactions.startDate')}
              />

              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                placeholder={t('transactions.endDate')}
              />
            </div>
            {(filters.type || filters.category_id || filters.start_date || filters.end_date) && (
              <Button
                variant="link"
                onClick={() => setFilters({ type: '', category_id: '', start_date: '', end_date: '' })}
                className="mt-2 h-auto p-0 text-blue-600"
              >
                {t('transactions.clearFilters')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transactions List - Only show for transactions view */}
      {viewMode === 'transactions' && (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <TableSkeleton rows={10} />
            ) : transactions.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('transactions.date')}</TableHead>
                        <TableHead>{t('transactions.category')}</TableHead>
                        <TableHead className="hidden sm:table-cell">{t('transactions.description')}</TableHead>
                        <TableHead>{t('transactions.type')}</TableHead>
                        <TableHead className="text-right">{t('transactions.amount')}</TableHead>
                        <TableHead className="text-right">{t('transactions.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              {format(new Date(transaction.transaction_date), 'MMM dd, yyyy', { locale: getDateLocale() })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: transaction.category_color }}
                                ></div>
                                <span className="font-medium">{transaction.category_name || t('transactions.uncategorized')}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden sm:table-cell max-w-[200px] truncate">
                              {transaction.description || '-'}
                            </TableCell>
                            <TableCell>
                              <div className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${transaction.type === 'income'
                                ? 'border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                {transaction.type}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              <span className={transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(transaction)}
                                  className="h-8 w-8 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Pencil size={14} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(transaction.id)}
                                  className="h-8 w-8 text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {transactions.length > itemsPerPage && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      {t('common.showing')} {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, transactions.length)} {t('common.of')} {transactions.length}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        {t('common.previous')}
                      </Button>
                      <div className="flex items-center gap-2 px-3 py-1 border rounded-md">
                        <span className="text-sm font-medium">{currentPage}</span>
                        <span className="text-sm text-muted-foreground">/</span>
                        <span className="text-sm text-muted-foreground">{Math.ceil(transactions.length / itemsPerPage)}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(transactions.length / itemsPerPage), p + 1))}
                        disabled={currentPage >= Math.ceil(transactions.length / itemsPerPage)}
                      >
                        {t('common.next')}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Wallet className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  {t('transactions.noTransactions')}
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Start tracking your finances by adding your first transaction. Track income, expenses, and see where your money goes!
                </p>
                <Button onClick={handleAdd}>
                  <Plus size={16} className="mr-2" />
                  {t('transactions.addTransaction')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recurring List - Only show for recurring view */}
      {viewMode === 'recurring' && (
        <div className="space-y-4">
          {/* Recurring List */}
          {loading ? (
            <ListSkeleton items={5} />
          ) : recurringList.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="flex flex-col items-center">
                <Repeat className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground mb-3">{t('recurring.noRecurring')}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  💡 Tick "Make Recurring" checkbox when adding transactions
                </p>
                <Button onClick={handleAdd}>
                  <Plus size={16} className="mr-2" />
                  {t('recurring.addRecurring')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recurringList.map((rec) => (
                <Card key={rec.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${rec.type === 'income'
                            ? 'border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            {t(`transactions.${rec.type}`)}
                          </span>
                          <Badge variant="outline" className="text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                            {t(`recurring.${rec.frequency}`)}
                          </Badge>
                          {rec.is_active ? (
                            <Badge variant="outline" className="text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200">
                              ✓ {t('recurring.active')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500 bg-gray-50 dark:bg-gray-900/20 border-gray-200">
                              ○ {t('recurring.inactive')}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-xl font-bold">{formatAmount(rec.amount, rec.currency)}</h3>
                        {(rec.category_name || rec.description) && (
                          <div className="text-sm text-muted-foreground">
                            {rec.category_name && <span className="mr-3 font-medium text-foreground">📁 {rec.category_name}</span>}
                            {rec.description}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{t('recurring.next')}: <span className="font-medium">{new Date(rec.next_occurrence).toLocaleDateString()}</span></span>
                          </div>
                          {rec.end_date && <span>• {t('recurring.ends')}: {new Date(rec.end_date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingTransaction(rec); // Assuming recur edit uses same modal logic (or specialized logic, keeping original behavior)
                            // The original behavior navigated to /recurring?edit=id. 
                            // But here we are IN transactions page maybe? 
                            // wait, Transactions page HAS Recurring tab. 
                            // Reuse logic:
                            // The original code handled manual navigation or kept it separate.
                            // I'll stick to what original code did: navigate('/recurring?edit=...')
                            // Wait, Transactions page has viewMode='recurring'. Using window.location.href='/recurring' in shortcuts.
                            // Let's inspect original code logic about edit.
                            // Original: navigate(`/recurring?edit=${rec.id}`)
                            navigate(`/recurring?edit=${rec.id}`);
                          }}
                          className="h-9 w-9"
                        >
                          <Pencil size={16} className="text-blue-600 dark:text-blue-400" />
                        </Button>

                        {/* Toggle and Delete buttons */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            try {
                              await api.patch(`/recurring/${rec.id}/toggle`);
                              toast.success(t('common.success'));
                              fetchRecurring();
                            } catch (error) {
                              toast.error(t('common.error'));
                            }
                          }}
                          className="h-9 w-9"
                          title={rec.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {rec.is_active ? '🟢' : '⚪'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            if (window.confirm(t('recurring.recurringDeleted'))) {
                              try {
                                await api.delete(`/recurring/${rec.id}`);
                                toast.success(t('recurring.recurringDeleted'));
                                fetchRecurring();
                              } catch (error) {
                                toast.error(t('common.error'));
                              }
                            }
                          }}
                          className="h-9 w-9"
                        >
                          <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <TransactionModal
          transaction={editingTransaction}
          categories={categories}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};



export default Transactions;
