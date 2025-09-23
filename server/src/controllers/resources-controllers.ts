import { GoogleGenAI, Type } from '@google/genai';
import { eq } from 'drizzle-orm';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { externalResourcesTable } from '../db/schema/tbl-external-resources';
import { subjectsTable } from '../db/schema/tbl-subjects';
import { topicsTable } from '../db/schema/tbl-topics';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';

export const CreateExternalResources = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { subjectId } = req.body;

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

      // Check if external resources already exist for this subject
      const existingResources = await db
        .select()
        .from(externalResourcesTable)
        .where(eq(externalResourcesTable.subjectId, subjectId));

      if (existingResources.length > 0) {
        console.log(
          `Found ${existingResources.length} existing external resources for subject: ${subject.subjectName}`
        );

        // Group existing resources by topic
        const resourcesByTopic: { [key: string]: any[] } = {};
        existingResources.forEach(resource => {
          if (!resourcesByTopic[resource.topicName]) {
            resourcesByTopic[resource.topicName] = [];
          }
          resourcesByTopic[resource.topicName].push({
            title: resource.resourceTitle,
            url: resource.url,
            type: resource.type,
            source: resource.source,
            difficulty: resource.difficulty,
          });
        });

        // Format existing resources to match the expected response structure
        const formattedTopics = Object.keys(resourcesByTopic).map(
          topicName => ({
            topic_name: topicName,
            description: `Existing resources for ${topicName}`,
            resources: resourcesByTopic[topicName],
          })
        );

        const existingResourcesResponse = {
          subject: subject.subjectName,
          subject_id: subjectId,
          description: `Existing external resources for ${subject.subjectName}`,
          topics: formattedTopics,
          total_topics: formattedTopics.length,
          total_resources: existingResources.length,
          saved_to_database: existingResources.length,
          search_timestamp: new Date().toISOString(),
          search_metadata: {
            agents_used: ['database_retrieval'],
            topics_source: 'fetched_from_database',
            search_date: new Date().toDateString(),
            grounding_enabled: false,
            processing_time: 'Existing resources retrieved from database',
            database_integration: true,
            is_existing_data: true,
          },
        };

        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              existingResourcesResponse,
              `External resources already exist for subject: ${subject.subjectName} with ${formattedTopics.length} topics and ${existingResources.length} resources. Retrieved from database.`
            )
          );
      }

      // No existing resources found, proceed with the original generation process
      console.log(
        `No existing resources found for subject: ${subject.subjectName}. Generating new resources...`
      );

      // Fetch all topics for this subject
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

      console.log(
        `Found ${topicsData.length} topics for subject: ${subject.subjectName}`
      );

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

      // Use the topic titles from the database
      const topics = topicsData.map(topic => topic.title);

      // AGENT 1: Search for resources for each topic
      console.log('Agent 1: Searching for resources for each topic...');

      const topicResources = [];

      for (const topic of topics) {
        console.log(`Searching resources for topic: ${topic}`);

        const resourcePrompt = `Search and verify 2 best educational resources about "${topic}" in the context of "${subject.subjectName}".

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

      // AGENT 2: Structure and organize all resources
      console.log('Agent 2: Structuring and organizing all resources...');

      const structurePrompt = `Based on the following search results for different topics under the subject "${
        subject.subjectName
      }", create a well-structured list of external learning resources:

${topicResources
  .map(
    (tr, index) => `
**Topic ${index + 1}: ${tr.topic}**
${tr.searchResults}
`
  )
  .join('\n')}

Please organize these resources into a structured format with the following strict requirements:
1. Group resources by topic under the subject "${subject.subjectName}"
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

      // AGENT 3: Save resources to database
      console.log('Agent 3: Saving resources to database...');

      const resourcesToInsert = [];

      for (const topicData of structuredResources.topics || []) {
        const topicName = topicData.topic_name;
        const topicDescription = topicData.description || '';

        for (const resource of topicData.resources || []) {
          // Map difficulty to match our enum
          let difficulty = 'beginner';
          if (resource.difficulty) {
            const diff = resource.difficulty.toLowerCase();
            if (diff.includes('intermediate') || diff.includes('medium')) {
              difficulty = 'intermediate';
            } else if (diff.includes('advanced') || diff.includes('hard')) {
              difficulty = 'advanced';
            }
          }

          resourcesToInsert.push({
            resourceId: uuidv4(),
            subjectId,
            topicName,
            description: topicDescription,
            resourceTitle: resource.title || 'Untitled Resource',
            url: resource.url || '',
            type: resource.type || 'other',
            source: resource.source || 'Unknown',
            difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
          });
        }
      }

      // Insert resources into database
      let savedResources: any[] = [];
      if (resourcesToInsert.length > 0) {
        try {
          savedResources = await db
            .insert(externalResourcesTable)
            .values(resourcesToInsert)
            .returning();

          console.log(
            `Saved ${savedResources.length} external resources to database`
          );
        } catch (dbError) {
          console.error('Error saving resources to database:', dbError);
          // Continue with the response even if database save fails
        }
      }

      // Add timestamp and enhance metadata
      const enhancedResources = {
        ...structuredResources,
        subject: subject.subjectName,
        subject_id: subjectId,
        total_topics: structuredResources.topics?.length || 0,
        total_resources:
          structuredResources.topics?.reduce(
            (total: number, topic: any) =>
              total + (topic.resources?.length || 0),
            0
          ) || 0,
        saved_to_database: savedResources.length,
        search_metadata: {
          agents_used: ['resource_search', 'structuring', 'database_storage'],
          topics_source: 'fetched_from_database',
          search_date: new Date().toDateString(),
          grounding_enabled: true,
          processing_time: 'Multi-agent workflow completed',
          database_integration: true,
          is_existing_data: false,
        },
      };

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            enhancedResources,
            `External resources found and saved successfully for subject: ${subject.subjectName} with ${enhancedResources.total_topics} topics and ${enhancedResources.total_resources} resources. ${savedResources.length} resources saved to database.`
          )
        );
    } catch (error) {
      console.error('Error getting external resources:', error);
      res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);
