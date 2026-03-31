# Sistema de Aprobación de Usuarios - Sin Cambios en BD

## 📋 Cómo funciona

Este sistema permite aprobar usuarios para acceder a la app **sin modificar la base de datos**. Todo se gestiona a través de un archivo JSON local.

## 🔄 Flujo de Usuario

1. **Registro**: Usuario se registra con edad >= 18 ✅
2. **Email de Verificación**: Recibe email con instrucciones sobre cómo verificar edad
3. **Verifica Email**: Hace clic en enlace de verificación ✅
4. **Esperando Aprobación**: Se muestra pantalla en el frontend indicando que debe:
   - Ir a **Punto Vuela con DNI**, O
   - Enviar **foto del DNI a puntovuelacuevas@gmail.com**
5. **Admin Aprueba**: Admin usa endpoint `/api/v1/auth/pending-users` y `/api/v1/auth/approve/:userId`
6. **Acceso Completo**: Usuario puede loguear y usar toda la app

## 📁 Archivos Involucrados

```
backend/
├── config/
│   ├── mailer.js              (modificado - email con instrucciones DNI)
│   └── approved-users.json    (NUEVO - gestión de aprobaciones)
├── controllers/
│   └── auth.controller.js     (modificado - lógica de aprobación)
├── models/
│   └── usuario.model.js       (NO MODIFICADO - sin cambios BD)
└── routes/
    └── auth.routes.js         (modificado - agregar endpoints admin)

frontend/
└── src/
    ├── App.tsx                (modificado - pantalla awaitingAdminApproval)
    └── services/
        └── api.ts             (modificado - manejo de awaiting_approval)
```

## 🔌 API Endpoints para Admin

### Obtener usuarios pendientes de aprobación
```bash
GET /api/v1/auth/pending-users

# Respuesta:
{
  "count": 5,
  "usuarios": [
    {
      "id": 1,
      "nombre_completo": "Juan García",
      "email": "juan@example.com",
      "edad": 25,
      "genero": "Hombre",
      "localidad": "Cuevas del Becerro",
      "rol_activo": "voluntario",
      "fecha_registro": "2026-03-31T10:30:00Z"
    },
    ...
  ],
  "approved": 3  // Usuarios ya aprobados
}
```

### Aprobar un usuario específico
```bash
PUT /api/v1/auth/approve/:userId

# Ejemplo:
PUT /api/v1/auth/approve/5

# Respuesta:
{
  "message": "Usuario aprobado correctamente",
  "usuario": {
    "id": 5,
    "email": "maria@example.com",
    "nombre_completo": "María López",
    "approved": true
  }
}
```

## 📝 Archivo approved-users.json

Localización: `backend/config/approved-users.json`

```json
{
  "approvedUserIds": [1, 3, 5, 7],
  "pendingUsers": [2, 4, 6],
  "lastUpdated": "2026-03-31T10:45:00Z"
}
```

- `approvedUserIds`: Array de IDs de usuarios aprobados
- `pendingUsers`: Array de IDs pendientes (opcional, para referencia)
- Se actualiza automáticamente cuando un admin aprueba un usuario

## ✅ Validación de Login

Cuando un usuario intenta loguear (en `auth.controller.js`):

```javascript
// 1. Verifica contraseña ✓
// 2. Verifica email_verified ✓
// 3. Verifica que su ID esté en approved-users.json
if (!approvedData.approvedUserIds.includes(usuario.id)) {
    return res.status(403).json({
        message: 'Tu cuenta está pendiente de aprobación...',
        awaiting_approval: true
    });
}
```

## 🎨 Pantalla del Frontend

Cuando `awaiting_approval: true`, el usuario ve:

- Mensaje explicativo sobre el proceso de verificación
- Instrucciones para ir a Punto Vuela con DNI
- Correo para enviar DNI: `puntovuelacuevas@gmail.com`
- Botón para volver a intentar login o inicio

## 🚀 Ventajas de Esta Solución

| ✅ Solución Actual | Solución BD (Anterior) |
|---|---|
| Sin cambios en estructura BD | Requiere ALTER TABLE |
| Fácil de gestionar (JSON) | Más complejo (columnas) |
| Reversible en segundos | Requiere migración |
| Funciona sin dependencias | Depende de Sequelize |
| Portable (incluir JSON en git) | Cambios permanentes |
| Simple panel de admin futuro | Requiere ORM updates |

## 🔐 Seguridad

El archivo `approved-users.json` es **procesado solo en el servidor**:
- No se expone al cliente
- Solo el backend puede leerlo/escribirlo
- Los IDs aprobados nunca se envían al frontend (solo el flag `awaiting_approval`)

## 📝 Notas de Implementación

1. El archivo se crea automáticamente en la primera ejecución
2. Si no existe, se inicializa con arrays vacíos
3. Cada aprobación se guarda inmediatamente en el JSON
4. No hay sincronización con BD - es puramente en memoria/archivo

## ¿Cómo Aprobar Usuarios Manualmente?

Si quieres agregar usuarios aprobados manualmente sin usar el endpoint:

```json
{
  "approvedUserIds": [1, 2, 3],
  "pendingUsers": [],
  "lastUpdated": "2026-03-31T11:00:00Z"
}
```

Solo edita el archivo y agrega los IDs. El backend lo leerá en la próxima solicitud.

