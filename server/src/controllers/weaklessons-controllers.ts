import { GoogleGenAI } from '@google/genai';
import { and, eq } from 'drizzle-orm';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { quizQuestionsTable } from '../db/schema/tbl-quiz-questions';
import { quizResultsTable } from '../db/schema/tbl-quiz-results';
import { quizzesTable } from '../db/schema/tbl-quizzes';
import { subjectsTable } from '../db/schema/tbl-subjects';
import { topicsTable } from '../db/schema/tbl-topics';
import { weakLessonsTable } from '../db/schema/tbl-weak-lessons';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';

// Helper function to generate study schedule recommendations
const generateStudySchedule = async (
  genAI: any,
  weakTopics: any[],
  totalStudyTime: string,
  subjectName: string
) => {
  if (weakTopics.length === 0) return null;

  const schedulePrompt = `Create a personalized study schedule for a student who needs to improve in these topics:

SUBJECT: ${subjectName}
WEAK TOPICS: ${weakTopics
    .map(topic => `${topic.title} (${topic.averagePerformance}%)`)
    .join(', ')}
ESTIMATED TOTAL TIME: ${totalStudyTime}
NUMBER OF TOPICS: ${weakTopics.length}

Create a realistic weekly study schedule that:
1. Prioritizes topics based on performance (worst performance first)
2. Balances daily study time (30-60 minutes per session)
3. Includes review and practice time
4. Provides specific daily goals

REQUIRED OUTPUT FORMAT:
{
  "weeklySchedule": {
    "totalWeeks": 2,
    "studyDaysPerWeek": 5,
    "averageDailyTime": "45 minutes",
    "week1": {
      "monday": {"topic": "Topic Name", "activities": ["Activity 1", "Activity 2"], "duration": "45 min"},
      "tuesday": {"topic": "Topic Name", "activities": ["Activity 1", "Activity 2"], "duration": "30 min"},
      "wednesday": {"topic": "Topic Name", "activities": ["Activity 1", "Activity 2"], "duration": "60 min"},
      "thursday": {"topic": "Topic Name", "activities": ["Activity 1", "Activity 2"], "duration": "45 min"},
      "friday": {"topic": "Review", "activities": ["Review all topics", "Practice questions"], "duration": "30 min"}
    },
    "week2": {
      "monday": {"topic": "Topic Name", "activities": ["Advanced practice", "Self-assessment"], "duration": "45 min"},
      "tuesday": {"topic": "Topic Name", "activities": ["Problem solving", "Review mistakes"], "duration": "45 min"},
      "wednesday": {"topic": "Topic Name", "activities": ["Concept reinforcement"], "duration": "30 min"},
      "thursday": {"topic": "Mixed Review", "activities": ["All topics review", "Practice test"], "duration": "60 min"},
      "friday": {"topic": "Final Assessment", "activities": ["Self-evaluation", "Next steps planning"], "duration": "30 min"}
    }
  },
  "studyTips": [
    "Tip 1 for effective studying",
    "Tip 2 for retention",
    "Tip 3 for practice"
  ],
  "milestones": [
    {"week": 1, "goal": "Complete concept review for all weak topics"},
    {"week": 2, "goal": "Achieve 75%+ accuracy in practice questions"}
  ]
}

Return ONLY the JSON response.`;

  try {
    const scheduleResult = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: schedulePrompt,
    });

    const scheduleText = scheduleResult.text;
    const cleanedScheduleResponse = (scheduleText || '')
      .replace(/```json|```/g, '')
      .trim();
    return JSON.parse(cleanedScheduleResponse);
  } catch (error) {
    console.error('Error generating study schedule:', error);
    return null;
  }
};
const generatePracticeQuestions = async (
  genAI: any,
  weakTopic: any,
  subjectName: string,
  userMistakes: string[]
) => {
  const practicePrompt = `Generate 5 practice questions for a student struggling with this topic:

SUBJECT: ${subjectName}
TOPIC: ${weakTopic.title}
DIFFICULTY: ${weakTopic.difficulty}
STUDENT'S COMMON MISTAKES: ${userMistakes.join(', ')}

Generate questions that specifically address the student's weak areas and common mistakes.
Include a mix of difficulty levels (2 easy, 2 medium, 1 challenging).

REQUIRED OUTPUT FORMAT:
{
  "practiceQuestions": [
    {
      "question": "Question text",
      "options": {
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
      },
      "correctAnswer": "A",
      "explanation": "Detailed explanation of why this is correct",
      "difficulty": "Easy/Medium/Hard",
      "targetedWeakness": "What specific weakness this addresses"
    }
  ]
}

Return ONLY the JSON response.`;

  try {
    const practiceResult = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: practicePrompt,
    });

    const practiceText = practiceResult.text;
    const cleanedPracticeResponse = (practiceText || '')
      .replace(/```json|```/g, '')
      .trim();
    return JSON.parse(cleanedPracticeResponse);
  } catch (error) {
    console.error('Error generating practice questions:', error);
    return { practiceQuestions: [] };
  }
};

export const generateWeakLessons = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { subjectId } = req.params;
      const userId = req.user.userId;

      // Validate subjectId
      if (!subjectId || subjectId.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Subject ID is required'));
      }

      console.log(
        `Generating weak lessons for user ${userId}, subject ${subjectId}`
      );

      // Verify subject exists
      const subjectData = await db
        .select()
        .from(subjectsTable)
        .where(eq(subjectsTable.subjectId, subjectId))
        .limit(1);

      if (subjectData.length === 0) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Subject not found'));
      }

      const subject = subjectData[0];

      // Get all topics for this subject
      const topics = await db
        .select()
        .from(topicsTable)
        .where(eq(topicsTable.subjectId, subjectId));

      if (topics.length === 0) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'No topics found for this subject'));
      }

      console.log(
        `Found ${topics.length} topics for subject: ${subject.subjectName}`
      );

      // Get all quiz attempts with detailed question analysis
      const userQuizData = await db
        .select({
          quizId: quizzesTable.quizId,
          topicId: quizzesTable.topicId,
          topicTitle: topicsTable.title,
          topicDescription: topicsTable.description,
          topicDifficulty: topicsTable.difficulty,
          score: quizResultsTable.score,
          totalMarks: quizResultsTable.totalMarks,
          completedAt: quizResultsTable.completedAt,
        })
        .from(quizzesTable)
        .innerJoin(topicsTable, eq(quizzesTable.topicId, topicsTable.topicId))
        .leftJoin(
          quizResultsTable,
          eq(quizzesTable.quizId, quizResultsTable.quizId)
        )
        .where(
          and(
            eq(quizzesTable.userId, userId),
            eq(quizzesTable.subjectId, subjectId)
          )
        );

      console.log(
        `Found ${userQuizData.length} quiz attempts by user for this subject`
      );

      if (userQuizData.length === 0) {
        return res.status(200).json(
          new ApiResponse(
            200,
            {
              subject: {
                id: subject.subjectId,
                name: subject.subjectName,
              },
              analysis: {
                totalTopics: topics.length,
                attemptedTopics: 0,
                weakTopics: 0,
                message:
                  'No quiz attempts found for this subject. Please complete some quizzes first to identify weak areas.',
              },
              topics: topics.map(topic => ({
                topicId: topic.topicId,
                title: topic.title,
                description: topic.description || 'No description available',
                difficulty: topic.difficulty,
                hasAttempts: false,
              })),
              weakTopics: [],
            },
            'No quiz attempts found for analysis'
          )
        );
      }

      // Get detailed question analysis for all attempted quizzes
      console.log(
        'Getting detailed question analysis for weakness detection...'
      );

      interface QuizAnalysisData {
        quizId: string;
        topicId: string | null;
        topicTitle: string | null;
        topicDescription: string | null;
        topicDifficulty: string | null;
        completedAt: Date | null;
        totalQuestions: number;
        correctAnswers: number;
        percentage: number;
        questions: Array<{
          question: string;
          optionA: string | null;
          optionB: string | null;
          optionC: string | null;
          optionD: string | null;
          correctAnswer: string;
          userChoice: string | null;
          isCorrect: boolean;
          difficulty: string | null;
        }>;
      }

      const quizAnalysisData: QuizAnalysisData[] = [];

      for (const quiz of userQuizData) {
        if (!quiz.quizId) continue; // Skip if no quiz result exists

        console.log(
          `Analyzing quiz ${quiz.quizId} for topic: ${quiz.topicTitle}`
        );

        // Get all questions for this quiz with user answers
        const questionsWithAnswers = await db
          .select()
          .from(quizQuestionsTable)
          .where(eq(quizQuestionsTable.quizId, quiz.quizId));

        console.log(
          `Found ${questionsWithAnswers.length} questions for this quiz`
        );

        // Analyze each question
        const questionAnalysis = questionsWithAnswers.map(q => ({
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          userChoice: q.userChoice || 'No answer provided',
          isCorrect: q.userChoice === q.correctAnswer,
          difficulty: q.difficulty,
        }));

        const correctAnswers = questionAnalysis.filter(q => q.isCorrect).length;
        const totalQuestions = questionAnalysis.length;
        const percentage =
          totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

        console.log(
          `Quiz performance: ${correctAnswers}/${totalQuestions} = ${percentage.toFixed(
            1
          )}%`
        );

        quizAnalysisData.push({
          quizId: quiz.quizId,
          topicId: quiz.topicId,
          topicTitle: quiz.topicTitle,
          topicDescription: quiz.topicDescription,
          topicDifficulty: quiz.topicDifficulty,
          completedAt: quiz.completedAt,
          totalQuestions: totalQuestions,
          correctAnswers: correctAnswers,
          percentage: Math.round(percentage),
          questions: questionAnalysis,
        });
      }

      if (quizAnalysisData.length === 0) {
        return res.status(200).json(
          new ApiResponse(
            200,
            {
              subject: {
                id: subject.subjectId,
                name: subject.subjectName,
              },
              analysis: {
                totalTopics: topics.length,
                attemptedTopics: 0,
                weakTopics: 0,
                message: 'No completed quizzes found for analysis.',
              },
              weakTopics: [],
            },
            'No completed quizzes found for analysis'
          )
        );
      }

      console.log(
        `Sending ${quizAnalysisData.length} quiz analyses to LLM for weakness detection...`
      );

      // Generate LLM prompt with quiz analysis data
      const prompt = `You are an expert educational analyst. Analyze the student's quiz performance data and identify weak areas that need remedial study.

SUBJECT: ${subject.subjectName}
TOTAL TOPICS AVAILABLE: ${topics.length}
TOPICS ATTEMPTED: ${quizAnalysisData.length}

DETAILED QUIZ ANALYSIS:
${quizAnalysisData
  .map(
    (quiz, index) => `
=== Quiz ${index + 1}: ${quiz.topicTitle} ===
Topic Description: ${quiz.topicDescription || 'No description available'}
Topic Difficulty: ${quiz.topicDifficulty}
Overall Performance: ${quiz.correctAnswers}/${quiz.totalQuestions} = ${
      quiz.percentage
    }%
Completed: ${
      quiz.completedAt
        ? new Date(quiz.completedAt).toLocaleDateString()
        : 'Unknown date'
    }

QUESTION-BY-QUESTION ANALYSIS:
${quiz.questions
  .map(
    (q, qIndex) => `
Question ${qIndex + 1}: ${q.question}
A) ${q.optionA}
B) ${q.optionB}
C) ${q.optionC}
D) ${q.optionD}
Correct Answer: ${q.correctAnswer}
User Answer: ${q.userChoice}
Result: ${q.isCorrect ? '✅ CORRECT' : '❌ WRONG'}
Difficulty: ${q.difficulty}
`
  )
  .join('')}
---
`
  )
  .join('')}

UNATTEMPTED TOPICS:
${topics
  .filter(
    topic => !quizAnalysisData.some(quiz => quiz.topicId === topic.topicId)
  )
  .map(
    topic => `
- ${topic.title}: ${topic.description || 'No description'} (Difficulty: ${
      topic.difficulty
    })
`
  )
  .join('')}

ANALYSIS INSTRUCTIONS:
1. Identify topics where the student performed poorly (< 60% correct)
2. Look for patterns in wrong answers to identify conceptual gaps
3. Consider question difficulty levels when assessing performance
4. For each weak area identified, provide specific remedial recommendations
5. If performance is good across all topics (≥75% average), indicate no major weaknesses found

REQUIRED OUTPUT FORMAT:
{
  "analysis": {
    "totalTopics": ${topics.length},
    "attemptedTopics": ${quizAnalysisData.length},
    "averageOverallPerformance": [calculate average percentage across all quizzes],
    "performanceSummary": "[brief summary of student's performance]"
  },
  "weakTopics": [
    {
      "topicId": "topic_id",
      "title": "Topic Name",
      "description": "Topic description",
      "difficulty": "Easy/Medium/Hard",
      "averagePerformance": [percentage score],
      "problemAreas": "[specific areas where student struggled]",
      "remedialRecommendations": "[specific study recommendations]"
    }
  ],
  "attemptedTopics": [
    {
      "topicId": "topic_id",
      "title": "Topic Name",
      "performance": [percentage],
      "isWeak": [true/false]
    }
  ],
  "unattemptedTopics": [
    {
      "topicId": "topic_id",
      "title": "Topic Name",
      "difficulty": "Easy/Medium/Hard",
      "status": "not_attempted"
    }
  ]
}

Return ONLY the JSON response, no additional text.`;

      console.log('Sending analysis request to LLM...');

      // Send to LLM for analysis
      const genAI = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY!,
      });

      const result = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      const analysisText = result.text;

      console.log('Received LLM analysis response');

      let analysisData;
      try {
        // Clean the response and parse JSON
        const cleanedResponse = (analysisText || '')
          .replace(/```json|```/g, '')
          .trim();
        analysisData = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('Error parsing LLM response:', parseError);
        console.log('Raw LLM response:', analysisText);
        throw new Error('Failed to parse weakness analysis from LLM');
      }

      console.log(
        `LLM identified ${analysisData.weakTopics?.length || 0} weak topics`
      );

      // Generate detailed remedial lessons for weak topics
      let detailedRemedialLessons = [];
      if (analysisData.weakTopics?.length > 0) {
        console.log('Generating detailed remedial lessons for weak topics...');

        for (const weakTopic of analysisData.weakTopics) {
          console.log(`Generating remedial content for: ${weakTopic.title}`);

          // Extract user mistakes for this topic
          const topicQuizData = quizAnalysisData.filter(
            quiz => quiz.topicId === weakTopic.topicId
          );
          const userMistakes = topicQuizData.flatMap(quiz =>
            quiz.questions
              .filter(q => !q.isCorrect)
              .map(
                q =>
                  `Question: ${q.question.substring(0, 100)}... | User chose: ${
                    q.userChoice
                  } | Correct: ${q.correctAnswer}`
              )
          );

          const remedialPrompt = `You are an expert educational content creator. Generate a comprehensive remedial study plan for a student who is struggling with this topic.

SUBJECT: ${subject.subjectName}
WEAK TOPIC: ${weakTopic.title}
DESCRIPTION: ${weakTopic.description || 'No description available'}
DIFFICULTY LEVEL: ${weakTopic.difficulty}
STUDENT'S PERFORMANCE: ${weakTopic.averagePerformance}%
PROBLEM AREAS: ${weakTopic.problemAreas}
CURRENT RECOMMENDATIONS: ${weakTopic.remedialRecommendations}

STUDENT'S SPECIFIC MISTAKES FROM QUIZ ANALYSIS:
${userMistakes.join('\n')}

Generate a detailed remedial lesson that includes:

1. **Concept Review**: Break down the core concepts the student needs to understand
2. **Step-by-Step Learning Path**: Ordered steps to master this topic
3. **Practice Exercises**: Specific types of questions/problems to practice
4. **Common Mistakes to Avoid**: Based on the student's quiz errors
5. **Study Resources**: Suggested resources, videos, or materials
6. **Self-Assessment Questions**: Questions to test understanding
7. **Time Allocation**: Recommended study time distribution

REQUIRED OUTPUT FORMAT:
{
  "topicId": "${weakTopic.topicId}",
  "title": "${weakTopic.title}",
  "difficulty": "${weakTopic.difficulty}",
  "performance": ${weakTopic.averagePerformance},
  "conceptReview": {
    "coreConceptsToReview": ["concept1", "concept2", "concept3"],
    "fundamentalPrinciples": "Detailed explanation of fundamental principles",
    "keyTermsAndDefinitions": [
      {"term": "term1", "definition": "definition1"},
      {"term": "term2", "definition": "definition2"}
    ]
  },
  "learningPath": {
    "step1": {"title": "Step Title", "description": "What to do", "timeRequired": "30 minutes"},
    "step2": {"title": "Step Title", "description": "What to do", "timeRequired": "45 minutes"},
    "step3": {"title": "Step Title", "description": "What to do", "timeRequired": "60 minutes"}
  },
  "practiceExercises": {
    "basicLevel": ["exercise1", "exercise2", "exercise3"],
    "intermediateLevel": ["exercise1", "exercise2"],
    "advancedLevel": ["exercise1", "exercise2"]
  },
  "commonMistakes": [
    {"mistake": "Common mistake description", "correction": "How to avoid/correct it"},
    {"mistake": "Another mistake", "correction": "Correction approach"}
  ],
  "studyResources": {
    "recommendedReadings": ["resource1", "resource2"],
    "videoLessons": ["video topic 1", "video topic 2"],
    "onlinePractice": ["practice site/method 1", "practice site/method 2"]
  },
  "selfAssessment": [
    {"question": "Assessment question 1", "expectedAnswer": "What they should know"},
    {"question": "Assessment question 2", "expectedAnswer": "What they should know"}
  ],
  "timeAllocation": {
    "totalRecommendedTime": "4-6 hours over 1 week",
    "dailyStudyTime": "30-45 minutes per day",
    "breakdown": {
      "conceptReview": "1-2 hours",
      "practiceExercises": "2-3 hours",
      "selfAssessment": "1 hour"
    }
  }
}

Return ONLY the JSON response, no additional text.`;

          try {
            const remedialResult = await genAI.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: remedialPrompt,
            });

            const remedialText = remedialResult.text;
            const cleanedRemedialResponse = (remedialText || '')
              .replace(/```json|```/g, '')
              .trim();
            const remedialLesson = JSON.parse(cleanedRemedialResponse);

            // Generate additional practice questions
            console.log(
              `Generating practice questions for: ${weakTopic.title}`
            );
            const practiceQuestions = await generatePracticeQuestions(
              genAI,
              weakTopic,
              subject.subjectName,
              userMistakes
            );

            // Combine remedial lesson with practice questions
            const completeLesson = {
              ...remedialLesson,
              additionalPracticeQuestions:
                practiceQuestions.practiceQuestions || [],
              mistakeAnalysis:
                userMistakes.length > 0
                  ? {
                      totalMistakes: userMistakes.length,
                      commonErrorPatterns: userMistakes.slice(0, 3), // Show top 3 mistakes
                      improvementFocus: `Focus on understanding ${weakTopic.problemAreas}`,
                    }
                  : null,
            };

            detailedRemedialLessons.push(completeLesson);
            console.log(
              `Generated complete remedial lesson for: ${weakTopic.title}`
            );
          } catch (error) {
            console.error(
              `Error generating remedial lesson for ${weakTopic.title}:`,
              error
            );
            // Add a basic fallback lesson
            detailedRemedialLessons.push({
              topicId: weakTopic.topicId,
              title: weakTopic.title,
              difficulty: weakTopic.difficulty,
              performance: weakTopic.averagePerformance,
              error: 'Failed to generate detailed remedial lesson',
              basicRecommendations: weakTopic.remedialRecommendations,
            });
          }
        }

        console.log(`\n=== REMEDIAL LESSON GENERATION SUMMARY ===`);
        console.log(
          `Total weak topics identified: ${
            analysisData.weakTopics?.length || 0
          }`
        );
        console.log(
          `Detailed lessons generated: ${detailedRemedialLessons.length}`
        );
        console.log(
          `Total practice questions created: ${detailedRemedialLessons.reduce(
            (total, lesson) =>
              total + (lesson.additionalPracticeQuestions?.length || 0),
            0
          )}`
        );
        console.log(
          `Average study time required: ${detailedRemedialLessons.length * 4}-${
            detailedRemedialLessons.length * 6
          } hours`
        );
        console.log(`==========================================\n`);
      }

      // Generate personalized study schedule
      let personalizedSchedule = null;
      if (detailedRemedialLessons.length > 0) {
        console.log('Generating personalized study schedule...');
        personalizedSchedule = await generateStudySchedule(
          genAI,
          analysisData.weakTopics,
          `${detailedRemedialLessons.length * 4}-${
            detailedRemedialLessons.length * 6
          } hours`,
          subject.subjectName
        );

        if (personalizedSchedule) {
          console.log('Study schedule generated successfully');
        }
      }

      // Create the lesson record in database
      const lessonId = uuidv4();
      const currentTime = new Date();

      const weakLessonData = {
        lessonId,
        userId,
        subject: {
          id: subject.subjectId,
          name: subject.subjectName,
        },
        analysis: analysisData.analysis,
        weakTopics: analysisData.weakTopics || [],
        attemptedTopics: analysisData.attemptedTopics || [],
        unattemptedTopics: analysisData.unattemptedTopics || [],
        detailedRemedialLessons: detailedRemedialLessons,
        personalizedStudySchedule: personalizedSchedule,
        remedialSummary: {
          totalWeakTopics: analysisData.weakTopics?.length || 0,
          detailedLessonsGenerated: detailedRemedialLessons.length,
          totalPracticeQuestions: detailedRemedialLessons.reduce(
            (total, lesson) =>
              total + (lesson.additionalPracticeQuestions?.length || 0),
            0
          ),
          averageStudyTimeRequired:
            detailedRemedialLessons.length > 0
              ? `${detailedRemedialLessons.length * 4}-${
                  detailedRemedialLessons.length * 6
                } hours total`
              : 'No study time needed',
          message:
            detailedRemedialLessons.length > 0
              ? `Generated ${detailedRemedialLessons.length} comprehensive remedial lessons with step-by-step learning paths, practice exercises, and personalized study resources.`
              : 'No detailed remedial lessons needed.',
        },
        remedialContent:
          analysisData.weakTopics?.length > 0
            ? `Based on your quiz performance analysis, here are the areas that need improvement:\n\n${analysisData.weakTopics
                .map(
                  (topic: any, index: number) =>
                    `${index + 1}. **${topic.title}** (${
                      topic.averagePerformance
                    }% average)\n   - Problem Areas: ${
                      topic.problemAreas
                    }\n   - Recommendations: ${topic.remedialRecommendations}\n`
                )
                .join('\n')}`
            : 'Excellent performance! No significant weaknesses detected in your quiz attempts.',
        generatedAt: currentTime.toISOString(),
      };

      // Save to database
      await db.insert(weakLessonsTable).values({
        weakLessonId: lessonId,
        userId: userId,
        subjectId: subjectId,
        lessonContent: JSON.stringify(weakLessonData),
        createdAt: currentTime,
        updatedAt: currentTime,
      });

      console.log('Weakness analysis saved to database');

      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            weakLessonData,
            analysisData.weakTopics?.length > 0
              ? `Comprehensive weakness analysis complete! Found ${
                  analysisData.weakTopics.length
                } areas needing improvement with ${
                  detailedRemedialLessons.length
                } detailed remedial lessons and ${detailedRemedialLessons.reduce(
                  (total, lesson) =>
                    total + (lesson.additionalPracticeQuestions?.length || 0),
                  0
                )} personalized practice questions.`
              : 'Analysis complete! No significant weaknesses detected based on your quiz performance.'
          )
        );
    } catch (error) {
      console.error('Error generating weak lessons:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

export const getUserWeakLessons = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { subjectId } = req.params;
      const userId = req.user.userId;

      console.log(
        `Getting weak lessons for user ${userId}, subject ${subjectId}`
      );

      let whereConditions;
      if (subjectId === 'all') {
        whereConditions = eq(weakLessonsTable.userId, userId);
      } else {
        whereConditions = and(
          eq(weakLessonsTable.userId, userId),
          eq(weakLessonsTable.subjectId, subjectId)
        );
      }

      const weakLessons = await db
        .select({
          weakLessonId: weakLessonsTable.weakLessonId,
          lessonContent: weakLessonsTable.lessonContent,
          createdAt: weakLessonsTable.createdAt,
          updatedAt: weakLessonsTable.updatedAt,
          subjectName: subjectsTable.subjectName,
        })
        .from(weakLessonsTable)
        .innerJoin(
          subjectsTable,
          eq(weakLessonsTable.subjectId, subjectsTable.subjectId)
        )
        .where(whereConditions);

      if (weakLessons.length === 0) {
        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              { lessons: [] },
              subjectId === 'all'
                ? 'No weak lessons found for any subject'
                : 'No weak lessons found for this subject'
            )
          );
      }

      // Parse lesson content and format response
      const formattedLessons = weakLessons.map(lesson => {
        let parsedContent;
        try {
          parsedContent = JSON.parse(lesson.lessonContent);
        } catch (error) {
          console.error('Error parsing lesson content:', error);
          parsedContent = { error: 'Failed to parse lesson content' };
        }

        return {
          id: lesson.weakLessonId,
          userId: userId,
          subject: {
            name: lesson.subjectName,
          },
          content: parsedContent,
          createdAt: lesson.createdAt,
          updatedAt: lesson.updatedAt,
        };
      });

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { lessons: formattedLessons },
            `Found ${formattedLessons.length} weak lesson(s)`
          )
        );
    } catch (error) {
      console.error('Error getting user weak lessons:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

export const regenerateLatestWeakLessons = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { subjectId } = req.body;
      const userId = req.user.userId;

      console.log(
        `Regenerating latest weak lessons for user ${userId}, subject ${subjectId}`
      );

      // This will follow similar logic to generateWeakLessons but focus on latest performance
      // For now, let's just call the generate function
      // You can enhance this later to focus on recent attempts only
      req.params.subjectId = subjectId;
      return await generateWeakLessons(req, res, next);
    } catch (error) {
      console.error('Error regenerating latest weak lessons:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);
