const mockResend = jest.fn();

jest.mock('@/src/servicios/supabase/cliente', () => ({
  get supabase() {
    return mockSupabaseActual;
  },
}));

let mockSupabaseActual: { auth: { resend: typeof mockResend } } | null = {
  auth: { resend: mockResend },
};

import { reenviarVerificacion } from '@/src/servicios/supabase/autenticacion';

describe('reenviarVerificacion', () => {
  beforeEach(() => {
    mockResend.mockReset();
    mockSupabaseActual = { auth: { resend: mockResend } };
  });

  it('reenvía el correo de verificación con el tipo y correo correctos', async () => {
    mockResend.mockResolvedValue({ error: null });

    const resultado = await reenviarVerificacion('ana@example.com');

    expect(mockResend).toHaveBeenCalledWith({ type: 'signup', email: 'ana@example.com' });
    expect(resultado).toEqual({ error: null });
  });

  it('devuelve el mensaje de error cuando Supabase falla', async () => {
    mockResend.mockResolvedValue({ error: { message: 'Límite de reenvíos alcanzado' } });

    const resultado = await reenviarVerificacion('ana@example.com');

    expect(resultado).toEqual({ error: 'Límite de reenvíos alcanzado' });
  });

  it('lanza un error si Supabase no está configurado', async () => {
    mockSupabaseActual = null;

    await expect(reenviarVerificacion('ana@example.com')).rejects.toThrow(
      'Supabase no está configurado'
    );
    expect(mockResend).not.toHaveBeenCalled();
  });
});
