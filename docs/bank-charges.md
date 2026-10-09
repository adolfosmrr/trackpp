# Carga de gastos de tarjeta

Un automatismo externo (el que lee el Gmail del dueño) detecta consumos de Naranja, Naranja X o Banco Galicia y los manda a trackpp. La app crea un gasto pendiente y manda un push para elegir espacio y categoría. Recién al confirmar se crea el movimiento, igual que un gasto cargado a mano, con actividad para el resto del espacio.

Este documento es el contrato del endpoint. No aplica la migración ni despliega la función.

## Endpoint

`POST https://<project-ref>.supabase.co/functions/v1/ingest-bank-charge`

La función tiene `verify_jwt = false`. No mandes el JWT de un usuario ni la `service_role`. La autorización es el HMAC de abajo.

Si la puerta de Supabase responde `401` con un mensaje de JWT *antes* de entrar a la función, agregá el header `apikey` con la publishable key del proyecto (`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). Ese header solo abre la puerta. No autoriza el cuerpo.

## Firma

Headers obligatorios:

| Header | Valor |
| --- | --- |
| `Content-Type` | `application/json` |
| `X-Ingest-Timestamp` | Unix time en segundos, 10 dígitos |
| `X-Ingest-Signature` | HMAC-SHA256 en hex (64 caracteres) |

El mensaje firmado es la concatenación exacta:

```text
<timestamp>.<raw body>
```

`<raw body>` son los bytes del body HTTP, sin re-serializar el JSON. Un espacio de más cambia la firma.

La ventana es de 5 minutos para atrás o para adelante. Fuera de eso responde `401` (`Stale signature`), así un request capturado no se puede reutilizar después. El mismo mail, reenviado dentro de la ventana, no duplica el gasto: `external_ref` es único.

Secreto compartido: variable `INGEST_SECRET` en los secrets de la función. Tiene que ser el mismo valor del lado del automatismo.

Ejemplo canónico. Con `INGEST_SECRET=test-secret`, timestamp `1760000000` y este body exacto (192 bytes):

```json
{"gmail_account":"dueno@gmail.com","message_id":"18c0abc","source":"naranjax","amount":12345.67,"currency":"ARS","merchant":"Comercio","card_last4":"1234","charged_at":"2026-10-09","raw":null}
```

la firma es:

```text
9c83fa940031523d6cec7f644df682d82983c7e499ba3f03ff1a838878abda82
```

```bash
export INGEST_SECRET='test-secret'
export INGEST_URL='https://<project-ref>.supabase.co/functions/v1/ingest-bank-charge'
BODY='{"gmail_account":"dueno@gmail.com","message_id":"18c0abc","source":"naranjax","amount":12345.67,"currency":"ARS","merchant":"Comercio","card_last4":"1234","charged_at":"2026-10-09","raw":null}'
TS="$(date +%s)"
SIG="$(printf '%s' "${TS}.${BODY}" | openssl dgst -sha256 -hmac "$INGEST_SECRET" | awk '{print $NF}')"

curl --fail-with-body -sS -X POST "$INGEST_URL" \
  -H "Content-Type: application/json" \
  -H "X-Ingest-Timestamp: $TS" \
  -H "X-Ingest-Signature: $SIG" \
  --data-binary "$BODY"
```

`printf '%s'` no agrega un salto de línea. Si el body cambia en un byte, la firma deja de servir. Para comprobar el vector fijo (timestamp `1760000000`, secreto `test-secret`, body de arriba) la firma tiene que dar `9c83fa940031523d6cec7f644df682d82983c7e499ba3f03ff1a838878abda82`. Ese timestamp ya está vencido: sirve para verificar el hash, no para llamar al endpoint.

## Body

```json
{
  "gmail_account": "dueno@gmail.com",
  "message_id": "18c0abc",
  "source": "naranjax",
  "amount": 12345.67,
  "currency": "ARS",
  "merchant": "Comercio",
  "card_last4": "1234",
  "charged_at": "2026-10-09",
  "raw": {}
}
```

| Campo | Regla |
| --- | --- |
| `gmail_account` | Email de la casilla leída. Se compara en minúsculas contra `ACCOUNT_MAP`. No se busca el usuario en la base. |
| `message_id` | Id del mensaje de Gmail. Sin espacios, hasta 200 caracteres. |
| `source` | `naranja`, `naranjax`, `galicia` u `other`. |
| `amount` | Número mayor a 0, o string decimal con hasta 2 decimales (`"12345.67"`). Se guarda con 2 decimales. |
| `currency` | Código de 3 letras. Si falta, `ARS`. |
| `merchant` | Texto opcional, hasta 200 caracteres. Si falta, el movimiento se titula "Gasto con tarjeta". |
| `card_last4` | Opcional. Se quedan los últimos 4 dígitos (`1234` o `****1234`). |
| `charged_at` | Opcional, `YYYY-MM-DD`. Si falta, el movimiento usa la fecha de hoy al confirmarlo. |
| `raw` | JSON opcional con el mail o el parseo original. Hasta ~24 KB. |

`external_ref` queda `gmail:<gmail_account en minúsculas>:<message_id>`.

## Respuestas

| HTTP | Body | Cuándo |
| --- | --- | --- |
| `201` | `{ "status": "created", "id": "<uuid>" }` | Gasto nuevo. Si hay tokens, se manda el push. |
| `200` | `{ "status": "duplicate", "id": "<uuid>" }` | Ese `external_ref` ya existe. No se manda otro push. |
| `400` | `{ "error": "..." }` | JSON o campos inválidos. |
| `401` | `{ "error": "Invalid signature" \| "Stale signature" }` | Firma o timestamp. |
| `403` | `{ "error": "Gmail account is not allowed" }` | El email no está en `ACCOUNT_MAP`. |
| `413` | `{ "error": "Payload is too large" }` | Body de más de 32 KB. |
| `422` | `{ "error": "Mapped user does not have a profile" }` | El uuid del mapa no tiene fila en `profiles`. |
| `500` | `{ "error": "Server configuration error" }` | Falta `INGEST_SECRET`, `ACCOUNT_MAP` o la service role. |

## A quién se le asigna

`ACCOUNT_MAP` es un JSON en los secrets de la función:

```json
{"dueno@gmail.com":"00000000-0000-0000-0000-000000000000"}
```

La clave es el email, el valor es el `profiles.id` (el mismo uuid de `auth.users`). La comparación ignora mayúsculas. No hay lookup libre por email.

## Push

Solo si el insert es nuevo. Título en español, por ejemplo `Nuevo gasto: $12.345,67 en Comercio`. Cuerpo: `¿A qué espacio lo cargo?`.

`data`:

```json
{ "type": "pending_charge", "chargeId": "<uuid>", "userId": "<uuid>" }
```

Canal de Android: `bank-charges` (la app lo crea antes de guardar el token). Si en EAS está activada la seguridad extra de push, hay que setear `EXPO_ACCESS_TOKEN`. Si no, se puede omitir.

Un ticket `DeviceNotRegistered` borra ese token. Si el push falla, el gasto igual queda creado: al abrir la app aparece en Inicio.

## Secrets de la función

| Secret | Obligatorio | Uso |
| --- | --- | --- |
| `INGEST_SECRET` | Sí | Clave HMAC. Elegila larga y aleatoria. |
| `ACCOUNT_MAP` | Sí | JSON email → uuid del usuario. |
| `EXPO_ACCESS_TOKEN` | Solo si activás push security en EAS | Header `Authorization: Bearer` contra Expo. |
| `SUPABASE_URL` | Lo inyecta Supabase | No lo cargues a mano. |
| `SUPABASE_SERVICE_ROLE_KEY` | Lo inyecta Supabase | No lo pongas en la app. |

La app no recibe ninguno de estos valores.
