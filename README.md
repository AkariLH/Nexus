# Nexus

Proyecto full‑stack con backend en Spring Boot (Java 17 + MySQL) y app móvil en React Native usando Expo. Este README documenta el estado actual, cómo ejecutar ambas partes, la configuración de red en LAN para probar en un teléfono físico con Expo Go y resolución de problemas conocida.

## Visión General

- Backend: Spring Boot 3.2, Java 17, MySQL 8, JPA/Hibernate, BCrypt, Spring Security (CORS habilitado).
- Frontend: Expo SDK 54, React Native, React 19, TypeScript, Axios.
- Estado: Endpoint de registro de usuario implementado e integrado con la app. En web funciona; en móvil funciona por LAN con la configuración indicada (ver Red/Networking).

## Estructura del Repositorio

```
projects/Nexus/
  backend/                         # API Spring Boot
    src/main/resources/application.properties
    pom.xml
  Nexus/                           # App Expo (esta carpeta)
    app/                           # Pantallas y rutas (expo-router)
    config/api.config.ts           # Lógica de BASE_URL del API (LAN/IP)
    services/api.client.ts         # Instancia de Axios + interceptores
    app.json                       # Config de Expo (HTTP claro en Android)
    metro.config.js                # Resolver de Metro para tslib
    package.json
```

## Backend (Spring Boot)

### Requisitos Previos

- Java 17 (JDK)
- Maven 3.9+
- MySQL 8 ejecutándose localmente con una base de datos `nexus`

Crear la BD (ejemplo):

```sql
CREATE DATABASE nexus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Configuración

Archivo `backend/src/main/resources/application.properties` (valores clave):

```
server.port=8080
server.address=0.0.0.0
server.servlet.context-path=/api

spring.datasource.url=jdbc:mysql://localhost:3306/nexus?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=<tu_usuario>
spring.datasource.password=<tu_password>

spring.jpa.hibernate.ddl-auto=none
```

Notas:
- `server.address=0.0.0.0` hace que la API escuche en todas las interfaces para que los dispositivos de la LAN puedan alcanzarla.
- Asegúrate de que el esquema `nexus` exista y que las credenciales sean correctas.

### Ejecutar

```powershell
cd backend
mvn spring-boot:run
```

Deberías ver: `Tomcat started on port(s): 8080 (http) with context path '/api'`.

### Endpoints de Salud y Auth

- Salud: `GET http://<IP_PC>:8080/api/auth/health` → `200 OK` con `Nexus API is running`
- Registro: `POST http://<IP_PC>:8080/api/auth/register`

Ejemplo de request:

```json
{
  "email": "user@example.com",
  "password": "Password123",
  "confirmPassword": "Password123",
  "displayName": "User Name",
  "nickname": "OptionalNick",
  "birthDate": "2000-12-24"
}
```

El servidor valida edad (13+), longitud de contraseña (8+) y devuelve `201 Created` con un payload que incluye `linkCode`.

## Frontend (Expo / React Native)

### Requisitos Previos

- Node.js 18+
- Expo CLI (usar `npx expo start`)
- App Expo Go en tu teléfono físico (iOS/Android)

### Instalar y Ejecutar

```powershell
cd Nexus
npm install
npx expo start
```

Abre en el teléfono con Expo Go (preferentemente conexión LAN).

### Red en Dispositivo Físico (LAN)

La app usa la IP LAN de tu máquina de desarrollo para llamar a la API. Actualiza esto si cambia la IP de tu PC:

- Archivo: `Nexus/config/api.config.ts`
- Constante: `LOCAL_NETWORK_IP` (actualmente `192.168.0.208`)

La URL base generada es `http://<LOCAL_NETWORK_IP>:8080` para dispositivos móviles.

Android (desarrollo) permite HTTP claro adicionalmente:

- `Nexus/app.json` → `android.usesCleartextTraffic: true`

### Cliente Axios

- `Nexus/services/api.client.ts` configura la instancia de Axios, timeouts y formateo de errores.
- Hay logs en el interceptor de requests para facilitar el diagnóstico de conectividad.

## CORS

El CORS está configurado en el backend (`SecurityConfig`) para permitir orígenes de desarrollo (localhost e IPs LAN en puertos comunes). Si agregas un nuevo puerto o dominio, asegúrate de incluirlo en la lista permitida.

## Solución de Problemas de Conectividad

1. Backend escuchando en todas las interfaces
   - Verifica `server.address=0.0.0.0` y que el backend esté corriendo.
2. Probar endpoint de salud desde el teléfono
   - Visita `http://<IP_PC>:8080/api/auth/health` en el navegador del teléfono; debe mostrar `Nexus API is running`.
3. Expo en modo LAN
   - Inicia Expo en LAN (evita Tunnel) y recarga Expo Go.
4. Firewall de Windows (si aplica)
   - Ejecuta PowerShell como Administrador:
     ```powershell
     netsh advfirewall firewall add rule name="Spring Boot Server" dir=in action=allow protocol=TCP localport=8080
     ```
5. Aislamiento AP del router
   - Si el teléfono no alcanza la IP del PC, desactiva AP Isolation en el router Wi‑Fi.
6. HTTP claro en Android
   - `app.json` tiene `usesCleartextTraffic: true` para permitir HTTP en desarrollo.

## Estado Actual

- ✅ Backend con MySQL; endpoints de salud y registro.
- ✅ Formulario de registro en frontend con validaciones e integración de API.
- ✅ Conectividad por LAN en dispositivo físico vía Expo Go.
- 🔄 Siguiente: Login (JWT), verificación por correo, conexión por código (link‑code), CRUD de eventos.

## Comandos Útiles

Backend:

```powershell
cd backend; mvn spring-boot:run
```

Frontend:

```powershell
cd Nexus; npx expo start
```

Comprobaciones de red (Windows PowerShell):

```powershell
Test-NetConnection -ComputerName <IP_PC> -Port 8080
Invoke-WebRequest -Uri "http://<IP_PC>:8080/api/auth/health" -Method GET
```

## Notas

- `app.frontend-url` en las properties del backend es informativa para futuras funciones (emails, redirecciones). No afecta la conectividad móvil.
- Si cambia la IP de tu PC, actualiza `LOCAL_NETWORK_IP` en `api.config.ts` y recarga Expo Go.

---

¡Feliz desarrollo! Si quieres, podemos añadir variables de entorno o un `.env` para evitar editar la IP manualmente durante el desarrollo.
