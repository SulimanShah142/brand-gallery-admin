// AnalyticsStyles.ts
import { StyleSheet } from "react-native";


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

/* Design tokens */
export const Tokens = {
  colors: {
    bg: "#FAFAFA",
    cardBg: "#FFFFFF",
    text: "#0F172A",
    muted: "#6B7280",
    accent: "#111111",
    positive: "#16A34A",
    negative: "#DC2626",
    primary: "#2563EB",
    subtleBorder: "#ECECEC",
    softBorder: "#F3F3F3",
    rowAlt: "#FBFBFB",
    surfaceElevated: "#F8FAFC",
  },
  space: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 18,
    round: 999,
  },
  fonts: {
    size: {
      xs: 11,
      sm: 12,
      base: 13,
      lg: 16,
      xl: 20,
    },
    weight: {
      normal: "600" as any,
      bold: "800" as any,
      heavy: "900" as any,
    },
  },
  shadows: {
    soft: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 3,
    },
    card: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
      elevation: 6,
    },
  },
  table: {
    minWidth: 1100,
    rowHeight: 60,
  },
};

/**
 * createStyles(isRTL)
 * Usage:
 *   import createStyles from './AnalyticsStyles';
 *   const styles = createStyles(isRTL); // pass boolean from your i18n hook
 */
export default function createStyles(isRTL: boolean = false): any {

  return StyleSheet.create({
    /* BASE / LAYOUT */
    container: {
      flex: 1,
      backgroundColor: Tokens.colors.bg,
      paddingBottom: Tokens.space.xl,
      paddingHorizontal: Tokens.space.lg,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: Tokens.colors.bg,
    },
    centerEmptyState: {
      paddingVertical: 30,
      justifyContent: "center",
      alignItems: "center",
    },

    /* CARDS / SURFACES */
    card: {
      backgroundColor: Tokens.colors.cardBg,
      borderRadius: Tokens.radii.lg,
      padding: Tokens.space.lg,
      ...Tokens.shadows.soft,
    },
    cardElevated: {
      backgroundColor: Tokens.colors.cardBg,
      borderRadius: Tokens.radii.lg,
      padding: Tokens.space.lg,
      ...Tokens.shadows.card,
    },

    /* TABLE / LIST */
    table: {
      minWidth: Tokens.table.minWidth,
      backgroundColor: Tokens.colors.cardBg,
      borderRadius: Tokens.radii.lg,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: Tokens.colors.subtleBorder,
    },

    databaseShell: {
      marginTop: Tokens.space.md,
      borderRadius: Tokens.radii.lg,
      overflow: "hidden",
    },

    databaseShellFullscreen: {
      marginTop: Tokens.space.md,
      borderRadius: Tokens.radii.lg,
      overflow: "hidden",
      minHeight: 420,
      width: "100%",
      backgroundColor: Tokens.colors.cardBg,
      borderWidth: 1,
      borderColor: Tokens.colors.subtleBorder,
    },

    tableHeader: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Tokens.colors.accent,
      paddingVertical: 14,
      paddingHorizontal: 6,
    },

    tableHeaderCell: {
      color: "#FFF",
      fontWeight: Tokens.fonts.weight.heavy,
      fontSize: Tokens.fonts.size.xs,
      letterSpacing: 1,
      paddingHorizontal: 12,
      flexShrink: 1,
      textAlign: isRTL ? "right" : "left",
    },

    tableRowWrapper: {
      width: "100%",
    },

  // ensure rows do not wrap horizontally

// small enhancements and missing style names used by UI
tableRowEnhanced: {
  paddingVertical: 12,
  paddingHorizontal: 8,
},

tableRowActive: {
  // subtle highlight when row expanded
  backgroundColor: Tokens.colors.rowAlt,
},

// product thumbnail used in the database rows



// header for table within report (if missing)


    rowEven: {
      backgroundColor: Tokens.colors.cardBg,
    },

    rowOdd: {
      backgroundColor: Tokens.colors.rowAlt,
    },

    cell: {
      paddingHorizontal: Tokens.space.md,
      fontSize: Tokens.fonts.size.base,
      color: Tokens.colors.muted,
      flexShrink: 1,
      textAlign: isRTL ? "right" : "left",
    },

    cellStrong: {
      paddingHorizontal: Tokens.space.md,
      fontSize: Tokens.fonts.size.base,
      fontWeight: Tokens.fonts.weight.bold,
      color: Tokens.colors.text,
      flexShrink: 1,
      textAlign: isRTL ? "right" : "left",
    },

    cellPrice: {
      paddingHorizontal: Tokens.space.md,
      fontSize: Tokens.fonts.size.base,
      fontWeight: Tokens.fonts.weight.heavy,
      color: Tokens.colors.text,
      flexShrink: 1,
      textAlign: "right",
    },

    tableProductImage: {
      width: 40,
      height: 40,
      borderRadius: Tokens.radii.sm,
      backgroundColor: Tokens.colors.surfaceElevated,
    },

    tableProductFallback: {
      width: 40,
      height: 40,
      borderRadius: Tokens.radii.sm,
      backgroundColor: Tokens.colors.surfaceElevated,
      justifyContent: "center",
      alignItems: "center",
    },

    /* REPORT / CELL SYSTEM */
   // in AnalyticsStyles -> createStyles(...) inside StyleSheet.create({...})



// ensure rows never wrap

    reportCellText: {
      fontSize: Tokens.fonts.size.base,
      color: Tokens.colors.muted,
      fontWeight: Tokens.fonts.weight.normal,
      textAlign: isRTL ? "right" : "left",
    },

    reportStrongCellText: {
      fontSize: Tokens.fonts.size.base,
      color: Tokens.colors.text,
      fontWeight: Tokens.fonts.weight.bold,
      textAlign: isRTL ? "right" : "left",
    },

    reportMoneyCellText: {
      fontSize: Tokens.fonts.size.base,
      color: Tokens.colors.positive,
      fontWeight: Tokens.fonts.weight.bold,
      textAlign: "right",
    },

    reportTableCard: {
      backgroundColor: Tokens.colors.cardBg,
      borderRadius: Tokens.radii.lg,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: Tokens.colors.subtleBorder,
      marginTop: Tokens.space.md,
      ...Tokens.shadows.card,
    },

    reportTableScroll: {
      flexGrow: 1,
    },

    

    /* HEADER / SECTION */
    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Tokens.space.md,
    },

    sectionHeaderActions: {
      flexDirection: "row",
      alignItems: "center",
    },

    tableToggleButton: {
      backgroundColor: Tokens.colors.surfaceElevated,
      borderRadius: Tokens.radii.round,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },

    tableToggleText: {
      color: Tokens.colors.accent,
      fontSize: Tokens.fonts.size.xs,
      fontWeight: Tokens.fonts.weight.bold,
    },

    sectionEyebrow: {
      fontSize: Tokens.fonts.size.xs,
      color: Tokens.colors.muted,
      fontWeight: Tokens.fonts.weight.bold,
      letterSpacing: 1,
    },

    tableCountBadge: {
      backgroundColor: Tokens.colors.accent,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },

    tableCountText: {
      color: "#FFF",
      fontWeight: Tokens.fonts.weight.bold,
      fontSize: Tokens.fonts.size.xs,
    },

    expandGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },

    expandItem: {
      width: "50%",
      marginBottom: Tokens.space.lg,
    },

    expandLabel: {
      fontSize: Tokens.fonts.size.xs,
      color: Tokens.colors.muted,
      fontWeight: Tokens.fonts.weight.bold,
      textTransform: "uppercase",
    },

    expandValue: {
      marginTop: 6,
      fontSize: Tokens.fonts.size.base,
      color: Tokens.colors.text,
      fontWeight: Tokens.fonts.weight.normal,
    },

    productValueContainer: {
      minWidth: 90,
      alignItems: isRTL ? "flex-start" : "flex-end",
    },

    /* STATUS / BADGES */
    statusBadgeBase: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },

    statusText: {
      fontSize: 10,
      fontWeight: Tokens.fonts.weight.heavy,
      color: Tokens.colors.text,
    },

    analyticsTabs: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: Tokens.radii.md,
      backgroundColor: Tokens.colors.surfaceElevated,
      marginRight: Tokens.space.sm,
    },

    analyticsTabActive: {
      backgroundColor: Tokens.colors.accent,
    },

    analyticsTabText: {
      fontSize: Tokens.fonts.size.sm,
      fontWeight: Tokens.fonts.weight.bold,
      color: Tokens.colors.muted,
      marginStart: 8,
    },

    analyticsTabTextActive: {
      color: "#FFF",
    },

    /* AUTH / FORMS */
    authContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    authCard: {
      width: "100%",
      maxWidth: 520,
      borderRadius: Tokens.radii.lg,
      padding: Tokens.space.lg,
      backgroundColor: Tokens.colors.cardBg,
      ...Tokens.shadows.card,
    },

    authHeader: { marginBottom: Tokens.space.sm },
    authTitle: {
      fontSize: Tokens.fonts.size.xl,
      fontWeight: Tokens.fonts.weight.heavy,
      color: Tokens.colors.text,
    },
    authSubtitle: { marginTop: 6, color: Tokens.colors.muted },
    authLine: {
      height: 1,
      backgroundColor: Tokens.colors.softBorder,
      marginTop: Tokens.space.sm,
      marginBottom: Tokens.space.sm,
    },

    authInputGroup: { marginTop: Tokens.space.md },
    authLabel: {
      fontSize: Tokens.fonts.size.sm,
      color: Tokens.colors.muted,
      marginBottom: Tokens.space.xs,
      textAlign: isRTL ? "right" : "left",
    },

    /* ... (rest of your styles left unchanged) ... */


    passwordBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Tokens.colors.surfaceElevated,
      borderRadius: Tokens.radii.sm,
      paddingHorizontal: Tokens.space.md,
      height: 56,
    },
    passwordInput: {
      flex: 1,
      color: Tokens.colors.text,
      fontSize: Tokens.fonts.size.base,
      paddingVertical: 0,
    },
    eyeBtn: {
      width: 40,
      height: 40,
      borderRadius: Tokens.radii.sm,
      justifyContent: "center",
      alignItems: "center",
    },

    authButton: {
      height: 56,
      backgroundColor: Tokens.colors.accent,
      borderRadius: Tokens.radii.md,
      justifyContent: "center",
      alignItems: "center",
      marginTop: Tokens.space.md,
      ...Tokens.shadows.card,
    },

    authButtonText: {
      color: "#FFF",
      fontWeight: Tokens.fonts.weight.heavy,
      fontSize: Tokens.fonts.size.base,
    },

    authFooter: {
      marginTop: Tokens.space.lg,
      paddingTop: Tokens.space.sm,
      borderTopWidth: 1,
      borderTopColor: Tokens.colors.softBorder,
    },

    /* SECTION + TITLES */
    section: { marginTop: Tokens.space.lg },
    sectionTitle: {
      fontSize: Tokens.fonts.size.sm,
      fontWeight: Tokens.fonts.weight.heavy,
      color: Tokens.colors.muted,
      letterSpacing: 1,
      marginBottom: Tokens.space.sm,
      textTransform: "uppercase",
    },

    /* EXPAND / DETAILS */
    tableExpand: {
      backgroundColor: Tokens.colors.bg,
      padding: Tokens.space.md,
      borderTopWidth: 1,
      borderColor: Tokens.colors.softBorder,
    },

    expandTitle: {
      fontSize: 10,
      fontWeight: Tokens.fonts.weight.heavy,
      color: Tokens.colors.muted,
      letterSpacing: 1,
      marginBottom: 8,
    },

    expandLine: {
      fontSize: Tokens.fonts.size.sm,
      fontWeight: Tokens.fonts.weight.normal,
      color: Tokens.colors.text,
      paddingVertical: 2,
    },

    /* MODAL */
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      paddingHorizontal: Tokens.space.lg,
    },

    modalCard: {
      backgroundColor: Tokens.colors.bg,
      borderRadius: Tokens.radii.lg,
      padding: Tokens.space.lg,
      borderWidth: 1,
      borderColor: Tokens.colors.softBorder,
      ...Tokens.shadows.card,
    },

    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Tokens.space.md,
    },

    modalEyebrow: {
      fontSize: Tokens.fonts.size.xs,
      fontWeight: Tokens.fonts.weight.heavy,
      color: Tokens.colors.muted,
      letterSpacing: 1,
    },

    modalTitle: {
      fontSize: Tokens.fonts.size.xl,
      fontWeight: Tokens.fonts.weight.heavy,
      color: Tokens.colors.text,
    },

    modalCloseButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Tokens.colors.surfaceElevated,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 20, 
      marginLeft: 10
    },

    /* small misc */
    reportHeaderText: {
      fontSize: Tokens.fonts.size.sm,
      fontWeight: Tokens.fonts.weight.bold,
      color: Tokens.colors.muted,
    },

    reportStrongCellTextSmall: {
      fontSize: Tokens.fonts.size.sm,
      fontWeight: Tokens.fonts.weight.bold,
      color: Tokens.colors.text,
    },
    /* Additional modal & input styles from user paste */
    modalLabel: {
      fontSize: Tokens.fonts.size.xs,
      fontWeight: Tokens.fonts.weight.bold,
      color: Tokens.colors.muted,
      letterSpacing: 1,
      marginBottom: 8,
      textTransform: "uppercase",
    },

    modalInput: {
      backgroundColor: Tokens.colors.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Tokens.colors.subtleBorder,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: Tokens.colors.text,
      marginBottom: 12,
    },

    modalDateButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Tokens.colors.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Tokens.colors.subtleBorder,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 16,
    },

    modalDateButtonText: {
      color: Tokens.colors.text,
      fontSize: 13,
      fontWeight: Tokens.fonts.weight.normal,
    },

    modalSaveButton: {
      backgroundColor: Tokens.colors.accent,
      borderRadius: 14,
      paddingVertical: 13,
      alignItems: "center",
    },

    modalSaveButtonText: {
      color: "#FFF",
      fontSize: 13,
      fontWeight: Tokens.fonts.weight.heavy,
      letterSpacing: 0.8,
    },

    /* PRODUCT SYSTEM */
    individualSaleUnitRowLine: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: Tokens.colors.softBorder,
    },

    expandTableBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: Tokens.colors.surfaceElevated,
      justifyContent: "center",
      alignItems: "center",
      marginStart: 8,
    },

    miniUnitIndicatorBullet: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: Tokens.colors.accent,
    },

    /* AUTH SYSTEM (UNIFIED CARD STYLE) - overriding earlier for the other auth variant */
    authContainerAlt: {
      flex: 1,
      backgroundColor: "#F7F7F8",
      justifyContent: "center",
      paddingHorizontal: 24,
    },

    authCardAlt: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: Tokens.colors.cardBg,
      borderRadius: 24,
      paddingHorizontal: 24,
      paddingVertical: 24,
      borderWidth: 1,
      borderColor: Tokens.colors.softBorder,
      ...Tokens.shadows.soft,
    },

    authHeaderCenter: {
      alignItems: "center",
      marginBottom: 32,
    },

    languageButton: {
      width: 42,
      height: 36,
      borderRadius: 12,
      backgroundColor: Tokens.colors.accent,
      justifyContent: "center",
      alignItems: "center",
      marginEnd: 8,
    },

    languageText: {
      color: "#FFF",
      fontWeight: Tokens.fonts.weight.heavy,
      fontSize: 12,
    },

    authTitleLarge: {
      fontSize: 28,
      fontWeight: Tokens.fonts.weight.heavy,
      color: Tokens.colors.text,
      letterSpacing: -0.8,
      marginBottom: 6,
    },

    authSubtitleStrong: {
      fontSize: 12,
      fontWeight: Tokens.fonts.weight.bold,
      color: "#8A8A8A",
      letterSpacing: 1.2,
      lineHeight: 16,
    },

    authLineShort: {
      width: 56,
      height: 2,
      backgroundColor: Tokens.colors.accent,
      marginTop: 10,
      marginBottom: 12,
    },

    reportSelectorCard: {
      backgroundColor: Tokens.colors.cardBg,
      borderRadius: 24,
      padding: 20,
      marginHorizontal: Tokens.space.md,
      marginBottom: Tokens.space.lg,
      ...Tokens.shadows.card,
    },

    reportMainTitle: {
      fontSize: 18,
      fontWeight: Tokens.fonts.weight.heavy,
      color: Tokens.colors.text,
      letterSpacing: 0.5,
    },

    reportSelectorRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: Tokens.space.md,
    },

    reportHeaderCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: Tokens.colors.cardBg,
      borderRadius: 18,
      paddingHorizontal: 20,
      paddingVertical: 18,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: Tokens.colors.subtleBorder,
      ...Tokens.shadows.soft,
    },

    reportCountBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#EFF6FF",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: Tokens.radii.round,
    },

    reportCountText: {
      marginStart: 6,
      fontWeight: Tokens.fonts.weight.bold,
      color: Tokens.colors.primary,
      fontSize: 13,
    },

    reportSelectorButton: {
      flex: 1,
      height: 44,
      backgroundColor: "#F7F7F7",
      borderRadius: 14,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: Tokens.colors.softBorder,
    },

    reportSection: {
      marginHorizontal: Tokens.space.md,
      marginBottom: Tokens.space.lg,
    },

    reportHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Tokens.space.md,
    },

    reportTitle: {
      fontSize: 18,
      fontWeight: Tokens.fonts.weight.heavy,
      color: Tokens.colors.text,
    },

    reportMetricRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: Tokens.space.sm,
    },

    reportMetricLabel: {
      fontSize: Tokens.fonts.size.sm,
      color: Tokens.colors.muted,
    },

    reportMetricValue: {
      fontSize: Tokens.fonts.size.sm,
      fontWeight: Tokens.fonts.weight.bold,
      color: Tokens.colors.text,
    },

    yearResetButton: {
      marginLeft: Tokens.space.sm,
      height: 44,
      paddingHorizontal: 14,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: Tokens.colors.surfaceElevated,
      borderWidth: 1,
      borderColor: Tokens.colors.softBorder,
    },

    yearResetText: {
      fontSize: Tokens.fonts.size.sm,
      fontWeight: Tokens.fonts.weight.bold,
      color: Tokens.colors.primary,
    },
// Add these to the styles object in AnalyticsStyles

reportBody: {
  paddingHorizontal: 18,
  paddingBottom: 18,
  paddingTop: 4,
},

reportCardGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: Tokens.space.md, // if RN doesn't support gap, see note below
},

reportCard: {
  backgroundColor: Tokens.colors.surfaceElevated,
  borderRadius: Tokens.radii.md,
  padding: Tokens.space.md,
  width: "48%", // two columns on most phones
  minWidth: 150,
  marginBottom: Tokens.space.md,
},

reportCardTitle: {
  fontSize: Tokens.fonts.size.sm,
  color: Tokens.colors.muted,
  fontWeight: Tokens.fonts.weight.bold,
  marginBottom: 6,
},

reportCardValue: {
  fontSize: 16,
  fontWeight: Tokens.fonts.weight.heavy,
  color: Tokens.colors.text,
},

reportCardSubtitle: {
  marginTop: 6,
  fontSize: Tokens.fonts.size.sm,
  color: Tokens.colors.muted,
},

    /* BUSINESS STATEMENT */
    statementCard: {
      backgroundColor: Tokens.colors.cardBg,
      borderRadius: 24,
      padding: 22,
      marginHorizontal: Tokens.space.md,
      marginBottom: Tokens.space.lg,
      borderWidth: 1,
      borderColor: Tokens.colors.softBorder,
      ...Tokens.shadows.soft,
    },

    statementTitle: {
      fontSize: 18,
      fontWeight: Tokens.fonts.weight.heavy,
      color: Tokens.colors.text,
    },

    statementMonth: {
      marginTop: 5,
      fontSize: 13,
      color: Tokens.colors.muted,
      fontWeight: Tokens.fonts.weight.normal,
    },

    statementSection: {
      marginTop: 22,
    },

    statementSectionTitle: {
      fontSize: 11,
      fontWeight: Tokens.fonts.weight.heavy,
      color: "#999",
      letterSpacing: 1.2,
      marginBottom: 10,
    },

    statementRow: {
      minHeight: 46,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: Tokens.colors.bg,
    },

    statementLabel: {
      fontSize: 14,
      color: "#666",
      fontWeight: Tokens.fonts.weight.normal,
    },

    statementValue: {
      fontSize: 15,
      color: Tokens.colors.text,
      fontWeight: Tokens.fonts.weight.bold,
    },
// Ensure this exists inside createStyles(...) result
tableRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: Tokens.space.sm,
  minHeight: Tokens.table.rowHeight,
  borderBottomWidth: 1,
  borderBottomColor: Tokens.colors.softBorder,
  flexWrap: "nowrap",     // prevent wrapping
},

orderRow: {
  flexDirection: "row",
  alignItems: "center",
  minHeight: 58,
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderBottomColor: Tokens.colors.softBorder,
  flexWrap: "nowrap",
},

orderRowEven: {
  backgroundColor: Tokens.colors.cardBg,
},

orderRowOdd: {
  backgroundColor: Tokens.colors.rowAlt,
},

reportCellContainer: {
  justifyContent: "center",
  paddingHorizontal: 16,
  height: 64,
  flexShrink: 0, // prevent shrinking by default
},

reportTableContent: {
  minWidth: Tokens.table.minWidth + 120,
  flexDirection: "column",
},

reportTableHeader: {
  flexDirection: "row",
  alignItems: "center",
  borderBottomWidth: 1,
  borderBottomColor: Tokens.colors.softBorder,
  backgroundColor: Tokens.colors.cardBg,
},

// product thumbnail used in table rows
productThumb: {
  width: 48,
  height: 48,
  borderRadius: Tokens.radii.sm,
  marginHorizontal: 8,
  backgroundColor: Tokens.colors.surfaceElevated,
},

productThumbFallback: {
  width: 48,
  height: 48,
  borderRadius: Tokens.radii.sm,
  marginHorizontal: 8,
  backgroundColor: Tokens.colors.surfaceElevated,
  justifyContent: "center",
  alignItems: "center",
},

smallGrey: {
  fontSize: Tokens.fonts.size.sm,
  color: Tokens.colors.muted,
  marginTop: 4,
},

// status/payment containers so those badges don't cause wrapping
reportStatusContainer: {
  width: COLUMN_WIDTHS?.status ?? 150,
  justifyContent: "center",
  alignItems: "center",
  flexShrink: 0,
},
reportStatusBadge: {
  paddingHorizontal: 8,
  paddingVertical: 6,
  borderRadius: 10,
  flexDirection: "row",
  alignItems: "center",
},
reportStatusText: {
  marginStart: 8,
  fontSize: Tokens.fonts.size.sm,
  fontWeight: Tokens.fonts.weight.bold,
},

reportPaymentContainer: {
  width: COLUMN_WIDTHS?.payment ?? 110,
  justifyContent: "center",
  alignItems: "center",
  flexShrink: 0,
},
reportPaymentBadge: {
  paddingHorizontal: 8,
  paddingVertical: 6,
  borderRadius: 10,
  flexDirection: "row",
  alignItems: "center",
},
reportPaymentText: {
  marginStart: 8,
  fontSize: Tokens.fonts.size.sm,
  color: Tokens.colors.muted,
},
    statementValueBold: {
      fontSize: 17,
      fontWeight: Tokens.fonts.weight.heavy,
    },

    authInputGroupAlt: {
      marginBottom: 16,
    },

    authLabelAlt: {
      fontSize: 10,
      fontWeight: Tokens.fonts.weight.heavy,
      color: "#666",
      letterSpacing: 1.2,
      marginBottom: 8,
    },

    authInput: {
      height: 52,
      backgroundColor: Tokens.colors.bg,
      borderWidth: 1,
      borderColor: Tokens.colors.subtleBorder,
      borderRadius: 14,
      paddingHorizontal: 16,
      fontSize: 14,
      fontWeight: Tokens.fonts.weight.normal,
      color: Tokens.colors.text,
    },

    reportEmptyCard: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 50,
      paddingHorizontal: 20,
    },

    reportEmptyIcon: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: Tokens.colors.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },

    reportEmptyTitle: {
      fontSize: 16,
      fontWeight: Tokens.fonts.weight.heavy,
      color: "#334155",
      marginBottom: 6,
    },

    reportEmptySubtitle: {
      fontSize: 13,
      color: "#94A3B8",
      textAlign: "center",
    },

     
    /* ORDER CARDS */
    orderCard: {
      backgroundColor: Tokens.colors.cardBg,
      borderRadius: 20,
      padding: 18,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: "#F1F1F1",
      ...Tokens.shadows.soft,
    },

    orderCardTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    orderCustomerName: {
      fontSize: 15,
      fontWeight: Tokens.fonts.weight.heavy,
      color: Tokens.colors.text,
    },

    orderId: {
      marginTop: 4,
      fontSize: 11,
      color: "#888",
    },


  orderAmount: {
    fontSize: 18,
    fontWeight: "900",
    color: "#000",
  },

  // =========================
  // SUMMARY CARD (UNIFIED KPI STYLE)
  // =========================
  summaryCard: {
    marginTop: Tokens.space.lg,
    borderRadius: Tokens.radii.lg,
    backgroundColor: Tokens.colors.cardBg,
    padding: Tokens.space.xl,
    borderWidth: 1,
    borderColor: Tokens.colors.subtleBorder,
    ...Tokens.shadows.card,
  },

  summaryEyebrow: {
    color: Tokens.colors.muted,
    fontSize: Tokens.fonts.size.xs,
    letterSpacing: 1,
    fontWeight: Tokens.fonts.weight.bold,
  },

  netProfitValue: {
    color: Tokens.colors.text,
    fontSize: 32,
    fontWeight: Tokens.fonts.weight.heavy,
    marginTop: Tokens.space.sm,
  },

  netProfitLabel: {
    color: Tokens.colors.muted,
    fontSize: Tokens.fonts.size.sm,
    marginTop: Tokens.space.xs,
  },

  reportHeaderCell: {
    paddingHorizontal: 14,

    justifyContent: "center",
  },

  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 24,
  },

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: -Tokens.space.sm,
  },

  statusSummaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: Tokens.space.md,
    gap: Tokens.space.sm,
  },

  statusSummaryBadge: {
    flexDirection: "column",
    backgroundColor: Tokens.colors.surfaceElevated,
    borderRadius: Tokens.radii.md,
    paddingVertical: Tokens.space.sm,
    paddingHorizontal: Tokens.space.md,
    minWidth: 100,
    marginBottom: Tokens.space.sm,
  },

  statusSummaryLabel: {
    fontSize: Tokens.fonts.size.xs,
    fontWeight: Tokens.fonts.weight.bold,
    marginBottom: 4,
  },

  statusSummaryValue: {
    fontSize: Tokens.fonts.size.lg,
    fontWeight: Tokens.fonts.weight.heavy,
    color: Tokens.colors.text,
  },

  summaryItem: {
    flex: 1,
    minWidth: 140,
    marginHorizontal: Tokens.space.sm,
    marginBottom: Tokens.space.md,
  },

  summaryItemLabel: {
    color: Tokens.colors.muted,
    fontSize: Tokens.fonts.size.xs,
  },

  summaryItemValue: {
    color: Tokens.colors.text,
    fontSize: Tokens.fonts.size.lg,
    fontWeight: Tokens.fonts.weight.bold,
    marginTop: Tokens.space.xs,
  },

  tableRowExpanded: {
    backgroundColor: "#FAFAFA",
  },



  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
  },

  badge: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    paddingVertical: 14,
    marginHorizontal: 4,
    alignItems: "center",
  },

  badgeValue: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 24,
  },

  badgeLabel: {
    marginTop: 6,
    color: "#A5A5A5",
    fontSize: 11,
    letterSpacing: 1,
  },

  // =========================
  // HEADER SYSTEM
  // =========================
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 58,
    paddingBottom: 24,
  },

  headerEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8B8B8B",
    letterSpacing: 2,
  },

  tableContainer: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ECECEC",
    marginHorizontal: 16,
    marginBottom: 20,
  },

  
  cellText: {
    fontSize: 13,
    color: "#444",
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111",
    marginTop: 6,
  },

  headerSubtitle: {
    fontSize: 13,
    color: "#7A7A7A",
    marginTop: 4,
  },

  headerActions: {
    alignItems: "flex-end",
    gap: 10,
  },

  calendarButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F6F6",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },

  calendarButtonText: {
    marginLeft: 6,
    fontWeight: "700",
    color: "#111",
  },

  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },

  primaryButtonText: {
    color: "#FFF",
    marginLeft: 6,
    fontWeight: "700",
  },

  // =========================
  // EXPANSION SYSTEM
  // =========================
  orderExpansion: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#F0F0F0",
  },

  expansionLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },

  expansionLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#888",
    letterSpacing: 0.8,
  },

  // =========================
  // STATUS BADGES (MINIMAL CLEAN SYSTEM)
  // =========================
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  // =========================
  // SMALL UTILITIES
  // =========================
  tableCellPrice: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111111",
  },

  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
  },

  emptyText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#AAAAAA",
    textAlign: "center",
    letterSpacing: 1,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  // =========================
  // BUTTONS (UNIFIED MINI ACTION)
  // =========================
  addExpenseMiniBtn: {
    backgroundColor: "#111",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },

  addExpenseMiniText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  // =========================
  // EXPENSE SYSTEM (CLEAN CARD)
  // =========================
  expenseCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EFEFEF",

    padding: 16,
    marginBottom: 12,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  expenseTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111",
  },

  expenseDate: {
    marginTop: 4,
    fontSize: 10,
    color: "#888",
    fontWeight: "600",
  },

  expenseAmount: {
    fontSize: 13,
    fontWeight: "900",
    color: "#111",
  },

  // =========================
  // ANALYTICS TABS (CLEAN SYSTEM)
 
  tableExpandPremium: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    padding: 16,
  },

  expandHeader: {
    marginBottom: 14,
  },

  orderTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  orderIdText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111",
  },

  orderMetaText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },

  orderSection: {
    marginTop: 10,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#999",
    marginBottom: 10,
    letterSpacing: 1,
  },

  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

 

  productName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },

  productMeta: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  productPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111",
  },

  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#F0F0F0",
  },

  footerLabel: {
    fontSize: 11,
    color: "#888",
  },

  footerValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
  },

  footerTotal: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111",
  },

  expandSubtitle: {
    fontSize: 11,
    color: "#777",
    marginTop: 2,
  },

  expandGridPremium: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },

  expandCard: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    padding: 12,
    borderRadius: 12,
  },

  expandCardTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#555",
    marginBottom: 8,
    textTransform: "uppercase",
  },

  expandMainText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
  },

  expandMetaText: {
    fontSize: 11,
    color: "#777",
    marginTop: 2,
  },

  expandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  expandValueStrong: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111",
  },

  expandProductSection: {
    marginTop: 6,
  },

  productStoryRowPremium: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },

  expandFooter: {
    marginTop: 12,
    alignItems: "flex-start",
  },

  // =========================
  // PRODUCT SYSTEM (UNIFIED CARD)
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ECECEC",
  },

  productHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
  },

  productStoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F3F3",
    paddingVertical: 14,
    gap: 12,
  },

  productStoryName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111",
  },

  productStoryMeta: {
    marginTop: 4,
    color: "#666",
    fontSize: 12,
    lineHeight: 18,
  },

  productStoryPrice: {
    fontSize: 13,
    fontWeight: "900",
    color: "#111",
  },

  productInfo: {
    flex: 1,
    marginLeft: 16,
  },

  productSubtitle: {
    marginTop: 5,
    color: "#777",
    fontSize: 12,
  },

  productRevenueBox: {
    alignItems: "flex-end",
    marginRight: 12,
  },

  productRevenue: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111",
  },

  productRevenueLabel: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
  },

  productStatsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
  },

  productMetric: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
  },

  metricValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
  },

  metricLabel: {
    marginTop: 4,
    fontSize: 11,
    color: "#888",
  },

  salesContainer: {
    padding: 16,
  },

  saleCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },

  saleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  saleCustomer: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
  },

  statusBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },

  saleMeta: {
    marginTop: 6,
    color: "#777",
    fontSize: 12,
  },

  saleGrid: {
    marginTop: 14,
    gap: 6,
  },

  saleInfo: {
    color: "#555",
    fontSize: 13,
  },

  saleBottom: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  saleAmount: {
    fontWeight: "900",
    fontSize: 16,
    color: "#111",
  },

  saleOrderId: {
    color: "#888",
    fontSize: 12,
  },

  emptyTitle: {
    marginTop: 12,
    fontWeight: "800",
    fontSize: 16,
  },

  emptySubtitle: {
    marginTop: 6,
    color: "#888",
    textAlign: "center",
    fontSize: 13,
  },
  // =========================
  // TABLE SYSTEM (UNIFIED CORE)
  // =========================
  tableWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    marginTop: 12,
    marginBottom: 20,
  },

  tableCellHeader: {
    flex: 1,
    fontSize: 11,
    fontWeight: "900",
    color: "#111",
    textTransform: "uppercase",
  },

  tableCellStrong: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    color: "#111",
  },

  tableCell: {
    width: 120,
    fontSize: 11,
    color: "#111",
    paddingHorizontal: 6,
  },

  // =========================
  // DETAIL / CAMPAIGN BLOCKS
  // =========================
  campaignAuditDetailsSlat: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F3F3",
    width: "100%",
  },

  campaignDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 4,
  },

  campaignDetailLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#666",
    flex: 1,
    paddingRight: 10,
  },

  campaignDetailValue: {
    fontSize: 10,
    fontWeight: "900",
    color: "#000",
    minWidth: 95,
    textAlign: "right",
  },

  // =========================
  // MINOR UTILITIES
  // =========================
  expansionValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111",
  },

  miniDropdownAlertContainer: {
    paddingVertical: 6,
  },

  miniDropdownAlertText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#777",
  },

  // =========================
  // HEADER BAR
  // =========================
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#FFFFFF",
  },

  headerLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: "#999999",
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: "uppercase",
  },

  expenseAmountContainer: {
    minWidth: 90,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  productDropdownDetailBox: {
    backgroundColor: "#FAFAFA",
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    gap: 8,
  },

  dropdownSubsectionHeader: {
    fontSize: 8,
    fontWeight: "900",
    color: "#888888",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },

  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  addExpBtn: {
    backgroundColor: "#000000",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 2,
  },

  addExpText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  // =========================
  // SUMMARY CARD (MAIN KPI BLOCK)
  // =========================

  netLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#999999",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  statGrid: {
    flexDirection: "row",
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },

  statItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },

  statLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: "#888888",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  statValue: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 6,
  },

  // =========================
  // ANALYTICS BADGES
  // =========================

  analyticsBadgeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    paddingHorizontal: 20,
  },

  analyticsBadgeItem: {
    flex: 1,
    backgroundColor: "#111111",
    padding: 14,
  },

  statementLabelBold: {
    fontWeight: "900",
  },

  analyticsBadgeLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: "#999999",
    letterSpacing: 1,
    marginBottom: 6,
  },

  analyticsBadgeValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  productExpanded: {
    backgroundColor: "#FAFAFA",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#EEE",
  },

  expandedTitle: {
    fontSize: 9,
    fontWeight: "900",
    color: "#888",
    marginBottom: 10,
    letterSpacing: 1,
  },

  unitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },

  unitLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  unitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#000",
    marginRight: 8,
  },

  unitText: {
    fontSize: 10,
    color: "#333",
    fontWeight: "600",
  },

  unitRight: {
    alignItems: "flex-end",
  },

  emptyMini: {
    fontSize: 10,
    fontWeight: "600",
    color: "#999",
    textAlign: "center",
    paddingVertical: 10,
  },

  unitPrice: {
    fontSize: 11,
    fontWeight: "900",
    color: "#111",
  },

  expenseDeleteBtn: {
    marginLeft: 12,
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },

  unitOldPrice: {
    fontSize: 9,
    color: "#FF3B30",
    textDecorationLine: "line-through",
  },

  // =========================
  // PRODUCT CARDS (EXPANDABLE)
  // =========================

  expandableCard: {
    borderWidth: 1,
    borderColor: "#EEEEEE",
    padding: 14,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
  },

  productMainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  productSubText: {
    fontSize: 10,
    color: "#888888",
    fontWeight: "600",
    marginTop: 4,
  },

 
  
  productTotalValue: {
    fontSize: 13,
    fontWeight: "900",
    color: "#000000",
  },

  prodThumbnail: {
    width: 36,
    height: 48,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },

  fallbackThumbBox: {
    width: 36,
    height: 48,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },

  // =========================
  // EXPANDED PRODUCT DETAILS
  // =========================

  expandedDetailsSlat: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
    paddingTop: 12,
    gap: 10,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  detailLabel: {
    fontSize: 11,
    color: "#777777",
    fontWeight: "500",
  },

  detailValue: {
    fontSize: 11,
    color: "#000000",
    fontWeight: "700",
  },

  // =========================
  // EXPENSE LIST
  // =========================

  expenseRowSlatItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingBottom: 100,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    backgroundColor: "#FFFFFF",
  },

  expenseDescriptionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111111",
  },

  expenseMetaDateGutter: {
    fontSize: 9,
    color: "#888888",
    fontWeight: "500",
    marginTop: 3,
  },

  expenseValueAmountText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FF3B30",
  },

  // =========================
  // EMPTY / STATES
  // =========================

  emptyTextHint: {
    fontSize: 9,
    fontWeight: "800",
    color: "#CCCCCC",
    textAlign: "center",
    letterSpacing: 0.5,
  },

  centerMinimalGutter: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // =========================
  // MODAL
  // =========================

  modalOverlayContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  modalContentCard: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  modalHeadingTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: 1.5,
    marginBottom: 20,
  },

  modalInputField: {
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
    paddingVertical: 10,
    fontSize: 14,
    color: "#000000",
    fontWeight: "600",
    marginBottom: 20,
  },

  modalActionsRowArea: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },

  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDDDDD",
  },

  cancelBtnText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#666666",
  },

  modalSubmitBtn: {
    flex: 2,
    backgroundColor: "#000000",
    paddingVertical: 14,
    alignItems: "center",
  },

  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  });
}