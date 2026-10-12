-- Tabelas técnicas presentes em todos os bancos SQL (incluídas na primeira migração de cada serviço).
CREATE TABLE OUTBOX (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
  tipo NVARCHAR(200) NOT NULL,
  assunto NVARCHAR(200) NOT NULL,
  versao INT NOT NULL,
  ocorrido_em DATETIME2 NOT NULL,
  payload NVARCHAR(MAX) NOT NULL,
  publicado_em DATETIME2 NULL
);
CREATE TABLE EVENTO_PROCESSADO (
  evento_id NVARCHAR(80) NOT NULL PRIMARY KEY,
  tipo NVARCHAR(200) NOT NULL,
  processado_em DATETIME2 NOT NULL
);
