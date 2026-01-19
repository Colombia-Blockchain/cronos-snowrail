# 🚀 Quick Start - Chat Payment System

## ✅ Implementación Completada

### Backend Services (100%)
- ✅ **PrismaService**: Conexión a PostgreSQL con Prisma ORM
- ✅ **WebSocketService**: Socket.io server con autenticación
- ✅ **ChatService**: Manejo de mensajes y comandos
- ✅ **CommandParser**: Parser completo de comandos `/pay`, `/deposit`, etc.
- ✅ **NotificationService**: Sistema de notificaciones en tiempo real

### Frontend Services (100%)
- ✅ **WebSocketClient**: Cliente Socket.io con reconexión automática
- ✅ **useWebSocket**: Hook React para WebSocket
- ✅ **useChat**: Hook para chat con React Query
- ✅ **useNotifications**: Hook para notificaciones

### API Routes (100%)
- ✅ `POST /api/chat/messages` - Enviar mensaje
- ✅ `GET /api/chat/messages` - Obtener historial
- ✅ `DELETE /api/chat/messages/:id` - Borrar mensaje
- ✅ `GET /api/notifications` - Obtener notificaciones
- ✅ `POST /api/notifications/:id/read` - Marcar como leído
- ✅ `POST /api/notifications/read-all` - Marcar todas como leídas
- ✅ `DELETE /api/notifications/:id` - Descartar notificación

## 📦 Instalación

### 1. Instalar Dependencias

```bash
# Desde la raíz del proyecto
npm install

# O instalar por separado
cd apps/backend && npm install
cd ../frontend && npm install
```

### 2. Setup PostgreSQL

#### Opción A: Docker (Recomendado)

```bash
docker run --name cronos-postgres \
  -e POSTGRES_DB=cronos_snowrail \
  -e POSTGRES_USER=cronos \
  -e POSTGRES_PASSWORD=cronos123 \
  -p 5432:5432 \
  -d postgres:16
```

#### Opción B: Local

```bash
# macOS
brew install postgresql@16
brew services start postgresql@16
createdb cronos_snowrail

# Ubuntu
sudo apt install postgresql
sudo systemctl start postgresql
sudo -u postgres createdb cronos_snowrail
```

### 3. Setup Redis (Opcional - Para múltiples servidores)

```bash
# Docker (recomendado)
docker run --name cronos-redis \
  -p 6379:6379 \
  -d redis:7-alpine

# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt install redis-server
sudo systemctl start redis
```

### 4. Configurar Variables de Entorno

#### Backend `.env`

Crea `/apps/backend/.env`:

```bash
# Wallet & Blockchain
PRIVATE_KEY=tu_private_key_aqui
RPC_URL=https://evm-t3.cronos.org
CHAIN_ID=338
SETTLEMENT_CONTRACT_ADDRESS=0xae6E14caD8D4f43947401fce0E4717b8D17b4382
MIXER_CONTRACT_ADDRESS=0xfAef6b16831d961CBd52559742eC269835FF95FF

# Database
DATABASE_URL=postgresql://cronos:cronos123@localhost:5432/cronos_snowrail

# Redis (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Auth
JWT_SECRET=tu_jwt_secret_super_secreto_aqui

# Server
PORT=4000
HOST=0.0.0.0
NODE_ENV=development
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info
```

#### Frontend `.env.local`

Crea `/apps/frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=http://localhost:4000
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=tu_walletconnect_project_id
```

### 5. Inicializar Base de Datos

```bash
cd apps/backend

# Generar Prisma client
npm run prisma:generate

# Push schema a la base de datos (desarrollo)
npm run prisma:push

# O crear migración (producción)
npm run prisma:migrate
```

## 🎯 Ejecutar el Sistema

### Opción 1: Ejecutar Todo (desde raíz)

```bash
# Terminal 1 - Backend
cd apps/backend
npm run dev

# Terminal 2 - Frontend
cd apps/frontend
npm run dev
```

### Opción 2: Desarrollo Individual

```bash
# Solo Backend (puerto 4000)
cd apps/backend
npm run dev

# Solo Frontend (puerto 3000)
cd apps/frontend
npm run dev
```

## 🧪 Probar el Sistema

### 1. Verificar Backend

```bash
# Health check
curl http://localhost:4000/health

# Readiness check
curl http://localhost:4000/health/ready
```

Deberías ver:
```json
{
  "status": "success",
  "code": "HEALTH_CHECK_OK",
  "message": "Backend server is running",
  "data": { ... }
}
```

### 2. Probar WebSocket con wscat

```bash
# Instalar wscat
npm install -g wscat

# Conectar
wscat -c ws://localhost:4000

# Autenticar
> {"type":"auth","token":"","address":"0x742d35Cc6634C0532925a3b844Bc9e7595f39dF4"}

# Deberías recibir:
< {"event":"auth:success","data":{...},"timestamp":"..."}
```

### 3. Probar Chat API

```bash
# Enviar mensaje
curl -X POST http://localhost:4000/api/chat/messages \
  -H "Content-Type: application/json" \
  -H "X-User-Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f39dF4" \
  -d '{"content":"/help"}'

# Obtener historial
curl http://localhost:4000/api/chat/messages?limit=10 \
  -H "X-User-Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f39dF4"
```

### 4. Probar Notificaciones API

```bash
# Obtener notificaciones
curl http://localhost:4000/api/notifications?limit=10 \
  -H "X-User-Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f39dF4"
```

### 5. Abrir Frontend

Navega a http://localhost:3000

## 📝 Comandos de Chat Disponibles

### Pagos
```
/pay <recipient> <amount> [currency]
/pay 0x742d35Cc6634C0532925a3b844Bc9e7595f39dF4 100 CRO

/deposit <intentId> <amount>
/deposit intent-123 100

/withdraw <noteOrIntentId>
/withdraw mixer-note-abc123

/mix <amount>
/mix 0.1
```

### B2B
```
/bulk upload
/bulk preview <batchId>
/bulk execute <batchId>
/bulk status <batchId>
```

### Info
```
/status [intentId]
/wallet
/history [limit]
/help [command]
```

## 🔧 Prisma Studio (Base de Datos GUI)

```bash
cd apps/backend
npm run prisma:studio
```

Abre http://localhost:5555 para ver y editar datos.

## 📊 Estructura de Base de Datos

```
User
├─ ChatMessage (mensajes)
├─ Notification (notificaciones)
├─ BulkBatch (lotes de pagos)
├─ Intent (intenciones de pago)
└─ MixerDeposit (depósitos privados)
```

## 🐛 Troubleshooting

### Error: "Cannot connect to database"

```bash
# Verificar PostgreSQL está corriendo
docker ps | grep postgres
# O
pg_isready

# Ver logs
docker logs cronos-postgres
```

### Error: "Module not found: Can't resolve '@prisma/client'"

```bash
cd apps/backend
npm run prisma:generate
```

### Error: "WebSocket connection failed"

1. Verificar backend está corriendo en puerto 4000
2. Verificar CORS_ALLOWED_ORIGINS incluye tu frontend URL
3. Verificar firewall no bloquea puerto 4000

### Error: "Port 4000 already in use"

```bash
# Encontrar proceso usando el puerto
lsof -ti:4000

# Matar proceso
kill -9 $(lsof -ti:4000)
```

## 📦 Archivos Creados

### Backend
```
apps/backend/
├── prisma/
│   └── schema.prisma                    ✅ Schema completo
├── src/
│   ├── services/
│   │   ├── prisma-service.ts           ✅ Conexión DB
│   │   ├── websocket-service.ts        ✅ WebSocket server
│   │   ├── chat-service.ts             ✅ Manejo de chat
│   │   ├── command-parser.ts           ✅ Parser de comandos
│   │   └── notification-service.ts     ✅ Notificaciones
│   ├── api/routes/
│   │   ├── chat.ts                     ✅ Rutas de chat
│   │   └── notifications.ts            ✅ Rutas de notificaciones
│   └── index.ts                        ✅ Actualizado
└── package.json                        ✅ Actualizado
```

### Frontend
```
apps/frontend/
├── src/
│   ├── services/
│   │   └── websocket-client.ts         ✅ Cliente WebSocket
│   └── hooks/
│       ├── use-websocket.ts            ✅ Hook WebSocket
│       ├── use-chat.ts                 ✅ Hook Chat
│       └── use-notifications.ts        ✅ Hook Notificaciones
└── package.json                        ✅ Actualizado
```

### Shared Types
```
packages/shared-types/src/
└── index.ts                            ✅ Tipos de Chat, Notifications, WS
```

### Documentación
```
docs/
├── CHAT_PAYMENT_ARCHITECTURE.md        ✅ Arquitectura completa
├── IMPLEMENTATION_GUIDE.md             ✅ Guía de implementación
CHAT_SYSTEM_SUMMARY.md                  ✅ Resumen ejecutivo
QUICK_START.md                          ✅ Este archivo
```

## 🎨 Próximos Pasos (Componentes UI)

Para completar la interfaz visual, necesitas crear:

### Componentes de Chat
1. `ChatInterface.tsx` - Contenedor principal
2. `MessageList.tsx` - Lista de mensajes
3. `MessageInput.tsx` - Input con autocompletado
4. `TransactionPreview.tsx` - Preview de transacciones

### Componentes de Notificaciones
1. `NotificationCenter.tsx` - Centro de notificaciones
2. `NotificationItem.tsx` - Item individual
3. `ToastNotification.tsx` - Toast animado
4. `NotificationBell.tsx` - Campanita con badge

### Ejemplo de Uso en Next.js

```tsx
// app/chat/page.tsx
'use client';

import { useChat } from '@/hooks/use-chat';
import { useNotifications } from '@/hooks/use-notifications';

export default function ChatPage() {
  const { messages, sendMessage, isSending } = useChat();
  const { notifications, unreadCount } = useNotifications();

  return (
    <div>
      <h1>Chat de Pagos</h1>
      <div>Notificaciones: {unreadCount}</div>

      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.content}
          </div>
        ))}
      </div>

      <button onClick={() => sendMessage('/help')}>
        Ayuda
      </button>
    </div>
  );
}
```

## 📚 Recursos

- [Documentación Prisma](https://www.prisma.io/docs)
- [Socket.io Docs](https://socket.io/docs/v4/)
- [React Query Docs](https://tanstack.com/query/latest)
- [Next.js Docs](https://nextjs.org/docs)

## 🎉 ¡Felicidades!

Has completado la implementación del sistema de chat de pagos. El backend está 100% funcional con:
- ✅ Base de datos PostgreSQL
- ✅ WebSocket en tiempo real
- ✅ Sistema de chat completo
- ✅ Notificaciones
- ✅ Hooks React listos para usar

Solo faltan los componentes UI (opcionales) para tener una interfaz visual completa.

## 🤝 Soporte

Para problemas o preguntas:
- Revisa los logs del backend
- Usa Prisma Studio para inspeccionar la DB
- Prueba con wscat para WebSocket debugging
- Consulta la documentación en `/docs`
