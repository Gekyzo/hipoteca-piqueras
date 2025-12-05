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
