import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TeamFlow SaaS API Documentation',
      version: '1.0.0',
      description:
        'Production-grade RESTful API for TeamFlow — modern B2B SaaS project management platform featuring real-time collaboration, multi-tenant workspace isolation, Kanban pipelines, file attachments, and analytics.',
      contact: {
        name: 'TeamFlow Engineering',
        url: 'https://github.com/TanishkaGupta2609/TeamFlow',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Local Development Server',
      },
      {
        url: 'https://teamflow-api.onrender.com/api',
        description: 'Production Cloud Server (Render)',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Provide valid JWT access token in the format: Bearer <token>',
        },
      },
      schemas: {
        StandardSuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation completed successfully' },
            data: { type: 'object' },
          },
        },
        StandardErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error description' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Invalid format' },
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6af87a24525e6bb7164eae51' },
            name: { type: 'string', example: 'Elena Rostova' },
            email: { type: 'string', example: 'elena@teamflow.io' },
            avatar: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg' },
            designation: { type: 'string', example: 'Lead Product Architect' },
            isActive: { type: 'boolean', example: true },
          },
        },
        Workspace: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6af87a25525e6bb7164eae77' },
            name: { type: 'string', example: 'TeamFlow HQ' },
            slug: { type: 'string', example: 'teamflow-hq' },
            description: { type: 'string', example: 'Core workspace organization' },
            logo: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/v1/logo.png' },
            owner: { type: 'string', example: '6af87a24525e6bb7164eae51' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6af87a26525e6bb7164eae88' },
            title: { type: 'string', example: 'Implement Authentication Pipeline' },
            description: { type: 'string', example: 'JWT tokens with refresh token rotation' },
            status: {
              type: 'string',
              enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
              example: 'IN_PROGRESS',
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
              example: 'HIGH',
            },
            position: { type: 'number', example: 1000 },
            dueDate: { type: 'string', format: 'date-time' },
            attachments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  url: { type: 'string' },
                  size: { type: 'number' },
                  mimeType: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          summary: 'Health Check Probe',
          description: 'Returns API server status, uptime, and database connection state.',
          responses: {
            200: { description: 'API is healthy and database connected.' },
          },
        },
      },
      '/auth/register': {
        post: {
          summary: 'User Registration',
          description: 'Registers a new account, generates default workspace, and sets HttpOnly refresh cookie.',
          responses: {
            201: { description: 'User account created successfully.' },
            400: { description: 'Validation failed on submitted attributes.' },
            409: { description: 'Account email already exists.' },
          },
        },
      },
      '/auth/login': {
        post: {
          summary: 'User Authentication',
          description: 'Authenticates user credentials and issues JWT access token and HttpOnly refresh cookie.',
          responses: {
            200: { description: 'Authenticated successfully.' },
            401: { description: 'Invalid email or password credentials.' },
          },
        },
      },
      '/auth/refresh': {
        post: {
          summary: 'Rotate Refresh Token',
          description: 'Exchanges refresh token for new access token with automatic reuse attack detection.',
          responses: {
            200: { description: 'New access token issued.' },
            401: { description: 'Refresh token invalid or expired.' },
            403: { description: 'Compromised token reuse detected.' },
          },
        },
      },
      '/workspaces': {
        get: {
          summary: 'List User Workspaces',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'List of workspaces user is a member of.' },
          },
        },
        post: {
          summary: 'Create New Workspace',
          security: [{ BearerAuth: [] }],
          responses: {
            201: { description: 'Workspace created successfully with creator as ADMIN.' },
          },
        },
      },
      '/workspaces/{workspaceId}/projects': {
        get: {
          summary: 'List Workspace Projects',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'List of projects in workspace.' },
            403: { description: 'Forbidden: not a workspace member.' },
          },
        },
      },
      '/workspaces/{workspaceId}/tasks': {
        get: {
          summary: 'List Workspace Tasks',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Filtered tasks list.' },
          },
        },
      },
      '/workspaces/{workspaceId}/tasks/{taskId}/move': {
        patch: {
          summary: 'Move Task (Kanban drag-and-drop)',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'taskId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Task repositioned and status updated.' },
          },
        },
      },
      '/workspaces/{workspaceId}/analytics': {
        get: {
          summary: 'Workspace Real-Time Analytics Dashboard',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Aggregated analytics: progress, distribution, velocity, and workload.' },
          },
        },
      },
      '/workspaces/{workspaceId}/calendar': {
        get: {
          summary: 'Workspace Calendar Deadlines',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Scheduled tasks and project milestones in date range.' },
          },
        },
      },
      '/upload': {
        post: {
          summary: 'Upload Generic File',
          security: [{ BearerAuth: [] }],
          responses: {
            201: { description: 'File uploaded to Cloudinary/local fallback.' },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
