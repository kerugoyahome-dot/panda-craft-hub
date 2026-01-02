-- Allow financial department and admins to delete transactions
CREATE POLICY "Financial and admins can delete transactions"
ON public.financial_transactions
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.department_type = 'financial'::department_type
  ))
);