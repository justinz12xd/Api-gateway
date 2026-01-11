# 🚀 Love4Pets API Gateway

API Gateway para centralizar el acceso a todos los microservicios de Love4Pets.

## 📋 Descripción

Este API Gateway actúa como punto de entrada único para el frontend, proporcionando:

- **Autenticación centralizada**: Validación de JWT local (Supabase)
- **Rate Limiting**: Protección contra abuso
- **Routing inteligente**: Proxy a microservicios
- **Logging centralizado**: Trazabilidad de requests
- **Health Checks**: Monitoreo de servicios

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY (:3001)                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Global Middleware                       │   │
│  │  - Helmet (Security Headers)                        │   │
│  │  - CORS                                             │   │
│  │  - Rate Limiting (ThrottlerGuard)                   │   │
│  │  - JWT Validation (JwtAuthGuard)                    │   │
│  │  - Role Authorization (RolesGuard)                  │   │
│  │  - Logging (LoggingInterceptor)                     │   │
│  │  - Error Handling (HttpExceptionFilter)             │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Proxy Routes                       │   │
│  │                                                      │   │
│  │  /auth/*     → REST API (Rust :8080)                │   │
│  │  /api/*      → REST API (Rust :8080)                │   │
│  │  /graphql    → GraphQL API (Python :8000)           │   │
│  │  /payments/* → Payments Service (Python :8001)      │   │
│  │  /health/*   → Local Health Checks                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌───────────┐   ┌───────────┐   ┌───────────┐
    │  REST API │   │  GraphQL  │   │ Payments  │
    │   :8080   │   │   :8000   │   │   :8001   │
    └───────────┘   └───────────┘   └───────────┘
```

## 🚀 Instalación

```bash
# Navegar al directorio
cd Api-gateway

# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus valores
```

## ⚙️ Configuración

### Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del gateway | `3001` |
| `NODE_ENV` | Entorno | `development` |
| `JWT_SECRET` | Secret de Supabase | requerido |
| `REST_API_URL` | URL del REST API | `http://localhost:8080` |
| `GRAPHQL_API_URL` | URL del GraphQL API | `http://localhost:8000` |
| `PAYMENTS_API_URL` | URL del Payments Service | `http://localhost:8001` |
| `WEBSOCKET_API_URL` | URL del WebSocket | `http://localhost:4000` |
| `CORS_ORIGINS` | Orígenes permitidos | `http://localhost:3000` |

## 🏃 Ejecución

```bash
# Desarrollo (con hot reload)
pnpm dev

# Producción
pnpm build
pnpm start:prod
```

## 📚 Documentación API

Swagger UI disponible en: `http://localhost:3001/docs`

## 🔐 Autenticación

El Gateway valida tokens JWT de Supabase localmente:

1. Frontend envía request con `Authorization: Bearer <token>`
2. Gateway valida firma, expiración y audience del JWT
3. Si válido, propaga el request al microservicio correspondiente
4. Headers del usuario se agregan al request proxied

### Rutas Públicas (sin token)

- `GET /health/*` - Health checks
- `POST /auth/login` - Login
- `POST /auth/register` - Registro
- `GET /api/animales` - Listar animales
- `GET /api/refugios` - Listar refugios
- `GET /api/causas-urgentes` - Listar causas urgentes
- `POST /payments/webhooks/stripe` - Webhook de Stripe

### Rutas Protegidas (requieren token)

- `POST /api/animales` - Crear animal
- `PUT /api/animales/:id` - Actualizar animal
- `POST /payments` - Crear pago
- etc.

## 📊 Rate Limiting

| Tipo | Límite | Ventana |
|------|--------|---------|
| Corto | 10 requests | 1 segundo |
| Medio | 50 requests | 10 segundos |
| Largo | 100 requests | 1 minuto |

## 🏥 Health Checks

- `GET /health` - Estado básico del Gateway
- `GET /health/all` - Estado de todos los servicios
- `GET /health/rest` - Estado del REST API
- `GET /health/graphql` - Estado del GraphQL API
- `GET /health/payments` - Estado del Payments Service

## 📁 Estructura del Proyecto

```
src/
├── main.ts                 # Bootstrap
├── app.module.ts           # Módulo principal
├── config/                 # Configuración
│   ├── env.config.ts       # Typed config
│   └── env.validation.ts   # Validación Joi
├── auth/                   # Autenticación
│   ├── strategies/         # JWT Strategy
│   ├── guards/             # Auth & Roles Guards
│   ├── decorators/         # @Public, @Roles, @CurrentUser
│   └── types/              # Tipos de usuario
├── proxy/                  # Proxy a microservicios
│   ├── controllers/        # Controladores por servicio
│   └── services/           # ProxyService
├── health/                 # Health checks
│   ├── health.controller.ts
│   └── health.module.ts
└── common/                 # Utilidades compartidas
    ├── constants/          # Constantes
    ├── interceptors/       # Logging
    └── filters/            # Exception handling
```

## 🧪 Tests

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:cov
```

## 🔧 Patrones Implementados

### Strategy Pattern
- `JwtStrategy`: Valida JWT de Supabase
- Preparado para agregar más estrategias (OAuth, API Keys)

### Adapter Pattern
- `ProxyService`: Adapta requests del Gateway a cada microservicio
- Unifica la interfaz de comunicación

### Guard Pattern (NestJS)
- `JwtAuthGuard`: Protege rutas que requieren autenticación
- `RolesGuard`: Controla acceso por rol

### Filter Pattern (NestJS)
- `HttpExceptionFilter`: Estandariza respuestas de error

## 📝 Rúbrica

Este API Gateway implementa:

- **Pilar 1**: Validación JWT local (no llama a Supabase para validar tokens)
- **Pilar 2**: Wrapper del servicio de pago a través de `/payments/*`
- **Pilar 3**: Centraliza el acceso a todos los microservicios

## 🤝 Integración con Frontend

Actualizar `.env.local` del Frontend:

```env
# Antes (conexiones directas)
NEXT_PUBLIC_REST_API_URL=http://localhost:8080
NEXT_PUBLIC_GRAPHQL_API_URL=http://localhost:8000
NEXT_PUBLIC_PAYMENTS_API_URL=http://localhost:8001

# Después (todo a través del Gateway)
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3001
```