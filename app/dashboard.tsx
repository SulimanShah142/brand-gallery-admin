// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';

// const { width } = Dimensions.get('window');
// const API_URL = "http://192.168.1.4:3000"; // Ensure this matches your server IP

// export default function AdminDashboard() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [data, setData] = useState({
//     totalSales: 0,
//     totalRevenue: "0",
//     estimatedProfit: "0",
//     activeSellers: "0", // Add static or dynamic counts for these
//     deliverers: "0"
//   });

//   const fetchStats = async () => {
//     try {
//       const response = await fetch(`${API_URL}/api/admin/analytics/monthly`);
//       const json = await response.json();
//       setData(prev => ({
//         ...prev,
//         totalSales: json.totalSales || 0,
//         totalRevenue: json.totalRevenue || "0",
//         estimatedProfit: json.estimatedProfit || "0",
//       }));
//     } catch (error) {
//       console.error("Failed to fetch admin stats:", error);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   useEffect(() => {
//     fetchStats();
//   }, []);

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchStats();
//   };

//   const statCards = [
//     { label: "Today's Orders", value: data.totalSales.toString(), icon: "cart-outline", color: "#0A1128" },
//     { label: "Est. Revenue", value: `AFN ${data.totalRevenue}`, icon: "cash-outline", color: "#0A1128" },
//     { label: "Est. Profit", value: `AFN ${data.estimatedProfit}`, icon: "trending-up-outline", color: "#2D6A4F" },
//     { label: "Active Deliverers", value: "12", icon: "bicycle-outline", color: "#0A1128" },
//   ];

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#0A1128" />
//       </View>
//     );
//   }

//   return (
//     <ScrollView 
//       style={styles.container} 
//       contentContainerStyle={styles.content}
//       refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
//     >
//       <Text style={styles.header}>Admin Overview</Text>

//       {/* 1. Stats Grid */}
//       <View style={styles.statsGrid}>
//         {statCards.map((item, index) => (
//           <View key={index} style={styles.statCard}>
//             <Ionicons name={item.icon as any} size={24} color={item.color} />
//             <Text style={styles.statValue}>{item.value}</Text>
//             <Text style={styles.statLabel}>{item.label}</Text>
//           </View>
//         ))}
//       </View>

//       {/* 2. Quick Actions */}
//       <Text style={styles.sectionTitle}>Management</Text>
      
//       <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/admin/categories')}>
//         <View style={styles.actionIconBox}>
//           <Ionicons name="add-circle-outline" size={24} color="#fff" />
//         </View>
//         <View>
//           <Text style={styles.actionTitle}>Catalog Management</Text>
//           <Text style={styles.actionSub}>Manage categories & products</Text>
//         </View>
//         <Ionicons name="chevron-forward" size={20} color="#ccc" style={{ marginLeft: 'auto' }} />
//       </TouchableOpacity>

//       <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/admin/orders')}>
//         <View style={[styles.actionIconBox, { backgroundColor: '#333' }]}>
//           <Ionicons name="cube-outline" size={24} color="#fff" />
//         </View>
//         <View>
//           <Text style={styles.actionTitle}>Order Manager</Text>
//           <Text style={styles.actionSub}>Review & update order status</Text>
//         </View>
//         <Ionicons name="chevron-forward" size={20} color="#ccc" style={{ marginLeft: 'auto' }} />
//       </TouchableOpacity>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   container: { flex: 1, backgroundColor: '#fff' },
//   content: { padding: 20, paddingTop: 60 },
//   header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
//   sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 30, marginBottom: 15 },
//   statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
//   statCard: { 
//     width: (width - 50) / 2, 
//     backgroundColor: '#F8F8F8', 
//     padding: 20, 
//     borderRadius: 15, 
//     marginBottom: 10,
//     alignItems: 'flex-start' 
//   },
//   statValue: { fontSize: 18, fontWeight: 'bold', marginTop: 10 },
//   statLabel: { fontSize: 12, color: '#666', marginTop: 2 },
//   actionItem: { 
//     flexDirection: 'row', 
//     alignItems: 'center', 
//     padding: 15, 
//     backgroundColor: '#fff', 
//     borderRadius: 12, 
//     marginBottom: 10,
//     borderWidth: 1,
//     borderColor: '#EEEEEE'
//   },
//   actionIconBox: { 
//     width: 45, 
//     height: 45, 
//     backgroundColor: '#0A1128', 
//     borderRadius: 10, 
//     justifyContent: 'center', 
//     alignItems: 'center', 
//     marginRight: 15 
//   },
//   actionTitle: { fontSize: 16, fontWeight: '600' },
//   actionSub: { fontSize: 12, color: '#888' }
// });
