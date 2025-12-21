import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { BarChart, PieChart } from "react-native-chart-kit";
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from '../components/CustomButton';
import { BASE_URL } from "../utils/api";
import { parseJwt } from '../utils/auth';
import axios from 'axios';

const screenWidth = Dimensions.get('window').width;

export default function ResultAnalysisScreen({ navigation, route }) {
  const { depressionScore, anxietyScore, stressScore, userEmail } = route?.params || {};
  const [history, setHistory] = useState([]);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('userToken');
      const userObj = parseJwt(token);
      const email = userObj?.email;

      axios.get(`${BASE_URL}/mentalhealthresults/${email}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => setHistory(res.data))
        .catch(() => {});
    })();
  }, []);

  const getSeverityLevel = (score, type) => {
    const ranges = {
      depression: [
        { max: 9, level: 'Normal', color: '#22c55e', description: 'No significant depression symptoms' },
        { max: 13, level: 'Mild', color: '#84cc16', description: 'Some mild depression symptoms present' },
        { max: 20, level: 'Moderate', color: '#eab308', description: 'Moderate depression - consider seeking support' },
        { max: 27, level: 'Severe', color: '#f97316', description: 'Severe depression - professional help recommended' },
        { max: Infinity, level: 'Extremely Severe', color: '#ef4444', description: 'Extremely severe - immediate professional help needed' }
      ],
      anxiety: [
        { max: 7, level: 'Normal', color: '#22c55e', description: 'No significant anxiety symptoms' },
        { max: 9, level: 'Mild', color: '#84cc16', description: 'Some mild anxiety symptoms present' },
        { max: 14, level: 'Moderate', color: '#eab308', description: 'Moderate anxiety - consider coping strategies' },
        { max: 19, level: 'Severe', color: '#f97316', description: 'Severe anxiety - professional help recommended' },
        { max: Infinity, level: 'Extremely Severe', color: '#ef4444', description: 'Extremely severe - immediate professional help needed' }
      ],
      stress: [
        { max: 14, level: 'Normal', color: '#22c55e', description: 'Normal stress levels' },
        { max: 18, level: 'Mild', color: '#84cc16', description: 'Mild stress - manageable with self-care' },
        { max: 25, level: 'Moderate', color: '#eab308', description: 'Moderate stress - implement stress management' },
        { max: 33, level: 'Severe', color: '#f97316', description: 'Severe stress - seek support and reduce workload' },
        { max: Infinity, level: 'Extremely Severe', color: '#ef4444', description: 'Extremely severe - immediate intervention needed' }
      ]
    };

    const range = ranges[type].find(r => score <= r.max);
    return range || ranges[type][0];
  };

  const depressionLevel = getSeverityLevel(depressionScore, 'depression');
  const anxietyLevel = getSeverityLevel(anxietyScore, 'anxiety');
  const stressLevel = getSeverityLevel(stressScore, 'stress');

  // Prepare data for pie chart
  const totalScore = depressionScore + anxietyScore + stressScore;
  const pieData = [
    {
      name: 'Depression',
      score: depressionScore,
      color: '#ef4444',
      legendFontColor: '#1e293b',
      legendFontSize: 14,
    },
    {
      name: 'Anxiety',
      score: anxietyScore,
      color: '#3b82f6',
      legendFontColor: '#1e293b',
      legendFontSize: 14,
    },
    {
      name: 'Stress',
      score: stressScore,
      color: '#10b981',
      legendFontColor: '#1e293b',
      legendFontSize: 14,
    },
  ];

  const getRecommendations = (severity) => {
    if (severity === 'Normal') {
      return [
        '✓ Continue maintaining healthy habits',
        '✓ Regular exercise and good sleep',
        '✓ Stay connected with loved ones',
        '✓ Practice gratitude and mindfulness'
      ];
    } else if (severity === 'Mild') {
      return [
        '• Monitor your symptoms regularly',
        '• Practice relaxation techniques',
        '• Maintain a consistent routine',
        '• Engage in enjoyable activities',
        '• Consider talking to someone you trust'
      ];
    } else if (severity === 'Moderate') {
      return [
        '⚠ Consider professional counseling',
        '⚠ Practice stress management techniques',
        '⚠ Regular physical activity is important',
        '⚠ Limit caffeine and alcohol',
        '⚠ Maintain social connections'
      ];
    } else {
      return [
        '⚠️ SEEK PROFESSIONAL HELP IMMEDIATELY',
        '⚠️ Contact a mental health professional',
        '⚠️ Reach out to trusted friends/family',
        '⚠️ Consider crisis hotlines if needed',
        '⚠️ Do not isolate yourself'
      ];
    }
  };

  const getOverallAssessment = () => {
    const severityScores = {
      'Normal': 0,
      'Mild': 1,
      'Moderate': 2,
      'Severe': 3,
      'Extremely Severe': 4
    };

    const avgSeverity = (
      severityScores[depressionLevel.level] +
      severityScores[anxietyLevel.level] +
      severityScores[stressLevel.level]
    ) / 3;

    if (avgSeverity < 1) {
      return {
        title: 'Good Mental Health',
        message: 'Your overall mental health appears to be in a healthy range. Keep up the good work with your self-care practices!',
        color: '#22c55e'
      };
    } else if (avgSeverity < 2) {
      return {
        title: 'Mild Concerns',
        message: 'You are experiencing some mild symptoms. This is a good time to focus on self-care and stress management techniques.',
        color: '#eab308'
      };
    } else if (avgSeverity < 3) {
      return {
        title: 'Moderate Concerns',
        message: 'Your symptoms suggest moderate distress. We strongly recommend speaking with a mental health professional for support.',
        color: '#f97316'
      };
    } else {
      return {
        title: 'Significant Concerns',
        message: 'Your results indicate significant distress. Please seek professional help as soon as possible. You don\'t have to face this alone.',
        color: '#ef4444'
      };
    }
  };

  const overallAssessment = getOverallAssessment();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Mental Health Analysis</Text>
      <Text style={styles.dateText}>
        Completed: {new Date().toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })}
      </Text>

      {/* Overall Assessment Card */}
      <View style={[styles.overallCard, { borderLeftColor: overallAssessment.color }]}>
        <Text style={[styles.overallTitle, { color: overallAssessment.color }]}>
          {overallAssessment.title}
        </Text>
        <Text style={styles.overallMessage}>{overallAssessment.message}</Text>
      </View>

      {/* Bar Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Your Scores</Text>
        <BarChart
          data={{
            labels: ["Depression", "Anxiety", "Stress"],
            datasets: [{ 
              data: [depressionScore || 0, anxietyScore || 0, stressScore || 0] 
            }]
          }}
          width={screenWidth - 40}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#f0f9ff',
            backgroundGradientTo: '#e0f2fe',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            labelColor: () => '#1e40af',
            style: { borderRadius: 16 },
            propsForLabels: {
              fontSize: 12,
              fontWeight: '600',
            },
          }}
          style={styles.chart}
          showValuesOnTopOfBars
          fromZero
        />
      </View>

      {/* Pie Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Score Distribution</Text>
        <PieChart
          data={pieData}
          width={screenWidth - 40}
          height={200}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="score"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
          style={styles.pieChart}
        />
      </View>

      {/* Detailed Results */}
      <View style={styles.detailsContainer}>
        {/* Depression */}
        <View style={[styles.resultCard, { borderLeftColor: depressionLevel.color }]}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultCategory}>Depression</Text>
            <View style={[styles.severityBadge, { backgroundColor: depressionLevel.color }]}>
              <Text style={styles.severityText}>{depressionLevel.level}</Text>
            </View>
          </View>
          <Text style={styles.scoreText}>Score: {depressionScore} / 42</Text>
          <Text style={styles.descriptionText}>{depressionLevel.description}</Text>
          <View style={styles.recommendationsContainer}>
            {getRecommendations(depressionLevel.level).map((rec, idx) => (
              <Text key={idx} style={styles.recommendation}>{rec}</Text>
            ))}
          </View>
        </View>

        {/* Anxiety */}
        <View style={[styles.resultCard, { borderLeftColor: anxietyLevel.color }]}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultCategory}>Anxiety</Text>
            <View style={[styles.severityBadge, { backgroundColor: anxietyLevel.color }]}>
              <Text style={styles.severityText}>{anxietyLevel.level}</Text>
            </View>
          </View>
          <Text style={styles.scoreText}>Score: {anxietyScore} / 42</Text>
          <Text style={styles.descriptionText}>{anxietyLevel.description}</Text>
          <View style={styles.recommendationsContainer}>
            {getRecommendations(anxietyLevel.level).map((rec, idx) => (
              <Text key={idx} style={styles.recommendation}>{rec}</Text>
            ))}
          </View>
        </View>

        {/* Stress */}
        <View style={[styles.resultCard, { borderLeftColor: stressLevel.color }]}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultCategory}>Stress</Text>
            <View style={[styles.severityBadge, { backgroundColor: stressLevel.color }]}>
              <Text style={styles.severityText}>{stressLevel.level}</Text>
            </View>
          </View>
          <Text style={styles.scoreText}>Score: {stressScore} / 42</Text>
          <Text style={styles.descriptionText}>{stressLevel.description}</Text>
          <View style={styles.recommendationsContainer}>
            {getRecommendations(stressLevel.level).map((rec, idx) => (
              <Text key={idx} style={styles.recommendation}>{rec}</Text>
            ))}
          </View>
        </View>
      </View>

      {/* Crisis Resources */}
      <View style={styles.crisisCard}>
        <Text style={styles.crisisTitle}>🆘 Need Immediate Help?</Text>
        <Text style={styles.crisisText}>
          National Suicide Prevention Lifeline: 988{'\n'}
          Crisis Text Line: Text HOME to 741741{'\n'}
          International Association for Suicide Prevention: iasp.info
        </Text>
      </View>

      {/* Recent History */}
      {history.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Recent Test History</Text>
          {history.slice(0, 5).map((h, idx) => (
            <View key={idx} style={styles.historyItem}>
              <Text style={styles.historyDate}>
                {new Date(h.timestamp).toLocaleDateString()}
              </Text>
              <View style={styles.historyScores}>
                <Text style={styles.historyScore}>D: {h.depressionScore}</Text>
                <Text style={styles.historyScore}>A: {h.anxietyScore}</Text>
                <Text style={styles.historyScore}>S: {h.stressScore}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <CustomButton
          title="View Full History"
          onPress={() => navigation.navigate('History')}
          style={styles.button}
        />
        <CustomButton
          title="Get Personalized Activities"
          onPress={() => navigation.navigate('Activities', {
            depressionScore,
            anxietyScore,
            stressScore,
            mood: overallAssessment.title
          })}
          style={styles.button}
        />
        <CustomButton
          title="Back to Home"
          onPress={() => navigation.navigate('Home')}
          style={[styles.button, styles.secondaryButton]}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e40af',
    marginTop: 20,
    marginHorizontal: 20,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  overallCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderLeftWidth: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  overallTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  overallMessage: {
    fontSize: 15,
    color: '#475569',
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
  pieChart: {
    marginVertical: 8,
  },
  detailsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  resultCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultCategory: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  recommendationsContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  recommendation: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 6,
    lineHeight: 18,
  },
  crisisCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  crisisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 8,
  },
  crisisText: {
    fontSize: 14,
    color: '#7f1d1d',
    lineHeight: 22,
  },
  historyContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  historyScores: {
    flexDirection: 'row',
    gap: 12,
  },
  historyScore: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  buttonContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  button: {
    marginVertical: 6,
  },
  secondaryButton: {
    backgroundColor: '#64748b',
  },
});