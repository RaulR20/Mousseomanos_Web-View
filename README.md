# Mousseomanos - Web View - Fork

| Camada   | Tecnologia                                                          | Pasta       |
|----------|---------------------------------------------------------------------|-------------|
| Backend  | Java 21, Spring Boot 4.1, Maven, JPA, Actuator, H2 (dev), PostgreSQL | `backend/`  |
| Frontend | Angular 18.2 (CLI 18.2 local ao projeto), TypeScript 5.5, SCSS       | `frontend/` |

## Funcionalidade

Mapa do Google embutido na página. O usuário informa um endereço ou CEP, ou usa a localização do navegador. O mapa mostra um círculo azul na localização de referência e um pin vermelho em cada hamburgueria próxima (raio de 3 km, até 20 resultados). Não há lista. Ao clicar em um pin, abre um balão com o nome e a distância em linha reta até você (calculada no navegador, sem API extra). O mapa usa um estilo escuro próprio e esconde os outros estabelecimentos do Google.

Como funciona:

1. O navegador obtém as coordenadas: geolocalização do navegador, ou geocodificação do endereço/CEP (Geocoding API, via Maps JavaScript API).
2. Chama `GET /api/hamburguerias?lat=<lat>&lng=<lng>`; o backend consulta a **Places API (New)** (Text Search) e devolve nome e coordenadas.
3. O navegador desenha o mapa com o círculo azul e os pins.

São necessárias **duas chaves** do Google Maps Platform, porque uma chave de navegador é pública e deve ser restrita por domínio, enquanto a do servidor não pode:

| Chave                      | Variável                  | APIs habilitadas                         | Restrição                      |
|----------------------------|---------------------------|------------------------------------------|--------------------------------|
| Servidor (secreta)         | `GOOGLE_MAPS_API_KEY`     | Places API (New)                         | por API (e, se possível, por IP) |
| Navegador (pública)        | `GOOGLE_MAPS_BROWSER_KEY` | Maps JavaScript API e Geocoding API      | por HTTP referrer (seu domínio) |

- A chave de navegador é entregue ao front por `GET /api/config`, então não exige rebuild entre ambientes.
- Sem `GOOGLE_MAPS_API_KEY` a busca responde 503; sem `GOOGLE_MAPS_BROWSER_KEY` a tela mostra "O mapa não está configurado."
- Se a chave de navegador for inválida ou a Geocoding API não estiver habilitada, a tela avisa após 10 segundos.
- A geolocalização do navegador só funciona em `localhost` ou HTTPS.

## Pré-requisitos

- **Java 21** (SDKMAN: `sdk install java 21-tem`).
- **Node 20 LTS** (`nvm use` dentro de `frontend/` lê o `.nvmrc`). O Angular 18 suporta Node 18.19+, 20.11+ e 22+; com o Node 24 o CLI funciona, mas avisa que a versão não é suportada.
- **Maven**: não precisa de instalação global, o projeto usa `./mvnw`.
- **Angular CLI**: a versão do projeto é a 18, instalada em `frontend/node_modules`. O `ng` global da máquina pode ser de outra versão (hoje é a 22): ao rodar dentro de `frontend/`, ele delega para o CLI local do projeto. Fora do projeto, use `npx @angular/cli@18 ...` se precisar do CLI 18.
- **Chrome/Chromium** para os testes do frontend (Karma). Se não estiver no PATH, defina `CHROME_BIN`.

## Desenvolvimento

Backend (http://localhost:8080, perfil `dev` com H2 em memória e console em `/h2-console`). As chaves do Google Maps ficam em `backend/.env` (não versionado). Copie o modelo e preencha (em dev, restrinja a chave de navegador a `http://localhost:4200/*`):

```bash
cp backend/.env.example backend/.env   # edite e preencha as duas chaves
cd backend && ./mvnw spring-boot:run
```

O backend lê o `.env` do diretório onde é iniciado (`backend/`); variáveis de ambiente reais têm prioridade sobre o arquivo. O frontend **não usa `.env` nem guarda chave alguma**: ele recebe a chave de navegador do backend em `/api/config`.

Frontend (http://localhost:4200). As chamadas a `/api` são encaminhadas para `http://localhost:8080` por `proxy.conf.json`; se mudar a porta do backend, ajuste esse arquivo.

```bash
cd frontend && nvm use && npm install && npx ng serve
```

## Testes

```bash
cd backend && ./mvnw verify
cd frontend && npx ng test --watch=false --browsers=ChromeHeadless
```

## Preparação para deploy

Nada no código depende de uma conta de nuvem específica; a configuração vem de variáveis de ambiente.

### Backend (`backend/Dockerfile`)

Variáveis de ambiente:

| Variável                      | Descrição                                                                                                  |
|-------------------------------|------------------------------------------------------------------------------------------------------------|
| `SPRING_DATASOURCE_URL`       | ex.: `jdbc:postgresql://<host>:5432/<db>?sslmode=require`                                                  |
| `GOOGLE_MAPS_API_KEY`         | chave de servidor com a Places API (New) habilitada. **Segredo**                                           |
| `GOOGLE_MAPS_BROWSER_KEY`     | chave de navegador (Maps JavaScript API + Geocoding API), restrita por domínio. Pública por natureza       |
| `SPRING_DATASOURCE_USERNAME`  | usuário do banco                                                                                           |
| `SPRING_DATASOURCE_PASSWORD`  | senha do banco                                                                                             |
| `APP_CORS_ALLOWED_ORIGINS`    | origens permitidas (separadas por vírgula). Se não definida, vale `http://localhost:4200`; defina como vazia para desativar o CORS (front servido pelo proxy `/api`) |
| `PORT`                        | porta HTTP (padrão `8080`)                                                                                 |
| `SPRING_PROFILES_ACTIVE`      | o Dockerfile já define `prod`; sem ela (execução local) o padrão é `dev`                                   |
| `JAVA_TOOL_OPTIONS`           | o Dockerfile já define `-XX:MaxRAMPercentage=75` (limite de memória da JVM no container)                   |

- Health checks: `/actuator/health/liveness` e `/actuator/health/readiness`.
- No perfil `prod`: sem console H2, `ddl-auto: none` (quando houver entidades, adicione Flyway/Liquibase) e respostas de erro sem mensagem nem stacktrace.

### Frontend (`frontend/Dockerfile`)

Build Angular de produção servido por nginx, com fallback de SPA, cache de arquivos com hash e gzip.
O front chama sempre `/api/...` (caminho relativo); o nginx encaminha para `BACKEND_URL`
(ex.: `https://meu-backend.azurewebsites.net`, sem caminho no final; padrão `http://backend:8080`),
então o mesmo build serve para qualquer ambiente.

### Stack local parecida com produção

```bash
docker compose up --build   # http://localhost:8081
```

Sobe PostgreSQL, backend (perfil `prod`) e frontend (nginx). As chaves do Google Maps vêm de `backend/.env`, se existir. Requer acesso ao Docker (usuário no grupo `docker`).

No Azure não use arquivo `.env`: defina as mesmas variáveis como configuração/segredos do serviço.

> Os Dockerfiles, a configuração do nginx e o `docker-compose.yml` ainda não foram executados; foram validados apenas o jar com o perfil `prod`, a extração em camadas e o build do Angular.
