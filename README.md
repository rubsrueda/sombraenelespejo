# sombraenelespejo
Libro sobre la situación actual de las relaciones.

## GitHub Pages (sin servidor)

Si publicas en GitHub Pages, no puedes ejecutar Node, SQLite ni webhooks dentro de GitHub Pages. Este sitio funciona igualmente en modo estático.

### Flujo recomendado en GitHub Pages

1. Publica el repositorio en GitHub Pages.
2. En Stripe Payment Link, configura redirección después de pago exitoso hacia:
	- `https://rubsrueda.github.io/sombraenelespejo/ventas.html?checkout=success`
3. El usuario vuelve a [ventas.html](ventas.html), se marca acceso local y puede entrar en [lectura.html](lectura.html).

### Importante

- En modo estático, el acceso se guarda en el navegador del usuario.
- Si cambia de dispositivo o borra datos del navegador, perderá el acceso local.
- Para validación histórica fuerte (5+ años), necesitas backend con webhooks (sección siguiente) o Firebase bien configurado.

## Backend local con SQLite (sin base de datos externa)

Este repositorio incluye un backend opcional en [backend/package.json](backend/package.json) para registrar compras de Stripe en un archivo SQLite y validar accesos históricos.

### 1) Instalacion

```bash
cd backend
npm install
cp .env.example .env
```

### 2) Configuracion

Edita [backend/.env](backend/.env) con tus valores reales:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `DEFAULT_GRANT_ID` (por defecto: `sombraenelespejo-libro-completo`)
- `ALLOWED_ORIGINS` (dominios autorizados para consultar acceso)

La base de datos se guarda en archivo fisico (`SQLITE_PATH`, por defecto `backend/data/app.db`).

### 3) Ejecutar

```bash
cd backend
npm run dev
```

Salud del servicio:

```bash
curl http://localhost:8787/health
```

### 4) Endpoint de webhook Stripe

- URL: `POST /api/stripe/webhook`
- Evento procesado: `checkout.session.completed`
- Resultado: inserta compra en `purchases` y activa acceso en `entitlements`.

Para pruebas locales con Stripe CLI:

```bash
stripe listen --forward-to localhost:8787/api/stripe/webhook
```

### 5) Verificar acceso

Endpoint:

```text
GET /api/access/verify?email=cliente@correo.com&grantId=sombraenelespejo-libro-completo
```

Respuesta:

```json
{
	"ok": true,
	"hasAccess": true,
	"updatedAt": "2026-05-16T12:34:56.000Z"
}
```

## Firebase: configuracion minima

1. Crea un proyecto en Firebase.
2. Activa Authentication con Google y Email/Password.
3. Activa Firestore Database en modo produccion o test segun necesidad.
4. Copia la configuracion web y pegala en [firebase-config.js](firebase-config.js).

### Estructura usada por la web

- Reseñas en la coleccion `reviews`.
- Accesos por usuario en `users/{uid}/entitlements/{grantId}`.

### Reglas recomendadas de Firestore

```text
rules_version = '2';
service cloud.firestore {
	match /databases/{database}/documents {
		match /reviews/{reviewId} {
			allow read: if true;
			allow create: if request.auth != null;
			allow update, delete: if false;
		}

		match /users/{userId}/entitlements/{grantId} {
			allow read, write: if request.auth != null && request.auth.uid == userId;
		}
	}
}
```

### Flujo de compra y desbloqueo

1. Configura el Payment Link de Stripe.
2. URL de retorno: `https://rubsrueda.github.io/sombraenelespejo/ventas.html?checkout=success`.
3. Al volver, se guarda acceso local y, si hay sesion iniciada, tambien en Firebase.
4. La pagina [lectura.html](lectura.html) desbloquea el libro completo cuando detecta ese acceso.
