# 🚀 Setup Rápido - Ver el Chat Funcionando

## Paso 1: Instalar Todo

```bash
# Desde la raíz
npm install
```

## Paso 2: PostgreSQL con Docker

```bash
docker run -d \
  --name cronos-postgres \
  -e POSTGRES_DB=cronos_snowrail \
  -e POSTGRES_USER=cronos \
  -e POSTGRES_PASSWORD=cronos123 \
  -p 5432:5432 \
  postgres:16
```

## Paso 3: Setup Base de Datos

```bash
cd apps/backend
npm run prisma:generate
npm run prisma:push
```

## Paso 4: Iniciar Backend

```bash
# Desde apps/backend
npm run dev
```

Deberías ver:
```
[INFO] [WebSocketService] Initialized
[INFO] [ChatService] Initialized
[INFO] Server running on http://0.0.0.0:4000
```

## Paso 5: Iniciar Frontend (Nueva Terminal)

```bash
cd apps/frontend
npm run dev
```

## Paso 6: Abrir el Chat

Abre en tu navegador: **http://localhost:3000/chat**

## 🎯 Probar Comandos

Una vez en la página del chat, prueba:

```
/help
/wallet
/pay 0x742d35Cc6634C0532925a3b844Bc9e7595f39dF4 100 CRO
/status
/history
```

¡Deberías ver las respuestas del sistema en tiempo real! 🎉

## ❌ Si algo no funciona:

```bash
# Verificar backend
curl http://localhost:4000/health

# Verificar PostgreSQL
docker ps | grep postgres

# Ver logs del backend
# (En la terminal donde corre el backend)
```

## 🧹 Para limpiar después:

```bash
docker stop cronos-postgres
docker rm cronos-postgres
```
