import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  selectedDate: Date;
  onOpenCalendar: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  loading?: boolean;
};

const formatMonth = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

const AnalyticsHeader: React.FC<Props> = ({
  selectedDate,
  onOpenCalendar,
  onPrevMonth,
  onNextMonth,
  loading = false,
}) => {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "ios" ? 60 : 40,
        paddingBottom: 12,
        backgroundColor: "#fff",
      }}
    >
      {/* Top Row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: "#111",
          }}
        >
          Analytics
        </Text>

        {loading && (
          <ActivityIndicator size="small" color="#111" />
        )}
      </View>

      {/* Month Selector */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 14,
        }}
      >
        {/* Left */}
        <TouchableOpacity
          onPress={onPrevMonth}
          style={{
            padding: 8,
            borderRadius: 10,
            backgroundColor: "#F3F4F6",
          }}
        >
          <Ionicons name="chevron-back" size={18} color="#111" />
        </TouchableOpacity>

        {/* Center Month Button */}
        <TouchableOpacity
          onPress={onOpenCalendar}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Ionicons name="calendar-outline" size={18} color="#111" />

          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#111",
            }}
          >
            {formatMonth(selectedDate)}
          </Text>
        </TouchableOpacity>

        {/* Right */}
        <TouchableOpacity
          onPress={onNextMonth}
          style={{
            padding: 8,
            borderRadius: 10,
            backgroundColor: "#F3F4F6",
          }}
        >
          <Ionicons name="chevron-forward" size={18} color="#111" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AnalyticsHeader;