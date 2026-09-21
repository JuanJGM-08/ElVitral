const request = require('supertest');

jest.mock('../lib/db.js', () => ({
  query: jest.fn(),
}));

jest.mock('../lib/auth.js', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
  sanitizeEmail: jest.fn((email) => String(email ?? '').trim().toLowerCase()),
  sanitizeString: jest.fn((value) => String(value ?? '').trim()),
  generateAccessToken: jest.fn(() => 'fake-access-token'),
  generateRefreshToken: jest.fn(() => 'fake-refresh-token'),
  getUserFromRequest: jest.fn(),
  isAdmin: jest.fn((user) => user?.rol === 'admin'),
  verifyToken: jest.fn(),
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  createSession: jest.fn(() => ({ sid: 'fake-sid', session: {} })),
  deleteSession: jest.fn(),
  getSession: jest.fn(),
}));

const { query } = require('../lib/db.js');
const {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  createSession,
  sanitizeEmail,
} = require('../lib/auth.js');

const app = require('../index.js');

describe('Login - POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('inicia sesion correctamente con credenciales validas', async () => {
    query.mockResolvedValueOnce([
      {
        id: 1,
        nombre: 'Juan Perez',
        email: 'juan@test.com',
        password: 'hashed_password',
        rol: 'usuario',
        activo: 1,
        aprobado: 1,
      },
    ]);

    comparePassword.mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'juan@test.com',
        password: '123456',
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();

    expect(createSession).toHaveBeenCalledWith({
      id: 1,
      rol: 'usuario',
      nombre: 'Juan Perez',
      email: 'juan@test.com',
    });

    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.body.token).toBeUndefined();
  });

  test('rechaza login con password incorrecto', async () => {
    query.mockResolvedValueOnce([
      {
        id: 1,
        nombre: 'Juan Perez',
        email: 'juan@test.com',
        password: 'hashed_password',
        rol: 'usuario',
        activo: 1,
        aprobado: 1,
      },
    ]);

    comparePassword.mockResolvedValueOnce(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'juan@test.com',
        password: 'incorrecta',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  test('rechaza login si el usuario no existe', async () => {
    query.mockResolvedValueOnce([]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'noexiste@test.com',
        password: '123456',
      });

    expect(res.status).toBe(401);
    expect(comparePassword).not.toHaveBeenCalled();
  });
  
  test('rechaza login cuando email y password estan vacios', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: '',
        password: '',
      });

    expect(sanitizeEmail).toHaveBeenCalledWith('');

    expect(res.status).toBe(400);

    expect(query).not.toHaveBeenCalled();

    expect(comparePassword).not.toHaveBeenCalled();

    expect(generateAccessToken).not.toHaveBeenCalled();
    expect(generateRefreshToken).not.toHaveBeenCalled();
  });
});
