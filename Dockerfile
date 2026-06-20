# Runtime image for a DRYDOCK Spring Boot service.
#
# This is a thin runtime-only image: CI builds the executable jars with Maven, stages
# each one as <SERVICE>.jar in the build context, and this Dockerfile wraps it. Build with:
#   docker build --build-arg SERVICE=<service-name> -f Dockerfile dist
#
# All application config (DB, RabbitMQ, Eureka, secrets) is overridable via environment
# variables at deploy time, so the same image runs against any server.
FROM eclipse-temurin:21-jre

ARG SERVICE
WORKDIR /app
COPY ${SERVICE}.jar app.jar

# JAVA_OPTS lets you tune heap / GC / system props per deployment without rebuilding.
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
