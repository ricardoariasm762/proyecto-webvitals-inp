# Integración de gRPC-Web y Protocol Buffers en el Navegador

## 1. Desafíos de gRPC en la Web
A diferencia de los entornos cliente/servidor nativos en Node.js, Go o Java, los navegadores web modernos no exponen las APIs de bajo nivel de HTTP/2 necesarias para leer y escribir los "HTTP/2 trailers" crudos que gRPC utiliza para señalizar el código de estado (`grpc-status`) y los metadatos de error.

---

## 2. La Solución: Envoy Proxy como Traductor L7
Para resolver esta limitación, el proyecto implementa un proxy **Envoy** intermedio:
- **Puerto 8080**: El navegador se comunica utilizando el protocolo `gRPC-Web` sobre HTTP/1.1 o HTTP/2 estándar.
- **Filtro `envoy.filters.http.grpc_web`**: Envoy inspecciona el payload binario, deserializa los encabezados y establece una conexión gRPC nativa en HTTP/2 hacia el backend en el puerto `9090`.
- **Manejo de CORS**: Envoy intercepta las peticiones `OPTIONS` (preflight) y retorna los encabezados requeridos (`access-control-allow-origin: *`, `access-control-allow-headers: content-type,x-grpc-web,x-user-agent`).

---

## 3. Generación de Stubs y Empaquetado
Los stubs generados en `src/proto/`:
- `vitals_telemetry_pb.ts`: Modela los mensajes `TelemetryFrame`, `OptimizationVerdict` y `StreamSummary` utilizando `google-protobuf`.
- `vitals_telemetry_grpc_web_pb.ts`: Expone el cliente `VitalsAuditorServiceClient` con wrappers de `Promise` nativos para consumo reactivo en Angular.
