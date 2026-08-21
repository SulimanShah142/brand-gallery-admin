import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Image, SafeAreaView, KeyboardAvoidingView,   StyleSheet,
RefreshControl, Modal,Platform, ActivityIndicator, TextInput
  // ... other RN imports you use
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { API_URL } from "@/lib/config";
import { useLanguage } from '@/Contexts/LanguageContext';
import { execSql, isOnline } from '@/lib/offline';
import createStyles from "@/components/AnalyticsStyles"

type OrderItem = {
  id?: string | number;
  productName?: string;
  name?: string;
  quantity?: number;
  qty?: number;
  imageUrl?: string;
  productImage?: string;
  [k: string]: any;
};

type Order = {
  id: string;
  date?: string;
  orderId?: string | number;
  customer?: string;
  phone?: string;
  product?: string;
  productImage?: string | null;
  items: OrderItem[];
  qty: number;
  status: string;
  shipping: number;
  total: number;
  paymentMethod?: string;
  [k: string]: any;
};

type Product = {
  id?: string | number;
  estimatedProfit?: number;
  profit?: number;
  unitsSold?: number;
  quantitySold?: number;
  grossRevenue?: number;
  [k: string]: any;
};

type Expense = {
  id: string;
  amount: number;
  description?: string;
  createdAt?: string;
  [k: string]: any;
};

type FlatRow = {
  id: string;
  date?: string;
  orderId?: string | number;
  customer?: string;
  phone?: string;
  product?: string;
  productImage?: string | null;
  items: OrderItem[];
  qty: number;
  status: string;
  shipping: number;
  total: number;
  paymentMethod?: string;
};

export default function AnalyticsPage() {
  // --------------------
  // i18n & helpers
  // --------------------
  const [showYearPicker, setShowYearPicker] = useState(false);
  const { t, locale, setLanguage, isRTL } = useLanguage(); // keep as in your app

  const safe = (v: any) => Number(v ?? 0);
  const safeNumber = (v: any) => Number(v ?? 0).toLocaleString();

  const getProfitFactor = useCallback((profitPercentage: any) => {
    const normalized = Number(profitPercentage ?? 20);
    const margin = Number.isFinite(normalized) && normalized > 0 ? normalized / 100 : 0.2;
    return margin / (1 + margin);
  }, []);

  const deriveLineRevenue = useCallback((item: any) => {
    const quantity = Number(item?.quantity ?? item?.qty ?? 1);
    const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;

    const lineTotalCandidates = [item?.total, item?.amount, item?.saleValue, item?.salesValue, item?.grossRevenue];
    for (const candidate of lineTotalCandidates) {
      const value = Number(candidate ?? 0);
      if (Number.isFinite(value) && value > 0) {
        return value;
      }
    }

    const unitValueCandidates = [item?.price, item?.unitPrice, item?.unit_value, item?.unitValue, item?.value];
    for (const candidate of unitValueCandidates) {
      const value = Number(candidate ?? 0);
      if (Number.isFinite(value) && value > 0) {
        return value * safeQuantity;
      }
    }

    return 0;
  }, []);


const computeProductAggregates = useCallback(
  (
    orders: any[] = [],
    productsList: any[] = [],
    settingsData: any = null,
  ) => {
    const exchangeRate = Number(
      settingsData?.usdToAfnRate ??
        settingsData?.usd_to_afn_rate ??
        65,
    );

    const productUsdCostMap = new Map<string, number>();
    const productProfitMap = new Map<string, number>();

    for (const product of Array.isArray(productsList)
      ? productsList
      : []) {
      const name = String(product?.name ?? "")
        .trim()
        .toLowerCase();

      if (!name) continue;

      const usdCost = Number(product?.usdPrice ?? 0);

      if (Number.isFinite(usdCost) && usdCost > 0) {
        productUsdCostMap.set(name, usdCost);
      }

      const profitPercentage = Number(product?.profitPercentage ?? product?.profit_rate ?? product?.profit ?? 20);
      if (Number.isFinite(profitPercentage)) {
        productProfitMap.set(name, profitPercentage);
      }
    }

    const aggregates = new Map<string, any>();

    for (const order of Array.isArray(orders) ? orders : []) {
      const items = Array.isArray(order?.items)
        ? order.items
        : [];

      if (items.length === 0) {
        continue;
      }

      // ============================================================
      // AUTHORITATIVE REVENUE
      // ============================================================
      // The order total is the final amount charged for this order.
      //
      // DO NOT use item.unitPrice / item.price as revenue here.
      // Those values may represent catalog price, old price,
      // pre-discount price, etc.
      // ============================================================

      const orderTotal = Number(
        order?.total ??
          order?.totalAmount ??
          order?.orderTotal ??
          0,
      );

      if (
        !Number.isFinite(orderTotal) ||
        orderTotal <= 0
      ) {
        continue;
      }

      // ============================================================
      // VALID ITEMS
      // ============================================================

      const validItems = items
        .map((item: any) => {
          const name = String(
            item?.productName ??
              item?.name ??
              "",
          )
            .trim()
            .toLowerCase();

          const quantity = Number(
            item?.quantity ??
              item?.qty ??
              0,
          );

          return {
            item,
            name,
            quantity:
              Number.isFinite(quantity) &&
              quantity > 0
                ? quantity
                : 0,
          };
        })
        .filter(
          (entry: any) =>
            entry.name &&
            entry.quantity > 0,
        );

      if (validItems.length === 0) {
        continue;
      }

      // ============================================================
      // TOTAL QUANTITY
      // ============================================================

      const totalQuantity =
        validItems.reduce(
          (
            sum: number,
            entry: any,
          ) =>
            sum +
            entry.quantity,
          0,
        );

      if (totalQuantity <= 0) {
        continue;
      }

      // ============================================================
      // ALLOCATE ORDER REVENUE
      // ============================================================

      for (const entry of validItems) {
        const {
          item,
          name,
          quantity,
        } = entry;

        // Revenue allocation is based on quantity.
        //
        // For one product:
        //   orderTotal * 1 / 1 = orderTotal
        //
        // For two products:
        //   each receives its proportional share.
        const allocatedRevenue =
          orderTotal *
          (
            quantity /
            totalQuantity
          );

        // ============================================================
        // PRODUCT COST
        // ============================================================

        const productCostUsd =
          productUsdCostMap.get(name) ??
          Number(
            item?.usdPrice ??
              0,
          );

        const safeProductCostUsd =
          Number.isFinite(
            productCostUsd,
          ) &&
          productCostUsd > 0
            ? productCostUsd
            : 0;

        const costUsd =
          safeProductCostUsd *
          quantity;

        const costAfn =
          costUsd *
          exchangeRate;

        const profitPercentage = Number(
          productProfitMap.get(name) ??
            item?.profitPercentage ??
            item?.profit_rate ??
            item?.profit ??
            20,
        );

        const profitAfn =
          allocatedRevenue *
          getProfitFactor(
            profitPercentage,
          );

        // ============================================================
        // EXISTING AGGREGATE
        // ============================================================

        const existing =
          aggregates.get(name) ??
          {
            revenue: 0,
            baseCostUsd: 0,
            baseCostAfn: 0,
            unitsSold: 0,
            ordersSet:
              new Set<string>(),
          };

        existing.revenue +=
          allocatedRevenue;

        existing.baseCostUsd +=
          costUsd;

        existing.baseCostAfn +=
          costAfn;

        existing.profit +=
          profitAfn;

        existing.unitsSold +=
          quantity;

        const orderId = String(
          order?.id ??
            order?.orderId ??
            "",
        );

        if (orderId) {
          existing.ordersSet.add(
            orderId,
          );
        }

        aggregates.set(
          name,
          existing,
        );
      }
    }

    // ================================================================
    // FINAL RESULT
    // ================================================================

    const result = new Map<string, any>();

    for (
      const [
        name,
        value,
      ] of aggregates.entries()
    ) {
      const revenue =
        Number(
          value.revenue ??
            0,
        );

      const cost =
        Number(
          value.baseCostAfn ??
            0,
        );

      const costUsd =
        Number(
          value.baseCostUsd ??
            0,
        );

      const unitsSold =
        Number(
          value.unitsSold ??
            0,
        );

      const ordersCount =
        value.ordersSet.size;

      result.set(
        name,
        {
          revenue,
          cost,
          baseCostUsd:
            costUsd,
          unitsSold,
          ordersCount,
          profit:
            Number(
              value.profit ??
                0,
            ),
        },
      );
    }

    return result;
  },
  [getProfitFactor],
);


  const calculateProductPerformance = useCallback((product: any, orders: any[] = [], settingsData: any = null) => {
    const normalizedProductName = String(product?.name ?? "").trim().toLowerCase();
    const exchangeRate = Number(
      settingsData?.usdToAfnRate ??
        settingsData?.usd_to_afn_rate ??
        product?.usdToAfnRate ??
        65,
    );

    const serverRevenue = Number(product?.grossRevenue ?? product?.revenue ?? product?.salesValue ?? 0);
    const serverCost = Number(product?.baseCostAfn ?? product?.baseCost ?? 0);
    const serverProfit = Number(product?.estimatedProfit ?? product?.profitFromCost ?? product?.profit ?? 0);
    const serverUnitsSold = Number(product?.unitsSold ?? product?.quantitySold ?? 0);
    const productProfitPercentage = Number(product?.profitPercentage ?? product?.profit_rate ?? product?.profit ?? 20);

    // prefer centralized aggregates so per-product and summary match exactly
    try {
      const agg = computeProductAggregates(orders, [product], settingsData);
      const entry = agg.get(normalizedProductName);
      if (entry) {
        const revenue = Number(entry.revenue ?? 0);
        const cost = Number(entry.cost ?? 0);
        const costUsd = Number(entry.baseCostUsd ?? 0);
        const unitsSold = Number(entry.unitsSold ?? serverUnitsSold ?? 0);
        const unitCostAfn = unitsSold > 0 ? cost / Math.max(unitsSold, 1) : Number(product?.usdPrice ?? 0) * exchangeRate;

        const resolvedProfit =
          Number(entry?.profit ?? 0) > 0
            ? Number(entry.profit ?? 0)
            : revenue > 0
              ? revenue * getProfitFactor(productProfitPercentage)
              : 0;

        return {
          revenue,
          cost,
          costUsd,
          unitCostUsd: unitsSold > 0 ? (costUsd / Math.max(unitsSold, 1)) : Number(product?.usdPrice ?? 0),
          unitCostAfn,
          profit: resolvedProfit,
          unitsSold,
          ordersCount: Number(entry.ordersCount ?? 0),
        };
      }
    } catch (e) {
      // ignore and fallback to previous logic
    }

    const matchingOrders = (orders ?? []).filter((order: any) => {
      const orderProductName = String(order?.product ?? "").trim().toLowerCase();
      const items = Array.isArray(order?.items) ? order.items : [];
      const hasMatchingItem = items.some((item: any) => {
        const itemName = String(item?.productName ?? item?.name ?? "").trim().toLowerCase();
        return itemName === normalizedProductName;
      });

      return orderProductName === normalizedProductName || hasMatchingItem;
    });

    const matchingItems = (matchingOrders ?? []).flatMap((order: any) => {
      const items = Array.isArray(order?.items) ? order.items : [];
      return items.filter((item: any) => {
        const itemName = String(item?.productName ?? item?.name ?? "").trim().toLowerCase();
        return itemName === normalizedProductName;
      });
    });

    const soldUnits = matchingItems.reduce((sum: number, item: any) => {
      const quantity = Number(item?.quantity ?? item?.qty ?? 0);
      return sum + (Number.isFinite(quantity) ? quantity : 0);
    }, 0);

    // revenue: prefer explicit per-item line revenue, otherwise allocate order totals
    const derivedRevenue = matchingItems.reduce((sum: number, item: any) => sum + deriveLineRevenue(item), 0);

    const allocatedOrderRevenue = matchingOrders.reduce((sum: number, order: any) => {
      const orderTotal = Number(order?.total ?? order?.totalAmount ?? order?.orderTotal ?? 0);
      const items = Array.isArray(order?.items) ? order.items : [];
      const totalOrderQuantity = items.reduce((s: number, it: any) => s + Number(it?.quantity ?? it?.qty ?? 0), 0);

      if (!Number.isFinite(orderTotal) || orderTotal <= 0 || totalOrderQuantity <= 0) return sum;

      // sum quantities of matching items in this order
      const matchingQtyInOrder = items.reduce((s: number, it: any) => {
        const itemName = String(it?.productName ?? it?.name ?? "").trim().toLowerCase();
        if (itemName !== normalizedProductName) return s;
        const q = Number(it?.quantity ?? it?.qty ?? 0);
        return s + (Number.isFinite(q) ? q : 0);
      }, 0);

      if (matchingQtyInOrder <= 0) return sum;

      // allocate proportional share of order total
      return sum + (orderTotal * (matchingQtyInOrder / totalOrderQuantity));
    }, 0);

    const revenue = Number(derivedRevenue > 0 ? derivedRevenue : allocatedOrderRevenue > 0 ? allocatedOrderRevenue : serverRevenue);

    const fallbackUnitsSold = Number(product?.unitsSold ?? product?.quantitySold ?? 0);
    const unitsSold = soldUnits > 0 ? soldUnits : fallbackUnitsSold;
    // determine unit cost USD: prefer product-level price, otherwise infer from matching items
    let unitCostUsd = Number(product?.usdPrice ?? 0);
    if (unitCostUsd <= 0 && matchingItems.length > 0) {
      const weighted = matchingItems.reduce((acc: any, it: any) => {
        const q = Number(it?.quantity ?? it?.qty ?? 0) || 0;
        const cand = Number(it?.usdPrice ?? it?.unitPrice ?? it?.unit_value ?? it?.unitValue ?? it?.value ?? 0) || 0;
        return { totalQty: acc.totalQty + q, totalCost: acc.totalCost + cand * q };
      }, { totalQty: 0, totalCost: 0 });

      if (weighted.totalQty > 0) unitCostUsd = weighted.totalCost / weighted.totalQty;
    }

    const unitCostAfn = unitCostUsd * exchangeRate;
    const resolvedCost = serverCost > 0 ? serverCost : unitsSold > 0 ? unitCostAfn * unitsSold : 0;

    const fallbackProfit = revenue > 0 ? revenue * getProfitFactor(productProfitPercentage) : 0;

    return {
      revenue,
      cost: resolvedCost,
      costUsd: serverCost > 0 ? serverCost / Math.max(exchangeRate, 1) : resolvedCost / Math.max(exchangeRate, 1),
      unitCostUsd: Number(product?.usdPrice ?? 0),
      unitCostAfn,
      profit: fallbackProfit > 0 ? fallbackProfit : revenue - resolvedCost,
      unitsSold,
      ordersCount: matchingOrders.length,
    };
  }, [computeProductAggregates, getProfitFactor]);

const buildOrderItemTotals = useCallback(
  (
    orders: any[] = [],
    productsList: any[] = [],
    settingsData: any = null,
  ) => {
    const map =
      computeProductAggregates(
        orders,
        productsList,
        settingsData,
      );

    const totals = {
      revenue: 0,
      baseCostUsd: 0,
      baseCostAfn: 0,
      profit: 0,
      unitsSold: 0,
      products: new Set<string>(),
    };

    for (const [
      name,
      value,
    ] of map.entries()) {
      totals.revenue +=
        Number(
          value.revenue ?? 0,
        );

      totals.baseCostUsd +=
        Number(
          value.baseCostUsd ?? 0,
        );

      totals.baseCostAfn +=
        Number(
          value.cost ?? 0,
        );

      totals.profit +=
        Number(
          value.profit ?? 0,
        );

      totals.unitsSold +=
        Number(
          value.unitsSold ?? 0,
        );

      totals.products.add(
        name,
      );
    }

    return totals;
  },
  [computeProductAggregates],
);

// Shared helper: compute per-product aggregates using identical allocation logic

  // --------------------
  // Auth token (in-memory only)
  // --------------------
  const [adminToken, setAdminTokenState] = useState<string | null>(null);
  const adminTokenRef = useRef<string | null>(null);

  // keep ref in sync when state changes
  useEffect(() => {
    adminTokenRef.current = adminToken;
  }, [adminToken]);

  // wrapper to keep both in sync when setting token programmatically
  const setAdminToken = useCallback((token: string | null) => {
    adminTokenRef.current = token;
    setAdminTokenState(token);
  }, []);
  // --------------------
  // UI state
  // --------------------
  const [authState, setAuthState] = useState<"logged_out" | "logged_in">(
    "logged_out",
  );

  const [activeTab, setActiveTab] = useState<
    "dashboard" | "products" | "database" | "expenses" | "statement"
  >("dashboard");

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [password, setPassword] = useState("");
  const [passkey, setPasskey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);

  // pickers / modals
  const [expenseModal, setExpenseModal] = useState(false);

  // date controls
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [reportMode, setReportMode] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportDate, setReportDate] = useState(new Date());
  const [expenseDate, setExpenseDate] = useState(new Date());


  // table UI
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [databaseModalVisible, setDatabaseModalVisible] = useState(false);
  const [databaseViewMode, setDatabaseViewMode] = useState<
    "compact" | "fullscreen"
  >("compact");

  // --------------------
  // Data state (unified report)
  // --------------------
  const [report, setReport] = useState<{
    orders: Order[];
    products: Product[];
    expenses: Expense[];
    loading: boolean;
  }>({
    orders: [],
    products: [],
    expenses: [],
    loading: false,
  });

  const [databaseRows, setDatabaseRows] = useState<FlatRow[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  // expense form fields
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");

  // --------------------
  // constants (translation friendly)
  // --------------------
  const TAB_CONFIG = useMemo(
    () => [
      { key: "products", label: t("Products"), icon: "cube-outline" },
      { key: "expenses", label: t("Expenses"), icon: "wallet-outline" },
      { key: "database", label: t("Database"), icon: "server-outline" },
      { key: "statement", label: t("Statement"), icon: "document-text-outline" },
    ],
    [t],
  );

const COLUMN_WIDTHS = {
  date: 95,
  orderId: 120,
  customer: 170,
  product: 210,
  qty: 80,
  items: 90,
  status: 150,
  shipping: 120,
  payment: 110,
  total: 130,
};



  const TABLE_COLUMNS = useMemo(
    () => [
      { key: "date", label: t("created"), width: COLUMN_WIDTHS.date },
      { key: "orderId", label: t("orderId"), width: COLUMN_WIDTHS.orderId },
      { key: "customer", label: t("customer"), width: COLUMN_WIDTHS.customer },
      { key: "product", label: t("product"), width: COLUMN_WIDTHS.product },
      { key: "qty", label: t("quantity"), width: COLUMN_WIDTHS.qty },
      { key: "items", label: t("items"), width: COLUMN_WIDTHS.items },
      { key: "status", label: t("status"), width: COLUMN_WIDTHS.status },
      { key: "shipping", label: t("shipping"), width: COLUMN_WIDTHS.shipping },
      { key: "payment", label: t("paymentMethod"), width: COLUMN_WIDTHS.payment },
      { key: "total", label: t("total"), width: COLUMN_WIDTHS.total },
    ],
    [t, COLUMN_WIDTHS],
  );


  // Ensure the horizontal table content is wide enough for all columns
const TOTAL_TABLE_WIDTH = TABLE_COLUMNS.reduce(
  (sum, c) => sum + (c.width || 140),
  0,
) + 40; // small extra padding

  const MONTHS = useMemo(
    () => [
      t("January"),
      t("February"),
      t("March"),
      t("April"),
      t("May"),
      t("June"),
      t("July"),
      t("August"),
      t("September"),
      t("October"),
      t("November"),
      t("December"),
    ],
    [t],
  );

  // --------------------
  // Helpers: normalize orders (single source of truth)
  // --------------------
const normalizeOrders = useCallback((payload: any): Order[] => {
  const source = Array.isArray(payload) ? payload : payload?.orders ?? [];

  return source.map((o: any) => {
    const items = Array.isArray(o.items) ? o.items : [];
    
    const qty = items.reduce(
      (sum: number, item: any) => sum + Number(item.quantity ?? item.qty ?? 0),
      0,
    );

    const firstItem = items[0] ?? {};
    const productName = firstItem.productName || firstItem.name || o.productName || o.product || "-";

    return {
      id: String(o.id ?? Date.now()),
      date: o.createdAt ?? o.date ?? undefined,
      orderId: o.id,
      customer: o.customerName ?? "-",
      phone: o.phoneNumber ?? o.phone ?? "-",
      product: productName,
      productImage: firstItem.productImage ?? firstItem.imageUrl ?? o.imageUrl ?? null,
      items,
      qty,
      status: String(o.status ?? "pending").toLowerCase(),
      shipping: Number(o.shippingFee ?? o.shipping ?? 0),
      total: Number(o.totalAmount ?? o.total ?? 0),
      paymentMethod: o.paymentMethod ?? o.payment_method ?? o.paymentType ?? "N/A",
    } as Order;
  });
}, []); // <-- Added missing closing parenthesis here

  // --------------------
  // Sync selected date -> month/year
  // --------------------
  const syncReportDate = useCallback((date: Date) => {
    setSelectedDate(date);
    setReportMonth(date.getMonth() + 1);
    setReportYear(date.getFullYear());
  }, []);

  // --------------------
  // Core fetch that populates dashboard/products/charts/expenses/orders
  // --------------------
  const fetchData = useCallback(async (date: Date, silent = false) => {
    const token = adminTokenRef.current;
    if (!token) return;

    const safeDate = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
    const month = safeDate.getMonth() + 1;
    const year = safeDate.getFullYear();

    try {
      silent ? setRefreshing(true) : setLoading(true);

      const online = await isOnline().catch(() => false);

      if (!online) {
        const cached = await execSql("SELECT * FROM local_expenses ORDER BY created_at DESC;");
        setReport((prev) => ({ ...prev, expenses: Array.isArray(cached) ? cached : [] }));
        setDashboard(null);
        setDatabaseRows([]);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const ordersUrl =
        reportMode === "yearly"
          ? `${API_URL}/api/admin/orders?timeline=yearly&year=${year}`
          : `${API_URL}/api/admin/orders?timeline=custom&year=${year}&month=${String(month).padStart(2, "0")}`;

      const productsUrl =
        reportMode === "yearly"
          ? `${API_URL}/api/admin/analytics/products?year=${year}`
          : `${API_URL}/api/admin/analytics/products?month=${month}&year=${year}`;

      const [dashboardRes, productsRes, chartsRes, expensesRes, ordersRes, settingsRes] =
        await Promise.all([
          fetch(`${API_URL}/api/admin/analytics/dashboard?month=${month}&year=${year}`, { headers }),
          fetch(productsUrl, { headers }),
          fetch(`${API_URL}/api/admin/analytics/charts?month=${month}&year=${year}`, { headers }),
          fetch(`${API_URL}/api/admin/expenses`, { headers }),
          fetch(ordersUrl, { headers }),
          fetch(`${API_URL}/api/admin/settings`, { headers }),
        ]);

      if (dashboardRes.status === 401) {
        // force re-login
        setAdminToken(null);
        setAuthState("logged_out");
        return;
      }

      const dashboardJson = await dashboardRes.json().catch(() => null);
      const productsJson = await productsRes.json().catch(() => null);
      const chartsJson = await chartsRes.json().catch(() => null);
      const expensesJson = await expensesRes.json().catch(() => []);
      const ordersJson = await ordersRes.json().catch(() => []);
      const settingsJson = await settingsRes.json().catch(() => null);

      setDashboard(dashboardJson);
      setSettings(settingsJson ?? null);

      // normalize / set unified report state
      const normalizedOrders = normalizeOrders(ordersJson);
      const normalizedProducts = Array.isArray(productsJson?.products)
        ? productsJson.products
        : Array.isArray(productsJson)
        ? productsJson
        : [];

      setReport({
        orders: normalizedOrders,
        products: normalizedProducts,
        expenses: Array.isArray(expensesJson) ? expensesJson : [],
        loading: false,
      });

      // database rows flattened (for table)
      const flatRows: FlatRow[] = normalizedOrders.map((o) => ({
        id: String(o.id),
        date: o.date,
        orderId: o.orderId,
        customer: o.customer ?? "-",
        phone: o.phone ?? "-",
        product: o.product ?? "-",
        productImage: o.productImage ?? null,
        items: o.items,
        qty: o.qty,
        status: o.status ?? "pending",
        shipping: o.shipping ?? 0,
        total: o.total ?? 0,
        paymentMethod: o.paymentMethod,
      }));

      setDatabaseRows(flatRows);

      // cache local expenses
      await execSql("DELETE FROM local_expenses;");
      for (const e of (expensesJson ?? [])) {
        await execSql(
          `INSERT INTO local_expenses (id, amount, description, created_at) VALUES (?, ?, ?, ?)`,
          [e.id, e.amount, e.description, e.createdAt],
        );
      }
    } catch (err) {
      console.log("fetchData error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [normalizeOrders, setAdminToken]);

  // --------------------
  // Business report fetcher (reuses normalizeOrders)
  // --------------------
 const fetchBusinessReport = useCallback(
  async (monthOverride?: number, yearOverride?: number) => {
    const token = adminTokenRef.current;
    if (!token) return;

    // prefer overrides, then current state
    const month = monthOverride ?? reportMonth;
    const year = yearOverride ?? reportYear;

    try {
      setReport((r) => ({ ...r, loading: true }));

      const headers = { Authorization: `Bearer ${token}` };

      // Build URLs depending on monthly/yearly mode
      // Orders endpoint expects month for monthly timeline; for yearly we request with year only (no month)
      const ordersUrl =
        reportMode === "monthly"
          ? `${API_URL}/api/admin/orders?timeline=custom&year=${year}&month=${String(month).padStart(2, "0")}`
          : `${API_URL}/api/admin/orders?timeline=yearly&year=${year}`;

      const productsUrl =
        reportMode === "monthly"
          ? `${API_URL}/api/admin/analytics/products?month=${month}&year=${year}`
          : `${API_URL}/api/admin/analytics/products?year=${year}`;

      const [ordersRes, productsRes, expensesRes] = await Promise.all([
        fetch(ordersUrl, { headers }),
        fetch(productsUrl, { headers }),
        fetch(`${API_URL}/api/admin/expenses`, { headers }),
      ]);

      const ordersJson = await ordersRes.json().catch(() => []);
      const productsJson = await productsRes.json().catch(() => null);
      const expensesJson = await expensesRes.json().catch(() => []);

      const normalizedOrders = normalizeOrders(ordersJson);
      const normalizedProducts = Array.isArray(productsJson?.products)
        ? productsJson.products
        : Array.isArray(productsJson)
        ? productsJson
        : [];

      const flatRows: FlatRow[] = normalizedOrders.map((o) => ({
        id: String(o.id),
        date: o.date,
        orderId: o.orderId,
        customer: o.customer ?? "-",
        phone: o.phone ?? "-",
        product: o.product ?? "-",
        productImage: o.productImage ?? null,
        items: o.items,
        qty: o.qty,
        status: o.status ?? "pending",
        shipping: o.shipping ?? 0,
        total: o.total ?? 0,
        paymentMethod: o.paymentMethod,
      }));

      setDatabaseRows(flatRows);
      setReport({
        orders: normalizedOrders,
        products: normalizedProducts,
        expenses: Array.isArray(expensesJson) ? expensesJson : [],
        loading: false,
      });
    } catch (err) {
      console.log("Business report fetch error:", err);
      setReport({ orders: [], products: [], expenses: [], loading: false });
    }
  },
  [normalizeOrders, reportMonth, reportYear, reportMode],
);

  // auto load report when logged in
  useEffect(() => {
    if (authState !== "logged_in") return;
    void fetchBusinessReport(reportMode === "monthly" ? reportMonth : undefined, reportYear);
}, [authState, reportMonth, reportYear, reportMode, fetchBusinessReport]);

  // fetch main data when logged in and selectedDate changes
  useEffect(() => {
    if (authState !== "logged_in") return;
    void fetchData(selectedDate, false);
  }, [authState, selectedDate, fetchData]);


  
  // --------------------
  // Report summary derived from unified report
  // --------------------
  const reportSummary = useMemo(() => {
    const orders = report.orders ?? [];
    const products = report.products ?? [];
    const expensesList = report.expenses ?? [];

    const totalOrders = orders.length;
    const orderMetrics = buildOrderItemTotals(orders, products, settings);
    const dashboardFinancials = dashboard?.financials ?? {};

 // Use the exact totals calculated from every order item.
// This guarantees the summary matches the product ledger.
const revenue = Number(orderMetrics.revenue ?? 0);

const shipping = Number(
  dashboardFinancials.shippingCollected ??
  0
);

const estimatedProfit = Number(orderMetrics.profit ?? 0);
  const averageOrderValue =
  totalOrders > 0
    ? revenue / totalOrders
    : 0;

    const delivered = orders.filter((o) =>
      ["delivered", "completed"].includes(String(o.status).toLowerCase()),
    ).length;

    const cancelled = orders.filter((o) =>
      String(o.status).toLowerCase().includes("cancel"),
    ).length;

    const totalExpenses = expensesList.reduce(
      (s, e) => s + Number(e.amount ?? 0),
      0,
    );

    const productCostTotals = Array.isArray(products)
      ? products.reduce(
          (acc, product) => {
            const baseCostUsdValue = Number(product?.baseCost ?? product?.baseCostUsd ?? 0);
            const baseCostAfnValue = Number(product?.baseCostAfn ?? 0);

            acc.baseCostUsd += Number.isFinite(baseCostUsdValue) ? baseCostUsdValue : 0;
            acc.baseCostAfn += Number.isFinite(baseCostAfnValue)
              ? baseCostAfnValue
              : 0;
            return acc;
          },
          { baseCostUsd: 0, baseCostAfn: 0 },
        )
      : { baseCostUsd: 0, baseCostAfn: 0 };

    const baseCostUsd =
      productCostTotals.baseCostUsd > 0
        ? productCostTotals.baseCostUsd
        : orderMetrics.baseCostUsd;

    const baseCost =
      productCostTotals.baseCostAfn > 0
        ? productCostTotals.baseCostAfn
        : productCostTotals.baseCostUsd > 0
        ? productCostTotals.baseCostUsd * Number(settings?.usdToAfnRate ?? settings?.usd_to_afn_rate ?? 65)
        : orderMetrics.baseCostAfn;

    const netProfit = estimatedProfit - totalExpenses;

    const unitsSold = orderMetrics.unitsSold;

    return {
      totalOrders,
      revenue,
      shipping,
      delivered,
      cancelled,
      expenses: totalExpenses,
      baseCost,
      baseCostUsd,
      estimatedProfit,
      netProfit,
      unitsSold,
      averageOrderValue,
    };
  }, [buildOrderItemTotals, report, settings, dashboard]);

  // -- Restore 'products' alias (used by many UI sections)
// Use the unified report.products so other code that expects `products` keeps working.
const products: Product[] = useMemo(() => {
  return Array.isArray(report.products) ? report.products : [];
}, [report.products]);

// -- Restore 'financialMetrics' (small summary derived from dashboard + expenses)
const financialMetrics = useMemo(() => {
  const financials = dashboard?.financials ?? {};
  const expenseTotal = Array.isArray(report.expenses)
    ? report.expenses.reduce((sum, e) => sum + Number(e.amount ?? 0), 0)
    : 0;

  const grossRevenue = Number(financials.revenue ?? 0);
  const estimatedProfit = Number(financials.estimatedProfit ?? grossRevenue * 0.3);
  const netProfitValue = Number(financials.netProfit ?? estimatedProfit - expenseTotal);

  return {
    grossRevenue,
    estimatedProfit,
    totalExpenseAmount: expenseTotal,
    netProfit: netProfitValue,
  };
}, [dashboard, report.expenses]);

  // expose a clean ledgerProducts for other UI code
  const ledgerProducts = useMemo(() => {
    return Array.isArray(report.products) ? report.products : [];
  }, [report.products]);

  // memoized aggregates map for exact per-product numbers
  const productAggMap = useMemo(() => {
    return computeProductAggregates(report.orders ?? [], ledgerProducts ?? [], settings);
  }, [report.orders, ledgerProducts, settings, computeProductAggregates]);

  // inside AnalyticsPage, after `const { t, locale, setLanguage, isRTL } = useLanguage();`
// ensure styles are created at runtime and recreated only when isRTL changes
const styles = useMemo(() => createStyles(isRTL), [isRTL]) as any;

// restore `charts` variable used by UI
const charts = useMemo(() => {
  // prefer explicit charts returned from the dashboard, fall back to report.charts
  return dashboard?.charts ?? (report as any)?.charts ?? null;
}, [dashboard, report]);

// restore 'products' alias if still used elsewhere

// if anything else was removed, add similar safe aliases:
// e.g., const orders = useMemo(() => Array.isArray(report.orders) ? report.orders : [], [report.orders]);
  // --------------------
  // Expense operations (add/delete) — use unified state
  // --------------------
  const addExpense = useCallback(async () => {
    if (!expenseAmount || !expenseDescription) return;

    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: Number(expenseAmount),
      description: expenseDescription,
      createdAt: expenseDate.toISOString(),
    };

    setReport((prev) => ({ ...prev, expenses: [newExpense, ...prev.expenses] }));
    setExpenseAmount("");
    setExpenseDescription("");
    setExpenseDate(new Date());
    setExpenseModal(false);

    try {
      const online = await isOnline().catch(() => false);

      await execSql(
        `INSERT INTO local_expenses (id, amount, description, created_at) VALUES (?, ?, ?, ?)`,
        [newExpense.id, newExpense.amount, newExpense.description, newExpense.createdAt],
      );

      if (online) {
        await fetch(`${API_URL}/api/admin/expenses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newExpense),
        });
      }
    } catch (e) {
      console.log(e);
    }
  }, [expenseAmount, expenseDescription, expenseDate]);

  const deleteExpense = useCallback(async (expenseId: string) => {
    try {
      setReport((prev) => ({ ...prev, expenses: prev.expenses.filter((e) => e.id !== expenseId) }));

      const online = await isOnline().catch(() => false);

      await execSql("DELETE FROM local_expenses WHERE id = ?", [expenseId]);

      if (online) {
        await fetch(`${API_URL}/api/admin/expenses/${expenseId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminTokenRef.current}`,
          },
        });
      }
    } catch (err) {
      console.log("deleteExpense error:", err);
    }
  }, []);

  // --------------------
  // Auth: handleLogin (keeps token in-memory only)
  // --------------------
  const handleLogin = useCallback(async () => {
    if (!password || !passkey) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, passkey }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Login failed");

      const token = data.adminToken ?? data.token ?? null;
      if (!token) throw new Error(data?.error || "Missing token");

      setAdminToken(token);
      setAuthState("logged_in");
    } catch (e: any) {
      Alert.alert("Login Failed", e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [password, passkey, setAdminToken]);

  // --------------------
  // Render helpers (unchanged logic, using TAB_CONFIG)
  // --------------------
  const renderAnalyticsTabs = useCallback(() => {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        {TAB_CONFIG.map((tab) => {
          const isActive = activeTab === (tab.key as any);
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key as any)}
              style={[styles.analyticsTabs, isActive && styles.analyticsTabActive]}
            >
              <Ionicons name={tab.icon as any} size={15} color={isActive ? "#FFF" : "#666"} />
              <Text style={[styles.analyticsTabText, isActive && styles.analyticsTabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  }, [TAB_CONFIG, activeTab]);

  const safeExpenses = useMemo(() => (Array.isArray(report.expenses) ? report.expenses : []), [report.expenses]);

  const renderExpenses = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionEyebrow}>{t("finance")}</Text>
          <Text style={styles.sectionTitle}>{t("companyExpenses")}</Text>
        </View>

        <TouchableOpacity style={styles.addExpenseMiniBtn} onPress={() => setExpenseModal(true)}>
          <Ionicons name="add" size={15} color="#FFF" />
          <Text style={styles.addExpenseMiniText}>{t("add")}</Text>
        </TouchableOpacity>
      </View>

      {safeExpenses.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="wallet-outline" size={42} color="#C5C5C5" />
          <Text style={styles.emptyTitle}>{t("noExpenses")}</Text>
          <Text style={styles.emptySubtitle}>{t("companyExpensesAppearHere")}</Text>
        </View>
      ) : (
        safeExpenses.map((expense) => (
          <View key={expense.id} style={styles.expenseCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.expenseTitle}>{expense.description || t("expense")}</Text>
              <Text style={styles.expenseDate}>{formatDate(expense.createdAt)}</Text>
            </View>
            <Text style={styles.expenseAmount}>AFN {Number(expense.amount).toLocaleString()}</Text>
            <TouchableOpacity onPress={() => deleteExpense(expense.id)} style={styles.expenseDeleteBtn}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
// --- continuation / replacement of second half starting at `logout` ---

  const logout = async () => {
    // clear in-memory session only to force re-login
    adminTokenRef.current = null;
    setAdminToken(null);
    setAuthState("logged_out");
  };

  // Small config maps (can be moved to a constants file)
  const STATUS_CONFIG: Record<
    string,
    { bg: string; color: string; icon: string }
  > = {
    pending: { bg: "#FEF3C7", color: "#92400E", icon: "time-outline" },
    delivered: { bg: "#ECFDF5", color: "#065F46", icon: "checkmark-circle-outline" },
    completed: { bg: "#ECFDF5", color: "#065F46", icon: "checkmark-circle-outline" },
    cancelled: { bg: "#FEF2F2", color: "#991B1B", icon: "close-circle-outline" },
    refunded: { bg: "#EEF2FF", color: "#3730A3", icon: "return-up-back-outline" },
  };

  const PAYMENT_CONFIG: Record<
    string,
    { bg: string; color: string; icon: string }
  > = {
    cash: { bg: "#F8FAFC", color: "#0F172A", icon: "cash-outline" },
    card: { bg: "#F8FAFC", color: "#0F172A", icon: "card-outline" },
    momo: { bg: "#F8FAFC", color: "#0F172A", icon: "phone-portrait-outline" },
    unknown: { bg: "#F8FAFC", color: "#475569", icon: "help-circle-outline" },
  };

  // Safe date formatter (translation-friendly in future)
  const formatDate = (date?: string | Date) => {
    if (!date) return "-";
    try {
      return new Date(date).toLocaleDateString(locale ?? "en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  // Derived reportData compatible with existing UI code
  const reportData = useMemo(() => {
    return {
      orders: Array.isArray(report.orders) ? report.orders : [],
      products: Array.isArray(report.products) ? report.products : [],
      expenses: Array.isArray(report.expenses) ? report.expenses : [],
      metrics: reportSummary,
    };
  }, [report, reportSummary]);

  // Simple presentational types
  const StatementRow: React.FC<{
    label: React.ReactNode;
    value: React.ReactNode;
    danger?: boolean;
    success?: boolean;
    bold?: boolean;
  }> = ({ label, value, danger, success, bold }) => (
    <View style={styles.statementRow}>
      <Text style={[styles.statementLabel, bold && styles.statementLabelBold]}>
        {label}
      </Text>

      <Text
        style={[
          styles.statementValue,
          danger && { color: "#EF4444" },
          success && { color: "#22C55E" },
          bold && styles.statementValueBold,
        ]}
      >
        {value}
      </Text>
    </View>
  );

  const toggleRow = useCallback((id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const openPicker = useCallback(() => {
    setShowYearPicker(true);
  }, []);

  const onDateChange = (event: any, date?: Date) => {
    if (!date) {
      return;
    }

    const selected = new Date(date.getFullYear(), date.getMonth(), 1);

    setSelectedDate(selected);
    setReportMonth(selected.getMonth() + 1);
    setReportYear(selected.getFullYear());
  };

  // ledgerProducts is already defined earlier; ensure it is used
  const enrichedProducts = useMemo(() => {
    if (!Array.isArray(ledgerProducts)) return [];

    const orders = report.orders ?? [];

    // build aggregates map for exact per-product numbers
    const agg = computeProductAggregates(orders, ledgerProducts, settings);

    return ledgerProducts.map((product: any) => {
      const name = String(product.name ?? "").trim().toLowerCase();
      const v = agg.get(name) ?? { revenue: 0, unitsSold: 0, ordersCount: 0, cost: 0, profit: 0 };

      return {
        ...product,
        grossRevenue: v.revenue,
        _metrics: {
          revenue: v.revenue,
          units: v.unitsSold ?? Number(product.unitsSold ?? 0),
          orders: v.ordersCount ?? 0,
          avgRevenuePerOrder: (v.ordersCount && v.ordersCount > 0) ? (v.revenue / v.ordersCount) : 0,
        },
        _sales: Array.isArray(product.individualSales) ? product.individualSales : [],
        _aggregates: v,
      };
    });
  }, [ledgerProducts, report.orders, settings]);


useEffect(() => {
  console.log("\n");
  console.log("====================================================");
  console.log("🔍 ANALYTICS REVENUE DEBUG");
  console.log("====================================================");

  console.log("📦 REPORT ORDERS:", report.orders?.length ?? 0);
  console.log("📦 REPORT PRODUCTS:", report.products?.length ?? 0);

  // --------------------------------------------------
  // 1. RAW ORDER TOTALS
  // --------------------------------------------------
  const rawOrderTotal = (report.orders ?? []).reduce(
    (sum: number, order: any) => {
      const value = Number(
        order?.total ??
        order?.totalAmount ??
        order?.orderTotal ??
        0
      );

      console.log("🧾 ORDER:", {
        id: order?.id ?? order?.orderId,
        status: order?.status,
        total: order?.total,
        totalAmount: order?.totalAmount,
        orderTotal: order?.orderTotal,
        resolvedTotal: value,
      });

      return sum + (Number.isFinite(value) ? value : 0);
    },
    0
  );

  console.log("💰 RAW ORDER TOTAL SUM:", rawOrderTotal);

  // --------------------------------------------------
  // 2. PRODUCT ITEM LINE TOTALS
  // --------------------------------------------------
  let rawItemRevenue = 0;

  for (const order of report.orders ?? []) {
    const items = Array.isArray(order?.items)
      ? order.items
      : [];

    for (const item of items) {
      const quantity = Number(
        item?.quantity ??
        item?.qty ??
        0
      );

      const lineTotal = Number(
        item?.total ??
        item?.amount ??
        item?.saleValue ??
        item?.salesValue ??
        item?.grossRevenue ??
        0
      );

      const unitPrice = Number(
        item?.price ??
        item?.unitPrice ??
        item?.unit_value ??
        item?.unitValue ??
        item?.value ??
        0
      );

      const calculatedLine = lineTotal > 0
        ? lineTotal
        : unitPrice * quantity;

      rawItemRevenue += calculatedLine;

      console.log("🛒 ITEM:", {
        orderId: order?.id ?? order?.orderId,
        product:
          item?.productName ??
          item?.name,
        quantity,
        lineTotal,
        unitPrice,
        calculatedLine,
      });
    }
  }

  console.log(
    "🛒 RAW ITEM REVENUE SUM:",
    rawItemRevenue
  );

  // --------------------------------------------------
  // 3. PRODUCT AGGREGATE TOTAL
  // --------------------------------------------------
  let aggregateRevenue = 0;

  console.log("📊 PRODUCT AGGREGATES:");

  for (const [name, entry] of productAggMap.entries()) {
    const revenue = Number(
      entry?.revenue ?? 0
    );

    aggregateRevenue += revenue;

    console.log("📊 PRODUCT:", {
      name,
      revenue,
      unitsSold: entry?.unitsSold,
      ordersCount: entry?.ordersCount,
      cost: entry?.cost,
      profit: entry?.profit,
    });
  }

  console.log(
    "📊 PRODUCT AGGREGATE REVENUE SUM:",
    aggregateRevenue
  );

  // --------------------------------------------------
  // 4. BACKEND PRODUCT ANALYTICS
  // --------------------------------------------------
  let backendProductRevenue = 0;

  console.log("🌐 BACKEND PRODUCTS:");

  for (const product of report.products ?? []) {
    const revenue = Number(
      product?.grossRevenue ??
      product?.revenue ??
      product?.salesValue ??
      0
    );

    backendProductRevenue += revenue;

    console.log("🌐 PRODUCT:", {
      name: product?.name,
      grossRevenue: product?.grossRevenue,
      revenue: product?.revenue,
      salesValue: product?.salesValue,
      resolvedRevenue: revenue,
      unitsSold: product?.unitsSold,
      quantitySold: product?.quantitySold,
      estimatedProfit: product?.estimatedProfit,
    });
  }

  console.log(
    "🌐 BACKEND PRODUCT REVENUE SUM:",
    backendProductRevenue
  );

  // --------------------------------------------------
  // 5. DASHBOARD FINANCIALS
  // --------------------------------------------------
  console.log("🏦 DASHBOARD FINANCIALS:", {
    revenue: dashboard?.financials?.revenue,
    shippingCollected:
      dashboard?.financials?.shippingCollected,
    estimatedProfit:
      dashboard?.financials?.estimatedProfit,
    netProfit:
      dashboard?.financials?.netProfit,
    averageOrderValue:
      dashboard?.financials?.averageOrderValue,
  });

  // --------------------------------------------------
  // 6. REPORT SUMMARY
  // --------------------------------------------------
  console.log("📋 REPORT SUMMARY:", {
    revenue: reportSummary?.revenue,
    estimatedProfit:
      reportSummary?.estimatedProfit,
    baseCost:
      reportSummary?.baseCost,
    baseCostUsd:
      reportSummary?.baseCostUsd,
    expenses:
      reportSummary?.expenses,
    netProfit:
      reportSummary?.netProfit,
    unitsSold:
      reportSummary?.unitsSold,
    totalOrders:
      reportSummary?.totalOrders,
  });

  // --------------------------------------------------
  // 7. ORDER METRICS
  // --------------------------------------------------
  const orderMetrics = buildOrderItemTotals(
    report.orders ?? [],
    report.products ?? [],
    settings
  );

  console.log("📦 ORDER METRICS:", {
    revenue: orderMetrics?.revenue,
    baseCostUsd:
      orderMetrics?.baseCostUsd,
    baseCostAfn:
      orderMetrics?.baseCostAfn,
    profit:
      orderMetrics?.profit,
    unitsSold:
      orderMetrics?.unitsSold,
  });

  // --------------------------------------------------
  // 8. FINAL COMPARISON
  // --------------------------------------------------
  console.log("====================================================");
  console.log("🚨 REVENUE COMPARISON");
  console.log("====================================================");

  console.log({
    rawOrderTotal,
    rawItemRevenue,
    aggregateRevenue,
    backendProductRevenue,
    dashboardRevenue:
      Number(
        dashboard?.financials?.revenue ?? 0
      ),
    reportSummaryRevenue:
      Number(
        reportSummary?.revenue ?? 0
      ),
    orderMetricsRevenue:
      Number(
        orderMetrics?.revenue ?? 0
      ),
  });

  console.log("====================================================");
  console.log("🔍 END REVENUE DEBUG");
  console.log("====================================================");
}, [
  report.orders,
  report.products,
  productAggMap,
  dashboard,
  reportSummary,
  settings,
  buildOrderItemTotals,
]);


  const renderLogin = () => (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <View style={styles.authContainer}>
        <View style={styles.authCard}>
          {/* HEADER */}
          <View style={styles.authHeader}>
            <Text style={styles.authTitle}>{t("adminAccess")}</Text>

            <View style={styles.authLine} />

            <Text style={styles.authSubtitle}>
              {t("enterCredentialsToContinue")}
            </Text>
          </View>

          {/* PASSWORD */}
          <View style={styles.authInputGroup}>
            <Text style={styles.authLabel}>{t("password")}</Text>

            <View style={styles.passwordBox}>
              <TextInput
                style={styles.passwordInput}
                placeholder={t("enterPassword")}
                placeholderTextColor="#AAA"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* PASSKEY */}
          <View style={styles.authInputGroup}>
            <Text style={styles.authLabel}>{t("passkey")}</Text>

            <View style={styles.passwordBox}>
              <TextInput
                style={styles.passwordInput}
                placeholder={t("enterPasskey")}
                placeholderTextColor="#AAA"
                secureTextEntry={!showPasskey}
                value={passkey}
                onChangeText={setPasskey}
              />

              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPasskey(!showPasskey)}
              >
                <Ionicons
                  name={showPasskey ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* LOGIN BUTTON */}
          <TouchableOpacity
            style={[styles.authButton, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.authButtonText}>
              {loading ? t("verifying") : t("login")}
            </Text>
          </TouchableOpacity>

          {/* FOOTER */}
          <View style={styles.authFooter}>
            <Text style={styles.authSubtitle}>{t("secureAdminDashboard")}</Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  const changeYear = (delta: number) => {
    setReportYear((prev) => {
      const next = prev + delta;
      // trigger fetch via effect
      return next;
    });
  };

const resetReportYear = useCallback(() => {
  const now = new Date();
  setReportYear(now.getFullYear());
  if (reportMode === "monthly") {
    syncReportDate(now);
  }
}, [reportMode, syncReportDate]);

const openYearPicker = () => setShowYearPicker(true);
const closeYearPicker = () => setShowYearPicker(false);

const ReportPickerModal: React.FC = () => {
  if (!showYearPicker) return null;

  const now = new Date().getFullYear();
  const start = now - 6;
  const end = now + 4;
  const years = [] as number[];
  for (let y = start; y <= end; y++) years.push(y);

  return (
    <Modal visible={true} transparent animationType="fade" onRequestClose={closeYearPicker}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("selectPeriod")}</Text>
            <TouchableOpacity onPress={closeYearPicker} style={styles.modalCloseButton}>
              <Ionicons name="close" size={18} color="#111" />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            <TouchableOpacity
              style={[styles.modalDateButton, reportMode === "monthly" && { borderColor: "#2563EB", borderWidth: 1 }]}
              onPress={() => setReportMode("monthly")}
            >
              <Text style={styles.modalDateButtonText}>{t("monthly")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalDateButton, reportMode === "yearly" && { borderColor: "#2563EB", borderWidth: 1 }]}
              onPress={() => setReportMode("yearly")}
            >
              <Text style={styles.modalDateButtonText}>{t("yearly")}</Text>
            </TouchableOpacity>
          </View>

          {reportMode === "monthly" ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {MONTHS.map((month, index) => {
                const monthNumber = index + 1;
                const isSelected = monthNumber === reportMonth;
                return (
                  <TouchableOpacity
                    key={month}
                    style={[styles.modalDateButton, isSelected && { borderColor: "#2563EB", borderWidth: 1 }]}
                    onPress={() => {
                      setReportMonth(monthNumber);
                      setSelectedDate(new Date(reportYear, monthNumber - 1, 1));
                      closeYearPicker();
                    }}
                  >
                    <Text style={styles.modalDateButtonText}>{month}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 320 }}>
              {years.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[styles.modalDateButton, y === reportYear && { borderColor: "#2563EB", borderWidth: 1 }]}
                  onPress={() => {
                    setReportYear(y);
                    setSelectedDate(new Date(y, reportMonth - 1, 1));
                    closeYearPicker();
                  }}
                >
                  <Text style={styles.modalDateButtonText}>{String(y)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

  const ReportMetric: React.FC<{
    label: React.ReactNode;
    value: React.ReactNode;
    danger?: boolean;
    success?: boolean;
    bold?: boolean;
  }> = ({ label, value, danger, success, bold }) => (
    <View style={styles.reportMetricRow}>
      <Text style={[styles.reportMetricLabel, bold && { fontWeight: "900" }]}>
        {label}
      </Text>

      <Text
        style={[
          styles.reportMetricValue,
          success && { color: "#16A34A" },
          danger && { color: "#DC2626" },
          bold && { fontWeight: "900" },
        ]}
      >
        {value}
      </Text>
    </View>
  );

  const renderReportSelector = () => (
  <View style={styles.reportSelectorCard}>
    <View>
      <Text style={styles.reportMainTitle}>{t("businessAnalytics")}</Text>
      <Text style={{ marginTop: 6, color: "#777", fontSize: 12 }}>
        {t("monthlyFinancialAndOrderPerformance")}
      </Text>
    </View>

    <View style={styles.reportSelectorRow}>
      <TouchableOpacity
        style={styles.reportSelectorButton}
        onPress={() => setReportMode((prev) => (prev === "monthly" ? "yearly" : "monthly"))}
      >
        <Text style={{ fontWeight: "800" }}>{reportMode === "monthly" ? t("monthly") : t("yearly")}</Text>
        <Ionicons name="chevron-down" size={18} color="#555" />
      </TouchableOpacity>

      <TouchableOpacity onPress={openYearPicker} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Ionicons name="calendar-outline" size={18} color="#333" />
        <Text style={{ fontWeight: "800" }}>
          {reportMode === "monthly"
            ? new Date(reportYear, reportMonth - 1).toLocaleDateString(locale ?? "en-US", {
                month: "short",
                year: "numeric",
              })
            : String(reportYear)}
        </Text>
      </TouchableOpacity>
    </View>

    {/* report picker modal */}
    <ReportPickerModal />
  </View>
);

  const renderReportHeader = () => (
    <View style={styles.sectionHeaderRow}>
      <View>
        <Text style={styles.sectionEyebrow}>{t("businessReport")}</Text>

        <Text style={styles.sectionTitle}>
          {reportMode === "monthly"
            ? t("monthlyBusinessPerformance")
            : t("yearlyBusinessPerformance")}
        </Text>

        <Text style={styles.sectionSubtitle}>
          {reportMode === "monthly"
            ? `${MONTHS[reportMonth - 1]} ${reportYear}`
            : String(reportYear)}
        </Text>
      </View>

      <View style={styles.tableCountBadge}>
        <Text style={styles.tableCountText}>
          {(reportData.orders || []).length} {t("orders")}
        </Text>
      </View>
    </View>
  );

  const ReportCard: React.FC<{
    title: React.ReactNode;
    value: React.ReactNode;
    color?: string;
    subtitle?: React.ReactNode;
  }> = ({ title, value, color, subtitle }) => (
    <View style={styles.reportCard}>
      <Text style={styles.reportCardTitle}>{title}</Text>
      <Text style={[styles.reportCardValue, color ? { color } : undefined]}>
        {value}
      </Text>
      {subtitle && <Text style={styles.reportCardSubtitle}>{subtitle}</Text>}
    </View>
  );

  const ReportOrdersHeader: React.FC<{ orderCount: number }> = ({ orderCount }) => {
    return (
      <View style={styles.reportHeaderCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionEyebrow}>{t("database")}</Text>

          <Text style={styles.sectionTitle}>{t("reportOrders")}</Text>

          <Text style={styles.sectionSubtitle}>
            {t("allOrdersForSelectedPeriod")}
          </Text>
        </View>

        <View style={styles.reportCountBadge}>
          <Ionicons name="receipt-outline" size={16} color="#2563EB" />

          <Text style={styles.reportCountText}>
            {orderCount.toLocaleString()} {t("orders")}
          </Text>
        </View>
      </View>
    );
  };

  const safeText = (value: any): string => {
    if (value === null || value === undefined) {
      return "-";
    }

    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }

    if (Array.isArray(value)) {
      return value
        .map((item) =>
          typeof item === "object"
            ? String(item.name ?? item.productName ?? "-")
            : String(item),
        )
        .join(", ");
    }

    if (typeof value === "object") {
      return String(value.name ?? value.productName ?? value.title ?? "-");
    }

    return "-";
  };
  type ReportCellProps = {
    children: React.ReactNode;
    width: number;
    numberOfLines?: number;
    align?: "left" | "center" | "right";
  };
const ReportOrdersTable: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <View style={styles.reportTableCard}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reportTableScroll}>
        <View style={[styles.reportTableContent, { minWidth: TOTAL_TABLE_WIDTH }]}>
          {children}
        </View>
      </ScrollView>
    </View>
  );
};
const ReportCell: React.FC<ReportCellProps> = ({ children, width, numberOfLines = 1, align = "left" }) => {
  return (
    <View
      style={[
        styles.reportCellContainer,
        {
          width,
          maxWidth: width,
          flexShrink: 0,
          alignItems: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
        },
      ]}
    >
      <Text numberOfLines={numberOfLines} ellipsizeMode="tail" style={styles.reportCellText}>
        {safeText(children)}
      </Text>
    </View>
  );
};

const ReportStrongCell: React.FC<{ children: React.ReactNode; width: number; align?: "left" | "center" | "right" }> = ({
  children,
  width,
  align = "left",
}) => (
  <View
    style={[
      styles.reportCellContainer,
      {
        width,
        maxWidth: width,
        flexShrink: 0,
        alignItems: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
      },
    ]}
  >
    <Text numberOfLines={1} style={styles.reportStrongCellText}>
      {safeText(children)}
    </Text>
  </View>
);

const ReportMoneyCell: React.FC<{ amount: number; width: number }> = ({ amount, width }) => (
  <View style={[styles.reportCellContainer, { width, maxWidth: width, flexShrink: 0, alignItems: "flex-end" }]}>
    <Text numberOfLines={1} style={styles.reportMoneyCellText}>
      AFN {Number(amount ?? 0).toLocaleString()}
    </Text>
  </View>
);

  const ReportStatusBadge: React.FC<{ status?: string }> = ({ status = "pending" }) => {
    const normalized = String(status ?? "pending").toLowerCase().trim();
    const config = STATUS_CONFIG[normalized] ?? { bg: "#F1F5F9", color: "#64748B", icon: "ellipse-outline" };

    return (
      <View style={[styles.reportStatusContainer, { width: COLUMN_WIDTHS.status }]}>
        <View style={[styles.reportStatusBadge, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon as any} size={13} color={config.color} />
          <Text numberOfLines={1} style={[styles.reportStatusText, { color: config.color }]}>
            {t(normalized)}
          </Text>
        </View>
      </View>
    );
  };

  const ReportHeaderCell: React.FC<{ label: string; width: number; align?: "left" | "center" | "right" }> = ({ label, width, align = "left" }) => {
    return (
      <View
        style={[
          styles.reportHeaderCell,
          { width, alignItems: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start" },
        ]}
      >
        <Text numberOfLines={1} style={styles.reportHeaderText}>
          {label}
        </Text>
      </View>
    );
  };

  const ReportOrdersTableHeader: React.FC = () => {
    return (
      <View style={styles.reportTableHeader}>
        <ReportHeaderCell label={t("date")} width={COLUMN_WIDTHS.date} />
        <ReportHeaderCell label={t("orderId")} width={COLUMN_WIDTHS.orderId} />
        <ReportHeaderCell label={t("customer")} width={COLUMN_WIDTHS.customer} />
        <ReportHeaderCell label={t("product")} width={COLUMN_WIDTHS.product} />
        <ReportHeaderCell label={t("quantity")} width={COLUMN_WIDTHS.qty} align="center" />
        <ReportHeaderCell label={t("status")} width={COLUMN_WIDTHS.status} align="center" />
        <ReportHeaderCell label={t("revenue")} width={COLUMN_WIDTHS.total} align="right" />
        <ReportHeaderCell label={t("items")} width={COLUMN_WIDTHS.items} align="center" />
        <ReportHeaderCell label={t("shipping")} width={COLUMN_WIDTHS.shipping} />
        <ReportHeaderCell label={t("payment")} width={COLUMN_WIDTHS.payment} />
      </View>
    );
  };

  const ReportOrdersEmptyState: React.FC = () => (
    <View style={styles.reportEmptyCard}>
      <View style={styles.reportEmptyIcon}>
        <Ionicons name="receipt-outline" size={34} color="#94A3B8" />
      </View>

      <Text style={styles.reportEmptyTitle}>{t("noOrdersFound")}</Text>

      <Text style={styles.reportEmptySubtitle}>{t("noOrdersForSelectedPeriod")}</Text>
    </View>
  );

  const ReportPaymentBadge: React.FC<{ payment?: string }> = ({ payment = "unknown" }) => {
    const normalized = String(payment ?? "unknown").toLowerCase().trim();
    const config = PAYMENT_CONFIG[normalized] ?? PAYMENT_CONFIG.unknown;

    return (
      <View style={[styles.reportPaymentContainer, { width: COLUMN_WIDTHS.payment }]}>
        <View style={[styles.reportPaymentBadge, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon as any} size={13} color={config.color} />
          <Text style={[styles.reportPaymentText, { color: config.color }]}>{t(normalized)}</Text>
        </View>
      </View>
    );
  };

  // Row renderer for a single order
  const ReportOrderRow: React.FC<{ order: any; index: number }> = ({ order, index }) => {
    const even = index % 2 === 0;
    const customer = order.customer ?? order.customerName ?? order.fullName ?? "-";
    const product =
      typeof order.product === "string"
        ? order.product
        : order.product?.name ?? order.productName ?? order.itemName ?? "-";
    const quantity = Number(order.qty ?? order.quantity ?? order.productQuantity ?? 1);
    const total = Number(order.total ?? order.totalPrice ?? order.orderTotal ?? 0);
    const shipping = Number(order.shipping ?? order.shippingFee ?? 0);
    const payment = order.paymentMethod ?? order.payment ?? order.payment_type ?? "-";
    const status = String(order.status ?? "pending");

    return (
      <View style={[styles.orderRow, even ? styles.orderRowEven : styles.orderRowOdd]}>
        <ReportCell width={COLUMN_WIDTHS.date}>{formatDate(order.date)}</ReportCell>
        <ReportStrongCell width={COLUMN_WIDTHS.orderId}>#{order.orderId ?? order.id}</ReportStrongCell>
        <ReportCell width={COLUMN_WIDTHS.customer} numberOfLines={1}>{customer}</ReportCell>
        <ReportCell width={COLUMN_WIDTHS.product} numberOfLines={1}>{product}</ReportCell>
        <ReportStrongCell width={COLUMN_WIDTHS.qty} align="center">{quantity}</ReportStrongCell>
        <ReportStatusBadge status={status} />
        <ReportMoneyCell width={COLUMN_WIDTHS.total} amount={total} />
        <ReportStrongCell width={COLUMN_WIDTHS.items} align="center">{order.items ?? order.itemCount ?? 1}</ReportStrongCell>
        <ReportMoneyCell width={COLUMN_WIDTHS.shipping} amount={shipping} />
        <ReportPaymentBadge payment={payment} />
      </View>
    );
  };

  const renderReportSummary = () => {
    const metrics = reportData.metrics ?? ({} as any);

    return (
      <View style={styles.reportSection}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle}>{t("financialOverview")}</Text>
        </View>

        <View style={styles.reportCardGrid}>
          <ReportCard title={t("revenue")} value={`AFN ${Number(metrics.revenue ?? 0).toLocaleString()}`} color="#059669" />
          <ReportCard title={t("shipping")} value={`AFN ${Number(metrics.shipping ?? 0).toLocaleString()}`} />
          <ReportCard title={t("expenses")} value={`AFN ${Number(metrics.expenses ?? 0).toLocaleString()}`} color="#DC2626" />
          <ReportCard title={t("baseCost")} value={`USD ${Number(metrics.baseCostUsd ?? 0).toLocaleString()}`} />
          <ReportCard title={t("estimatedProfit")} value={`AFN ${Number(metrics.estimatedProfit ?? 0).toLocaleString()}`} color="#2563EB" />
          <ReportCard title={t("netProfit")} value={`AFN ${Number(metrics.netProfit ?? 0).toLocaleString()}`} color={Number(metrics.netProfit ?? 0) >= 0 ? "#16A34A" : "#DC2626"} />
          <ReportCard title={t("averageOrder")} value={`AFN ${Number(metrics.averageOrderValue ?? 0).toLocaleString()}`} />
        </View>
      </View>
    );
  };

  const statusBreakdownCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const order of report.orders) {
      const status = String(order.status ?? "pending").toLowerCase();
      counts[status] = (counts[status] ?? 0) + 1;
    }

    return counts;
  }, [report.orders]);

  const renderReportKPIs = () => {
    const metrics = reportData.metrics ?? ({} as any);

    const activeStatuses = [
      "assigned_to_deliverer",
      "shipped",
      "transit",
      "picked_up",
      "out_for_delivery",
      "refund_pickup_in_progress",
    ];

    const activeCount = activeStatuses.reduce(
      (sum, key) => sum + (statusBreakdownCounts[key] ?? 0),
      0,
    );

    return (
      <View style={styles.reportSection}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle}>{t("orderPerformance")}</Text>
        </View>

        <View style={styles.reportCardGrid}>
          <ReportCard title={t("totalOrders")} value={metrics.totalOrders ?? 0} />
          <ReportCard title={t("delivered")} value={metrics.delivered ?? 0} color="#16A34A" />
          <ReportCard title={t("cancelled")} value={metrics.cancelled ?? 0} color="#DC2626" />
          <ReportCard title={t("unitsSold")} value={metrics.unitsSold ?? 0} />
        </View>

        <View style={styles.statusSummaryRow}>
          {[
            [t("delivered"), statusBreakdownCounts.delivered ?? 0, "#16A34A"],
            [t("cancelled"), statusBreakdownCounts.cancelled ?? 0, "#DC2626"],
            [t("refunded"), statusBreakdownCounts.refunded ?? 0, "#2563EB"],
            [t("active"), activeCount, "#F59E0B"],
          ].map(([label, count, color]) => (
            <View key={String(label)} style={styles.statusSummaryBadge}>
              <Text style={[styles.statusSummaryLabel, { color: String(color) }]}>{label}</Text>
              <Text style={styles.statusSummaryValue}>{Number(count).toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const ReportOrdersSection: React.FC<{ orders: any[] }> = ({ orders }) => {
    return (
      <View style={styles.section}>
        <ReportOrdersHeader orderCount={orders.length} />

        {orders.length === 0 ? (
          <ReportOrdersEmptyState />
        ) : (
          <ReportOrdersTable>
            <ReportOrdersTableHeader />
            {orders.map((order, index) => (
              <ReportOrderRow key={order.id ?? index} order={order} index={index} />
            ))}
          </ReportOrdersTable>
        )}
      </View>
    );
  };

  const renderBusinessReport = () => (
    <View style={styles.section}>
      {renderReportKPIs()}
      <ReportOrdersSection orders={reportData.orders ?? []} />
    </View>
  );

  // ... rest of component render continues
const renderProductLedger = () => (
  <View style={styles.section}>
    {/* =========================================================
        HEADER
    ========================================================= */}
    <View style={styles.sectionHeaderRow}>
      <View>
        <Text style={styles.sectionEyebrow}>
          {t("products")}
        </Text>

        <Text style={styles.sectionTitle}>
          {t("productPerformance")}
        </Text>
      </View>

      <View style={styles.tableCountBadge}>
        <Text style={styles.tableCountText}>
          {products.length} {t("products")}
        </Text>
      </View>
    </View>

    {/* =========================================================
        EMPTY STATE
    ========================================================= */}
    {products.length === 0 ? (
      <View style={styles.emptyStateContainer}>
        <Ionicons
          name="cube-outline"
          size={42}
          color="#C5C5C5"
        />

        <Text style={styles.emptyTitle}>
          {t("noProducts")}
        </Text>

        <Text style={styles.emptySubtitle}>
          {t("productAnalyticsAppearHere")}
        </Text>
      </View>
    ) : (
      /* =======================================================
          PRODUCT LIST
      ======================================================= */
   products.map((product: any, index: number) => {
  // ============================================================
  // PRODUCT IDENTITY
  // ============================================================

  const productKey = String(
    product?.productId ??
      product?.id ??
      product?.name ??
      index,
  );

  const expanded =
    expandedId === productKey;

  // ============================================================
  // NORMALIZED PRODUCT NAME
  // ============================================================
  //
  // Must match the normalization used by
  // computeProductAggregates().
  //
  // Example:
  //
  // "Gucci Bag"
  // "gucci bag"
  // " Gucci Bag "
  //
  // All resolve to:
  //
  // "gucci bag"
  // ============================================================

  const normalizedName = String(
    product?.name ?? "",
  )
    .trim()
    .toLowerCase();

  // ============================================================
  // SINGLE SOURCE OF TRUTH
  // ============================================================
  //
  // The Product Ledger does NOT calculate its own revenue.
  //
  // It does NOT use:
  //
  // product.grossRevenue
  // product.revenue
  // product.salesValue
  // product.estimatedProfit
  // product.unitsSold
  // product.quantitySold
  // product.totalOrders
  //
  // Everything comes from productAggMap.
  //
  // orders
  //   ↓
  // computeProductAggregates()
  //   ↓
  // productAggMap
  //   ↓
  // Product Ledger
  //
  // The SummarySection uses the SAME map.
  // ============================================================

  const aggEntry =
    productAggMap.get(
      normalizedName,
    ) ?? null;

  // ============================================================
  // FINANCIAL METRICS
  // ============================================================

  const revenue = Number(
    aggEntry?.revenue ?? 0,
  );

  const costAfn = Number(
    aggEntry?.cost ?? 0,
  );

  const costUsd = Number(
    aggEntry?.baseCostUsd ?? 0,
  );

  // ============================================================
  // OPERATIONAL METRICS
  // ============================================================

  const unitsSold = Number(
    aggEntry?.unitsSold ?? 0,
  );

  const ordersCount = Number(
    aggEntry?.ordersCount ?? 0,
  );

  // ============================================================
  // PROFIT
  // ============================================================
  //
  // IMPORTANT:
  //
  // This is the EXACT same calculation used by SummarySection.
  //
  // Revenue - Product Cost = Gross Profit
  // ============================================================

  const profit =
    revenue -
    costAfn;

  const isProfitPositive =
    profit >= 0;

  // ============================================================
  // EXCHANGE RATE
  // ============================================================

  const exchangeRate = Number(
    settings?.usdToAfnRate ??
      settings?.usd_to_afn_rate ??
      65,
  );

  // ============================================================
  // CATALOG FALLBACK
  // ============================================================
  //
  // This is ONLY used for displaying a unit cost when the
  // aggregate contains no cost information.
  //
  // It NEVER affects revenue, total cost, or profit.
  // ============================================================

  const catalogUnitPriceUsd =
    Number(
      product?.usdPrice ?? 0,
    );

  // ============================================================
  // UNIT COST
  // ============================================================

  const unitCostUsd =
    unitsSold > 0 &&
    costUsd > 0
      ? costUsd /
        unitsSold
      : catalogUnitPriceUsd;

  const unitCostAfn =
    unitsSold > 0 &&
    costAfn > 0
      ? costAfn /
        unitsSold
      : unitCostUsd *
        exchangeRate;

  // ============================================================
  // SAFE FORMATTERS
  // ============================================================

  const formatAFN = (
    value: number,
  ) => {
    const safeValue =
      Number.isFinite(value)
        ? value
        : 0;

    return `AFN ${Math.round(
      safeValue,
    ).toLocaleString()}`;
  };

  const formatUSD = (
    value: number,
  ) => {
    const safeValue =
      Number.isFinite(value)
        ? value
        : 0;

    return `USD ${safeValue.toLocaleString(
      undefined,
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
    )}`;
  };

  // ============================================================
  // RENDER PRODUCT CARD
  // ============================================================

  return (
    <View
      key={productKey}
      style={styles.productCard}
    >
      {/* ========================================================
          PRODUCT HEADER
      ======================================================== */}

      <TouchableOpacity
        style={
          styles.productHeader
        }
        activeOpacity={0.85}
        onPress={() =>
          setExpandedId(
            expanded
              ? null
              : productKey,
          )
        }
      >
        {/* PRODUCT IMAGE */}

        {product?.imageUrl ? (
          <Image
            source={{
              uri:
                product.imageUrl,
            }}
            style={
              styles.productThumb
            }
          />
        ) : (
          <View
            style={
              styles.productThumbFallback
            }
          >
            <Ionicons
              name="cube-outline"
              size={22}
              color="#888"
            />
          </View>
        )}

        {/* PRODUCT INFORMATION */}

        <View
          style={
            styles.productInfo
          }
        >
          <Text
            style={
              styles.productName
            }
            numberOfLines={1}
          >
            {product?.name ??
              "-"}
          </Text>

          <Text
            style={
              styles.productSubtitle
            }
          >
            {unitsSold.toLocaleString()}{" "}
            {t("unitsSold")} •{" "}
            {ordersCount.toLocaleString()}{" "}
            {t("orders")}
          </Text>
        </View>

        {/* PRODUCT REVENUE */}

        <View
          style={
            styles.productRevenueBox
          }
        >
          <Text
            style={
              styles.productRevenue
            }
          >
            {formatAFN(
              revenue,
            )}
          </Text>

          <Text
            style={
              styles.productRevenueLabel
            }
          >
            {t("revenue")}
          </Text>
        </View>

        {/* EXPAND ICON */}

        <Ionicons
          name={
            expanded
              ? "chevron-up"
              : "chevron-down"
          }
          size={20}
          color="#666"
        />
      </TouchableOpacity>

      {/* ========================================================
          EXPANDED PRODUCT DETAILS
      ======================================================== */}

      {expanded && (
        <View
          style={
            styles.tableExpand
          }
        >
          <View
            style={
              styles.expandGrid
            }
          >
            {/* PRODUCT */}

            <View
              style={
                styles.expandItem
              }
            >
              <Text
                style={
                  styles.expandLabel
                }
              >
                {t("product")}
              </Text>

              <Text
                style={
                  styles.expandValue
                }
              >
                {product?.name ??
                  "-"}
              </Text>
            </View>

            {/* UNITS SOLD */}

            <View
              style={
                styles.expandItem
              }
            >
              <Text
                style={
                  styles.expandLabel
                }
              >
                {t("unitsSold")}
              </Text>

              <Text
                style={
                  styles.expandValue
                }
              >
                {unitsSold.toLocaleString()}
              </Text>
            </View>

            {/* REVENUE */}

            <View
              style={
                styles.expandItem
              }
            >
              <Text
                style={
                  styles.expandLabel
                }
              >
                {t("revenue")}
              </Text>

              <Text
                style={
                  styles.expandValue
                }
              >
                {formatAFN(
                  revenue,
                )}
              </Text>
            </View>

            {/* PROFIT / LOSS */}

            <View
              style={
                styles.expandItem
              }
            >
              <Text
                style={
                  styles.expandLabel
                }
              >
                {t("profitLoss")}
              </Text>

              <Text
                style={[
                  styles.expandValue,
                  {
                    color:
                      isProfitPositive
                        ? "#22C55E"
                        : "#EF4444",
                  },
                ]}
              >
                {isProfitPositive
                  ? t("profit")
                  : t("loss")}{" "}
                •{" "}
                {formatAFN(
                  Math.abs(
                    profit,
                  ),
                )}
              </Text>
            </View>

            {/* ORDERS */}

            <View
              style={
                styles.expandItem
              }
            >
              <Text
                style={
                  styles.expandLabel
                }
              >
                {t("orders")}
              </Text>

              <Text
                style={
                  styles.expandValue
                }
              >
                {ordersCount.toLocaleString()}
              </Text>
            </View>

            {/* UNIT COST USD */}

            <View
              style={
                styles.expandItem
              }
            >
              <Text
                style={
                  styles.expandLabel
                }
              >
                {t("unitCost")}
              </Text>

              <Text
                style={
                  styles.expandValue
                }
              >
                {formatUSD(
                  unitCostUsd,
                )}
              </Text>
            </View>

            {/* UNIT COST AFN */}

            <View
              style={
                styles.expandItem
              }
            >
              <Text
                style={
                  styles.expandLabel
                }
              >
                {t("unitCost")} AFN
              </Text>

              <Text
                style={
                  styles.expandValue
                }
              >
                {formatAFN(
                  unitCostAfn,
                )}
              </Text>
            </View>

            {/* TOTAL BASE COST USD */}

            <View
              style={
                styles.expandItem
              }
            >
              <Text
                style={
                  styles.expandLabel
                }
              >
                {t("baseCost")}
              </Text>

              <Text
                style={
                  styles.expandValue
                }
              >
                {formatUSD(
                  costUsd,
                )}
              </Text>
            </View>

            {/* TOTAL BASE COST AFN */}

            {/* TOTAL BASE COST AFN */}

            <View
              style={
                styles.expandItem
              }
            >
              <Text
                style={
                  styles.expandLabel
                }
              >
                {t("baseCost")} AFN
              </Text>

              <Text
                style={
                  styles.expandValue
                }
              >
                {formatAFN(
                  costAfn,
                )}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
})
    )}
  </View>
);
          

  const hasLoaded = dashboard !== null && products !== null && charts !== null;

  if (loading && !hasLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />

        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerEyebrow}>{t("businessAnalytics")}</Text>

          <Text style={styles.headerTitle}>
            {selectedDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </Text>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={async () => {
              const next =
                locale === "en" ? "fa" : locale === "fa" ? "ps" : "en";

              await setLanguage(next);
            }}
          >
            <Text style={styles.languageText}>
              {locale === "en" ? "EN" : locale === "fa" ? "دری" : "پښتو"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.headerSubtitle}>
            {t("monthlyRevenue")} • {t("orders")} • {t("products")} •{" "}
            {t("expenses")}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={openPicker}
          >
            <Ionicons name="calendar-outline" size={18} color="#111" />

            <Text style={styles.calendarButtonText}>{t("change")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setExpenseModal(true)}
          >
            <Ionicons name="add-outline" size={16} color="#FFF" />

            <Text style={styles.primaryButtonText}>{t("expense")}</Text>
          </TouchableOpacity>
        </View>
      </View>

    </>
  );
const SummarySection = () => {
  // ============================================================
  // FINANCIAL SOURCE OF TRUTH
  // ============================================================
  //
  // ALL product financial data comes from productAggMap.
  //
  // productAggMap is generated from the centralized order
  // aggregation logic and is shared with the Product Ledger.
  //
  // Therefore:
  //
  // Product Ledger Revenue
  //        =
  // Summary Revenue
  //
  // Product Ledger Cost
  //        =
  // Summary Product Cost
  //
  // Product Ledger Profit
  //        =
  // Summary Gross Profit
  //
  // This prevents different parts of the screen from calculating
  // revenue using different sources.
  // ============================================================

  const orders = Array.isArray(report?.orders)
    ? report.orders
    : [];

  const expensesList = Array.isArray(report?.expenses)
    ? report.expenses
    : [];

  // ============================================================
  // PRODUCT FINANCIAL TOTALS
  // ============================================================

  let grossRevenue = 0;
  let totalCostUsd = 0;
  let totalCostAfn = 0;
  let totalUnitsSold = 0;

  for (const [, entry] of productAggMap.entries()) {
    grossRevenue += Number(
      entry?.revenue ?? 0,
    );

    totalCostUsd += Number(
      entry?.baseCostUsd ?? 0,
    );

    totalCostAfn += Number(
      entry?.cost ?? 0,
    );

    totalUnitsSold += Number(
      entry?.unitsSold ?? 0,
    );
  }

  // ============================================================
  // EXPENSES
  // ============================================================
  //
  // Expenses are separate from product cost.
  //
  // Product Cost:
  //   Cost of goods sold
  //
  // Expenses:
  //   Business operating expenses
  //
  // Net Profit:
  //   Revenue - Product Cost - Expenses
  // ============================================================

  const expenses = expensesList.reduce(
    (sum: number, expense: any) => {
      const amount = Number(
        expense?.amount ?? 0,
      );

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return sum;
      }

      return sum + amount;
    },
    0,
  );

  // ============================================================
  // PROFIT CALCULATIONS
  // ============================================================

  // Revenue after subtracting product cost.
  const grossProfit =
    grossRevenue -
    totalCostAfn;

  // Final profit after operating expenses.
  const netProfit =
    grossProfit -
    expenses;

  // ============================================================
  // ORDER STATISTICS
  // ============================================================

  const totalOrders =
    orders.length;

  const deliveredOrders =
    orders.filter(
      (order: any) => {
        const status = String(
          order?.status ?? "",
        )
          .trim()
          .toLowerCase();

        return (
          status === "delivered" ||
          status === "completed"
        );
      },
    ).length;

  const activeOrders =
    orders.filter(
      (order: any) => {
        const status = String(
          order?.status ?? "",
        )
          .trim()
          .toLowerCase();

        return (
          status !== "delivered" &&
          status !== "completed" &&
          status !== "cancelled" &&
          status !== "canceled" &&
          status !== "refunded"
        );
      },
    ).length;

  // ============================================================
  // SAFE FORMATTERS
  // ============================================================

  const formatAFN = (
    value: number,
  ) => {
    const safeValue =
      Number.isFinite(value)
        ? value
        : 0;

    return `AFN ${Math.round(
      safeValue,
    ).toLocaleString()}`;
  };

  const formatUSD = (
    value: number,
  ) => {
    const safeValue =
      Number.isFinite(value)
        ? value
        : 0;

    return `USD ${safeValue.toLocaleString(
      undefined,
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
    )}`;
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <View style={styles.summaryCard}>
      {/* ========================================================
          HEADER / NET PROFIT
      ======================================================== */}

      <Text
        style={styles.summaryEyebrow}
      >
        {t("monthlyPerformance")}
      </Text>

      <Text
        style={styles.netProfitValue}
      >
        {formatAFN(netProfit)}
      </Text>

      <Text
        style={styles.netProfitLabel}
      >
        {t("netProfit")}
      </Text>

      <View
        style={styles.summaryDivider}
      />

      {/* ========================================================
          PRIMARY FINANCIAL METRICS
      ======================================================== */}

      <View
        style={[
          styles.summaryGrid,
          {
            marginTop: 10,
          },
        ]}
      >
        {/* Revenue */}

        <View
          style={styles.summaryItem}
        >
          <Text
            style={
              styles.summaryItemLabel
            }
          >
            {t("revenue")}
          </Text>

          <Text
            style={
              styles.summaryItemValue
            }
          >
            {formatAFN(
              grossRevenue,
            )}
          </Text>
        </View>

        {/* Gross Profit */}

        <View
          style={styles.summaryItem}
        >
          <Text
            style={
              styles.summaryItemLabel
            }
          >
            {t("profit")}
          </Text>

          <Text
            style={[
              styles.summaryItemValue,
              {
                color:
                  grossProfit >= 0
                    ? "#22C55E"
                    : "#EF4444",
              },
            ]}
          >
            {formatAFN(
              grossProfit,
            )}
          </Text>
        </View>
      </View>

      {/* ========================================================
          SECONDARY FINANCIAL METRICS
      ======================================================== */}

      <View
        style={styles.summaryGrid}
      >
        {/* Product Cost */}

        <View
          style={styles.summaryItem}
        >
          <Text
            style={
              styles.summaryItemLabel
            }
          >
            {t("baseCost")}
          </Text>

          <Text
            style={
              styles.summaryItemValue
            }
          >
            {formatUSD(
              totalCostUsd,
            )}
          </Text>
        </View>

        {/* Expenses */}

        <View
          style={styles.summaryItem}
        >
          <Text
            style={
              styles.summaryItemLabel
            }
          >
            {t("expenses")}
          </Text>

          <Text
            style={[
              styles.summaryItemValue,
              {
                color:
                  expenses > 0
                    ? "#EF4444"
                    : "#22C55E",
              },
            ]}
          >
            {formatAFN(
              expenses,
            )}
          </Text>
        </View>

        {/* Units Sold */}

        <View
          style={styles.summaryItem}
        >
          <Text
            style={
              styles.summaryItemLabel
            }
          >
            {t("unitsSold")}
          </Text>

          <Text
            style={
              styles.summaryItemValue
            }
          >
            {Math.round(
              totalUnitsSold,
            ).toLocaleString()}
          </Text>
        </View>

        {/* Net Profit */}

        <View
          style={styles.summaryItem}
        >
          <Text
            style={
              styles.summaryItemLabel
            }
          >
            {t("netProfit")}
          </Text>

          <Text
            style={[
              styles.summaryItemValue,
              {
                color:
                  netProfit >= 0
                    ? "#22C55E"
                    : "#EF4444",
              },
            ]}
          >
            {formatAFN(
              netProfit,
            )}
          </Text>
        </View>
      </View>

      {/* ========================================================
          ORDER STATISTICS
      ======================================================== */}

      <View
        style={styles.badgeRow}
      >
        {/* Total Orders */}

        <View
          style={styles.badge}
        >
          <Text
            style={
              styles.badgeValue
            }
          >
            {totalOrders}
          </Text>

          <Text
            style={
              styles.badgeLabel
            }
          >
            {t("orders")}
          </Text>
        </View>

        {/* Active Orders */}

        <View
          style={styles.badge}
        >
          <Text
            style={
              styles.badgeValue
            }
          >
            {activeOrders}
          </Text>

          <Text
            style={
              styles.badgeLabel
            }
          >
            {t("active")}
          </Text>
        </View>

        {/* Delivered Orders */}

        <View
          style={styles.badge}
        >
          <Text
            style={
              styles.badgeValue
            }
          >
            {deliveredOrders}
          </Text>

          <Text
            style={
              styles.badgeLabel
            }
          >
            {t("delivered")}
          </Text>
        </View>
      </View>
    </View>
  );
};

  const renderDatabaseView = () => (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionEyebrow}>{t("database")}</Text>

          <Text style={styles.sectionTitle}>{t("orderLedger")}</Text>
        </View>

        <View style={styles.sectionHeaderActions}>
          <TouchableOpacity
            style={styles.tableToggleButton}
            onPress={() => setDatabaseModalVisible(true)}
          >
            <Text style={styles.tableToggleText}>{t("fullView")}</Text>
          </TouchableOpacity>

          <View style={styles.tableCountBadge}>
            <Text style={styles.tableCountText}>
              {databaseRows.length} {t("ordersUpper")}
            </Text>
          </View>
        </View>
      </View>

      {databaseRows.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="server-outline" size={42} color="#C5C5C5" />

          <Text style={styles.emptyTitle}>{t("noOrdersFound")}</Text>

          <Text style={styles.emptySubtitle}>{t("noOrdersRecorded")}</Text>
        </View>
      ) : (
        <View
          style={
            databaseViewMode === "fullscreen"
              ? styles.databaseShellFullscreen
              : styles.databaseShell
          }
        >
         <ScrollView horizontal showsHorizontalScrollIndicator={false}>
  <View style={[styles.table, { minWidth: TOTAL_TABLE_WIDTH }]}>
    {/* Header */}
    <View style={styles.tableHeader}>
                {TABLE_COLUMNS.map((column) => (
                  <Text
                    key={column.key}
                    style={[styles.tableHeaderCell, { width: column.width }]}
                  >
                    {t(column.key)}
                  </Text>
                ))}
              </View>

              {/* Rows */}
              {databaseRows.map((row, index) => {
                const id = String(row.id ?? row.orderId ?? `row-${index}`);

                const expanded = expandedRows.includes(id);

                const status = STATUS_CONFIG[row.status] ?? {
                  color: "#666",
                  bg: "#EFEFEF",
                };

                return (
                  <View key={id} style={styles.tableRowWrapper}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => toggleRow(id)}
                      style={[
                        styles.tableRow,
                        styles.tableRowEnhanced,
                        expanded && styles.tableRowActive,
                        index % 2 === 0 ? styles.rowEven : styles.rowOdd,
                      ]}
                    >
                      {/* DATE */}
                      <Text
                        style={[styles.cell, { width: COLUMN_WIDTHS.date }]}
                      >
                        {formatDate(row.date)}
                      </Text>

                      {/* ORDER */}
                      <View
                        style={{
                          width: COLUMN_WIDTHS.orderId,
                          paddingHorizontal: 10,
                        }}
                      >
                        <Text style={styles.cellStrong}>#{row.orderId}</Text>

                        <Text style={styles.smallGrey}>
                          {row.items?.length ?? 1} {t("items")}
                        </Text>
                      </View>

                      {/* CUSTOMER */}
                      <View
                        style={{
                          width: COLUMN_WIDTHS.customer,
                          paddingHorizontal: 10,
                        }}
                      >
                        <Text style={styles.cellStrong} numberOfLines={1}>
                          {row.customer}
                        </Text>

                        <Text style={styles.smallGrey} numberOfLines={1}>
                          {row.phone}
                        </Text>
                      </View>

                      {row.productImage ? (
                        <Image
                          source={{ uri: row.productImage }}
                          style={styles.productThumb}
                        />
                      ) : (
                        <View style={styles.productThumbFallback}>
                          <Ionicons
                            name="cube-outline"
                            size={18}
                            color="#666"
                          />
                        </View>
                      )}

                      {/* PRODUCT */}
                      <View
                        style={{
                          width: COLUMN_WIDTHS.product,
                          paddingHorizontal: 10,
                        }}
                      >
                        <Text style={styles.cell} numberOfLines={1}>
                          {row.product}
                        </Text>

                        {row.items?.length > 1 && (
                          <Text style={styles.smallGrey}>
                            +{row.items.length - 1} {t("moreItems")}
                          </Text>
                        )}
                      </View>

                      {/* QTY */}
                      <Text
                        style={[
                          styles.cellStrong,
                          {
                            width: COLUMN_WIDTHS.qty,
                            textAlign: "center",
                          },
                        ]}
                      >
                        {row.qty}
                      </Text>

                      {/* STATUS */}
                      <View
                        style={{
                          width: COLUMN_WIDTHS.status,
                          alignItems: "center",
                        }}
                      >
                        <View
                          style={[
                            styles.statusBadgeBase,
                            {
                              backgroundColor: status.bg,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              {
                                color: status.color,
                              },
                            ]}
                          >
                            {t(row.status)}
                          </Text>
                        </View>
                      </View>

                      {/* SHIPPING */}
                      <Text
                        style={[
                          styles.cell,
                          {
                            width: COLUMN_WIDTHS.shipping,
                            textAlign: "right",
                          },
                        ]}
                      >
                        AFN {Number(row.shipping).toLocaleString()}
                      </Text>

                      {/* TOTAL */}
                      <View
                        style={{
                          width: COLUMN_WIDTHS.total,
                          alignItems: "flex-end",
                          paddingHorizontal: 10,
                          flexDirection: "row",
                          justifyContent: "flex-end",
                          gap: 8,
                        }}
                      >
                        <Text style={styles.cellPrice}>
                          AFN {Number(row.total).toLocaleString()}
                        </Text>

                        <Ionicons
                          name={expanded ? "chevron-up" : "chevron-down"}
                          size={18}
                          color="#777"
                        />
                      </View>
                    </TouchableOpacity>

                    {expanded && (
                      <View style={styles.tableExpandPremium}>
                        {/* HEADER */}
                        <View style={styles.expandHeader}>
                          <Text style={styles.expandTitle}>
                            {t("orderStory")}
                          </Text>

                          <Text style={styles.expandSubtitle}>
                            {t("fullTransactionBreakdown")}
                          </Text>
                        </View>

                        {/* GRID */}
                        <View style={styles.expandGridPremium}>
                          <View style={styles.expandCard}>
                            <Text style={styles.expandCardTitle}>
                              {t("customer")}
                            </Text>

                            <Text style={styles.expandMainText}>
                              {row.customer}
                            </Text>

                            <Text style={styles.expandMetaText}>
                              {row.phone}
                            </Text>

                            <Text style={styles.expandMetaText}>
                              {t("order")} #{row.orderId}
                            </Text>

                            <Text style={styles.expandMetaText}>
                              {formatDate(row.date)}
                            </Text>
                          </View>

                          <View style={styles.expandCard}>
                            <Text style={styles.expandCardTitle}>
                              {t("financial")}
                            </Text>

                            <View style={styles.expandRow}>
                              <Text style={styles.expandLabel}>
                                {t("shipping")}
                              </Text>

                              <Text style={styles.expandValue}>
                                AFN {Number(row.shipping).toLocaleString()}
                              </Text>
                            </View>

                            <View style={styles.expandRow}>
                              <Text style={styles.expandLabel}>
                                {t("total")}
                              </Text>

                              <Text style={styles.expandValueStrong}>
                                AFN {Number(row.total).toLocaleString()}
                              </Text>
                            </View>

                            <View style={styles.expandRow}>
                              <Text style={styles.expandLabel}>
                                {t("items")}
                              </Text>

                              <Text style={styles.expandValue}>
                                {row.items?.length ?? 1}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* PRODUCTS */}
                        <View style={styles.expandProductSection}>
                          <Text style={styles.expandCardTitle}>
                            {t("products")}
                          </Text>

                          {row.items?.length ? (
                            row.items.map((item: any, i: number) => (
                              <View
                                key={i}
                                style={styles.productStoryRowPremium}
                              >
                                {row.productImage ? (
                                  <Image
                                    source={{ uri: row.productImage }}
                                    style={styles.productThumb}
                                  />
                                ) : (
                                  <View style={styles.productThumbFallback}>
                                    <Ionicons
                                      name="cube-outline"
                                      size={18}
                                      color="#666"
                                    />
                                  </View>
                                )}

                                <View style={{ flex: 1 }}>
                                  <Text style={styles.productStoryName}>
                                    {item.name}
                                  </Text>

                                  <Text style={styles.productStoryMeta}>
                                    {t("qty")} {item.qty}
                                    {item.selectedSize
                                      ? ` • ${t("size")} ${item.selectedSize}`
                                      : ""}
                                    {item.selectedColor
                                      ? ` • ${item.selectedColor}`
                                      : ""}
                                  </Text>
                                </View>

                                <Text style={styles.productStoryPrice}>
                                  AFN {Number(item.total ?? 0).toLocaleString()}
                                </Text>
                              </View>
                            ))
                          ) : (
                            <View style={styles.productStoryRowPremium}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.productStoryName}>
                                  {row.product}
                                </Text>

                                <Text style={styles.productStoryMeta}>
                                  {t("qty")} {row.qty}
                                </Text>
                              </View>

                              <Text style={styles.productStoryPrice}>
                                AFN {Number(row.total).toLocaleString()}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* FOOTER */}
                        <View style={styles.expandFooter}>
                          <View
                            style={[
                              styles.statusBadgeBase,
                              {
                                backgroundColor: status.bg,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                {
                                  color: status.color,
                                },
                              ]}
                            >
                              {t(row.status)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );

  if (authState === "logged_out") {
    return renderLogin();
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(selectedDate, true)}
          />
        }
      >
        <SummarySection />
     {renderReportSelector()}
        {renderAnalyticsTabs()}

        {activeTab === "statement" && renderBusinessReport()}
        {activeTab === "database" && renderDatabaseView()}
        {activeTab === "products" && renderProductLedger()}
        {activeTab === "expenses" && renderExpenses()}
      </ScrollView>

      {/* =========================
          EXPENSE MODAL
    ========================== */}

      <Modal visible={expenseModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalEyebrow}>{t("finance")}</Text>

                <Text style={styles.modalTitle}>{t("addExpense")}</Text>
              </View>

              <TouchableOpacity
                onPress={() => setExpenseModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={18} color="#111" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>{t("description")}</Text>

            <TextInput
              placeholder={t("expensePlaceholder")}
              placeholderTextColor="#8A8A8A"
              value={expenseDescription}
              onChangeText={setExpenseDescription}
              style={styles.modalInput}
            />

            <Text style={styles.modalLabel}>{t("amount")}</Text>

            <TextInput
              placeholder="0"
              placeholderTextColor="#8A8A8A"
              keyboardType="numeric"
              value={expenseAmount}
              onChangeText={setExpenseAmount}
              style={styles.modalInput}
            />

            <View style={styles.modalDateButton}>
              <Ionicons name="calendar-outline" size={16} color="#111" />

              <Text style={styles.modalDateButtonText}>
                {expenseDate ? expenseDate.toDateString() : t("pickDate")}
              </Text>
            </View>

            <TouchableOpacity
              onPress={addExpense}
              style={styles.modalSaveButton}
            >
              <Text style={styles.modalSaveButtonText}>{t("saveExpense")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* =========================
        DATABASE FULL VIEW
    ========================== */}

      <Modal visible={databaseModalVisible} animationType="slide">
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: "#F7F7F8",
          }}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("orderLedgerFullView")}</Text>

            <TouchableOpacity
              onPress={() => setDatabaseModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={20} color="#111" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              padding: 14,
              paddingBottom: 60,
            }}
          >
            {databaseRows.map((row, index) => {
              const id = String(row.id ?? row.orderId ?? index);

              const status = STATUS_CONFIG[row.status] ?? {
                color: "#666",
                bg: "#EEE",
              };

              return (
                <View key={id} style={styles.orderCard}>
                  {/* TOP */}

                  <View style={styles.orderTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderIdText}>#{row.orderId}</Text>

                      <Text style={styles.orderMetaText}>
                        {formatDate(row.date)} • {row.customer}
                      </Text>

                      <Text style={styles.orderMetaText}>{row.phone}</Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadgeBase,
                        {
                          backgroundColor: status.bg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: status.color,
                          },
                        ]}
                      >
                        {row.status?.replaceAll("_", " ").toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* PRODUCTS */}

                  <View style={styles.orderSection}>
                    <Text style={styles.sectionLabel}>{t("products")}</Text>

                    {row.items?.length ? (
                      row.items.map((item: any, i: number) => (
                        <View key={i} style={styles.productRow}>
                          {row.productImage ? (
                            <Image
                              source={{
                                uri: row.productImage,
                              }}
                              style={styles.productThumb}
                            />
                          ) : (
                            <View style={styles.productThumbFallback}>
                              <Ionicons
                                name="cube-outline"
                                size={18}
                                color="#666"
                              />
                            </View>
                          )}

                          <View
                            style={{
                              flex: 1,
                              marginLeft: 12,
                            }}
                          >
                            <Text style={styles.productName} numberOfLines={1}>
                              {item.name || row.product}
                            </Text>

                            <Text style={styles.productMeta}>
                              {t("qty")} {item.quantity ?? item.qty ?? 1}
                            </Text>
                          </View>

                          <Text style={styles.productPrice}>
                            AFN{" "}
                            {Number(
                              item.total ?? item.price ?? 0,
                            ).toLocaleString()}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.productRow}>
                        <View style={styles.productThumbFallback}>
                          <Ionicons
                            name="cube-outline"
                            size={18}
                            color="#666"
                          />
                        </View>

                        <View
                          style={{
                            flex: 1,
                            marginLeft: 12,
                          }}
                        >
                          <Text style={styles.productName}>{row.product}</Text>

                          <Text style={styles.productMeta}>
                            {t("qty")} {row.qty}
                          </Text>
                        </View>

                        <Text style={styles.productPrice}>
                          AFN {Number(row.total).toLocaleString()}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* FOOTER */}

                  <View style={styles.orderFooter}>
                    <View>
                      <Text style={styles.footerLabel}>{t("shipping")}</Text>

                      <Text style={styles.footerValue}>
                        AFN {Number(row.shipping).toLocaleString()}
                      </Text>
                    </View>

                    <View>
                      <Text style={styles.footerLabel}>{t("total")}</Text>

                      <Text style={styles.footerTotal}>
                        AFN {Number(row.total).toLocaleString()}
                      </Text>
                    </View>

                    <View>
                      <Text style={styles.footerLabel}>{t("items")}</Text>

                      <Text style={styles.footerValue}>
                        {row.items?.length ?? 1}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const S = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const R = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  full: 999,
};
