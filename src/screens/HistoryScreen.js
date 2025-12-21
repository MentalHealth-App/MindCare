import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from "react-native-chart-kit";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from "../utils/api";
import { parseJwt } from '../utils/auth';
import axios from 'axios';

const screenWidth = Dimensions.get('window').width;
const MAX_CHART_POINTS = 10;

export default function HistoryScreen({ route }) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // 'week', 'month', 'all'

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userObj = parseJwt(token);
      const userEmail = userObj?.email;
      
      if (!userEmail) throw new Error("Session expired. Please log in again.");
      
      const res = await axios.get(`${BASE_URL}/mentalhealthresults/${userEmail}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setHistory(res.data);
    } catch (err) {
      console.error('History fetch error:', err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredHistory = () => {
    if (selectedPeriod === 'all') return history;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    if (selectedPeriod === 'week') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (selectedPeriod === 'month') {
      cutoffDate.setDate(now.getDate() - 30);
    }
    
    return history.filter(h => new Date(h.timestamp) >= cutoffDate);
  };

  const filteredHistory = getFilteredHistory();
  const chartHistory = filteredHistory.slice(0, MAX_CHART_POINTS).reverse();

  // Prepare chart data
  const chartLabels = chartHistory.map(h => {
    const date = new Date(h.timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  const depressionData = chartHistory.map(h => h.depressionScore || 0);
  const anxietyData = chartHistory.map(h => h.anxietyScore || 0);
  const stressData = chartHistory.map(h => h.stressScore || 0);

  // Calculate statistics
  const calculateStats = (data) => {
    if (data.length === 0) return { avg: 0, min: 0, max: 0, trend: 'stable' };
    
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    const min = Math.min(...data);
    const max = Math.max(...data);
    
    // Simple trend calculation
    let trend = 'stable';
    if (data.length >= 2) {
      const recent = data.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, data.length);
      const earlier = data.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, data.length);
      
      if (recent > earlier + 3) trend = 'increasing';
      else if (recent < earlier - 3) trend = 'decreasing';
    }
    
    return { avg, min, max, trend };
  };

  const depressionStats = calculateStats(depressionData);
  const anxietyStats = calculateStats(anxietyData);
  const stressStats = calculateStats(stressData);

  const getTrendIcon = (trend) => {
    if (trend === 'increasing') return '📈';
    if (trend === 'decreasing') return '📉';
    return '➡️';
  };

  const getTrendColor = (trend) => {
    if (trend === 'increasing') return '#ef4444';
    if (trend === 'decreasing') return '#22c55e';
    return '#64748b';
  };

  const getTrendMessage = () => {
    if (filteredHistory.length === 0) return "No test history available yet. Take your first test to start tracking your mental health!";
    if (filteredHistory.length === 1) return "You've taken one test. Continue regular testing to track your progress over time.";
    
    let message = "";
    const avgTotal = (depressionStats.avg + anxietyStats.avg + stressStats.avg) / 3;
    
    if (avgTotal < 10) {
      message = "Your overall mental health metrics are in a healthy range. Keep maintaining your positive habits! ";
    } else if (avgTotal < 20) {
      message = "You're showing some mild symptoms. Continue monitoring and practicing self-care. ";
    } else if (avgTotal < 30) {
      message = "Your scores indicate moderate distress. Consider implementing stress management strategies and seeking support. ";
    } else {
      message = "Your scores show significant distress. We strongly encourage you to speak with a mental health professional. ";
    }
    
    // Add trend information
    if (depressionStats.trend === 'decreasing' && anxietyStats.trend === 'decreasing') {
      message += "Positive trend: Your symptoms are improving! ";
    } else if (depressionStats.trend === 'increasing' || anxietyStats.trend === 'increasing') {
      message += "Your symptoms appear to be increasing. This may be a good time to seek additional support. ";
    }
    
    return message;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading your history...</Text>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyTitle}>No Test History</Text>
        <Text style={styles.emptyText}>
          You haven't taken any tests yet. Take your first mental health assessment to start tracking your progress!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Progress & History</Text>
      
      {/* Period Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, selectedPeriod === 'week' && styles.filterButtonActive]}
          onPress={() => setSelectedPeriod('week')}
        >
          <Text style={[styles.filterText, selectedPeriod === 'week' && styles.filterTextActive]}>
            Last Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedPeriod === 'month' && styles.filterButtonActive]}
          onPress={() => setSelectedPeriod('month')}
        >
          <Text style={[styles.filterText, selectedPeriod === 'month' && styles.filterTextActive]}>
            Last Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedPeriod === 'all' && styles.filterButtonActive]}
          onPress={() => setSelectedPeriod('all')}
        >
          <Text style={[styles.filterText, selectedPeriod === 'all' && styles.filterTextActive]}>
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Overall Trend Message */}
      <View style={styles.trendCard}>
        <Text style={styles.trendTitle}>📊 Overall Assessment</Text>
        <Text style={styles.trendMessage}>{getTrendMessage()}</Text>
      </View>

      {/* Line Chart */}
      {chartHistory.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Score Trends Over Time</Text>
          <LineChart
            data={{
              labels: chartLabels,
              datasets: [
                { 
                  data: depressionData, 
                  color: () => "#ef4444",
                  strokeWidth: 2
                },
                { 
                  data: anxietyData, 
                  color: () => "#3b82f6",
                  strokeWidth: 2
                },
                { 
                  data: stressData, 
                  color: () => "#10b981",
                  strokeWidth: 2
                }
              ],
              legend: ["Depression", "Anxiety", "Stress"],
            }}
            width={screenWidth - 40}
            height={240}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#f0f9ff",
              backgroundGradientTo: "#e0f2fe",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              labelColor: () => "#1e40af",
              propsForDots: {
                r: "4",
                strokeWidth: "2",
              },
              propsForBackgroundLines: {
                strokeDasharray: "",
                stroke: "#e2e8f0",
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Statistical Summary</Text>
        
        {/* Depression Stats */}
        <View style={[styles.statCard, { borderLeftColor: '#ef4444' }]}>
          <View style={styles.statHeader}>
            <Text style={styles.statTitle}>Depression</Text>
            <Text style={styles.trendIcon}>{getTrendIcon(depressionStats.trend)}</Text>
          </View>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Average</Text>
              <Text style={styles.statValue}>{depressionStats.avg.toFixed(1)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Min</Text>
              <Text style={styles.statValue}>{depressionStats.min}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Max</Text>
              <Text style={styles.statValue}>{depressionStats.max}</Text>
            </View>
          </View>
          <Text style={[styles.trendText, { color: getTrendColor(depressionStats.trend) }]}>
            Trend: {depressionStats.trend}
          </Text>
        </View>

        {/* Anxiety Stats */}
        <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
          <View style={styles.statHeader}>
            <Text style={styles.statTitle}>Anxiety</Text>
            <Text style={styles.trendIcon}>{getTrendIcon(anxietyStats.trend)}</Text>
          </View>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Average</Text>
              <Text style={styles.statValue}>{anxietyStats.avg.toFixed(1)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Min</Text>
              <Text style={styles.statValue}>{anxietyStats.min}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Max</Text>
              <Text style={styles.statValue}>{anxietyStats.max}</Text>
            </View>
          </View>
          <Text style={[styles.trendText, { color: getTrendColor(anxietyStats.trend) }]}>
            Trend: {anxietyStats.trend}
          </Text>
        </View>

        {/* Stress Stats */}
        <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
          <View style={styles.statHeader}>
            <Text style={styles.statTitle}>Stress</Text>
            <Text style={styles.trendIcon}>{getTrendIcon(stressStats.trend)}</Text>
          </View>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Average</Text>
              <Text style={styles.statValue}>{stressStats.avg.toFixed(1)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Min</Text>
              <Text style={styles.statValue}>{stressStats.min}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Max</Text>
              <Text style={styles.statValue}>{stressStats.max}</Text>
            </View>
          </View>
          <Text style={[styles.trendText, { color: getTrendColor(stressStats.trend) }]}>
            Trend: {stressStats.trend}
          </Text>
        </View>
      </View>

      {/* Detailed History */}
      <View style={styles.historyContainer}>
        <Text style={styles.sectionTitle}>Complete Test History</Text>
        <Text style={styles.historySubtitle}>
          Showing {filteredHistory.length} test{filteredHistory.length !== 1 ? 's' : ''}
        </Text>
        
        {filteredHistory.map((h, idx) => (
          <View key={idx} style={styles.historyItem}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyDate}>
                {new Date(h.timestamp).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <Text style={styles.historyTime}>
                {new Date(h.timestamp).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            
            <View style={styles.historyScores}>
              <View style={styles.historyScoreItem}>
                <Text style={styles.historyScoreLabel}>Depression</Text>
                <Text style={[styles.historyScoreValue, { color: '#ef4444' }]}>
                  {h.depressionScore}
                </Text>
              </View>
              <View style={styles.historyScoreItem}>
                <Text style={styles.historyScoreLabel}>Anxiety</Text>
                <Text style={[styles.historyScoreValue, { color: '#3b82f6' }]}>
                  {h.anxietyScore}
                </Text>
              </View>
              <View style={styles.historyScoreItem}>
                <Text style={styles.historyScoreLabel}>Stress</Text>
                <Text style={[styles.historyScoreValue, { color: '#10b981' }]}>
                  {h.stressScore}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Insights */}
      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>💡 Insights & Tips</Text>
        <View style={styles.insightCard}>
          <Text style={styles.insightText}>
            • Regular testing helps you track patterns in your mental health{'\n'}
            • Aim to test weekly or bi-weekly for best insights{'\n'}
            • Notice what activities or events correlate with score changes{'\n'}
            • Share your progress with a healthcare provider if needed{'\n'}
            • Remember: these scores are tools for awareness, not diagnoses
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8fafc',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e40af',
    marginTop: 20,
    marginHorizontal: 20,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  trendCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  trendTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  trendMessage: {
    fontSize: 15,
    color: '#1e3a8a',
    lineHeight: 22,
  },
  chartContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  statCard: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  trendIcon: {
    fontSize: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  historyContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  historySubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  historyItem: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  historyDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  historyTime: {
    fontSize: 13,
    color: '#64748b',
  },
  historyScores: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  historyScoreItem: {
    alignItems: 'center',
  },
  historyScoreLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  historyScoreValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  insightsContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  insightCard: {
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  insightText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 22,
  },
});