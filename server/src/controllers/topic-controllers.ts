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

export const getExternalResources = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { subject, topicList } = req.body;

      if (!subject || subject.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Subject is required'));
      }

      // Validate topicList if provided
      if (
        topicList &&
        (!Array.isArray(topicList) ||
          topicList.some(
            topic => typeof topic !== 'string' || topic.trim() === ''
          ))
      ) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              'TopicList must be an array of non-empty strings'
            )
          );
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      // Define the grounding tool for web search
      const groundingTool = {
        googleSearch: {},
      };

      // Configure generation settings
      const config = {
        tools: [groundingTool],
      };

      let topics = [];

      // Use provided topicList or generate topics
      if (topicList && Array.isArray(topicList) && topicList.length > 0) {
        console.log('Using provided topic list...');
        topics = topicList.filter(topic => topic.trim() !== '');
      } else {
        // AGENT 1: Generate topics for the subject
        console.log('Agent 1: Generating topics for the subject...');

        const topicsPrompt = `Generate a comprehensive list of important topics for the subject "${subject}".
        Focus on key learning areas, fundamental concepts, and advanced topics that students should study.
        Provide 6-10 main topics that cover the breadth of this subject.`;

        const topicsResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: topicsPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                subject: {
                  type: Type.STRING,
                },
                topics: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                  },
                },
              },
              propertyOrdering: ['subject', 'topics'],
            },
          },
        });

        const topicsData = JSON.parse(topicsResponse.text || '{}');
        topics = topicsData.topics || [];
      }

      // AGENT 2: Search for resources for each topic
      console.log('Agent 2: Searching for resources for each topic...');

      const topicResources = [];

      for (const topic of topics) {
        console.log(`Searching resources for topic: ${topic}`);

        const resourcePrompt = `Search and verify 2 best educational resources about "${topic}" in the context of "${subject}".

        Requirements for resources:
        1. One must be a video from YouTube (make sure the video exists and is accessible)
        2. One must be an article/documentation from reputable educational sites like:
           - Khan Academy (khanacademy.org)
           - MIT OpenCourseWare (ocw.mit.edu)
           - Coursera (coursera.org)
           - edX (edx.org)
           - W3Schools (w3schools.com)
           - GeeksforGeeks (geeksforgeeks.org)
           - MDN Web Docs (developer.mozilla.org)

        For each resource, verify and provide:
        1. Clear, accurate title that matches the actual content
        2. Complete, working URL (must start with https:// and be directly accessible)
        3. Type (specify if video or article/documentation)
        4. Source platform name
        5. Difficulty level (beginner/intermediate/advanced)

        IMPORTANT:
        - Verify that each URL is valid and accessible
        - For YouTube videos, use only videos from reputable educational channels
        - For articles, prefer well-established educational platforms
        - Avoid URLs that require login or paid subscriptions
        - Double-check that links are not broken or outdated

        Keep the response focused on just these two carefully verified resources.`;

        const resourceResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: resourcePrompt,
          config,
        });

        topicResources.push({
          topic: topic,
          searchResults: resourceResponse.text,
        });
      }

      // AGENT 3: Structure and organize all resources
      console.log('Agent 3: Structuring and organizing all resources...');

      const structurePrompt = `Based on the following search results for different topics under the subject "${subject}", create a well-structured list of external learning resources:

${topicResources
  .map(
    (tr, index) => `
**Topic ${index + 1}: ${tr.topic}**
${tr.searchResults}
`
  )
  .join('\n')}

Please organize these resources into a structured format with the following strict requirements:
1. Group resources by topic under the subject "${subject}"
2. For each topic, verify and include exactly 2 resources:
   - One high-quality video resource (must be a working YouTube video)
   - One high-quality article/documentation resource (from reputable educational platforms)
3. URL Validation Requirements:
   - All URLs must start with https://
   - All URLs must be complete and directly accessible
   - YouTube video URLs should be in the format: https://www.youtube.com/watch?v=VIDEO_ID
   - Documentation URLs should be from established educational platforms
   - No shortened URLs or redirects
4. Remove any duplicate resources
5. Verify each resource is directly relevant to the topic
6. Ensure each URL leads to actual educational content
7. Skip any resource if its URL cannot be verified

Structure the response as a comprehensive JSON with the subject and all its topics with their resources.`;

      const structuredResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: structurePrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: {
                type: Type.STRING,
              },
              description: {
                type: Type.STRING,
              },
              topics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic_name: {
                      type: Type.STRING,
                    },
                    description: {
                      type: Type.STRING,
                    },
                    resources: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: {
                            type: Type.STRING,
                          },
                          url: {
                            type: Type.STRING,
                          },
                          type: {
                            type: Type.STRING,
                          },
                          source: {
                            type: Type.STRING,
                          },
                          difficulty: {
                            type: Type.STRING,
                          },
                        },
                        propertyOrdering: [
                          'title',
                          'url',
                          'type',
                          'source',
                          'difficulty',
                        ],
                      },
                    },
                  },
                  propertyOrdering: ['topic_name', 'description', 'resources'],
                },
              },
              total_topics: {
                type: Type.NUMBER,
              },
              total_resources: {
                type: Type.NUMBER,
              },
              search_timestamp: {
                type: Type.STRING,
              },
            },
            propertyOrdering: [
              'subject',
              'description',
              'topics',
              'total_topics',
              'total_resources',
              'search_timestamp',
            ],
          },
        },
      });

      const structuredResponseText = structuredResponse.text;

      if (!structuredResponseText) {
        return res
          .status(500)
          .json(
            new ApiResponse(500, {}, 'Failed to generate structured resources')
          );
      }

      const structuredResources = JSON.parse(structuredResponseText);

      // Add timestamp and enhance metadata
      const enhancedResources = {
        ...structuredResources,
        subject: subject,
        search_timestamp: new Date().toISOString(),
        total_topics: structuredResources.topics?.length || 0,
        total_resources:
          structuredResources.topics?.reduce(
            (total: number, topic: any) =>
              total + (topic.resources?.length || 0),
            0
          ) || 0,
        search_metadata: {
          agents_used:
            topicList && Array.isArray(topicList) && topicList.length > 0
              ? ['resource_search', 'structuring']
              : ['topic_generation', 'resource_search', 'structuring'],
          topics_source:
            topicList && Array.isArray(topicList) && topicList.length > 0
              ? 'provided_by_user'
              : 'generated_by_ai',
          search_date: new Date().toDateString(),
          grounding_enabled: true,
          processing_time: 'Multi-agent workflow completed',
        },
      };

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            enhancedResources,
            `External resources found and structured successfully for subject: ${subject} with ${
              enhancedResources.total_topics
            } topics and ${
              enhancedResources.total_resources
            } resources. Topics were ${
              topicList && Array.isArray(topicList) && topicList.length > 0
                ? 'provided by user'
                : 'generated by AI'
            }.`
          )
        );
    } catch (error) {
      console.error('Error getting external resources:', error);
      res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

export const generateShortQuestions = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { subject, merged_content, user_query } = req.body;

      if (!subject || subject.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Subject is required'));
      }

      if (!merged_content || merged_content.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Merged content is required'));
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      console.log('Generating short questions based on content...');

      // Determine the number of questions based on content length
      const contentLength = merged_content.length;
      let questionCount = 5; // default
      if (contentLength > 3000) questionCount = 12;
      else if (contentLength > 2000) questionCount = 10;
      else if (contentLength > 1500) questionCount = 8;
      else if (contentLength > 1000) questionCount = 6;

      const questionPrompt = `You are a Smart Study Question Generator. Based on the following content about "${subject}", generate ${questionCount} short, focused questions that test understanding of key concepts.

**Subject:** ${subject}

**Content:** ${merged_content}

**User Preferences:** ${user_query || 'No specific preferences provided'}

**Requirements:**
1. Generate ${questionCount} short questions (each question should be 10-20 words maximum)
2. Questions should cover the main concepts and important details from the content
3. ${
        user_query
          ? `Incorporate user preferences: ${user_query}`
          : 'Use a balanced mix of question types'
      }
4. Mix different types of questions:
   - Definition questions (What is...?)
   - Explanation questions (Why does...? How does...?)
   - Application questions (When would you use...?)
   - Comparison questions (What's the difference between...?)
5. Ensure questions are clear, specific, and directly answerable from the content
6. Vary the difficulty levels (beginner, intermediate, advanced)
7. Focus on the most important concepts that students should understand
8. Make questions concise but comprehensive
9. Avoid yes/no questions - prefer open-ended questions that require explanation
${
  user_query
    ? `10. Prioritize topics or question styles mentioned in user preferences: "${user_query}"`
    : ''
}

Generate questions that would help students review and test their understanding of the material effectively${
        user_query
          ? `, while following the user's specific requirements: ${user_query}`
          : ''
      }.`;

      const questionResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: questionPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: {
                type: Type.STRING,
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: {
                      type: Type.STRING,
                    },
                    question_type: {
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
                    'question_type',
                    'difficulty',
                    'topic_focus',
                  ],
                },
              },
              total_questions: {
                type: Type.NUMBER,
              },
            },
            propertyOrdering: ['subject', 'questions', 'total_questions'],
          },
        },
      });

      const questionResponseText = questionResponse.text;

      if (!questionResponseText) {
        return res
          .status(500)
          .json(new ApiResponse(500, {}, 'Failed to generate questions'));
      }

      const generatedQuestions = JSON.parse(questionResponseText);

      // Prepare simplified response data
      const responseData = {
        subject,
        user_query: user_query || '',
        questions: generatedQuestions.questions,
      };

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            responseData,
            `${
              generatedQuestions.questions.length
            } short questions generated successfully for ${subject}${
              user_query ? ' with user preferences applied' : ''
            }`
          )
        );
    } catch (error) {
      console.error('Error generating short questions:', error);
      res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);
