-- Mortgage Payments Tracker Schema
-- Sistema de seguimiento de pagos de hipoteca

-- Tabla de formas de pago
CREATE TABLE payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,                                                    -- Nombre de la forma de pago (ej: transferencia, efectivo, cheque)
  description TEXT,                                                             -- Descripción adicional
  active BOOLEAN DEFAULT TRUE,                                                  -- Si la forma de pago está activa
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()                             -- Fecha de creación del registro
);

-- Insertar formas de pago comunes
INSERT INTO payment_methods (name, description) VALUES
  ('transferencia', 'Transferencia bancaria'),
  ('efectivo', 'Pago en efectivo'),
  ('cheque', 'Pago con cheque'),
  ('bizum', 'Pago por Bizum');

-- Tabla principal de pagos
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,                              -- Usuario propietario del registro
  payment_date DATE NOT NULL,                                                   -- Fecha del pago
  amount DECIMAL(12, 2) NOT NULL,                                               -- Monto total del pago
  principal DECIMAL(12, 2),                                                     -- Parte del pago destinada al capital
  interest DECIMAL(12, 2),                                                      -- Parte del pago destinada a intereses
  extra_payment DECIMAL(12, 2) DEFAULT 0,                                       -- Pago adicional al capital
  remaining_balance DECIMAL(12, 2),                                             -- Saldo pendiente después del pago
  payment_number INTEGER,                                                       -- Número de cuota
  notes TEXT,                                                                   -- Notas u observaciones
  payment_method_id UUID REFERENCES payment_methods(id),                        -- Forma de pago utilizada
  created_by TEXT NOT NULL CHECK (created_by IN ('borrower', 'lender')),        -- Quién registró el pago: prestatario o prestamista
  lender_confirmed BOOLEAN DEFAULT FALSE,                                       -- Confirmación del prestamista
  lender_confirmed_at TIMESTAMP WITH TIME ZONE,                                 -- Fecha de confirmación del prestamista
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()                             -- Fecha de creación del registro
);

-- Enable Row Level Security
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Payment methods are public (read-only for authenticated users)
CREATE POLICY "Allow read for authenticated users" ON payment_methods
  FOR SELECT TO authenticated USING (true);

-- Payments: users can only access their own data
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON payments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments" ON payments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payments" ON payments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Optional: Index for faster queries by date
CREATE INDEX idx_payments_date ON payments(payment_date DESC);

-- Tabla de hipotecas
CREATE TABLE mortgages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,                              -- Usuario propietario del registro
  total_amount DECIMAL(12, 2) NOT NULL,                                         -- Monto total de la hipoteca
  interest_rate DECIMAL(5, 3) NOT NULL,                                         -- Tasa de interés anual (ej: 3.500)
  start_date DATE NOT NULL,                                                     -- Fecha de inicio de la hipoteca
  term_months INTEGER NOT NULL,                                                 -- Plazo en meses
  monthly_payment DECIMAL(12, 2) NOT NULL,                                      -- Cuota mensual
  notes TEXT,                                                                   -- Notas u observaciones
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),                            -- Fecha de creación del registro
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()                             -- Fecha de última actualización
);

-- Enable Row Level Security for mortgages
ALTER TABLE mortgages ENABLE ROW LEVEL SECURITY;

-- Mortgages: users can only access their own data
CREATE POLICY "Users can view own mortgages" ON mortgages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mortgages" ON mortgages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mortgages" ON mortgages
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mortgages" ON mortgages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trigger to update updated_at on mortgages
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mortgages_updated_at
  BEFORE UPDATE ON mortgages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabla de condiciones especiales de hipoteca
CREATE TABLE mortgage_conditions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mortgage_id UUID REFERENCES mortgages(id) ON DELETE CASCADE NOT NULL,          -- Hipoteca a la que pertenece
  condition_type TEXT NOT NULL CHECK (condition_type IN ('promotional_rate', 'fixed_rate_period', 'grace_period', 'other')),
  interest_rate DECIMAL(5, 3),                                                    -- Tasa de interés especial (si aplica)
  start_month INTEGER NOT NULL DEFAULT 1,                                         -- Mes de inicio (1 = primer mes)
  end_month INTEGER NOT NULL,                                                     -- Mes de finalización
  description TEXT,                                                               -- Descripción de la condición
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for mortgage_conditions
ALTER TABLE mortgage_conditions ENABLE ROW LEVEL SECURITY;

-- Mortgage conditions: users can only access conditions of their own mortgages
CREATE POLICY "Users can view own mortgage conditions" ON mortgage_conditions
  FOR SELECT TO authenticated
  USING (mortgage_id IN (SELECT id FROM mortgages WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own mortgage conditions" ON mortgage_conditions
  FOR INSERT TO authenticated
  WITH CHECK (mortgage_id IN (SELECT id FROM mortgages WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own mortgage conditions" ON mortgage_conditions
  FOR UPDATE TO authenticated
  USING (mortgage_id IN (SELECT id FROM mortgages WHERE user_id = auth.uid()))
  WITH CHECK (mortgage_id IN (SELECT id FROM mortgages WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own mortgage conditions" ON mortgage_conditions
  FOR DELETE TO authenticated
  USING (mortgage_id IN (SELECT id FROM mortgages WHERE user_id = auth.uid()));

-- Index for faster queries by mortgage_id
CREATE INDEX idx_mortgage_conditions_mortgage_id ON mortgage_conditions(mortgage_id);

-- Tabla de bonificaciones de hipoteca (descuentos permanentes en la tasa)
CREATE TABLE mortgage_bonifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mortgage_id UUID REFERENCES mortgages(id) ON DELETE CASCADE NOT NULL,          -- Hipoteca a la que pertenece
  bonification_type TEXT NOT NULL CHECK (bonification_type IN ('payroll', 'home_insurance', 'life_insurance', 'pension_fund', 'credit_card', 'direct_debit', 'other')),
  rate_reduction DECIMAL(5, 3) NOT NULL,                                          -- Reducción de tasa (ej: 0.40 para -0.40%)
  description TEXT,                                                               -- Descripción de la bonificación
  is_active BOOLEAN DEFAULT TRUE,                                                 -- Si la bonificación está activa
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for mortgage_bonifications
ALTER TABLE mortgage_bonifications ENABLE ROW LEVEL SECURITY;

-- Mortgage bonifications: users can only access bonifications of their own mortgages
CREATE POLICY "Users can view own mortgage bonifications" ON mortgage_bonifications
  FOR SELECT TO authenticated
  USING (mortgage_id IN (SELECT id FROM mortgages WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own mortgage bonifications" ON mortgage_bonifications
  FOR INSERT TO authenticated
  WITH CHECK (mortgage_id IN (SELECT id FROM mortgages WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own mortgage bonifications" ON mortgage_bonifications
  FOR UPDATE TO authenticated
  USING (mortgage_id IN (SELECT id FROM mortgages WHERE user_id = auth.uid()))
  WITH CHECK (mortgage_id IN (SELECT id FROM mortgages WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own mortgage bonifications" ON mortgage_bonifications
  FOR DELETE TO authenticated
  USING (mortgage_id IN (SELECT id FROM mortgages WHERE user_id = auth.uid()));

-- Index for faster queries by mortgage_id
CREATE INDEX idx_mortgage_bonifications_mortgage_id ON mortgage_bonifications(mortgage_id);

-- Tabla de participaciones en la hipoteca (para dividir la deuda entre usuarios)
-- Permite que diferentes usuarios tengan diferentes porcentajes de la hipoteca
-- y que las amortizaciones anticipadas reduzcan solo la porción del usuario que las realiza
CREATE TABLE mortgage_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mortgage_id UUID REFERENCES mortgages(id) ON DELETE CASCADE NOT NULL,          -- Hipoteca a la que pertenece
  user_role TEXT NOT NULL CHECK (user_role IN ('lender', 'borrower')),           -- Rol del usuario
  initial_share_amount DECIMAL(12, 2) NOT NULL,                                  -- Monto inicial de la participación
  initial_share_percentage DECIMAL(5, 2) NOT NULL,                               -- Porcentaje inicial de la participación
  amortized_amount DECIMAL(12, 2) DEFAULT 0,                                     -- Monto total amortizado anticipadamente
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mortgage_id, user_role)                                                  -- Solo una participación por rol por hipoteca
);

-- Enable Row Level Security for mortgage_shares
ALTER TABLE mortgage_shares ENABLE ROW LEVEL SECURITY;

-- Mortgage shares: users can view shares of their mortgages
CREATE POLICY "Users can view mortgage shares" ON mortgage_shares
  FOR SELECT TO authenticated
  USING (mortgage_id IN (SELECT id FROM mortgages WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert mortgage shares" ON mortgage_shares
  FOR INSERT TO authenticated
  WITH CHECK (mortgage_id IN (SELECT id FROM mortgages WHERE user_id = auth.uid()));

CREATE POLICY "Users can update mortgage shares" ON mortgage_shares
  FOR UPDATE TO authenticated
  USING (mortgage_id IN (SELECT id FROM mortgages WHERE user_id = auth.uid()))
  WITH CHECK (mortgage_id IN (SELECT id FROM mortgages WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete mortgage shares" ON mortgage_shares
  FOR DELETE TO authenticated
  USING (mortgage_id IN (SELECT id FROM mortgages WHERE user_id = auth.uid()));

-- Index for faster queries by mortgage_id
CREATE INDEX idx_mortgage_shares_mortgage_id ON mortgage_shares(mortgage_id);

-- Trigger to update updated_at on mortgage_shares
CREATE TRIGGER update_mortgage_shares_updated_at
  BEFORE UPDATE ON mortgage_shares
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabla de solicitudes de amortización anticipada
-- El prestatario crea solicitudes que el prestamista debe aprobar
CREATE TABLE amortization_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mortgage_id UUID REFERENCES mortgages(id) ON DELETE CASCADE NOT NULL,
  share_id UUID REFERENCES mortgage_shares(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,                                           -- Monto a amortizar
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by TEXT NOT NULL,                                               -- Email del solicitante
  reviewed_by TEXT,                                                         -- Email del revisor (prestamista)
  notes TEXT,                                                               -- Notas opcionales
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security for amortization_requests
ALTER TABLE amortization_requests ENABLE ROW LEVEL SECURITY;

-- Amortization requests: users can view requests of their mortgages
CREATE POLICY "Users can view amortization requests" ON amortization_requests
  FOR SELECT TO authenticated
  USING (mortgage_id IN (SELECT id FROM mortgages WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert amortization requests" ON amortization_requests
  FOR INSERT TO authenticated
  WITH CHECK (mortgage_id IN (SELECT id FROM mortgages WHERE user_id = auth.uid()));

CREATE POLICY "Users can update amortization requests" ON amortization_requests
  FOR UPDATE TO authenticated
  USING (mortgage_id IN (SELECT id FROM mortgages WHERE user_id = auth.uid()))
  WITH CHECK (mortgage_id IN (SELECT id FROM mortgages WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete amortization requests" ON amortization_requests
  FOR DELETE TO authenticated
  USING (mortgage_id IN (SELECT id FROM mortgages WHERE user_id = auth.uid()));

-- Index for faster queries
CREATE INDEX idx_amortization_requests_mortgage_id ON amortization_requests(mortgage_id);
CREATE INDEX idx_amortization_requests_status ON amortization_requests(status);
