// ============================================================================
// Limitador de intentos en memoria
// ----------------------------------------------------------------------------
// Protege los endpoints de autenticación (login, google, forgot-password)
// contra fuerza bruta y abuso de envío de correos.


const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos

// Configuración por tipo de intento. Los valores se pueden sobrescribir con
// variables de entorno ejecutar para adaptarlos sin tocar código.
function configFor(type) {
  return {
    login: {
      max: Number(process.env.RATE_LIMIT_LOGIN_MAX || 10),
      windowMs: Number(process.env.RATE_LIMIT_LOGIN_WINDOW_MS || DEFAULT_WINDOW_MS),
    },
    google: {
      max: Number(process.env.RATE_LIMIT_GOOGLE_MAX || 10),
      windowMs: Number(process.env.RATE_LIMIT_GOOGLE_WINDOW_MS || DEFAULT_WINDOW_MS),
    },
    forgot: {
      max: Number(process.env.RATE_LIMIT_FORGOT_MAX || 5),
      windowMs: Number(process.env.RATE_LIMIT_FORGOT_WINDOW_MS || DEFAULT_WINDOW_MS),
    },
  }[type] || { max: 10, windowMs: DEFAULT_WINDOW_MS };
}

const store = new Map();
const MAX_STORE_SIZE = 100000;

function prune(now) {
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

/**
 * Comprueba y registra un intento.
 * @param {string} type  - 'login' | 'google' | 'forgot'
 * @param {string} ip    - dirección IP del cliente
 * @param {string} identifier - email o identificador opcional
 * @returns {{ allowed: boolean, remaining: number, retryAfter: number }}
 */
function checkRate(type, ip, identifier = '') {
  const { max, windowMs } = configFor(type);
  const key = `${type}|${String(ip || '')}|${String(identifier || '').toLowerCase()}`.slice(0, 500);
  const now = Date.now();

  let entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count += 1;

  if (store.size > MAX_STORE_SIZE) {
    prune(now);
  }

  return {
    allowed: entry.count <= max,
    remaining: Math.max(0, max - entry.count),
    retryAfter: Math.ceil((entry.resetAt - now) / 1000),
  };
}

/** Devuelve el mensaje de error estandarizado cuando el límite se supera. */
function rateLimitError(detail = '') {
  return {
    status: 429,
    error: 'Demasiados intentos. Inténtalo de nuevo en unos minutos.',
    detail,
  };
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '';
}

module.exports = {
  checkRate,
  rateLimitError,
  getClientIp,
  configFor,
};
