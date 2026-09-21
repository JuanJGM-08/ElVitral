const request = require('supertest');

jest.mock('../lib/db.js', () => ({
  query: jest.fn(),
}));

jest.mock('../lib/auth.js', () => ({
  getUserFromRequest: jest.fn(),
  isAdmin: jest.fn((user) => user?.rol === 'admin'),
  sanitizeString: jest.fn((value) => String(value ?? '').trim()),
  sanitizeEmail: jest.fn((value) => {
    const email = String(value ?? '').trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Email invalido');
    }

    return email;
  }),
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
  generateToken: jest.fn(),
  verifyToken: jest.fn(),
}));

const { query } = require('../lib/db.js');
const { getUserFromRequest } = require('../lib/auth.js');
const app = require('../index.js');

describe('Cotizacion - POST /api/cotizaciones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('crea una cotizacion correctamente', async () => {
    getUserFromRequest.mockReturnValue({ id: 1, rol: 'usuario' });

    query
      .mockResolvedValueOnce([
        {
          id: 10,
          nombre: 'Vidrio templado',
          tipo: 'vidrio',
          precio_base: 100,
        },
      ])
      .mockResolvedValueOnce({ insertId: 55 })
      .mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/cotizaciones')
      .send({
        cliente: {
          nombre: 'Carlos Perez',
          email: 'carlos@test.com',
          telefono: '3001234567',
          direccion: 'Calle 123',
        },
        productos: [
          {
            producto_id: 10,
            cantidad: 2,
            medida_largo: 100,
            medida_ancho: 50,
            grosor: 8,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.codigo).toBeDefined();

    expect(query).toHaveBeenCalledTimes(3);
  });

  test('rechaza si el usuario no esta autenticado', async () => {
    getUserFromRequest.mockReturnValue(null);

    const res = await request(app)
      .post('/api/cotizaciones')
      .send({
        cliente: {
          nombre: 'Carlos Perez',
          email: 'carlos@test.com',
          telefono: '3001234567',
          direccion: 'Calle 123',
        },
        productos: [
          {
            producto_id: 10,
            cantidad: 1,
            medida_largo: 100,
            medida_ancho: 50,
          },
        ],
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('No autorizado');
    expect(query).not.toHaveBeenCalled();
  });

  test('lista únicamente las cotizaciones propias cuando el usuario es administrador', async () => {
    getUserFromRequest.mockReturnValue({ id: 'admin-1', rol: 'admin' });
    query.mockResolvedValueOnce([{ id: 7, usuario_id: 'admin-1', total: 125000 }]);

    const res = await request(app).get('/api/cotizaciones');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(query).toHaveBeenCalledWith(
      'SELECT * FROM cotizaciones WHERE usuario_id = ? ORDER BY fecha_cotizacion DESC',
      ['admin-1'],
    );
  });

  test('rechaza cliente incompleto', async () => {
    getUserFromRequest.mockReturnValue({ id: 1, rol: 'usuario' });

    const res = await request(app)
      .post('/api/cotizaciones')
      .send({
        cliente: {
          nombre: 'Carlos Perez',
          email: 'carlos@test.com',
          telefono: '',
          direccion: '',
        },
        productos: [
          {
            producto_id: 10,
            cantidad: 1,
            medida_largo: 100,
            medida_ancho: 50,
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Faltan datos del cliente o productos');
    expect(query).not.toHaveBeenCalled();
  });

  test('rechaza email invalido', async () => {
    getUserFromRequest.mockReturnValue({ id: 1, rol: 'usuario' });

    const res = await request(app)
      .post('/api/cotizaciones')
      .send({
        cliente: {
          nombre: 'Carlos Perez',
          email: 'correo-invalido',
          telefono: '3001234567',
          direccion: 'Calle 123',
        },
        productos: [
          {
            producto_id: 10,
            cantidad: 1,
            medida_largo: 100,
            medida_ancho: 50,
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email invalido');
    expect(query).not.toHaveBeenCalled();
  });

  test('rechaza si no vienen productos', async () => {
    getUserFromRequest.mockReturnValue({ id: 1, rol: 'usuario' });

    const res = await request(app)
      .post('/api/cotizaciones')
      .send({
        cliente: {
          nombre: 'Carlos Perez',
          email: 'carlos@test.com',
          telefono: '3001234567',
          direccion: 'Calle 123',
        },
        productos: [],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Faltan datos del cliente o productos');
    expect(query).not.toHaveBeenCalled();
  });

  test('rechaza productos inexistentes', async () => {
    getUserFromRequest.mockReturnValue({ id: 1, rol: 'usuario' });

    query.mockResolvedValueOnce([]);

    const res = await request(app)
      .post('/api/cotizaciones')
      .send({
        cliente: {
          nombre: 'Carlos Perez',
          email: 'carlos@test.com',
          telefono: '3001234567',
          direccion: 'Calle 123',
        },
        productos: [
          {
            producto_id: 999,
            cantidad: 1,
            medida_largo: 100,
            medida_ancho: 50,
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('No se encontraron productos válidos');
    expect(query).toHaveBeenCalledTimes(1);
  });

  test('calcula subtotal y total correctamente', async () => {
    getUserFromRequest.mockReturnValue({ id: 1, rol: 'usuario' });

    query
      .mockResolvedValueOnce([
        {
          id: 10,
          nombre: 'Vidrio templado',
          tipo: 'vidrio',
          precio_base: 100,
        },
      ])
      .mockResolvedValueOnce({ insertId: 55 })
      .mockResolvedValueOnce({});

    await request(app)
      .post('/api/cotizaciones')
      .send({
        cliente: {
          nombre: 'Carlos Perez',
          email: 'carlos@test.com',
          telefono: '3001234567',
          direccion: 'Calle 123',
        },
        productos: [
          {
            producto_id: 10,
            cantidad: 2,
            medida_largo: 100,
            medida_ancho: 50,
          },
        ],
      });

    const insertCotizacionCall = query.mock.calls[1];
    const params = insertCotizacionCall[1];

    expect(params[5]).toBe(100000);
    expect(params[6]).toBe(100000);
  });

  test('inserta la cotizacion en la base de datos mockeada', async () => {
    getUserFromRequest.mockReturnValue({ id: 1, rol: 'usuario' });

    query
      .mockResolvedValueOnce([
        {
          id: 10,
          nombre: 'Vidrio templado',
          tipo: 'vidrio',
          precio_base: 100,
        },
      ])
      .mockResolvedValueOnce({ insertId: 55 })
      .mockResolvedValueOnce({});

    await request(app)
      .post('/api/cotizaciones')
      .send({
        cliente: {
          nombre: 'Carlos Perez',
          email: 'carlos@test.com',
          telefono: '3001234567',
          direccion: 'Calle 123',
        },
        productos: [
          {
            producto_id: 10,
            cantidad: 1,
            medida_largo: 100,
            medida_ancho: 50,
          },
        ],
      });

    expect(query.mock.calls[1][0]).toContain('INSERT INTO cotizaciones');
    expect(query.mock.calls[1][1]).toEqual([
      1,
      'Carlos Perez',
      'carlos@test.com',
      '3001234567',
      'Calle 123',
      50000,
      50000,
      'vigente',
      expect.any(String),
    ]);
  });

  test('inserta los detalles de la cotizacion', async () => {
    getUserFromRequest.mockReturnValue({ id: 1, rol: 'usuario' });

    query
      .mockResolvedValueOnce([
        {
          id: 10,
          nombre: 'Vidrio templado',
          tipo: 'vidrio',
          precio_base: 100,
        },
      ])
      .mockResolvedValueOnce({ insertId: 55 })
      .mockResolvedValueOnce({});

    await request(app)
      .post('/api/cotizaciones')
      .send({
        cliente: {
          nombre: 'Carlos Perez',
          email: 'carlos@test.com',
          telefono: '3001234567',
          direccion: 'Calle 123',
        },
        productos: [
          {
            producto_id: 10,
            cantidad: 1,
            medida_largo: 100,
            medida_ancho: 50,
            grosor: 8,
          },
        ],
      });

    expect(query.mock.calls[2][0]).toContain('INSERT INTO cotizacion_detalles');
    expect(query.mock.calls[2][1]).toEqual([
      55,
      10,
      'Vidrio templado',
      1,
      100,
      50,
      8,
      50000,
      50000,
    ]);
  });
});
