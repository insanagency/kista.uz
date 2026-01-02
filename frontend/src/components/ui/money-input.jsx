import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";

export const MoneyInput = ({ value, onChange, className, ...props }) => {
    const inputRef = useRef(null);
    const [displayValue, setDisplayValue] = useState('');
    const [cursor, setCursor] = useState(null);

    // Helper to format number with spaces
    const format = (val) => {
        if (val === '' || val === undefined || val === null) return '';
        // Allow ending with dot for decimal typing
        const str = val.toString();
        const parts = str.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return parts.join('.');
    };

    // Helper to unformat (remove spaces)
    const unformat = (val) => {
        return val.replace(/\s/g, '');
    };

    // Sync prop value to display value, preserving cursor if needed
    useLayoutEffect(() => {
        const formatted = format(value);
        setDisplayValue(formatted);
    }, [value]);

    // Restore cursor position after render
    useLayoutEffect(() => {
        if (cursor !== null && inputRef.current) {
            inputRef.current.setSelectionRange(cursor, cursor);
        }
    }, [cursor, displayValue]);

    const handleChange = (e) => {
        const input = e.target;
        // Calculate new cursor position
        const selectionStart = input.selectionStart;
        const inputValue = input.value;

        // Count digits before cursor in the NEW value
        let digitsBeforeCursor = 0;
        for (let i = 0; i < selectionStart; i++) {
            if (/[0-9.]/.test(inputValue[i])) {
                digitsBeforeCursor++;
            }
        }

        const rawValue = unformat(inputValue);

        // Validate: simple regex for float or integer
        // Allow empty, or digits, or one dot
        if (rawValue !== '' && !/^\d*\.?\d*$/.test(rawValue)) return;

        // Call parent with raw value
        onChange({ target: { value: rawValue } });

        // Determine where the cursor should be in the NEW formatted string
        // We can't know the exact new formatted string here easily without re-running format
        // But we depend on the prop update cycle.
        // Let's predict the formatted string to find cursor.
        const newFormatted = format(rawValue);

        let newCursorPos = 0;
        let digitsSeen = 0;
        for (let i = 0; i < newFormatted.length; i++) {
            if (digitsSeen === digitsBeforeCursor) break;
            if (/[0-9.]/.test(newFormatted[i])) {
                digitsSeen++;
            }
            newCursorPos++;
        }
        // Edge case: if we are at the end, ensure we stay at end
        // But the loop handles it logicially.

        setCursor(newCursorPos);
    };

    return (
        <Input
            {...props}
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleChange}
            className={className}
        />
    );
};
