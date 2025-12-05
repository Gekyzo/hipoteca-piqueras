# Propuesta de Funcionalidades: Free vs Premium

## Visión General

Modelo freemium donde las funcionalidades básicas son gratuitas y las avanzadas requieren suscripción.

---

## Plan Gratuito (Free)

### Gestión Básica de Hipoteca

- ✅ Crear y editar una hipoteca
- ✅ Registro de pagos mensuales
- ✅ Historial de pagos (últimos 12 meses)
- ✅ Tabla de amortización básica
- ✅ Cálculo de cuota mensual

### Simulador Básico

- ✅ Simulación de amortización anticipada
- ✅ Cálculo de ahorro en intereses
- ✅ Visualización de impacto en plazo

### Autenticación

- ✅ Login con email
- ✅ Login con Google
- ✅ Una cuenta por usuario

### Limitaciones del Plan Gratuito

- ❌ Solo 1 hipoteca por cuenta
- ❌ Sin exportación de datos
- ❌ Sin notificaciones
- ❌ Sin sistema de participaciones
- ❌ Sin flujo de aprobación
- ❌ Historial limitado a 12 meses
- ❌ Sin comparador de ofertas
- ❌ Sin alertas de tipo de interés

---

## Plan Premium (€4.99/mes o €39.99/año)

### Todo lo del Plan Gratuito, más:

### Gestión Avanzada

- ⭐ Múltiples hipotecas (hasta 5)
- ⭐ Historial de pagos ilimitado
- ⭐ Condiciones especiales por período (tipos promocionales, carencia)
- ⭐ Bonificaciones por productos vinculados
- ⭐ Notas y documentos adjuntos

### Sistema de Participaciones

- ⭐ División de hipoteca entre partes
- ⭐ Seguimiento individual por participante
- ⭐ Cálculo de deuda por porcentaje
- ⭐ Historial de amortizaciones por parte

### Flujo de Aprobación

- ⭐ Solicitudes de amortización anticipada
- ⭐ Panel de aprobación para prestamista
- ⭐ Historial de solicitudes
- ⭐ Notificaciones por email

### Análisis y Reportes

- ⭐ Gráficos de evolución
- ⭐ Comparativa intereses vs principal
- ⭐ Proyección de ahorro
- ⭐ Exportación a PDF/Excel

### Alertas y Notificaciones

- ⭐ Recordatorio de pago mensual
- ⭐ Alerta de cambio de tipo de interés
- ⭐ Notificación de solicitudes pendientes
- ⭐ Resumen mensual por email

### Herramientas Adicionales

- ⭐ Comparador de ofertas hipotecarias
- ⭐ Calculadora de refinanciación
- ⭐ Simulador de subrogación
- ⭐ Escenarios "what-if" múltiples

---

## Plan Profesional (€14.99/mes)

### Todo lo de Premium, más:

### Para Asesores y Gestores

- 🏆 Hipotecas ilimitadas
- 🏆 Gestión de múltiples clientes
- 🏆 Panel de administración
- 🏆 Reportes personalizados
- 🏆 API de acceso
- 🏆 Marca blanca (sin logo de la app)
- 🏆 Soporte prioritario

---

## Comparativa de Planes

| Funcionalidad           | Free     | Premium   | Pro        |
| ----------------------- | -------- | --------- | ---------- |
| Hipotecas               | 1        | 5         | ∞          |
| Historial               | 12 meses | ∞         | ∞          |
| Pagos mensuales         | ✅       | ✅        | ✅         |
| Tabla amortización      | Básica   | Completa  | Completa   |
| Simulador               | Básico   | Avanzado  | Avanzado   |
| Condiciones especiales  | ❌       | ✅        | ✅         |
| Bonificaciones          | ❌       | ✅        | ✅         |
| Sistema participaciones | ❌       | ✅        | ✅         |
| Flujo aprobación        | ❌       | ✅        | ✅         |
| Notificaciones          | ❌       | ✅        | ✅         |
| Exportación             | ❌       | ✅        | ✅         |
| Gráficos                | ❌       | ✅        | ✅         |
| Comparador ofertas      | ❌       | ✅        | ✅         |
| Multi-cliente           | ❌       | ❌        | ✅         |
| API                     | ❌       | ❌        | ✅         |
| Marca blanca            | ❌       | ❌        | ✅         |
| **Precio**              | Gratis   | €4.99/mes | €14.99/mes |

---

## Roadmap de Implementación

### Fase 1: MVP Gratuito (Actual)

- [x] Gestión básica de hipoteca
- [x] Registro de pagos
- [x] Tabla de amortización
- [x] Simulador básico
- [x] Autenticación

### Fase 2: Premium Básico

- [x] Sistema de participaciones
- [x] Flujo de aprobación
- [ ] Condiciones especiales UI
- [ ] Bonificaciones UI
- [ ] Exportación PDF

### Fase 3: Premium Completo

- [ ] Notificaciones email
- [ ] Gráficos de evolución
- [ ] Comparador de ofertas
- [ ] Alertas de tipo de interés
- [ ] Múltiples hipotecas

### Fase 4: Plan Profesional

- [ ] Gestión multi-cliente
- [ ] Panel de administración
- [ ] API REST
- [ ] Marca blanca

---

## Modelo de Monetización

### Suscripción

- Pago recurrente mensual o anual
- Descuento del 33% en plan anual
- Prueba gratuita de 14 días para Premium

### Opciones de Pago

- Tarjeta de crédito/débito
- PayPal
- Bizum (España)

### Métricas Objetivo

| Métrica                 | Objetivo      |
| ----------------------- | ------------- |
| Conversión Free→Premium | 5-10%         |
| Churn mensual           | <5%           |
| LTV Premium             | €120 (2 años) |
| CAC                     | <€20          |

---

## Funcionalidades Descartadas

Estas funcionalidades se consideraron pero no se incluirán:

| Funcionalidad            | Razón de descarte              |
| ------------------------ | ------------------------------ |
| Conexión con bancos      | Complejidad regulatoria (PSD2) |
| Pagos automáticos        | Responsabilidad legal          |
| Asesoría financiera      | Requiere licencia              |
| Marketplace de hipotecas | Fuera del scope                |

---

## Notas Técnicas

### Implementación de Planes

```typescript
type PlanType = 'free' | 'premium' | 'pro';

interface UserSubscription {
  plan: PlanType;
  expires_at: string | null;
  features: string[];
}

// Feature flags
const PREMIUM_FEATURES = [
  'multiple_mortgages',
  'shares',
  'approval_flow',
  'notifications',
  'export',
  'charts',
];
```

### Tabla Supabase

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  plan TEXT NOT NULL DEFAULT 'free',
  starts_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```
