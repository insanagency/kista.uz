import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const LANGUAGES = [
  { code: 'uz', name: 'Uzb', flag: '🇺🇿' },
  { code: 'ru', name: 'Рус', flag: '🇷🇺' },
  { code: 'en', name: 'Eng', flag: '🇺🇸' },
];

export default function LanguageSelector({ className = '' }) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[0];

  const handleSelect = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <Select value={i18n.language} onValueChange={handleSelect}>
      <SelectTrigger className={`w-full ${className}`}>
        <SelectValue placeholder="Tilni tanlang">
          <span className="flex items-center gap-2">
            <span className="text-lg">{currentLanguage.flag}</span>
            <span className="font-medium">{currentLanguage.name}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="flex items-center gap-2">
              <span className="text-xl">{lang.flag}</span>
              <span className="font-medium">{lang.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

