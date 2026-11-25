# ==========================================
# Estágio 1: Build (Java 21 + Maven + Node.js para o Quinoa)
# ==========================================
FROM maven:3.9.9-eclipse-temurin-21 AS build

# Instala Node.js 20 para o Quarkus Quinoa compilar src/main/webui
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Copia o pom.xml e baixa dependências primeiro (melhora o cache)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copia o restante do projeto (Java + src/main/webui)
COPY src ./src

# Compila o backend + frontend (Quinoa) em modo fast-jar
RUN mvn package -DskipTests -B

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