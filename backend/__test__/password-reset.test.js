const { createPasswordResetToken, buildResetPasswordLink } = require('../lib/email.js');

describe('Helpers de recuperación de contraseña', () => {
  test('crea un token de recuperación con formato hexadecimal', () => {
    const token = createPasswordResetToken();

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);
    expect(/^[a-f0-9]+$/i.test(token)).toBe(true);
  });

  test('arma el enlace de restablecimiento con la URL del frontend', () => {
    const token = 'abc123';
    const link = buildResetPasswordLink(token, 'http://localhost:3000');

    expect(link).toBe('http://localhost:3000/reset-password/abc123');
  });
});
