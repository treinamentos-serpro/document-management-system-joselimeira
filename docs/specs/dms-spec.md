# Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web local que permita enviar, listar e baixar documentos, associando cada documento a um usuário lógico e armazenando os arquivos no filesystem local da aplicação.

## 2. Escopo

### Dentro do escopo

- Envio de um documento por requisição.
- Listagem dos documentos disponíveis para o usuário lógico configurado.
- Download de um documento pelo identificador.
- Exibição no frontend dos metadados, estado do envio e erros retornados pela API.
- Armazenamento dos arquivos em `backend/storage` por padrão, usando `multer` com `diskStorage`.
- Armazenamento dos metadados em memória durante a execução do processo.

### Fora do escopo

- Autenticação, autorização real, cadastro ou administração de usuários.
- Garantia de isolamento entre usuários ou proteção contra acesso por usuários não autenticados.
- Armazenamento externo, em nuvem ou em banco de dados.
- Persistência dos metadados após reiniciar o backend.
- Versionamento, edição, exclusão, compartilhamento ou busca avançada de documentos.
- Upload em lote, preview de arquivos e conversão de formatos.
- Varredura antivírus ou validação de conteúdo por tipo de arquivo.

> `owner` é apenas um metadado de demonstração nesta versão. Todas as requisições usam o usuário lógico configurado pelo servidor; esse valor não representa uma identidade autenticada e não deve ser usado como controle de segurança.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um único arquivo por `multipart/form-data`, no campo `file`. |
| RF-02 | O backend rejeita a requisição de upload se o campo `file` estiver ausente ou vazio. |
| RF-03 | O backend atribui um identificador único ao documento e gera o nome interno de armazenamento; o nome fornecido pelo cliente não é usado como caminho no filesystem. |
| RF-04 | Após armazenar o arquivo, o backend registra os metadados em memória e responde com os metadados públicos do documento criado. |
| RF-05 | O usuário pode listar os documentos do usuário lógico configurado, ordenados por `uploadedAt` decrescente. |
| RF-06 | O usuário pode baixar um documento existente pelo seu `id`; a resposta contém o arquivo como anexo e sugere o nome original ao navegador. |
| RF-07 | A API retorna `404` quando o identificador solicitado não corresponde a um documento registrado. |
| RF-08 | O frontend oferece controles para selecionar e enviar arquivo, atualizar a listagem e baixar um documento, apresentando estados de carregamento e erros. |
| RF-09 | O frontend atualiza a listagem após um upload bem-sucedido e permite tentar novamente uma operação que falhou. |
| RF-10 | O serviço frontend chama a API usando o prefixo `/api`; o proxy Vite de desenvolvimento remove esse prefixo ao encaminhar para o backend. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos são armazenados exclusivamente no filesystem local, usando `multer` com `diskStorage`; não usar serviços ou provedores externos. |
| RNF-02 | Os metadados são mantidos em memória. Reiniciar o backend limpa os metadados; arquivos físicos existentes não são automaticamente removidos nem recuperáveis pela API sem metadados. |
| RNF-03 | A pasta de armazenamento, o limite de tamanho, o usuário lógico e a porta do servidor são configuráveis por variáveis de ambiente, com os padrões definidos na seção 8. |
| RNF-04 | O limite padrão de upload é 10 MiB por arquivo. Arquivos acima do limite são rejeitados sem registrar metadados. |
| RNF-05 | Identificadores e nomes internos de arquivo são gerados pelo servidor. A API nunca aceita um caminho físico enviado pelo cliente e nunca retorna esse caminho. |
| RNF-06 | A API não confia no nome nem no MIME type enviados pelo cliente para compor caminhos de filesystem. A versão inicial aceita qualquer tipo de arquivo dentro do limite de tamanho. |
| RNF-07 | Rotas HTTP não implementam regras de negócio ou persistência: dependem de controllers, services e repositories, respeitando `routes -> controllers -> services -> repositories`. |
| RNF-08 | Configurações são fornecidas por variáveis de ambiente, seguindo o princípio 12-Factor. |
| RNF-09 | O backend usa Node.js, Express e CommonJS; o frontend usa React, Vite e ES Modules. Os testes do backend usam `node:test`. |

## 5. Modelo de dados

### Metadados públicos do documento

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | Identificador UUID gerado pelo servidor. |
| `originalName` | string | Sim | Nome original informado pelo cliente, usado para apresentação e download. |
| `size` | number | Sim | Tamanho do arquivo em bytes. |
| `mimeType` | string | Sim | MIME type informado pelo middleware de upload; é informativo e não valida o conteúdo. |
| `uploadedAt` | string | Sim | Data/hora em ISO 8601 UTC. |
| `owner` | string | Sim | Identificador do usuário lógico configurado pelo servidor; não é uma identidade autenticada. |

### Referência privada de armazenamento

O repository mantém, junto aos metadados em memória, a referência necessária para localizar o arquivo no diretório configurado. O nome interno é gerado pelo servidor a partir do identificador, sem usar o nome original. Essa referência não faz parte das respostas da API.

O identificador deve ser único. Dois arquivos com o mesmo `originalName` são documentos distintos. A remoção dos metadados ao reiniciar o processo não apaga os arquivos físicos; limpeza e recuperação de arquivos órfãos estão fora do escopo.

## 6. Contratos de API

As rotas do backend são descritas sem o prefixo `/api`. No desenvolvimento, o frontend acessa `/api/...` e o proxy do Vite encaminha a chamada ao backend removendo `/api`.

### Formato comum de erro

Respostas de erro da API usam `application/json`:

```json
{
  "error": {
    "code": "FILE_REQUIRED",
    "message": "Envie um arquivo no campo file."
  }
}
```

`code` é estável para tratamento pelo frontend; `message` é uma descrição legível em português. Erros inesperados retornam mensagem genérica, sem stack trace, caminho local ou detalhes internos.

### `POST /upload`

Envia um documento.

- `Content-Type`: `multipart/form-data`
- Campo obrigatório: `file` (um arquivo).
- Limite padrão: 10 MiB; configurável por `MAX_FILE_SIZE_BYTES`.
- A requisição aceita somente a parte `file`; campos multipart adicionais são rejeitados.
- Não há lista de extensões ou MIME types permitidos nesta versão.

### `GET /upload-config`

Informa o limite de upload efetivo para que o frontend valide a seleção antes do envio.

Sucesso: `200 OK`, `Content-Type: application/json`.

```json
{
  "maxFileSizeBytes": 10485760
}
```

Sucesso: `201 Created`, `Content-Type: application/json`.

```json
{
  "document": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "relatorio.pdf",
    "size": 24576,
    "mimeType": "application/pdf",
    "uploadedAt": "2026-09-29T12:00:00.000Z",
    "owner": "local-user"
  }
}
```

Erros:

| HTTP | `code` | Condição |
| --- | --- | --- |
| `400` | `FILE_REQUIRED` | Campo `file` ausente ou sem arquivo. |
| `413` | `FILE_TOO_LARGE` | Arquivo excede `MAX_FILE_SIZE_BYTES`. |
| `500` | `UPLOAD_FAILED` | Falha inesperada ao gravar arquivo ou registrar metadados. A resposta não revela detalhes internos. |

### `GET /documents`

Lista documentos associados ao usuário lógico configurado.

- Sem parâmetros ou corpo de requisição.
- Ordenação: `uploadedAt` decrescente.
- A lista vazia é uma resposta válida, não um erro.

Sucesso: `200 OK`, `Content-Type: application/json`.

```json
{
  "documents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "originalName": "relatorio.pdf",
      "size": 24576,
      "mimeType": "application/pdf",
      "uploadedAt": "2026-09-29T12:00:00.000Z",
      "owner": "local-user"
    }
  ]
}
```

### `GET /documents/:id/download`

Baixa o conteúdo binário do documento identificado por `id`.

- Sucesso: `200 OK`, conteúdo binário, `Content-Type` definido a partir do MIME type registrado e `Content-Disposition: attachment` com o nome original devidamente codificado/sanitizado para header HTTP.
- O caminho do arquivo é obtido exclusivamente a partir do registro em memória, nunca diretamente de um parâmetro do cliente.

Erros:

| HTTP | `code` | Condição |
| --- | --- | --- |
| `404` | `DOCUMENT_NOT_FOUND` | ID inexistente ou sem registro em memória. |
| `500` | `DOWNLOAD_FAILED` | Documento registrado, mas houve erro inesperado na leitura/envio do arquivo. Não revelar caminho ou stack trace. |

## 7. Decisões arquiteturais

### Backend

- `routes/`: registra métodos e caminhos HTTP e delega aos controllers.
- `middleware/`: configura o recebimento multipart e aplica limites na entrada HTTP.
- `controllers/`: interpreta a requisição, valida entrada básica, chama services e traduz resultado/erros para status e respostas HTTP.
- `services/`: aplica regras do domínio, como atribuição do owner lógico e coordenação entre arquivo e metadados.
- `repositories/`: persiste arquivos no filesystem local via `multer` com `diskStorage` e mantém metadados em memória.
- Dependências seguem `routes -> controllers -> services -> repositories`; camadas internas não conhecem Express ou detalhes HTTP.
- O endpoint `/health` existente permanece disponível para verificação de saúde do processo.

### Frontend

- Componentes funcionais React com Hooks, organizados em `components/`, `pages/` e `services/`.
- Um serviço centraliza chamadas `fetch` para upload, listagem e download.
- A interface inclui os componentes previstos no seed: upload, listagem e ação de download.
- Chamadas usam `/api`; o proxy de desenvolvimento direciona para `http://localhost:3000` removendo o prefixo.

### Configuração padrão

| Variável | Padrão | Uso |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do backend. |
| `HOST` | `127.0.0.1` | Interface de rede do backend. Altere somente quando houver necessidade de acesso remoto e controles de segurança apropriados. |
| `STORAGE_DIR` | `backend/storage` | Diretório local dos arquivos enviados. Caminhos relativos são resolvidos de forma consistente pelo backend. |
| `MAX_FILE_SIZE_BYTES` | `10485760` | Tamanho máximo de cada arquivo (10 MiB). |
| `DEFAULT_OWNER` | `local-user` | Identificador demonstrativo associado aos documentos. |

## 8. Plano de execução

As etapas abaixo descrevem trabalho futuro. Esta especificação não implementa nem executa alterações nos arquivos de backend ou frontend.

1. **Base do backend:** estruturar rotas, controllers, services e repositories conforme a arquitetura; configurar variáveis de ambiente e diretório de storage local.
2. **Upload e listagem:** configurar `multer.diskStorage`, validação de campo e limite de tamanho; gerar ID/nome interno; registrar metadados em memória; implementar `POST /upload` e `GET /documents`.
3. **Download:** implementar busca por ID e envio seguro do arquivo como anexo, com tratamento de inexistência e erros de filesystem.
4. **Testes do backend:** cobrir status, contratos JSON, upload válido/inválido, ordenação, limite de tamanho, download, ID inexistente e ausência de caminhos internos nas respostas.
5. **Serviço e interface frontend:** centralizar `fetch`; implementar seleção/envio, listagem, estados de carregamento/erro, atualização após upload e download.
6. **Integração local:** validar proxy `/api` do Vite com o backend e testar o fluxo completo no navegador.
7. **Verificação final:** executar testes backend e build frontend; confirmar armazenamento apenas local, limites de escopo e documentação de configuração.
