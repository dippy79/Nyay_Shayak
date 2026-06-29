create or replace function public.complete_payment(p_order text, p_payment text)
returns void language plpgsql security definer as $$
begin
  update public.payments set status = 'paid', razorpay_payment_id = p_payment, updated_at = now()
  where razorpay_order_id = p_order and status != 'paid';
  update public.consultations set status = 'paid', updated_at = now()
  where razorpay_order_id = p_order;
end; $$;
