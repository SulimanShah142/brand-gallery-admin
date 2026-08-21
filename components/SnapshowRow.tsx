import { View, Text, StyleSheet } from "react-native";

interface Props {
  label: string;
  value: string | number;
}

export default function SnapshotRow({
  label,
  value,
}: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>

      <Text style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    paddingVertical: 12,

    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },

  label: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },

  value: {
    fontSize: 15,
    color: "#111",
    fontWeight: "900",
  },
});