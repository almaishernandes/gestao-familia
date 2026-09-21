-- Migração aditiva: limita tipo (PDF/imagens/Word) e tamanho (15MB) dos
-- arquivos aceitos nos buckets de Storage. Segura para produção — não
-- afeta arquivos já enviados, só bloqueia envios futuros fora do padrão.

update storage.buckets
set file_size_limit = 15728640,
    allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp',
                                'application/msword',
                                'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
where id = 'house-documents';

update storage.buckets
set file_size_limit = 15728640,
    allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp']
where id = 'medical-documents';

update storage.buckets
set file_size_limit = 15728640,
    allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp']
where id = 'receipts';
