export type Locale = 'en' | 'fa' | 'ps';

export const LANGUAGES: { code: Locale; label: string; direction: 'ltr' | 'rtl' }[] = [
  { code: 'en', label: 'English', direction: 'ltr' },
  { code: 'fa', label: 'Dari', direction: 'rtl' },
  { code: 'ps', label: 'Pashto', direction: 'rtl' },
];

const TRANSLATIONS: Record<Locale, Record<string, string>> = {
 en: {
  // ===== REPORT =====
  businessReport: "Business Report",
  businessStatement: "Business Statement",
  monthly: "Monthly",
  yearly: "Yearly",

  financialPerformance: "Financial Performance",
  orderLifecycle: "Order Lifecycle",
  performance: "Performance",

  grossRevenue: "Gross Revenue",
  shippingRevenue: "Shipping Revenue",
  estimatedProfit: "Estimated Profit",
  expenses: "Expenses",
  netProfit: "Net Profit",

  totalOrders: "Total Orders",
  pendingOrders: "Pending Orders",
  processing: "Processing",
  deliveryQueue: "Delivery Queue",
  pickedUp: "Picked Up",
  outForDelivery: "Out For Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunds: "Refunds",
businessAnalyticsSubtitle: "Monthly financial and order performance",

  businessAnalytics: "Business Analytics",
  monthlyFinancialAndOrderPerformance: "Monthly financial and order performance",
  
  created: "Created",
  orderId: "Order ID",
  customer: "Customer",
  product: "Product",
  quantity: "Quantity",
  items: "Items",
  status: "Status",
  shipping: "Shipping",
  paymentMethod: "Payment Method",
  total: "Total",
  finance: "Finance",
  companyExpenses: "Company Expenses",
  add: "Add",
  noExpenses: "No expenses",
  companyExpensesAppearHere: "Company expenses appear here",
  expense: "Expense",
  adminAccess: "Admin Access",
  enterCredentialsToContinue: "Enter credentials to continue",
  password: "Password",
  enterPassword: "Enter password",
  passkey: "Passkey",
  enterPasskey: "Enter passkey",
  verifying: "Verifying",
  login: "Login",
  secureAdminDashboard: "Secure admin dashboard",
  reportOrders: "Orders",
  allOrdersForSelectedPeriod: "All orders for the selected period",
  orders: "Orders",
  noOrdersFound: "No orders found",
  noOrdersForSelectedPeriod: "No orders for the selected period",
  revenue: "Revenue",

  averageOrder: "Average Order",
  orderPerformance: "Order Performance",
 
  unitsSold: "Units Sold",
  products: "Products",
  productPerformance: "Product Performance",
  noProducts: "No products",
  productAnalyticsAppearHere: "Product analytics appear here",
  ordersUpper: "Orders",
  noOrdersRecorded: "No orders recorded",
  orderLedger: "Order Ledger",
  fullView: "Full view",
  moreItems: "More items",
  orderStory: "Order story",
  fullTransactionBreakdown: "Full transaction breakdown",
  financial: "Financial",
  qty: "Qty",
  size: "Size",
  change: "Change",
  monthlyRevenue: "Monthly revenue",
  revenueSubtitle: "Revenue for the selected period",
monthlyBusinessPerformance: "Monthly Business Performance",
yearlyBusinessPerformance: "Yearly Business Performance",

financialOverview: "Financial Overview",

noOrdersForPeriod: "No orders exist for this period.",

selectPeriod: "Select Period",

language: "Language",
  deliverySuccess: "Delivery Success",

  averageOrderValue: "Average Order Value",

  // ===== DATABASE =====
  database: "Database",
  
  compact: "Compact",
 
  orderDetails: "Order Details",
 
  phone: "Phone",

  orderItems: "Order Items",
  financialSummary: "Financial Summary",
  orderStatus: "Order Status",

  more: "more",

  monthlyPerformance: "Monthly Performance",

  profit: "Profit",
  loss: "Loss",
  profitLoss: "Profit / Loss",
  baseCost: "Base Cost",
  profitFromCost: "Profit From Cost",
  selectYear: "Select Year",

  active: "Active",


  productLedger: "Product Ledger",

  productName: "Product Name",
  units: "Units",
  sales: "Sales",

  
  addExpense: "Add Expense",

  amount: "Amount",
  description: "Description",

  // ===== EMPTY STATES =====
 
  noData: "No Data Available",

  // ===== COMMON =====

  close: "Close",
  report: "Report",

  yes: "Yes",
  no: "No",

  loading: "Loading...",
  search: "Search",

  today: "Today",
  month: "Month",
  year: "Year",
},
 fa: {
  businessReport: "گزارش کسب‌وکار",
  businessStatement: "صورت وضعیت کسب‌وکار",

  monthly: "ماهانه",
  yearly: "سالانه",

  financialPerformance: "عملکرد مالی",
  orderLifecycle: "چرخه سفارش",
  performance: "عملکرد",

  grossRevenue: "درآمد ناخالص",
  shippingRevenue: "درآمد ارسال",
  estimatedProfit: "سود تخمینی",
  expenses: "هزینه‌ها",
  netProfit: "سود خالص",

  totalOrders: "مجموع سفارش‌ها",
  pendingOrders: "سفارش‌های در انتظار",
  processing: "در حال پردازش",
  deliveryQueue: "صف ارسال",
  pickedUp: "تحویل گرفته شده",
  outForDelivery: "در حال ارسال",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
  refunds: "مرجوعی‌ها",
businessAnalyticsSubtitle: "عملکرد مالی و سفارش‌های ماهانه",

monthlyBusinessPerformance: "عملکرد ماهانه کسب‌وکار",
yearlyBusinessPerformance: "عملکرد سالانه کسب‌وکار",

financialOverview: "نمای کلی مالی",
orderPerformance: "عملکرد سفارش‌ها",

averageOrder: "میانگین سفارش",

reportOrders: "سفارش‌های گزارش",

noOrdersForPeriod: "در این بازه هیچ سفارشی وجود ندارد.",

selectPeriod: "انتخاب بازه",

language: "زبان",
  deliverySuccess: "موفقیت در تحویل",
  unitsSold: "تعداد فروش",
  averageOrderValue: "میانگین ارزش سفارش",

  profit: "سود",
  loss: "ضرر",
  profitLoss: "سود / ضرر",
  baseCost: "هزینه پایه",
  profitFromCost: "سود از هزینه",
  selectYear: "انتخاب سال",

  database: "پایگاه داده",
  orderLedger: "دفتر سفارش‌ها",
  fullView: "نمای کامل",
  compact: "نمای فشرده",
  orders: "سفارش‌ها",
 
  
  businessAnalytics: "تحلیل کسب‌وکار",
  monthlyFinancialAndOrderPerformance: "عملکرد مالی و سفارشات ماهانه",
 
  created: "تاریخ",
  orderId: "شماره سفارش",
  customer: "مشتری",
  product: "محصول",
  quantity: "تعداد",
  items: "موارد",
  status: "وضعیت",
  shipping: "هزینه حمل",
  paymentMethod: "روش پرداخت",
  total: "جمع",
  finance: "مالی",
  companyExpenses: "هزینه‌های شرکت",
  add: "افزودن",
  noExpenses: "هزینه‌ای ثبت نشده",
  companyExpensesAppearHere: "هزینه‌های شرکت در اینجا ظاهر می‌شوند",
  expense: "هزینه",
  adminAccess: "دسترسی مدیر",
  enterCredentialsToContinue: "برای ادامه اطلاعات خود را وارد کنید",
  password: "رمز عبور",
  enterPassword: "رمز عبور را وارد کنید",
  passkey: "کد عبور",
  enterPasskey: "کد عبور را وارد کنید",
  verifying: "در حال تأیید",
  login: "ورود",
  secureAdminDashboard: "داشبورد مدیریت امن",

  allOrdersForSelectedPeriod: "تمام سفارش‌ها برای دوره انتخاب‌شده",
 
  noOrdersFound: "هیچ سفارشی یافت نشد",
  noOrdersForSelectedPeriod: "هیچ سفارشی برای دوره انتخاب‌شده وجود ندارد",
  revenue: "درآمد",

  products: "محصولات",
  productPerformance: "عملکرد محصول",
  noProducts: "محصولی وجود ندارد",
  productAnalyticsAppearHere: "آنالیز محصولات در اینجا ظاهر می‌شود",
  ordersUpper: "سفارش‌ها",
  noOrdersRecorded: "هیچ سفارشی ثبت نشده",
  
  moreItems: "موارد بیشتر",
  orderStory: "جزئیات سفارش",
  fullTransactionBreakdown: "تفکیک کامل تراکنش",
  financial: "مالی",
  qty: "تعداد",
  size: "سایز",
  change: "تغییر",
  monthlyRevenue: "درآمد ماهانه",
  revenueSubtitle: "درآمد دوره انتخاب‌شده",

  orderDetails: "جزئیات سفارش",

  
  phone: "شماره تماس",
  
  
  orderItems: "اقلام سفارش",
  financialSummary: "خلاصه مالی",
  orderStatus: "وضعیت سفارش",

 
  active: "فعال",


  productName: "نام محصول",
  units: "تعداد",
  sales: "فروش",


  
  description: "توضیحات",

  
  
  report: "گزارش",

  yes: "بله",
  no: "خیر",

  loading: "در حال بارگذاری...",
  search: "جستجو",

  today: "امروز",
  month: "ماه",
  year: "سال",
},

ps: {
  businessReport: "د سوداګرۍ راپور",
  businessStatement: "د سوداګرۍ راپور",

  monthly: "میاشتنی",
  yearly: "کلنی",

  financialPerformance: "مالي فعالیت",
  orderLifecycle: "د فرمایش بهیر",
  performance: "فعالیت",

  grossRevenue: "ټول عاید",
  shippingRevenue: "د لېږد عاید",
  estimatedProfit: "اټکلی ګټه",
  expenses: "لګښتونه",
  netProfit: "خالصه ګټه",

  totalOrders: "ټول فرمایشونه",
  pendingOrders: "په تمه فرمایشونه",
  processing: "د پروسس په حال کې",
  deliveryQueue: "د سپارلو کتار",
  pickedUp: "ترلاسه شوي",
  outForDelivery: "د سپارلو په حال کې",
  delivered: "سپارل شوي",
  cancelled: "لغوه شوي",
  refunds: "بیرته ستنیدنې",

  deliverySuccess: "د سپارلو بریالیتوب",
  unitsSold: "پلورل شوي واحدونه",
  averageOrderValue: "د فرمایش منځنی ارزښت",

  profit: "ګټه",
  loss: "تاوان",
  profitLoss: "ګټه / تاوان",
  baseCost: "بنسټیز لګښت",
  profitFromCost: "له لګښت څخه ګټه",
  selectYear: "کال وټاکئ",

  database: "ډیټابېس",
  orderLedger: "د فرمایشونو دفتر",
  fullView: "بشپړ لید",
  compact: "لنډ لید",
  orders: "فرمایشونه",

  noOrdersFound: "هیڅ فرمایش ونه موندل شو",
  noOrdersRecorded: "په دې موده کې هېڅ فرمایش نشته.",

  orderDetails: "د فرمایش جزئیات",
  customer: "پېرودونکی",
  phone: "ټیلیفون",
  orderId: "د فرمایش شمېره",
  created: "د جوړېدو نېټه",

  
  businessAnalytics: "د سوداګرۍ تحلیل",
  monthlyFinancialAndOrderPerformance: "میاشتنی مالي او د امر فعالیت",

  

  
  status: "حالت",
  shipping: "د انتقال لګښت",
  paymentMethod: "د تادیې طریقه",
  total: "ټول",
  finance: "مالیه",
  companyExpenses: "د شرکت لګښتونه",
  add: "زیاتول",
  noExpenses: "هیڅ لګښت نشته",
  companyExpensesAppearHere: "د شرکت لګښتونه دلته ښودل کېږي",
  expense: "لګښت",
  adminAccess: "اداري لاسرسی",
  enterCredentialsToContinue: "د دوام لپاره مهرباني وکړئ معلومات دننه کړئ",
  password: "پټ نوم",
  enterPassword: "پټ نوم داخل کړئ",
  passkey: "د تېرېدو کوډ",
  enterPasskey: "د تېرېدو کوډ داخل کړئ",
  verifying: "تصدیق کیږي",
  login: "ننوتل",
  secureAdminDashboard: "خوندي اداري ډشبورډ",
  reportOrders: "فروختونه",
  allOrdersForSelectedPeriod: "ټول فرمایشونه د ټاکل شوې دورې لپاره",

  
  noOrdersForSelectedPeriod: "د ټاکل شوې دورې لپاره هېڅ فرمایش نشته",
  revenue: "عاید",

  
  averageOrder: "منځنۍ فرمایش",
  orderPerformance: "د فرمایش فعالیت",

  
  products: "محصولات",
  productPerformance: "د محصول فعالیت",
  noProducts: "هیڅ محصول نشته",
  productAnalyticsAppearHere: "د محصول تحلیلونه دلته ښکاري",
  ordersUpper: "فروختونه",

  
  moreItems: "نور توکي",
  orderStory: "د فرمایش تفصیل",
  fullTransactionBreakdown: "د تراکنش بشپړ تفصیل",
  financial: "مالي",
  qty: "مقدار",
  size: "سایز",
  change: "بدلون",
  monthlyRevenue: "میاشتنی عاید",
  revenueSubtitle: "د ټاکل شوي مودې عاید",
  product: "محصول",

  quantity: "مقدار",

  orderItems: "د فرمایش توکي",
  financialSummary: "مالي لنډیز",
  orderStatus: "د فرمایش حالت",


  items: "توکي",
  more: "نور",

  monthlyPerformance: "میاشتنی فعالیت",

  
  profit: "ګټه",

  active: "فعال",

  productLedger: "د محصولاتو دفتر",

  productName: "د محصول نوم",
  units: "واحدونه",
  sales: "پلور",


  addExpense: "لګښت اضافه کړئ",

  amount: "مقدار",
  description: "تشریح",


  noData: "هیڅ معلومات نشته",

  close: "بندول",
  report: "راپور",

  yes: "هو",
  no: "نه",
businessAnalyticsSubtitle: "د میاشتني مالي او فرمایشونو فعالیت",

monthlyBusinessPerformance: "د سوداګرۍ میاشتنی فعالیت",
yearlyBusinessPerformance: "د سوداګرۍ کلنی فعالیت",

financialOverview: "مالي عمومي کتنه",


noOrdersForPeriod: "په دې موده کې هېڅ فرمایش نشته.",

selectPeriod: "موده وټاکئ",

language: "ژبه",
  loading: "بارېږي...",
  search: "لټون",

  today: "نن",
  month: "میاشت",
  year: "کال",
}, // Fixed syntax closure: changed '}}' to '}'
};

// 🎯 CRASH PROTECTION: Automatically cleans up and reads out missing keys safely
export function translate(locale: Locale, key: string) {
  if (TRANSLATIONS[locale]?.[key]) {
    return TRANSLATIONS[locale][key];
  }
  
  if (TRANSLATIONS.en[key]) {
    return TRANSLATIONS.en[key];
  }

  const cleanFallback = key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
    
  return cleanFallback;
}

export function isRTL(locale: Locale) {
  return locale !== 'en';
}
