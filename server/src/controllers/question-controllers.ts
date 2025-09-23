import { GoogleGenAI, Type } from '@google/genai';
import { and, eq } from 'drizzle-orm';
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

// Get all short question exams for a subject
export const getShortQuestionExams = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { subjectId } = req.params;
      const userId = req.user.userId;

      if (!subjectId || subjectId.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Subject ID is required'));
      }

      // Get subject info
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

      // Get all exams for this user and subject
      const exams = await db
        .select()
        .from(shortQuestionExamsTable)
        .where(
          and(
            eq(shortQuestionExamsTable.userId, userId),
            eq(shortQuestionExamsTable.subjectId, subjectId)
          )
        )
        .orderBy(shortQuestionExamsTable.createdAt);

      const responseData = {
        subject: {
          id: subjectData[0].subjectId,
          name: subjectData[0].subjectName,
        },
        exams: exams.map(exam => ({
          id: exam.examId,
          totalQuestions: exam.totalQuestions,
          totalMarks: exam.totalMarks,
          userScore: exam.userScore,
          isCompleted: exam.isCompleted === 1,
          createdAt: exam.createdAt,
          completedAt: exam.completedAt,
        })),
      };

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            responseData,
            'Short question exams fetched successfully'
          )
        );
    } catch (error) {
      console.error('Error fetching short question exams:', error);
      res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// Get questions for a specific exam
export const getExamQuestions = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { examId } = req.params;
      const userId = req.user.userId;

      if (!examId || examId.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Exam ID is required'));
      }

      // Verify exam belongs to user
      const examData = await db
        .select()
        .from(shortQuestionExamsTable)
        .where(
          and(
            eq(shortQuestionExamsTable.examId, examId),
            eq(shortQuestionExamsTable.userId, userId)
          )
        )
        .limit(1);

      if (examData.length === 0) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Exam not found or access denied'));
      }

      const exam = examData[0];

      // Get all questions for this exam
      const questions = await db
        .select()
        .from(shortQuestionsTable)
        .where(eq(shortQuestionsTable.examId, examId))
        .orderBy(shortQuestionsTable.createdAt);

      const responseData = {
        exam: {
          id: exam.examId,
          totalQuestions: exam.totalQuestions,
          totalMarks: exam.totalMarks,
          userScore: exam.userScore,
          isCompleted: exam.isCompleted === 1,
          createdAt: exam.createdAt,
          completedAt: exam.completedAt,
        },
        questions: questions.map(q => ({
          id: q.questionId,
          question: q.question,
          userAnswer: q.userAnswer,
          userMarks: q.userMarks,
          maxMarks: q.maxMarks,
          evaluation: q.evaluation,
          isAnswered: q.isAnswered === 1,
          // Only include correct answer if exam is completed
          ...(exam.isCompleted === 1 && { correctAnswer: q.correctAnswer }),
        })),
      };

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            responseData,
            'Exam questions fetched successfully'
          )
        );
    } catch (error) {
      console.error('Error fetching exam questions:', error);
      res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// Submit answers for an exam
export const submitExamAnswers = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { examId } = req.params;
      const { answers } = req.body; // Array of { questionId, userAnswer }
      const userId = req.user.userId;

      if (!examId || !answers || !Array.isArray(answers)) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Exam ID and answers are required'));
      }

      // Verify exam belongs to user and is not completed
      const examData = await db
        .select()
        .from(shortQuestionExamsTable)
        .where(
          and(
            eq(shortQuestionExamsTable.examId, examId),
            eq(shortQuestionExamsTable.userId, userId)
          )
        )
        .limit(1);

      if (examData.length === 0) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Exam not found or access denied'));
      }

      const exam = examData[0];

      if (exam.isCompleted === 1) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Exam is already completed'));
      }

      // Get all questions for this exam
      const questions = await db
        .select()
        .from(shortQuestionsTable)
        .where(eq(shortQuestionsTable.examId, examId));

      // Initialize AI for evaluation
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      console.log('AI Agent is evaluating exam answers...');

      // Prepare evaluation data for AI
      const evaluationData = answers
        .filter(answer => answer.userAnswer && answer.userAnswer.trim())
        .map(answer => {
          const question = questions.find(
            q => q.questionId === answer.questionId
          );
          return {
            questionId: answer.questionId,
            question: question?.question || '',
            correctAnswer: question?.correctAnswer || '',
            userAnswer: answer.userAnswer.trim(),
            maxMarks: question?.maxMarks || 3,
          };
        });

      if (evaluationData.length === 0) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'No valid answers provided'));
      }

      // Create AI evaluation prompt
      const evaluationPrompt = `You are an AI Agent Answer Evaluator. You are evaluating student answers for a short question exam.

**Evaluation Instructions:**
- Evaluate each answer based on correctness, completeness, and understanding
- Award marks based on how well the student answer matches the expected correct answer
- IMPORTANT: Always award WHOLE NUMBERS (integers) for marks - no decimals (e.g., use 2, not 1.5)
- Consider partial credit for answers that are partially correct
- Provide constructive feedback for each answer
- Be fair but maintain academic standards

**Questions and Answers to Evaluate:**
${evaluationData
  .map(
    (item, index) => `
**Question ${index + 1}:**
Question: ${item.question}
Expected Answer: ${item.correctAnswer}
Student Answer: ${item.userAnswer}
Maximum Marks: ${item.maxMarks} (award whole numbers only: 0, 1, 2, 3, etc.)
`
  )
  .join('\n')}

For each question, provide:
1. Awarded marks (0 to maximum marks - INTEGERS ONLY, no decimals)
2. Brief evaluation explaining the scoring
3. Constructive feedback for improvement (if applicable)

Evaluate based on:
- Factual accuracy
- Completeness of answer
- Understanding demonstrated
- Relevance to the question
- Clarity of explanation

CRITICAL: All awarded marks must be whole numbers (integers) - never use decimal values like 1.5, 2.3, etc.`;

      try {
        const evaluationResponse = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: evaluationPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                evaluations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      questionIndex: {
                        type: Type.NUMBER,
                      },
                      awardedMarks: {
                        type: Type.INTEGER, // Changed to INTEGER to ensure whole numbers
                      },
                      maxMarks: {
                        type: Type.INTEGER, // Changed to INTEGER for consistency
                      },
                      evaluation: {
                        type: Type.STRING,
                      },
                      feedback: {
                        type: Type.STRING,
                      },
                      strengths: {
                        type: Type.STRING,
                      },
                      improvements: {
                        type: Type.STRING,
                      },
                    },
                    propertyOrdering: [
                      'questionIndex',
                      'awardedMarks',
                      'maxMarks',
                      'evaluation',
                      'feedback',
                      'strengths',
                      'improvements',
                    ],
                  },
                },
                overall_performance: {
                  type: Type.OBJECT,
                  properties: {
                    totalScore: {
                      type: Type.INTEGER, // Changed to INTEGER for consistency
                    },
                    totalMarks: {
                      type: Type.INTEGER, // Changed to INTEGER for consistency
                    },
                    percentage: {
                      type: Type.INTEGER, // Changed to INTEGER for consistency (0-100)
                    },
                    grade: {
                      type: Type.STRING,
                    },
                    overallFeedback: {
                      type: Type.STRING,
                    },
                  },
                  propertyOrdering: [
                    'totalScore',
                    'totalMarks',
                    'percentage',
                    'grade',
                    'overallFeedback',
                  ],
                },
              },
              propertyOrdering: ['evaluations', 'overall_performance'],
            },
          },
        });

        const evaluationResponseText = evaluationResponse.text;
        if (!evaluationResponseText) {
          throw new Error('AI evaluation response is empty');
        }

        const evaluationResult = JSON.parse(evaluationResponseText);
        console.log('AI Agent has completed answer evaluation');

        // Update each question with AI evaluation results
        let totalUserScore = 0;
        const updatedQuestions = [];

        for (let i = 0; i < evaluationData.length; i++) {
          const evaluation = evaluationResult.evaluations[i];
          const questionData = evaluationData[i];

          if (evaluation) {
            // Ensure userMarks is an integer (round decimal values)
            const userMarks = Math.min(
              Math.max(0, Math.round(evaluation.awardedMarks || 0)),
              questionData.maxMarks
            );
            totalUserScore += userMarks;

            // Create comprehensive feedback
            const fullEvaluation = `${evaluation.evaluation || ''}\n\n${
              evaluation.feedback || ''
            }${
              evaluation.strengths
                ? `\n\nStrengths: ${evaluation.strengths}`
                : ''
            }${
              evaluation.improvements
                ? `\n\nArea for improvement: ${evaluation.improvements}`
                : ''
            }`.trim();

            // Update question in database
            await db
              .update(shortQuestionsTable)
              .set({
                userAnswer: questionData.userAnswer,
                userMarks,
                evaluation: fullEvaluation,
                isAnswered: 1,
                updatedAt: new Date(),
              })
              .where(
                eq(shortQuestionsTable.questionId, questionData.questionId)
              );

            updatedQuestions.push({
              questionId: questionData.questionId,
              userMarks,
              maxMarks: questionData.maxMarks,
              evaluation: fullEvaluation,
            });
          }
        }

        // Use AI's overall performance or calculate if not provided
        if (evaluationResult.overall_performance) {
          totalUserScore = evaluationResult.overall_performance.totalScore;
        }

        // Update exam as completed
        await db
          .update(shortQuestionExamsTable)
          .set({
            userScore: totalUserScore,
            isCompleted: 1,
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(shortQuestionExamsTable.examId, examId));

        const responseData = {
          examId,
          totalScore: totalUserScore,
          totalMarks: exam.totalMarks,
          percentage: Math.round((totalUserScore / exam.totalMarks) * 100),
          answeredQuestions: updatedQuestions.length,
          totalQuestions: exam.totalQuestions,
          questions: updatedQuestions,
          evaluationMethod: 'AI-powered',
          overallFeedback:
            evaluationResult.overall_performance?.overallFeedback ||
            'Evaluation completed successfully',
        };

        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              responseData,
              `Exam submitted successfully! Score: ${totalUserScore}/${exam.totalMarks} (AI Evaluated)`
            )
          );
      } catch (aiError) {
        console.error(
          'AI evaluation failed, falling back to basic scoring:',
          aiError
        );

        // Fallback to basic keyword matching if AI fails
        let totalUserScore = 0;
        const updatedQuestions = [];

        for (const answer of answers) {
          const question = questions.find(
            q => q.questionId === answer.questionId
          );
          if (question && answer.userAnswer && answer.userAnswer.trim()) {
            const userAnswerLower = answer.userAnswer.toLowerCase();
            const correctAnswerLower = question.correctAnswer.toLowerCase();

            let userMarks = 0;
            const correctWords = correctAnswerLower
              .split(/\s+/)
              .filter(word => word.length > 2);
            const userWords = userAnswerLower.split(/\s+/);

            let matchingWords = 0;
            for (const correctWord of correctWords) {
              if (
                userWords.some(
                  (userWord: string) =>
                    userWord.includes(correctWord) ||
                    correctWord.includes(userWord)
                )
              ) {
                matchingWords++;
              }
            }

            const matchPercentage =
              correctWords.length > 0 ? matchingWords / correctWords.length : 0;
            if (matchPercentage > 0.7) userMarks = question.maxMarks;
            else if (matchPercentage > 0.5)
              userMarks = Math.ceil(question.maxMarks * 0.7);
            else if (matchPercentage > 0.3)
              userMarks = Math.ceil(question.maxMarks * 0.5);
            else if (matchPercentage > 0)
              userMarks = Math.ceil(question.maxMarks * 0.3);

            totalUserScore += userMarks;

            // Update question
            await db
              .update(shortQuestionsTable)
              .set({
                userAnswer: answer.userAnswer,
                userMarks,
                evaluation: `Basic evaluation: ${Math.round(
                  matchPercentage * 100
                )}% keyword match`,
                isAnswered: 1,
                updatedAt: new Date(),
              })
              .where(eq(shortQuestionsTable.questionId, answer.questionId));

            updatedQuestions.push({
              questionId: answer.questionId,
              userMarks,
              maxMarks: question.maxMarks,
            });
          }
        }

        // Update exam as completed
        await db
          .update(shortQuestionExamsTable)
          .set({
            userScore: totalUserScore,
            isCompleted: 1,
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(shortQuestionExamsTable.examId, examId));

        const responseData = {
          examId,
          totalScore: totalUserScore,
          totalMarks: exam.totalMarks,
          percentage: Math.round((totalUserScore / exam.totalMarks) * 100),
          answeredQuestions: updatedQuestions.length,
          totalQuestions: exam.totalQuestions,
          questions: updatedQuestions,
          evaluationMethod: 'Basic keyword matching',
          overallFeedback:
            'Evaluation completed using basic keyword matching due to AI service unavailability',
        };

        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              responseData,
              `Exam submitted successfully! Score: ${totalUserScore}/${exam.totalMarks} (Basic Evaluation)`
            )
          );
      }
    } catch (error) {
      console.error('Error submitting exam answers:', error);
      res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

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
        `AI Agent is gathering content for subject: ${subject.subjectName}`
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

      console.log(
        `AI Agent is analyzing content and generating ${questionCount} questions...`
      );

      // Generate short questions prompt
      let questionPrompt = `You are an AI Agent Short Question Exam Generator. You have analyzed the content from "${
        subject.subjectName
      }" and are now generating thoughtful short answer questions.

**Content Analysis Complete:** ${mergedContent}

**Topics Covered:** ${topicsData
        .map(t => `${t.title} (${t.difficulty})`)
        .join(', ')}

${hasWeakness ? `**Identified Weakness Areas:** ${weakness}` : ''}
${hasPreference ? `**User Learning Preferences:** ${user_preference}` : ''}

**AI Agent Instructions:**
- Generate ${questionCount} high-quality short answer questions
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

Generate an exam that effectively assesses student understanding across all topics in "${
        subject.subjectName
      }".`;

      const questionResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
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
          .json(
            new ApiResponse(500, {}, 'AI Agent failed to generate questions')
          );
      }

      console.log('AI Agent has successfully generated the exam questions');

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
          generation_process: {
            stage_1: 'Content analysis complete',
            stage_2: 'Topics and difficulty mapping finished',
            stage_3: 'Question generation successful',
            stage_4: 'Exam structure finalized',
          },
        },
      };

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            responseData,
            `AI Agent successfully created exam with ${
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
