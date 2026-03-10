export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SaaS Starter Enhanced API',
    description:
      'Public API for SaaS Starter Enhanced. Authenticate using an API key passed via the X-API-Key header.',
    version: '1.0.0',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1',
    },
  ],
  security: [{ ApiKeyAuth: [] }],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey' as const,
        in: 'header' as const,
        name: 'X-API-Key',
      },
    },
    schemas: {
      Error: {
        type: 'object' as const,
        properties: {
          error: { type: 'string' as const },
        },
      },
      Team: {
        type: 'object' as const,
        properties: {
          id: { type: 'integer' as const },
          name: { type: 'string' as const },
          planName: { type: 'string' as const, nullable: true },
          subscriptionStatus: { type: 'string' as const, nullable: true },
          createdAt: { type: 'string' as const, format: 'date-time' },
        },
      },
      Member: {
        type: 'object' as const,
        properties: {
          id: { type: 'integer' as const },
          userId: { type: 'integer' as const },
          role: { type: 'string' as const },
          joinedAt: { type: 'string' as const, format: 'date-time' },
          user: {
            type: 'object' as const,
            properties: {
              id: { type: 'integer' as const },
              name: { type: 'string' as const, nullable: true },
              email: { type: 'string' as const },
            },
          },
        },
      },
      ActivityLog: {
        type: 'object' as const,
        properties: {
          id: { type: 'integer' as const },
          action: { type: 'string' as const },
          timestamp: { type: 'string' as const, format: 'date-time' },
          ipAddress: { type: 'string' as const, nullable: true },
          userName: { type: 'string' as const, nullable: true },
        },
      },
      UsageStats: {
        type: 'object' as const,
        properties: {
          quota: {
            type: 'object' as const,
            nullable: true,
            properties: {
              plan: { type: 'string' as const },
              monthlyTokenLimit: { type: 'integer' as const },
              tokensUsed: { type: 'integer' as const },
              resetAt: { type: 'string' as const, format: 'date-time' },
            },
          },
          recentLogs: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                id: { type: 'integer' as const },
                model: { type: 'string' as const },
                inputTokens: { type: 'integer' as const },
                outputTokens: { type: 'integer' as const },
                cost: { type: 'string' as const },
                createdAt: { type: 'string' as const, format: 'date-time' },
              },
            },
          },
        },
      },
      InviteMemberRequest: {
        type: 'object' as const,
        required: ['email', 'role'],
        properties: {
          email: { type: 'string' as const, format: 'email' },
          role: { type: 'string' as const, enum: ['member', 'owner'] },
        },
      },
    },
  },
  paths: {
    '/teams': {
      get: {
        summary: 'Get team info',
        description: 'Returns the team associated with the API key.',
        operationId: 'getTeam',
        tags: ['Teams'],
        responses: {
          '200': {
            description: 'Team info',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Team' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/members': {
      get: {
        summary: 'List team members',
        description: 'Returns all members of the team.',
        operationId: 'listMembers',
        tags: ['Members'],
        responses: {
          '200': {
            description: 'List of members',
            content: {
              'application/json': {
                schema: {
                  type: 'object' as const,
                  properties: {
                    members: {
                      type: 'array' as const,
                      items: { $ref: '#/components/schemas/Member' },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      post: {
        summary: 'Invite a member',
        description: 'Invite a new member to the team by email.',
        operationId: 'inviteMember',
        tags: ['Members'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/InviteMemberRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Invitation created',
            content: {
              'application/json': {
                schema: {
                  type: 'object' as const,
                  properties: {
                    message: { type: 'string' as const },
                    invitationId: { type: 'integer' as const },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/activity': {
      get: {
        summary: 'Get activity logs',
        description: 'Returns activity logs for the team.',
        operationId: 'getActivityLogs',
        tags: ['Activity'],
        parameters: [
          {
            name: 'limit',
            in: 'query' as const,
            description: 'Max number of logs to return (default 50)',
            schema: { type: 'integer' as const, default: 50 },
          },
        ],
        responses: {
          '200': {
            description: 'Activity logs',
            content: {
              'application/json': {
                schema: {
                  type: 'object' as const,
                  properties: {
                    logs: {
                      type: 'array' as const,
                      items: { $ref: '#/components/schemas/ActivityLog' },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/usage': {
      get: {
        summary: 'Get AI usage stats',
        description: 'Returns AI usage quota and recent usage logs for the team.',
        operationId: 'getUsageStats',
        tags: ['Usage'],
        responses: {
          '200': {
            description: 'Usage statistics',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UsageStats' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
  },
};
