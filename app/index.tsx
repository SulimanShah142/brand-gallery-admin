import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "@/lib/config";
import SnapshotRow from "@/components/SnapshowRow";
import LifecycleRow from "@/components/LifecycleRow";
import DashboardButton from "@/components/DashboardButton";
import  KpiCard   from "@/components/KpiCard";

export default function AdminDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Destructured exact layout parameter properties initialization
  const [dashboard, setDashboard] = useState<any>(null);

  const [chartData, setChartData] = useState<any>(null);

  const fetchDashboard = async () => {
    try {
      const [dashboardRes, chartsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/analytics/dashboard`),
        fetch(`${API_URL}/api/admin/analytics/charts`),
      ]);

      const dashboardJson = await dashboardRes.json();
      const chartsJson = await chartsRes.json();

      setDashboard(dashboardJson);
      setChartData(chartsJson);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const safeNumber = (v: any) => Number(v ?? 0) || 0;

  // 🎯 REAL-TIME MATRIX GRID ARRAYS ALIGNED TO YOUR REQUEST

 if (loading || !dashboard) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#000000" />
    </View>
  );
}

 return (
  <ScrollView
    style={styles.container}
    contentContainerStyle={styles.content}
    refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
    }
    showsVerticalScrollIndicator={false}
  >
    {/* =======================
    HEADER
    ======================= */}

    <View style={styles.headerContainer}>
      <Text style={styles.smallTitle}>ADMIN DASHBOARD</Text>

      <Text style={styles.bigTitle}>Business Overview</Text>

      <Text style={styles.dateText}>
        {dashboard?.meta?.month ?? "-"} / {dashboard?.meta?.year ?? "-"}
      </Text>
    </View>

    {/* =======================
    HERO FINANCIAL CARD
    ======================= */}

    <View style={styles.heroCard}>
      <Text style={styles.heroLabel}>MONTHLY REVENUE</Text>

      <Text style={styles.heroRevenue}>
        AFN{" "}
        {safeNumber(dashboard?.financials?.revenue).toLocaleString()}
      </Text>

      <View style={styles.heroBottomRow}>
        <View>
          <Text style={styles.heroMiniLabel}>EST. PROFIT</Text>

          <Text style={styles.heroMiniValue}>
            AFN{" "}
            {safeNumber(
              dashboard?.financials?.estimatedProfit
            ).toLocaleString()}
          </Text>
        </View>

        <View>
          <Text style={styles.heroMiniLabel}>AVG ORDER</Text>

          <Text style={styles.heroMiniValue}>
            AFN{" "}
            {safeNumber(
              dashboard?.financials?.averageOrderValue
            ).toLocaleString()}
          </Text>
        </View>
      </View>
    </View>

    {/* =======================
    KPI GRID
    ======================= */}

    <View style={styles.kpiGrid}>
      <KpiCard
  title="Orders"
  value={safeNumber(
    dashboard?.financials
      ? dashboard?.lifecycle?.pending +
        dashboard?.lifecycle?.confirmed +
        dashboard?.lifecycle?.packaged +
        dashboard?.lifecycle?.delivered
      : 0
  )}
/>
      <KpiCard
        title="Delivered"
        value={safeNumber(dashboard?.lifecycle?.delivered)}
      />

      <KpiCard
        title="Active Ops"
        value={safeNumber(dashboard?.operations?.active)}
      />

      <KpiCard
        title="Pending"
        value={safeNumber(dashboard?.lifecycle?.pending)}
      />
    </View>

    {/* =======================
    TODAY SNAPSHOT
    ======================= */}

    <View style={styles.section}>
      <Text style={styles.sectionHeader}>TODAY</Text>

      <SnapshotRow
  label="Orders Today"
  value={safeNumber(dashboard?.today?.orders)}
/>

      <SnapshotRow
        label="Revenue Today"
        value={`AFN ${safeNumber(
          dashboard?.today?.revenue
        ).toLocaleString()}`}
      />

      <SnapshotRow
        label="Deliveries Today"
        value={safeNumber(dashboard?.today?.deliveries)}
      />
    </View>

    {/* =======================
    ORDER PIPELINE
    ======================= */}

    <View style={styles.section}>
      <Text style={styles.sectionHeader}>ORDER PIPELINE</Text>

      <LifecycleRow
        label="Pending"
        value={safeNumber(dashboard?.lifecycle?.pending)}
      />

      <LifecycleRow
        label="Packaging"
        value={safeNumber(dashboard?.lifecycle?.packaging)}
      />

      <LifecycleRow
        label="Out for Delivery"
        value={safeNumber(dashboard?.lifecycle?.out_for_delivery)}
      />

      <LifecycleRow
        label="Delivered"
        value={safeNumber(dashboard?.lifecycle?.delivered)}
      />
    </View>

    {/* =======================
    MANAGEMENT
    ======================= */}

    <Text style={styles.sectionHeader}>MANAGEMENT</Text>

    <DashboardButton
      title="Catalog"
      subtitle="Products & Categories"
      icon="pricetag-outline"
      onPress={() => router.push("./categories")}
    />

    <DashboardButton
      title="Orders"
      subtitle="Manage customer orders"
      icon="cube-outline"
      onPress={() => router.push("./orders")}
    />

    <DashboardButton
      title="Analytics"
      subtitle="Detailed reports"
      icon="bar-chart-outline"
      onPress={() => router.push("./analytics")}
    />
  </ScrollView>
);
}
const styles = StyleSheet.create({
  // =========================
  // BASE LAYOUT
  // =========================
  container: {
    flex: 1,
    backgroundColor: "#F3F5F9",
  },

  content: {
    padding: 20,
    paddingTop: 65,
    paddingBottom: 50,
  },

  headerContainer: {
    marginBottom: 25,
  },

  smallTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#888",
  },

  bigTitle: {
    fontSize: 30,
    fontWeight: "900",
    marginTop: 5,
    color: "#111",
  },

  dateText: {
    marginTop: 6,
    fontSize: 14,
    color: "#777",
  },

  heroCard: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 24,
    marginBottom: 22,
  },

  heroLabel: {
    color: "#BBB",
    fontWeight: "700",
    letterSpacing: 1,
  },
 center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F8',
  },
  heroRevenue: {
    color: "#FFF",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 8,
  },

  heroBottomRow: {
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  heroMiniLabel: {
    color: "#AAA",
    fontSize: 11,
  },

  heroMiniValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF",
  },

  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  section: {
    backgroundColor: "#FFF",
    padding: 18,
    borderRadius: 20,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  sectionHeader: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 14,
    color: "#777",
  },
});
