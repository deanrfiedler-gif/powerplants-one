-- Fictional options for D-025 S3. No operational carrier/platform choice, grant, user or class switch.
INSERT INTO ppo.supply_customer_notice_options(kind,code,label) VALUES
 ('Carrier','SYN-CAR-000001','Synthetic Orchard Freight'),
 ('Carrier','SYN-CAR-000002','Synthetic Glasshouse Express'),
 ('Platform','SYN-PLT-000001','Synthetic Freight Desk'),
 ('Platform','SYN-PLT-000002','Synthetic Manual Booking'),
 ('DelayReason','SYN-DLR-000001','Transport availability has changed.'),
 ('DelayReason','SYN-DLR-000002','Additional preparation is required before dispatch.'),
 ('DelayReason','SYN-DLR-000003','The delivery arrangements have changed.')
ON CONFLICT (code) DO NOTHING;
