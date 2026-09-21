const request = require('supertest');

jest.mock('../lib/db.js', () => ({
  query: jest.fn(),
}));

const { query } = require('../lib/db.js');
const app = require('../index.js');

describe('Catalogo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('lista productos activos del catalogo', async () => {
    query.mockResolvedValueOnce([
      {
        id: 1,
        nombre: 'Vidrio templado',
        tipo: 'vidrio',
        precio_base: '120000',
        activo: 1,
      },
    ]);

    const res = await request(app).get('/api/productos');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].nombre).toBe('Vidrio templado');
  });

  test('devuelve arreglo vacio si no hay productos', async () => {
    query.mockResolvedValueOnce([]);

    const res = await request(app).get('/api/productos');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
// ==========================
// NUEVO TEST
// ==========================
test('todos los productos devueltos pertenecen al catalogo activo', async () => {
  query.mockResolvedValueOnce([
    {
      id: 1,
      nombre: 'Vidrio templado',
      tipo: 'vidrio',
      precio_base: '120000',
      activo: 1,
    },
    {
      id: 2,
      nombre: 'Espejo biselado',
      tipo: 'espejo',
      precio_base: '80000',
      activo: 1,
    },
  ]);

  const res = await request(app).get('/api/productos');

  expect(res.status).toBe(200);
  expect(res.body).toHaveLength(2);

  res.body.forEach((producto) => {
    expect(producto.activo).toBe(1);
  });
});