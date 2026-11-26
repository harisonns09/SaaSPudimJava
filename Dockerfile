# syntax=docker/dockerfile:1
# ==========================================
# Estágio 1: Build (Java 21 + Maven + Node.js para o Quinoa)
# ==========================================
FROM node:20-bookworm-slim AS node

FROM maven:3.9.9-eclipse-temurin-21 AS build

# Copia o Node.js 20 de uma imagem oficial (sem baixar script/apt a cada build)
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -sf ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -sf ../lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

WORKDIR /workspace

# Copia o pom.xml e baixa dependências primeiro; cache persistente do Maven entre builds
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline -B

# Copia o restante do projeto (Java + src/main/webui)
COPY src ./src

# Compila o backend + frontend (Quinoa) em modo fast-jar; reutiliza cache do Maven e do npm
RUN --mount=type=cache,target=/root/.m2 --mount=type=cache,target=/root/.npm \
    mvn package -DskipTests -B

# ==========================================
# Estágio 2: Runtime (Imagem final leve para o Cloud Run)
# ==========================================
FROM eclipse-temurin:21-jre-jammy

WORKDIR /deployments

COPY --from=build /workspace/target/quarkus-app/lib/ /deployments/lib/
COPY --from=build /workspace/target/quarkus-app/*.jar /deployments/
COPY --from=build /workspace/target/quarkus-app/app/ /deployments/app/
COPY --from=build /workspace/target/quarkus-app/quarkus/ /deployments/quarkus/

EXPOSE 8080

# Respeita a variável PORT injetada automaticamente pelo Cloud Run
ENTRYPOINT ["sh", "-c", "java -Dquarkus.http.host=0.0.0.0 -Dquarkus.http.port=${PORT:-8080} -jar /deployments/quarkus-run.jar"]