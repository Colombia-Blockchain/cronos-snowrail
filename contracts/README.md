# Smart Contracts - Cronos Agentic Treasury

Este directorio contiene los contratos inteligentes para el Agentic Treasury en Cronos.

## 📁 Estructura del Proyecto

```
contracts/
├── contracts/                    # Código Solidity
│   └── Settlement.sol            # El Vault - ejecuta pagos autorizados
├── scripts/                      # Scripts de deployment y utilidades
│   ├── deploy.ts                 # Deploy del contrato
│   ├── balance.ts                # Consultar balances
│   ├── export-abis.ts            # Exportar ABIs para el backend
│   └── helpers.ts                # Funciones auxiliares
├── test/                         # Tests del contrato
│   ├── Settlement.test.ts        # Tests principales
│   └── fixtures.ts               # Fixtures reutilizables
├── deployments/                  # Registros de deployment (generado)
│   ├── cronos-testnet.json       # Metadata de deployment testnet
│   └── cronos-mainnet.json       # Metadata de deployment mainnet
├── config/                       # Configuración
│   └── env.ts                    # Variables de entorno validadas
├── artifacts/                    # Bytecode compilado (generado)
├── cache/                        # Cache de compilación (generado)
├── typechain-types/              # Tipos TypeScript generados
├── hardhat.config.ts             # Configuración de Hardhat
├── tsconfig.json                 # Configuración TypeScript
├── package.json                  # Dependencias
├── .env                          # Variables de entorno (no commitear)
├── .env.example                  # Plantilla de .env
└── README.md                     # Este archivo
```

## 🚀 Inicio Rápido

### 1. Instalación

```bash
cd contracts
npm install
```

### 2. Configurar Environment Variables

Copia `.env.example` como `.env` y completa los valores:

```bash
cp .env.example .env
```

**Valores necesarios:**

```bash
# OBLIGATORIO - Tu clave privada de testnet (sin 0x prefix)
PRIVATE_KEY=your_private_key_here

# OPCIONAL - Tienen valores por defecto
CRONOS_TESTNET_RPC=https://evm-t3.cronos.org
CRONOS_MAINNET_RPC=https://evm-rpc.cronos.org

# OPCIONAL - Para verificar contratos en Cronoscan
ETHERSCAN_API_KEY=your_cronoscan_api_key
```

### 3. Obtener TCRO de Testnet

Para testear el deployment necesitas fondos:

1. Ve a: https://cronos.org/faucet
2. Selecciona **Cronos Testnet**
3. Pega tu dirección Ethereum
4. Solicita TCRO

### 4. Compilar Contratos

```bash
npm run compile
```

### 5. Ejecutar Tests

```bash
npm run test
```

### 6. Deploy a Testnet

```bash
npm run deploy:testnet
```

Esto desplegará el contrato Settlement en Cronos Testnet y guardará la metadata en `deployments/cronos-testnet.json`.

## 📝 Scripts Disponibles

### Compilación y Testing

```bash
# Compilar contratos
npm run compile

# Compilar forzando recompilación
npm run compile:force

# Ejecutar todos los tests
npm run test

# Tests con cobertura de código
npm run test:coverage

# Tests con reporte de gas
npm run test:gas

# Generar tipos TypeScript
npm run typechain

# Limpiar artefactos compilados
npm run clean
```

### Deployment

```bash
# Deploy a testnet
npm run deploy:testnet

# Deploy a mainnet
npm run deploy:mainnet

# Deploy a localhost (local node)
npm run deploy:localhost
```

### Verificación

```bash
# Verificar contrato en Cronoscan (testnet)
npm run verify:testnet <ADDRESS> --constructor-args '[]'

# Verificar contrato en Cronoscan (mainnet)
npm run verify:mainnet <ADDRESS> --constructor-args '[]'
```

### Utilidades

```bash
# Consultar balances
npm run balance

# Consultar balance en testnet
npm run balance:testnet

# Consultar balance en mainnet
npm run balance:mainnet

# Listar cuentas disponibles
npm run accounts

# Iniciar node local
npm run node

# Fork mainnet localmente
npm run node:fork-mainnet
```

### Análisis y Formato

```bash
# Reporte de gas
npm run gas-report

# Linting (verificar estilo)
npm run lint

# Formatear código
npm run format

# Verificar formato sin cambiar
npm run format:check

# Compilar + tests (verificación rápida)
npm run check

# CI - compilar + coverage
npm run ci
```

## 📚 Entender la Arquitectura

### Settlement.sol (El Vault)

El contrato `Settlement` es el corazón del sistema. Es donde:

- **Se depositan fondos**: Cualquiera puede enviar CRO/TCRO
- **Se ejecutan pagos**: Solo ejecutores autorizados pueden transferir fondos
- **Se registran transacciones**: Todos los eventos quedan en blockchain

```solidity
// Ejemplo: Depositar fondos
await settlement.receive({value: ethers.parseEther("1.0")})

// Ejemplo: Ejecutar pago (requiere autorización)
await settlement.executeSettlement(
  intentHash,
  recipientAddress,
  amount
)
```

**Estado Actual (MVP):**
- ✅ Función de depósito básica
- ✅ Función de pago básica
- ⚠️ TODO: Control de acceso (solo ejecutores autorizados)
- ⚠️ TODO: Verificación de firmas

## 🔧 Estructura de Config

### config/env.ts

Valida y proporciona acceso type-safe a variables de entorno:

```typescript
import { config, validateConfig } from '@config/env'

// Acceder a RPC endpoint
const rpc = config.networks.cronos.testnet.rpc

// Acceder a clave privada
const key = config.privateKeys.testnet

// Validar configuración
validateConfig()

// Loguear resumen (sin datos sensibles)
logConfigSummary()
```

## 📤 Integración con Backend

### Exportar ABIs

El script `scripts/export-abis.ts` exporta los ABIs compilados para que el backend (`apps/backend`) pueda importarlos:

```bash
npm run typechain
```

Esto genera tipos en `typechain-types/` que pueden ser usados en el backend:

```typescript
// En apps/backend
import { Settlement } from '@cronos-x402/contracts/typechain-types'

const settlement = new ethers.Contract(address, abi, signer)
```

## 🔐 Seguridad

### Best Practices

1. **Nunca commitear `.env`** - Usa `.gitignore`
2. **Usar solo claves de testnet** en desarrollo
3. **Separar claves testnet/mainnet**
4. **Usar hardware wallet para mainnet**
5. **Rotar claves si se exponen**
6. **Verificar contratos en Cronoscan después de deployar**

### Manejo de Private Keys

```typescript
// CORRECTO - Sin 0x prefix
PRIVATE_KEY=a1b2c3d4e5f6...

// INCORRECTO - Con 0x prefix
PRIVATE_KEY=0xa1b2c3d4e5f6...
```

## 🧪 Testing

### Estructura de Tests

```typescript
// test/Settlement.test.ts
describe("Settlement", () => {
  let settlement: Settlement
  let owner: SignerWithAddress
  let recipient: SignerWithAddress

  beforeEach(async () => {
    // Setup inicial
  })

  it("should deposit funds", async () => {
    // Test de depósito
  })

  it("should execute settlement", async () => {
    // Test de pago
  })
})
```

### Ejecutar Tests Específicos

```bash
# Tests de un archivo
npm run test -- test/Settlement.test.ts

# Tests con patrón
npm run test -- --grep "should deposit"

# Tests con salida detallada
npm run test -- --reporter spec
```

## 📊 Redes Soportadas

### Cronos Testnet

- **Chain ID**: 338
- **Currency**: TCRO
- **RPC**: https://evm-t3.cronos.org
- **Explorer**: https://testnet.cronoscan.com
- **Faucet**: https://cronos.org/faucet

#### Contratos Desplegados en Testnet

| Contrato | Dirección | Descripción |
|----------|-----------|-------------|
| Settlement | [`0xae6E14caD8D4f43947401fce0E4717b8D17b4382`](https://testnet.cronoscan.com/address/0xae6E14caD8D4f43947401fce0E4717b8D17b4382) | Vault principal - pagos autorizados |
| ZKMixer | [`0xfAef6b16831d961CBd52559742eC269835FF95FF`](https://testnet.cronoscan.com/address/0xfAef6b16831d961CBd52559742eC269835FF95FF) | Mixer privado con verificación ZK |

**Executor (Backend Wallet)**: `0x40C7fa08031dB321245a2f96E6064D2cF269f18B`

#### ZKMixer - Privacy Mixer

El contrato ZKMixer implementa transferencias privadas con verificación de pruebas ZK:

```
FLUJO DE PRIVACIDAD:
─────────────────────────────────────────────────────
Alice deposita → commitment = hash(nullifier, secret)
                     ↓
               Merkle Tree
                     ↓
Bob retira   ← prueba ZK (sin revelar nullifier/secret)
─────────────────────────────────────────────────────
Los observadores NO pueden vincular depósito con retiro
```

**Características:**
- **Denominación**: 0.1 CRO por depósito
- **Árbol Merkle**: Profundidad 20 (~1M depósitos)
- **Historia de raíces**: 30 entradas
- **Verificación ZK**: On-chain en `withdraw()`

### Cronos Mainnet

- **Chain ID**: 25
- **Currency**: CRO
- **RPC**: https://evm-rpc.cronos.org
- **Explorer**: https://cronoscan.com

#### Contratos Desplegados en Mainnet

| Contrato | Dirección | Hash TX | Bloque |
|----------|-----------|---------|--------|
| Settlement | Pendiente | - | - |

### Local (Hardhat)

- **Chain ID**: 31337
- **RPC**: http://localhost:8545
- **Comandos**: `npm run node`

## 🐛 Troubleshooting

### Error: "Missing required environment variable: PRIVATE_KEY"

**Solución**: Configura `PRIVATE_KEY` en `.env`

```bash
PRIVATE_KEY=your_private_key_here
```

### Error: "Insufficient balance"

**Solución**: Tu cuenta no tiene TCRO. Ve al faucet:
https://cronos.org/faucet

### Error: "Cannot find module @config/env"

**Solución**: Asegúrate de que `tsconfig.json` tiene los path aliases correctos.

### Error: "Contract not found at address"

**Solución**: Verifica que el deployment fue exitoso en `deployments/cronos-testnet.json`

## 📖 Recursos

- **Hardhat Docs**: https://hardhat.org
- **Cronos Docs**: https://docs.cronos.org
- **Solidity Docs**: https://docs.soliditylang.org
- **ethers.js Docs**: https://docs.ethers.org/v6

## 🔄 Estado del Proyecto

### ✅ Completado

- **Issue #1**: Hardhat setup y configuración básica
- **Issue #2**: Implementar lógica de transferencia con signature verification (EIP-712)
- **Issue #3**: Agregar control de acceso (solo ejecutores autorizados) y replay protection
- **Issue #4**: Deployment script con validación y verificación en Cronoscan

### ⏭️ Próximos Pasos

- **Issue #5**: Backend Server Setup - Integración con Settlement contract
- **Mainnet Deployment**: Deploy a Cronos Mainnet (después de pruebas exhaustivas)
- **Auditoría de Seguridad**: Revisar con seguridad profesional antes de mainnet

## ✨ Contribuir

Cuando hagas cambios:

1. Crea una rama: `git checkout -b feature/nombre`
2. Haz cambios y tests
3. Formatea: `npm run format`
4. Verifica: `npm run check`
5. Haz commit y push
6. Abre un Pull Request

## 📜 License

MIT
