import { SwaggerUiOptions } from 'swagger-ui-express';

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Chave — Microserviço de Autenticação',
    version: '1.0.0',
    description: 'API REST para registro e autenticação de usuários via JWT.',
  },
  servers: [
    {
      url: '/api',
      description: 'Servidor local',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'usuario@email.com' },
          password: { type: 'string', format: 'password', example: 'Senha@12345' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          email: { type: 'string', example: 'usuario@email.com' },
          roles: { type: 'array', items: { type: 'string' }, example: ['geral'] },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        },
      },
      SignUpRequest: {
        type: 'object',
        required: ['name', 'birthday', 'email', 'gender', 'password', 'confirmationPassword'],
        properties: {
          name: { type: 'string', example: 'João Silva' },
          birthday: { type: 'string', format: 'date', example: '2000-05-15' },
          email: { type: 'string', format: 'email', example: 'joao@email.com' },
          gender: {
            type: 'string',
            enum: ['Masculino', 'Feminino', 'Indefinido'],
            example: 'Masculino',
          },
          password: { type: 'string', format: 'password', example: 'Senha@12345' },
          confirmationPassword: { type: 'string', format: 'password', example: 'Senha@12345' },
        },
      },
      UpdateUserRequest: {
        type: 'object',
        required: ['idUser'],
        properties: {
          idUser: { type: 'integer', example: 2 },
          name: { type: 'string', example: 'João Silva' },
          birthday: { type: 'string', format: 'date', example: '2000-05-15' },
          gender: {
            type: 'string',
            enum: ['Masculino', 'Feminino', 'Indefinido'],
            example: 'Masculino',
          },
          email: { type: 'string', format: 'email', example: 'joao@email.com' },
        },
      },
      UserIdRequest: {
        type: 'object',
        required: ['idUser'],
        properties: {
          idUser: { type: 'integer', example: 2 },
        },
      },
      UserResponse: {
        type: 'object',
        properties: {
          idUser: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'João Silva' },
          birthday: { type: 'string', format: 'date', example: '2000-05-15' },
          gender: { type: 'string', enum: ['Masculino', 'Feminino', 'Indefinido'] },
          email: { type: 'string', example: 'joao@email.com' },
          active: { type: 'boolean', example: true },
          roles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                idRole: { type: 'integer', example: 1 },
                name: { type: 'string', example: 'geral' },
                description: { type: 'string', example: 'Usuário padrão do sistema' },
                active: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
      LoggedUser: {
        type: 'object',
        properties: {
          idUser: { type: 'integer', example: 1 },
          email: { type: 'string', example: 'joao@email.com' },
          roles: { type: 'array', items: { type: 'string' }, example: ['geral'] },
        },
      },
      Error: {
        type: 'object',
        properties: {
          status: { type: 'integer', example: 500 },
          message: { type: 'string', example: 'Erro interno.' },
          error: { type: 'string' },
        },
      },
      Forbidden: {
        type: 'object',
        properties: {
          status: { type: 'integer', example: 403 },
          message: { type: 'string', example: 'Erro ao tentar realizar a operação.' },
          error: { type: 'string', example: 'Somente administradores podem realizar essa operação' },
        },
      },
      Unauthorized: {
        type: 'object',
        properties: {
          status: { type: 'integer', example: 401 },
          message: { type: 'string', example: 'Token inválido ou expirado.' },
        },
      },
    },
  },
  paths: {
    '/auth/login': {
      post: {
        tags: ['Autenticação'],
        summary: 'Login do usuário',
        description: 'Autentica o usuário com email e senha e retorna um token JWT. Limitado a 10 tentativas por 5 minutos.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Login realizado com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          400: {
            description: 'Email ou senha ausentes',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Email e senha são obrigatórios' },
                  },
                },
              },
            },
          },
          429: { description: 'Muitas tentativas — tente novamente em 5 minutos' },
          500: {
            description: 'Credenciais inválidas ou erro interno',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Error' } },
            },
          },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Autenticação'],
        summary: 'Logout do usuário',
        description: 'Invalida o token JWT atual, adicionando-o à blocklist no banco de dados. O token deixa de ser aceito imediatamente, mesmo que ainda não tenha expirado.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Logout realizado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Logout realizado com sucesso.' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Token ausente, inválido, expirado ou já revogado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } },
            },
          },
          500: {
            description: 'Erro interno ao revogar o token',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Error' } },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Autenticação'],
        summary: 'Retorna o usuário autenticado',
        description: 'Busca no banco os dados completos do usuário identificado pelo token JWT.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Dados do usuário autenticado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserResponse' },
              },
            },
          },
          401: {
            description: 'Token ausente, inválido ou expirado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'integer', example: 401 },
                    message: { type: 'string', example: 'Token inválido ou expirado.' },
                  },
                },
              },
            },
          },
          500: {
            description: 'Erro ao buscar o usuário no banco de dados',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Error' } },
            },
          },
        },
      },
    },
    '/users/sign-up': {
      post: {
        tags: ['Usuários'],
        summary: 'Cadastro de novo usuário',
        description: [
          'Cria um novo usuário com a role padrão **geral**.',
          '',
          '**Regras de validação:**',
          '- Nome: somente letras e espaços (acentos permitidos)',
          '- Data de nascimento: deve ser uma data passada',
          '- Email: formato válido e único no sistema',
          '- Senha: mínimo 10 caracteres, 1 maiúscula, 1 minúscula, 1 dígito, 1 caractere especial',
          '- Confirmação deve ser idêntica à senha',
          '',
          'Limitado a 5 cadastros por hora por IP.',
        ].join('\n'),
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SignUpRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Usuário criado com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserResponse' },
              },
            },
          },
          429: {
            description: 'Limite de cadastros atingido — tente novamente em 1 hora',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'integer', example: 429 },
                    message: { type: 'string', example: 'Limite de cadastros atingido. Tente novamente em 1 hora.' },
                  },
                },
              },
            },
          },
          500: {
            description: 'Erro de validação ou erro interno',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Error' } },
            },
          },
        },
      },
    },
    '/users/save': {
      put: {
        tags: ['Usuários'],
        summary: 'Atualiza dados de um usuário (admin)',
        description: [
          'Atualiza parcialmente os dados de qualquer usuário pelo `idUser` informado no body.',
          '',
          '**Requer perfil de administrador.**',
          '',
          'Todos os campos além de `idUser` são opcionais — apenas os enviados serão atualizados.',
          '',
          '**Regras de validação (quando o campo é enviado):**',
          '- Nome: somente letras e espaços (acentos permitidos)',
          '- Data de nascimento: deve ser uma data passada',
          '- Email: formato válido e único no sistema',
          '- Gênero: deve ser Masculino, Feminino ou Indefinido',
        ].join('\n'),
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Usuário atualizado com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserResponse' },
              },
            },
          },
          401: {
            description: 'Token ausente, inválido ou expirado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } },
            },
          },
          403: {
            description: 'Usuário autenticado não é administrador',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Forbidden' } },
            },
          },
          500: {
            description: 'Erro de validação ou erro interno',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Error' } },
            },
          },
        },
      },
    },
    '/users/all': {
      get: {
        tags: ['Usuários'],
        summary: 'Lista todos os usuários (admin)',
        description: 'Retorna a lista completa de usuários cadastrados. **Requer perfil de administrador.**',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de usuários retornada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/UserResponse' },
                },
              },
            },
          },
          401: {
            description: 'Token ausente, inválido ou expirado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } },
            },
          },
          403: {
            description: 'Usuário autenticado não é administrador',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Forbidden' } },
            },
          },
          500: {
            description: 'Erro interno',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Error' } },
            },
          },
        },
      },
    },
    '/users/copy-roles': {
      put: {
        tags: ['Usuários'],
        summary: 'Copia as roles do admin para outro usuário (admin)',
        description: [
          'Copia todas as roles do administrador autenticado para o usuário identificado por `idUser`.',
          '',
          '**Requer perfil de administrador.**',
        ].join('\n'),
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserIdRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Roles copiadas com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserResponse' },
              },
            },
          },
          401: {
            description: 'Token ausente, inválido ou expirado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } },
            },
          },
          403: {
            description: 'Usuário autenticado não é administrador',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Forbidden' } },
            },
          },
          500: {
            description: 'Usuário não encontrado ou erro interno',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Error' } },
            },
          },
        },
      },
    },
    '/users/downgrade-roles': {
      put: {
        tags: ['Usuários'],
        summary: 'Remove privilégios de um usuário (admin)',
        description: [
          'Reverte as roles do usuário identificado por `idUser` para somente a role padrão **geral**.',
          '',
          '**Requer perfil de administrador.**',
        ].join('\n'),
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserIdRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Privilégios removidos com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserResponse' },
              },
            },
          },
          401: {
            description: 'Token ausente, inválido ou expirado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } },
            },
          },
          403: {
            description: 'Usuário autenticado não é administrador',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Forbidden' } },
            },
          },
          500: {
            description: 'Usuário não encontrado ou erro interno',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Error' } },
            },
          },
        },
      },
    },
  },
};

export const swaggerUiOptions: SwaggerUiOptions = {
  customSiteTitle: 'Chave Auth API',
  swaggerOptions: {
    persistAuthorization: true,
  },
};
