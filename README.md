# Mousseomanos - Web View

| Camada   | Tecnologia                                   | Pasta       |
|----------|----------------------------------------------|-------------|
| Backend  | Java 21, Spring Boot 4.1 (Maven, JPA, H2)    | `backend/`  |
| Frontend | Angular 18, TypeScript 5.5, SCSS             | `frontend/` |

## Pré-requisitos

- Java 21 (SDKMAN: `sdk install java 21-tem`)
- Node 20 LTS (`nvm use` dentro de `frontend/` lê o `.nvmrc`)
- Não precisa instalar Maven nem Angular CLI globalmente: o projeto usa `./mvnw` e o CLI local (`npx ng`).

## Rodando

Backend (http://localhost:8080):

```bash
cd backend && ./mvnw spring-boot:run
```

Frontend (http://localhost:4200):

```bash
cd frontend && nvm use && npm install && npx ng serve
```

## Testes

```bash
cd backend && ./mvnw verify
cd frontend && npx ng test
```
