import { GoogleGenAI, Type } from '@google/genai';
import axios from 'axios';
import { Request, Response } from 'express';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';

export const createAllTopics = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { subject } = req.body;

      if (!subject || subject.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Subject name is required'));
      }

      const response = await axios.post(
        process.env.TOPIC_LIST_URL!,
        { subject },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const topicList = response.data?.topic_list;

      if (!topicList || !Array.isArray(topicList)) {
        return res
          .status(500)
          .json(
            new ApiResponse(
              500,
              {},
              'Failed to generate topics or invalid format'
            )
          );
      }

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            subject,
            generatedTopics: topicList,
          },
          'Topics generated successfully'
        )
      );
    } catch (error) {
      console.error('Error generating topics:', error);
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : 'Internal server error';
      res.status(500).json(new ApiResponse(500, null, errorMessage));
    }
  }
);

export const generateLearningContent = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { subject, topic } = req.body;

      if (!subject || !topic) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Subject and topic are required'));
      }

      const ai = new GoogleGenAI({
        apiKey: 'AIzaSyDTGafZ-KOR2FSctp5Z0mVXozrr6jaM5pg',
      });

      const systemPrompt = `You are a Smart Study Companion for students from any academic field.
                                The user will provide both a subject and a topic. Your job is to generate clear, well-structured study notes that are easy to understand and useful for learning.

                                Guidelines for the notes:
                                - Do not need to generate greeting like here it is or ok I am okay just start with the notes.
                                - Start with a short introduction to the topic.
                                - Break the content into organized sections with headings and bullet points.
                                - Explain concepts in simple, beginner-friendly language.
                                - Include examples, formulas, or small code snippets if they are relevant.
                                - Avoid using the subject name as a heading — focus only on the topic.
                                - End with a concise summary or key takeaways.
                                - Keep the tone educational, concise, and engaging.`;

      const userPrompt = `${systemPrompt}

                        User Topic: "${topic}" and Subject: "${subject}".

                        Now, generate the study notes.`;

      const response = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of response) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ content: chunk.text })}\n\n`);
        }
      }

      res.end();
    } catch (error) {
      console.error('Error generating learning content:', error);
      res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

export const generateQuiz = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { existing_content, weakness_topics, user_query } = req.body;

      if (!existing_content || existing_content.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Existing content is required'));
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      let newlyCreatedContent = '';
      let finalContent = existing_content;

      // AGENT 1: Generate content for weakness topics if provided
      if (
        weakness_topics &&
        Array.isArray(weakness_topics) &&
        weakness_topics.length > 0
      ) {
        console.log('Agent 1: Generating content for weakness topics...');

        const contentPrompt = `You are a Smart Study Companion. Generate short, clear, and beginner-friendly study notes for the following weakness topics:

Weakness Topics: ${weakness_topics.join(', ')}

Guidelines:
- Generate comprehensive but concise study notes for each topic
- Use simple language and clear explanations
- Include examples where relevant
- Structure with headings and bullet points
- Focus on key concepts that students typically struggle with

Generate detailed study content for these topics.`;

        const contentResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contentPrompt,
        });

        newlyCreatedContent = contentResponse.text || '';
        finalContent =
          existing_content +
          '\n\n--- Additional Study Material for Weak Topics ---\n\n' +
          newlyCreatedContent;
      }

      // AGENT 2: Generate quiz based on content and requirements
      console.log('Agent 2: Generating quiz...');

      const hasWeaknessTopics =
        weakness_topics &&
        Array.isArray(weakness_topics) &&
        weakness_topics.length > 0;

      // Determine quiz length based on content
      const contentLength = finalContent.length;
      let quizLength = 5; // default
      if (contentLength > 2000) quizLength = 10;
      else if (contentLength > 1000) quizLength = 8;
      else if (contentLength > 500) quizLength = 6;

      let quizPrompt = '';

      if (hasWeaknessTopics) {
        quizPrompt = `You are a Quiz Generator. Create a quiz based on the following content with specific focus distribution:

**Final Content:** ${finalContent}

**Weakness Topics:** ${weakness_topics.join(', ')}

**User Preferences:** ${user_query || 'No specific preferences'}

**Requirements:**
- Generate ${quizLength} multiple choice questions
- 70% of questions should focus on weakness topics: ${weakness_topics.join(
          ', '
        )}
- 30% of questions should come from the original existing content
- Each question should have 4 options (A, B, C, D)
- Include the correct answer
${user_query ? `- Apply user preferences: ${user_query}` : ''}

Create a challenging but fair quiz that helps reinforce the weak areas.`;
      } else {
        quizPrompt = `You are a Quiz Generator. Create a quiz based on the following content:

**Content:** ${existing_content}

**User Preferences:** ${user_query || 'No specific preferences'}

**Requirements:**
- Generate ${quizLength} multiple choice questions based on content length
- Questions should cover the main concepts from the content
- Each question should have 4 options (A, B, C, D)
- Include the correct answer
- Mix of difficulty levels (easy, medium, hard)
${user_query ? `- Apply user preferences: ${user_query}` : ''}

Create a comprehensive quiz that tests understanding of the content.`;
      }

      const quizResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: quizPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              quiz: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: {
                      type: Type.STRING,
                    },
                    options: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.STRING,
                      },
                    },
                    answer: {
                      type: Type.STRING,
                    },
                    difficulty: {
                      type: Type.STRING,
                    },
                    topic_focus: {
                      type: Type.STRING,
                    },
                  },
                  propertyOrdering: [
                    'question',
                    'options',
                    'answer',
                    'difficulty',
                    'topic_focus',
                  ],
                },
              },
            },
            propertyOrdering: ['quiz'],
          },
        },
      });

      const quizResponseText = quizResponse.text;

      if (!quizResponseText) {
        return res
          .status(500)
          .json(new ApiResponse(500, {}, 'Failed to generate quiz'));
      }

      const generatedQuiz = JSON.parse(quizResponseText);

      // Prepare response based on whether weakness topics were provided
      const responseData = {
        existing_content,
        weakness_topics: weakness_topics || [],
        user_query: user_query || '',
        newly_created_content: newlyCreatedContent,
        merged_content: hasWeaknessTopics ? finalContent : existing_content,
        quiz: generatedQuiz.quiz,
        quiz_metadata: {
          total_questions: generatedQuiz.quiz.length,
          has_weakness_focus: hasWeaknessTopics,
          content_length_category:
            contentLength > 2000
              ? 'long'
              : contentLength > 1000
              ? 'medium'
              : 'short',
        },
      };

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            responseData,
            hasWeaknessTopics
              ? 'Quiz generated successfully with weakness topic focus'
              : 'Quiz generated successfully from existing content'
          )
        );
    } catch (error) {
      console.error('Error generating quiz:', error);
      res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);
