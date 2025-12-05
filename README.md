# Hipoteca Piqueras

Aplicación web para el seguimiento y gestión de una hipoteca compartida entre dos partes (prestamista y prestatario).

## Características

- **Seguimiento de pagos**: Registro y visualización del historial de pagos mensuales
- **Tabla de amortización**: Cálculo automático del calendario de pagos con tipos de interés variables
- **Sistema de participaciones**: División de la hipoteca entre prestamista y prestatario
- **Simulador de amortización anticipada**: Cálculo de ahorro por pagos extra
- **Flujo de aprobación**: El prestatario solicita amortizaciones que el prestamista debe aprobar
- **PWA**: Instalable como aplicación móvil

## Stack Tecnológico

- React 18 + TypeScript
- Vite
- Supabase (Auth + PostgreSQL)
- Tailwind CSS + shadcn/ui
- PWA con Service Worker

## Documentación

| Documento                                                 | Descripción                                               |
| --------------------------------------------------------- | --------------------------------------------------------- |
| [Arquitectura](docs/architecture.md)                      | Estructura del proyecto y componentes principales         |
| [Base de datos](docs/database.md)                         | Esquema, tablas y políticas RLS                           |
| [Sistema de participaciones](docs/shares.md)              | Cómo funciona la división entre prestamista y prestatario |
| [Flujo de amortización](docs/amortization.md)             | Proceso de solicitud y aprobación de amortizaciones       |
| [Configuración](docs/setup.md)                            | Instrucciones de instalación y despliegue                 |
| [Propuesta de funcionalidades](docs/features-proposal.md) | Plan Free vs Premium vs Pro                               |
| [Quality Review](docs/quality-review.md)                  | Code quality audit and recommendations                    |

## Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con las credenciales de Supabase

# Desarrollo
npm run dev

# Build de producción
npm run build
```

## Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── AuthSection.tsx
│   ├── MortgageInfo.tsx
│   ├── PaymentForm.tsx
│   ├── PaymentsList.tsx
│   ├── AmortizationSchedule.tsx
│   ├── EarlyPayoffSimulator.tsx
│   └── AmortizationRequests.tsx
├── lib/                # Utilidades
│   └── amortization.ts # Cálculos de amortización
├── i18n/               # Traducciones (español)
├── supabase.ts         # Cliente y funciones de Supabase
├── types.ts            # Tipos TypeScript
└── App.tsx             # Componente principal
```

## Roles de Usuario

- **Prestamista** (`lender`): Aprueba amortizaciones, ve todas las participaciones
- **Prestatario** (`borrower`): Solicita amortizaciones, ve su progreso

## Licencia

Proyecto privado.
