import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View , Text} from "react-native";


type KpiCardProps = {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

export default function KpiCard({
  title,
  value,
  icon,
  color,
}: KpiCardProps) {
  return (
    <View style={styles.kpiCard}>
      <View
        style={[
          styles.kpiIconContainer,
          {
            backgroundColor: `${color}15`,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={22}
          color={color}
        />
      </View>

      <Text
        numberOfLines={1}
        style={styles.kpiValue}
      >
        {value}
      </Text>

      <Text style={styles.kpiTitle}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
    kpiCard: {
  width: '48%',
  backgroundColor: '#FFFFFF',
  borderRadius: 18,
  padding: 18,
  marginBottom: 14,

  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 12,
  shadowOffset: {
    width: 0,
    height: 4,
  },

  elevation: 3,
},

kpiIconContainer: {
  width: 46,
  height: 46,
  borderRadius: 14,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 16,
},

kpiValue: {
  fontSize: 22,
  fontWeight: '900',
  color: '#111827',
},

kpiTitle: {
  marginTop: 6,
  fontSize: 11,
  fontWeight: '700',
  color: '#6B7280',
  letterSpacing: 0.6,
  textTransform: 'uppercase',
},
})
