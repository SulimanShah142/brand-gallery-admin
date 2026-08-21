import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type TabKey = "dashboard" | "products" | "expenses";

type TabItem = {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const TABS: TabItem[] = [
  { key: "dashboard", label: "Dashboard", icon: "grid-outline" },
  { key: "products", label: "Products", icon: "cube-outline" },
  { key: "expenses", label: "Expenses", icon: "wallet-outline" },
];

interface Props {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}

export default function AnalyticsTabs({ activeTab, onChange }: Props) {
  return (
    <View
      style={{
        flexDirection: "row",
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 10,
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;

        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 12,

              backgroundColor: isActive ? "#111" : "#F2F2F2",
            }}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={isActive ? "#FFF" : "#555"}
            />

            <Text
              style={{
                marginLeft: 6,
                fontSize: 13,
                fontWeight: "600",
                color: isActive ? "#FFF" : "#555",
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}