import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrency } from '../context/CurrencyContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const CURRENCIES = [
  { code: 'UZS', name: 'Uzbekistan Som', symbol: 'so\'m', flag: '🇺🇿' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'KRW', name: 'Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', flag: '🇸🇦' }
];

export default function CurrencySelector({ className = '' }) {
  const queryClient = useQueryClient();
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);

  const selectedCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  const handleSelect = async (currencyCode) => {
    try {
      await setCurrency(currencyCode);

      // Invalidate all queries to refetch with new currency
      queryClient.invalidateQueries();
      console.log('🔄 Currency changed, invalidating all caches...');

      setIsOpen(false);
    } catch (error) {
      console.error('Error changing currency:', error);
    }
  };

  return (
    <Select value={currency} onValueChange={handleSelect}>
      <SelectTrigger className={`w-full ${className}`}>
        <SelectValue placeholder="Currency">
          <span className="flex items-center gap-2">
            <span className="text-lg">{selectedCurrency.flag}</span>
            <span>{selectedCurrency.code}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((curr) => (
          <SelectItem key={curr.code} value={curr.code}>
            <span className="flex items-center gap-2">
              <span className="text-xl">{curr.flag}</span>
              <span className="font-medium">{curr.code}</span>
              <span className="text-xs text-muted-foreground ml-1">({curr.name})</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

