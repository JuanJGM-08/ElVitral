const request = require('supertest');

jest.mock('../lib/db.js', () => ({ query: jest.fn() }));
jest.mock('../lib/auth.js', () => ({
  getUserFromRequest: jest.fn(),
  isAdmin: jest.fn((user) => user?.rol === 'admin'),
  sanitizeString: jest.fn((value) => String(value ?? '').trim()),
  sanitizeEmail: jest.fn((value) => String(value ?? '').trim().toLowerCase()),
}));
jest.mock('../lib/notifications.js', () => ({
  notifyOrderCreated: jest.fn(),
  notifyOrderStateChange: jest.fn(),
  notifyAppointment: jest.fn(),
  notifyStockMovement: jest.fn(),
  notifyPaymentReceived: jest.fn(),
}));

const { query } = require('../lib/db.js');
const { getUserFromRequest } = require('../lib/auth.js');
const { notifyPaymentReceived } = require('../lib/notifications.js');
const app = require('../index.js');

describe('Pagos Stripe en COP', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_example';
    getUserFromRequest.mockReturnValue({ id: 'user-1', rol: 'usuario' });
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  test('envía $10.000 COP como 1.000.000 unidades menores de Stripe', async () => {
    query.mockResolvedValueOnce([{
      id: 31,
      usuario_id: 'user-1',
      total: 10000,
      pago: 'pendiente',
      estado: 'pendiente',
    }]);
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'cs_test_123', url: 'https://checkout.stripe.test/session' }),
    });

    const response = await request(app)
      .post('/api/pedidos/31/create-checkout-session')
      .send({ tipo_pago: 'pagado' });

    expect(response.status).toBe(200);
    const body = new URLSearchParams(global.fetch.mock.calls[0][1].body);
    expect(body.get('line_items[0][price_data][currency]')).toBe('cop');
    expect(body.get('line_items[0][price_data][unit_amount]')).toBe('1000000');
    expect(response.body.amount_cop).toBe(10000);
  });

  test('rechaza cotizaciones por debajo de $10.000 COP', async () => {
    query.mockResolvedValueOnce([{
      id: 7,
      nombre: 'Herraje pequeño',
      tipo: 'herraje',
      precio_base: 9000,
    }]);

    const response = await request(app)
      .post('/api/cotizaciones')
      .send({
        cliente: {
          nombre: 'Cliente prueba',
          email: 'cliente@example.com',
          telefono: '3001234567',
          direccion: 'Calle 1',
        },
        productos: [{ producto_id: 7, cantidad: 1 }],
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('$10.000 COP');
    expect(query).toHaveBeenCalledTimes(1);
  });

  test('confirma el pago, inicia el pedido y avisa a los administradores', async () => {
    const pedido = {
      id: 31,
      usuario_id: 'user-1',
      total: 10000,
      pago: 'pendiente',
      estado: 'pendiente',
    };
    query
      .mockResolvedValueOnce([pedido])
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce([{ email: 'admin@example.com' }]);
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        payment_status: 'paid',
        currency: 'cop',
        amount_total: 1000000,
        metadata: { pedido_id: '31', tipo_pago: 'pagado', pago_previo: 'pendiente' },
        payment_intent: { status: 'succeeded', amount: 1000000 },
      }),
    });

    const response = await request(app)
      .post('/api/pedidos/31/pago-completado')
      .send({ stripe_session_id: 'cs_test_123', tipo_pago: 'pagado' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ pago: 'pagado', estado: 'en_proceso' });
    expect(query).toHaveBeenCalledWith(
      'UPDATE pedidos SET pago = ?, estado = ? WHERE id = ?',
      ['pagado', 'en_proceso', 31]
    );
    expect(notifyPaymentReceived).toHaveBeenCalledWith(
      ['admin@example.com'],
      31,
      10000,
      false
    );
  });
});
