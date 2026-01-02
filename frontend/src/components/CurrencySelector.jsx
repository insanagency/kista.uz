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

import { SUPPORTED_CURRENCIES } from '../lib/currencies';

const CURRENCIES = SUPPORTED_CURRENCIES;

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

