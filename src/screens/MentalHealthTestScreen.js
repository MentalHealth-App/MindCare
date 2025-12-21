import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from '../components/CustomButton';
import { BASE_URL } from "../utils/api";
import { parseJwt } from '../utils/auth';
import axios from 'axios';

// Full DASS-21 Questions
const TEST_QUESTIONS = [
  // Depression subscale (Questions 3, 5, 10, 13, 16, 17, 21)
  { id: 1, question: 'I found it hard to wind down', category: 'stress', scale: [0, 1, 2, 3] },
  { id: 2, question: 'I was aware of dryness of my mouth', category: 'anxiety', scale: [0, 1, 2, 3] },
  { id: 3, question: "I couldn't seem to experience any positive feeling at all", category: 'depression', scale: [0, 1, 2, 3] },
  { id: 4, question: 'I experienced breathing difficulty (eg, excessively rapid breathing, breathlessness)', category: 'anxiety', scale: [0, 1, 2, 3] },
  { id: 5, question: 'I found it difficult to work up the initiative to do things', category: 'depression', scale: [0, 1, 2, 3] },
  { id: 6, question: 'I tended to over-react to situations', category: 'stress', scale: [0, 1, 2, 3] },
  { id: 7, question: 'I experienced trembling (eg, in the hands)', category: 'anxiety', scale: [0, 1, 2, 3] },
  { id: 8, question: 'I felt that I was using a lot of nervous energy', category: 'stress', scale: [0, 1, 2, 3] },
  { id: 9, question: 'I was worried about situations in which I might panic and make a fool of myself', category: 'anxiety', scale: [0, 1, 2, 3] },
  { id: 10, question: 'I felt that I had nothing to look forward to', category: 'depression', scale: [0, 1, 2, 3] },
  { id: 11, question: 'I found myself getting agitated', category: 'stress', scale: [0, 1, 2, 3] },
  { id: 12, question: 'I found it difficult to relax', category: 'stress', scale: [0, 1, 2, 3] },
  { id: 13, question: 'I felt down-hearted and blue', category: 'depression', scale: [0, 1, 2, 3] },
  { id: 14, question: 'I was intolerant of anything that kept me from getting on with what I was doing', category: 'stress', scale: [0, 1, 2, 3] },
  { id: 15, question: 'I felt I was close to panic', category: 'anxiety', scale: [0, 1, 2, 3] },
  { id: 16, question: 'I was unable to become enthusiastic about anything', category: 'depression', scale: [0, 1, 2, 3] },
  { id: 17, question: "I felt I wasn't worth much as a person", category: 'depression', scale: [0, 1, 2, 3] },
  { id: 18, question: 'I felt that I was rather touchy', category: 'stress', scale: [0, 1, 2, 3] },
  { id: 19, question: 'I was aware of the action of my heart in the absence of physical exertion', category: 'anxiety', scale: [0, 1, 2, 3] },
  { id: 20, question: 'I felt scared without any good reason', category: 'anxiety', scale: [0, 1, 2, 3] },
  { id: 21, question: 'I felt that life was meaningless', category: 'depression', scale: [0, 1, 2, 3] }
];

const SCALE_LABELS = [
  'Did not apply to me at all',
  'Applied to me to some degree',
  'Applied to me to a considerable degree',
  'Applied to me very much'
];

export default function MentalHealthTestScreen({ navigation, route }) {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const handleAnswer = (qid, val) => {
    setAnswers(prev => ({ ...prev, [qid]: val }));
  };

  const goToNext = () => {
    if (answers[TEST_QUESTIONS[currentQuestion].id] === undefined) {
      Alert.alert('Please select an answer', 'You must answer the current question before proceeding.');
      return;
    }
    if (currentQuestion < TEST_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Compute DASS-21 scores (multiply by 2 for full DASS-42 equivalence)
  const computeScores = () => {
    let depressionScore = 0;
    let anxietyScore = 0;
    let stressScore = 0;

    TEST_QUESTIONS.forEach(q => {
      const answer = answers[q.id] || 0;
      if (q.category === 'depression') depressionScore += answer;
      if (q.category === 'anxiety') anxietyScore += answer;
      if (q.category === 'stress') stressScore += answer;
    });

    // Multiply by 2 for DASS-42 equivalent scores
    return {
      depressionScore: depressionScore * 2,
      anxietyScore: anxietyScore * 2,
      stressScore: stressScore * 2
    };
  };

  const getSeverityLevel = (score, type) => {
    const ranges = {
      depression: [
        { max: 9, level: 'Normal' },
        { max: 13, level: 'Mild' },
        { max: 20, level: 'Moderate' },
        { max: 27, level: 'Severe' },
        { max: Infinity, level: 'Extremely Severe' }
      ],
      anxiety: [
        { max: 7, level: 'Normal' },
        { max: 9, level: 'Mild' },
        { max: 14, level: 'Moderate' },
        { max: 19, level: 'Severe' },
        { max: Infinity, level: 'Extremely Severe' }
      ],
      stress: [
        { max: 14, level: 'Normal' },
        { max: 18, level: 'Mild' },
        { max: 25, level: 'Moderate' },
        { max: 33, level: 'Severe' },
        { max: Infinity, level: 'Extremely Severe' }
      ]
    };

    const range = ranges[type].find(r => score <= r.max);
    return range ? range.level : 'Normal';
  };

  const submitTest = async () => {
    if (Object.keys(answers).length !== TEST_QUESTIONS.length) {
      Alert.alert('Incomplete Test', 'Please answer all 21 questions before submitting.');
      return;
    }

    setLoading(true);
    const { depressionScore, anxietyScore, stressScore } = computeScores();

    try {
      const token = await AsyncStorage.getItem('userToken');
      const userObj = parseJwt(token);
      const userEmail = userObj?.email;
      
      if (!userEmail) {
        throw new Error("Session invalid. Please log in again.");
      }

      await axios.post(`${BASE_URL}/mentalhealthresults`, {
        userEmail,
        answers,
        depressionScore,
        anxietyScore,
        stressScore,
        severityLevels: {
          depression: getSeverityLevel(depressionScore, 'depression'),
          anxiety: getSeverityLevel(anxietyScore, 'anxiety'),
          stress: getSeverityLevel(stressScore, 'stress')
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLoading(false);
      navigation.navigate('ResultAnalysis', {
        depressionScore,
        anxietyScore,
        stressScore,
        userEmail
      });
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', err.response?.data?.error || err.message || 'Failed to save results');
    }
  };

  const progress = ((currentQuestion + 1) / TEST_QUESTIONS.length) * 100;
  const currentQ = TEST_QUESTIONS[currentQuestion];

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Question {currentQuestion + 1} of {TEST_QUESTIONS.length}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>DASS-21 Mental Health Assessment</Text>
        <Text style={styles.subtitle}>
          Please read each statement and select a number 0, 1, 2 or 3 which indicates how much the statement applied to you over the past week.
        </Text>

        {/* Current Question */}
        <View style={styles.questionCard}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{currentQ.category.toUpperCase()}</Text>
          </View>
          
          <Text style={styles.questionNumber}>Question {currentQuestion + 1}</Text>
          <Text style={styles.questionText}>{currentQ.question}</Text>

          {/* Answer Options */}
          <View style={styles.answersContainer}>
            {currentQ.scale.map(val => (
              <TouchableOpacity
                key={val}
                style={[
                  styles.answerBtn,
                  answers[currentQ.id] === val && styles.answerActive
                ]}
                onPress={() => handleAnswer(currentQ.id, val)}
                activeOpacity={0.7}
              >
                <View style={styles.answerContent}>
                  <Text style={[
                    styles.answerValue,
                    answers[currentQ.id] === val && styles.answerValueActive
                  ]}>
                    {val}
                  </Text>
                  <Text style={[
                    styles.answerLabel,
                    answers[currentQ.id] === val && styles.answerLabelActive
                  ]}>
                    {SCALE_LABELS[val]}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, currentQuestion === 0 && styles.navButtonDisabled]}
            onPress={goToPrevious}
            disabled={currentQuestion === 0}
          >
            <Text style={styles.navButtonText}>← Previous</Text>
          </TouchableOpacity>

          {currentQuestion < TEST_QUESTIONS.length - 1 ? (
            <TouchableOpacity
              style={styles.navButton}
              onPress={goToNext}
            >
              <Text style={styles.navButtonText}>Next →</Text>
            </TouchableOpacity>
          ) : (
            <CustomButton
              title="Submit Test"
              onPress={submitTest}
              loading={loading}
              style={styles.submitButton}
            />
          )}
        </View>

        {/* Answer Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Answers Completed:</Text>
          <View style={styles.summaryDots}>
            {TEST_QUESTIONS.map((q, idx) => (
              <View
                key={q.id}
                style={[
                  styles.summaryDot,
                  answers[q.id] !== undefined && styles.summaryDotFilled,
                  idx === currentQuestion && styles.summaryDotCurrent
                ]}
              />
            ))}
          </View>
          <Text style={styles.summaryCount}>
            {Object.keys(answers).length} / {TEST_QUESTIONS.length} completed
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e7ff',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 20,
    marginHorizontal: 20,
    color: '#1e40af',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  questionCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e40af',
    letterSpacing: 0.5,
  },
  questionNumber: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    color: '#1e293b',
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: 24,
  },
  answersContainer: {
    gap: 12,
  },
  answerBtn: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    transition: 'all 0.2s',
  },
  answerActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
    elevation: 2,
  },
  answerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  answerValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#64748b',
    width: 40,
    textAlign: 'center',
  },
  answerValueActive: {
    color: '#1e40af',
  },
  answerLabel: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
    marginLeft: 12,
    lineHeight: 20,
  },
  answerLabelActive: {
    color: '#1e40af',
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#e0e7ff',
    borderRadius: 12,
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#f1f5f9',
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
  },
  submitButton: {
    flex: 1,
    marginVertical: 0,
  },
  summaryContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
  },
  summaryDots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
  },
  summaryDotFilled: {
    backgroundColor: '#22c55e',
  },
  summaryDotCurrent: {
    backgroundColor: '#3b82f6',
    transform: [{ scale: 1.5 }],
  },
  summaryCount: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
});