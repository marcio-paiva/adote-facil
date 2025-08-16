## Pipeline CI/CD
Sim, há um pipeline CI/CD configurado no arquivo `experimento-ci-cd.yml`:
É acionado automaticamente quando um Pull Request é aberto para a branch main

Possui um fluxo definido com jobs sequenciais:
- Testes unitários
- Build das imagens Docker
- Testes básicos de integração (subindo containers temporariamente)
- Geração de artefato (ZIP do projeto)

## Testes automatizados no pipeline
Sim, há testes automatizados:
O job `unit-test` executa testes unitários usando Jest no backend (npm test -- --coverage)

Há uma verificação básica de integração no job up-containers que:
- Sobe os containers
- Aguarda 10 segundos para verificar se os serviços iniciam
- Desce os containers

## Uso de containers
Sim, o projeto usa Docker Compose para orquestração de containers.
O pipeline faz build das imagens (docker compose build);
Testa a subida dos containers (docker compose up -d);
Possui configuração para 3 serviços:
- Banco de dados PostgreSQL
- Backend Node.js
- Frontend (presumivelmente React/Vue/etc)

## Melhorias Implementadas
1. Verificação de Saúde do Backend
No job `up-containers`, entre os passos de subir e descer os containers.
- Faz uma requisição HTTP para o endpoint `/` do backend.
- Se não receber "OK", falha o pipeline (útil para detectar containers que sobem mas não funcionam).

1. Listagem de Imagens Docker
No job `build`, após o passo de construção das imagens.
- Mostra no log do GitHub Actions a lista de imagens criadas (nome, tamanho, versão).
- Verifica se o build gerou as imagens corretamente.
- Identifica problemas (ex.: imagens muito grandes).