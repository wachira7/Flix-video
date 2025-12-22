const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FlixVideo API Documentation',
      version: '1.0.0',
      description: 'AI-Powered Movie & TV Show Discovery Platform API',
      contact: {
        name: 'WaruTech',
        email: 'waruterewachira7@gmail.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server'
      },
      {
        url: 'https://api.flixvideo.com',
        description: 'Production Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            username: { type: 'string' },
            full_name: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin', 'moderator'] },
            status: { type: 'string', enum: ['active', 'suspended', 'deleted'] },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Movies', description: 'Movie content endpoints' },
      { name: 'TV Shows', description: 'TV show content endpoints' },
      { name: 'Search', description: 'Content search endpoints' },
      { name: 'Recommendations', description: 'AI-powered recommendations' },
      { name: 'Social', description: 'Social features (lists, reviews, etc.)' },
      { name: 'Payments', description: 'Payment and subscription endpoints' }
    ]
  },
  apis: ['./src/api/routes/*.js', './src/api/controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
