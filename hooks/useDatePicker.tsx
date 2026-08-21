import React, { useCallback, useMemo, useState } from "react";
import DatePickerModal from "../components/DatePickerModal"

/**
 * useDatePicker hook
 *
 * API:
 * const { selectedDate, openPicker, closePicker, DatePicker } = useDatePicker({
 *   initialDate,
 *   mode: 'month' | 'date' | 'time',
 *   onConfirm: (d) => { ... }
 * })
 *
 * - DatePicker is a React element you must render (e.g. <DatePicker />) somewhere in JSX (typically near root of page).
 * - openPicker() shows the picker.
 */
type Mode = "date" | "time" | "datetime" | "month";

type Params = {
  initialDate?: Date;
  mode?: Mode;
  locale?: string;
  onConfirm?: (d: Date) => void;
};

export default function useDatePicker({ initialDate, mode = "date", locale, onConfirm }: Params) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState<Date>(initialDate ?? new Date());

  const openPicker = useCallback((initial?: Date) => {
    if (initial) setValue(initial);
    setVisible(true);
  }, []);

  const closePicker = useCallback(() => {
    setVisible(false);
  }, []);

  const handleConfirm = useCallback(
    (d: Date) => {
      setValue(d);
      setVisible(false);
      onConfirm?.(d);
    },
    [onConfirm],
  );

  // DatePicker element to render inside component tree
  const DatePicker = useMemo(() => {
    return () => (
      <DatePickerModal
        visible={visible}
        value={value}
        mode={mode}
        locale={locale}
        onConfirm={handleConfirm}
        onCancel={closePicker}
      />
    );
  }, [visible, value, mode, locale, handleConfirm, closePicker]);

  return {
    selectedDate: value,
    openPicker,
    closePicker,
    DatePicker, // component to render: <DatePicker />
  };
}