import { GoogleGenAI, Type } from '@google/genai';
import { eq } from 'drizzle-orm';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { lessonsTable } from '../db/schema/tbl-lessons';
import { shortQuestionExamsTable } from '../db/schema/tbl-short-question-exams';
import { shortQuestionsTable } from '../db/schema/tbl-short-questions';
import { subjectsTable } from '../db/schema/tbl-subjects';
import { topicsTable } from '../db/schema/tbl-topics';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';

export const createShortQuestionExam = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { subjectId, weakness, user_preference } = req.body;
      const userId = req.user.userId;

      // Validation
      if (!subjectId || subjectId.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Subject ID is required'));
      }

      // Validate subject exists
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
      const topicsData = await db
        .select()
        .from(topicsTable)
        .where(eq(topicsTable.subjectId, subjectId));

      if (topicsData.length === 0) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              'No topics found for this subject. Please add topics first.'
            )
          );
      }

      // Get lessons content for all topics
      const allContent = [];
      const topicContents = [];

      for (const topic of topicsData) {
        const lessons = await db
          .select()
          .from(lessonsTable)
          .where(eq(lessonsTable.topicId, topic.topicId));

        let topicContent = '';
        if (lessons.length > 0) {
          topicContent = lessons.map(lesson => lesson.content).join('\n\n');
        } else {
          topicContent = `Topic: ${topic.title}\nDescription: ${
            topic.description || 'No description available'
          }`;
        }

        topicContents.push({
          topic: topic.title,
          difficulty: topic.difficulty,
          content: topicContent,
        });

        allContent.push(
          `**Topic: ${topic.title} (${topic.difficulty})**\n${topicContent}`
        );
      }

      const mergedContent = allContent.join('\n\n---\n\n');

      if (!mergedContent.trim()) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              'No content available to generate short questions'
            )
          );
      }

      console.log(
        `Generating short question exam for subject: ${subject.subjectName}`
      );

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      const hasWeakness = weakness && weakness.trim() !== '';
      const hasPreference = user_preference && user_preference.trim() !== '';

      // Determine question count based on content and topics
      const topicCount = topicsData.length;
      const contentLength = mergedContent.length;

      let questionCount = Math.max(5, Math.min(topicCount * 2, 15)); // 2 questions per topic, min 5, max 15
      if (contentLength > 5000) questionCount = Math.min(questionCount + 3, 20);
      else if (contentLength > 3000)
        questionCount = Math.min(questionCount + 2, 18);

      // Generate short questions prompt
      let questionPrompt = `You are a Short Question Exam Generator. Create short answer questions based on the following content from "${
        subject.subjectName
      }":

**Content:** ${mergedContent}

**Topics Covered:** ${topicsData
        .map(t => `${t.title} (${t.difficulty})`)
        .join(', ')}

${hasWeakness ? `**User Weakness Areas:** ${weakness}` : ''}
${hasPreference ? `**User Preferences:** ${user_preference}` : ''}

**Requirements:**
- Generate ${questionCount} short answer questions
- Questions should be answerable in 2-4 sentences or bullet points
- Cover all topics proportionally based on their difficulty
- Each question should have a clear, specific expected answer
- Assign appropriate marks (1-5 marks per question based on complexity)
${hasWeakness ? `- Focus more on weakness areas: ${weakness}` : ''}
${hasPreference ? `- Apply user preferences: ${user_preference}` : ''}
- Mix different question types:
  * Definition questions (What is...? Define...)
  * Explanation questions (Explain why/how...)
  * Application questions (How would you apply...?)
  * Comparison questions (Compare and contrast...)
  * Analysis questions (Analyze the relationship...)
- Ensure questions test understanding, not just memorization
- Make questions specific to the provided content

Generate questions that would effectively assess student understanding across all topics in "${
        subject.subjectName
      }".`;

      const questionResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: questionPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              exam_info: {
                type: Type.OBJECT,
                properties: {
                  subject: {
                    type: Type.STRING,
                  },
                  total_questions: {
                    type: Type.NUMBER,
                  },
                  total_marks: {
                    type: Type.NUMBER,
                  },
                },
                propertyOrdering: ['subject', 'total_questions', 'total_marks'],
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: {
                      type: Type.STRING,
                    },
                    correct_answer: {
                      type: Type.STRING,
                    },
                    max_marks: {
                      type: Type.NUMBER,
                    },
                    question_type: {
                      type: Type.STRING,
                    },
                    topic_focus: {
                      type: Type.STRING,
                    },
                  },
                  propertyOrdering: [
                    'question',
                    'correct_answer',
                    'max_marks',
                    'question_type',
                    'topic_focus',
                  ],
                },
              },
            },
            propertyOrdering: ['exam_info', 'questions'],
          },
        },
      });

      const questionResponseText = questionResponse.text;

      if (!questionResponseText) {
        return res
          .status(500)
          .json(new ApiResponse(500, {}, 'Failed to generate short questions'));
      }

      const generatedExam = JSON.parse(questionResponseText);

      // Calculate total marks
      const totalMarks = generatedExam.questions.reduce(
        (sum: number, q: any) => sum + (q.max_marks || 3),
        0
      );

      // Create exam record in database
      const examId = uuidv4();
      const examData = {
        examId,
        userId,
        subjectId,
        totalQuestions: generatedExam.questions.length,
        totalMarks,
        userScore: 0,
        isCompleted: 0,
      };

      const savedExam = await db
        .insert(shortQuestionExamsTable)
        .values(examData)
        .returning();

      // Create questions in database
      const questionsToInsert = generatedExam.questions.map((q: any) => ({
        questionId: uuidv4(),
        examId,
        question: q.question || 'Sample question',
        correctAnswer: q.correct_answer || 'Sample answer',
        userAnswer: null,
        userMarks: 0,
        maxMarks: q.max_marks || 3,
        evaluation: null,
        isAnswered: 0,
      }));

      const savedQuestions = await db
        .insert(shortQuestionsTable)
        .values(questionsToInsert)
        .returning();

      console.log(
        `Short question exam created with ID: ${examId}, Questions: ${savedQuestions.length}`
      );

      // Prepare response (don't include correct answers for security)
      const responseData = {
        exam: {
          id: savedExam[0].examId,
          userId: savedExam[0].userId,
          subjectId: savedExam[0].subjectId,
          totalQuestions: savedExam[0].totalQuestions,
          totalMarks: savedExam[0].totalMarks,
          userScore: savedExam[0].userScore,
          isCompleted: savedExam[0].isCompleted,
          createdAt: savedExam[0].createdAt,
        },
        subject: {
          id: subject.subjectId,
          name: subject.subjectName,
        },
        questions: savedQuestions.map(q => ({
          id: q.questionId,
          question: q.question,
          maxMarks: q.maxMarks,
          isAnswered: q.isAnswered === 1,
          // Don't include correctAnswer in response for security
        })),
        exam_metadata: {
          total_topics_covered: topicsData.length,
          has_weakness_focus: hasWeakness,
          has_user_preferences: hasPreference,
          content_length_category:
            contentLength > 5000
              ? 'comprehensive'
              : contentLength > 3000
              ? 'detailed'
              : contentLength > 1500
              ? 'moderate'
              : 'basic',
          weakness: weakness || '',
          user_preference: user_preference || '',
          question_distribution: topicsData.map(topic => ({
            topic: topic.title,
            difficulty: topic.difficulty,
            estimated_questions: Math.ceil(questionCount / topicsData.length),
          })),
        },
      };

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            responseData,
            `Short question exam created successfully with ${
              savedQuestions.length
            } questions covering ${topicsData.length} topics${
              hasWeakness ? ' (focused on weakness areas)' : ''
            }`
          )
        );
    } catch (error) {
      console.error('Error creating short question exam:', error);
      res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);
