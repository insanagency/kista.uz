"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import { useTranslation } from "react-i18next"
import { enUS, ru, uz } from "date-fns/locale"

export function DatePicker({ date, setDate, placeholder = "Pick a date", className }) {
    const { t, i18n } = useTranslation()

    const locales = {
        en: enUS,
        ru: ru,
        uz: uz
    }

    const currentLocale = locales[i18n.language] || enUS

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: currentLocale }) : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent data-slot="popover-content" className="w-auto p-0 z-50">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    locale={currentLocale}
                />
            </PopoverContent>
        </Popover>
    )
}
