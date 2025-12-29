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
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', flag: '🇸🇦' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' }
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
        <SelectValue placeholder="Valyutani tanlang">
          <span className="flex items-center gap-2">
            <span className="text-lg">{selectedCurrency.flag}</span>
            <span className="font-medium">{selectedCurrency.code}</span>
            <span className="text-muted-foreground text-xs truncate"> - {selectedCurrency.symbol}</span>
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

