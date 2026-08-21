import React, { useEffect, useMemo, useState } from "react";
import { Modal, View, TouchableOpacity, Text, StyleSheet } from "react-native";

type Mode = "date" | "time" | "datetime" | "month";

type Props = {
  visible: boolean;
  value: Date;
  mode?: Mode;
  locale?: string;
  onConfirm: (d: Date) => void;
  onCancel: () => void;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function DatePickerModal({
  visible,
  value,
  mode = "date",
  onConfirm,
  onCancel,
}: Props) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [visible, value]);

  const selectedMonth = draft.getMonth();
  const selectedYear = draft.getFullYear();
  const selectedDay = draft.getDate();

  const days = useMemo(() => {
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return Array.from({ length: lastDay }, (_, index) => index + 1);
  }, [selectedMonth, selectedYear]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, index) => currentYear - 6 + index);
  }, []);

  const handleConfirm = () => {
    const normalized = mode === "month"
      ? new Date(draft.getFullYear(), draft.getMonth(), 1)
      : draft;
    onConfirm(normalized);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{mode === "month" ? "Select month" : "Select date"}</Text>

          {mode === "month" ? (
            <View style={styles.grid}>
              {MONTHS.map((month, index) => {
                const isSelected = selectedMonth === index;
                return (
                  <TouchableOpacity
                    key={month}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => setDraft(new Date(selectedYear, index, 1))}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{month}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Year</Text>
                <View style={styles.pillRow}>
                  {years.map((year) => {
                    const isSelected = selectedYear === year;
                    return (
                      <TouchableOpacity
                        key={year}
                        style={[styles.pill, isSelected && styles.pillSelected]}
                        onPress={() => setDraft(new Date(year, selectedMonth, Math.min(selectedDay, 28)))}
                      >
                        <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>{year}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Month</Text>
                <View style={styles.pillRow}>
                  {MONTHS.map((month, index) => {
                    const isSelected = selectedMonth === index;
                    return (
                      <TouchableOpacity
                        key={month}
                        style={[styles.pill, isSelected && styles.pillSelected]}
                        onPress={() => setDraft(new Date(selectedYear, index, Math.min(selectedDay, 28)))}
                      >
                        <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>{month}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Day</Text>
                <View style={styles.pillRow}>
                  {days.map((day) => {
                    const isSelected = selectedDay === day;
                    return (
                      <TouchableOpacity
                        key={day}
                        style={[styles.pill, isSelected && styles.pillSelected]}
                        onPress={() => setDraft(new Date(selectedYear, selectedMonth, day))}
                      >
                        <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>{day}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={onCancel}>
              <Text style={styles.actionText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.confirmBtn]} onPress={handleConfirm}>
              <Text style={[styles.actionText, { color: "#fff" }]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#fff",
    paddingTop: 12,
    paddingBottom: 18,
    paddingHorizontal: 14,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    maxHeight: "80%",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    marginBottom: 8,
  },
  optionSelected: {
    backgroundColor: "#2563EB",
  },
  optionText: {
    color: "#111827",
    fontWeight: "600",
  },
  optionTextSelected: {
    color: "#fff",
  },
  row: {
    marginBottom: 10,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    color: "#4B5563",
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  pillSelected: {
    backgroundColor: "#2563EB",
  },
  pillText: {
    fontSize: 12,
    color: "#111827",
  },
  pillTextSelected: {
    color: "#fff",
  },
  actions: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  confirmBtn: {
    backgroundColor: "#111",
    borderRadius: 8,
  },
  actionText: {
    fontSize: 16,
  },
});