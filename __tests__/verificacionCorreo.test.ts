const mockResend = jest.fn();
const mockSignUp = jest.fn();

jest.mock('@/src/servicios/supabase/cliente', () => ({
  get supabase() {
    return mockSupabaseActual;
  },
}));

let mockSupabaseActual: { auth: { resend: typeof mockResend; signUp: typeof mockSignUp } } | null = {
  auth: { resend: mockResend, signUp: mockSignUp },
};

import { registrarUsuario, reenviarVerificacion } from '@/src/servicios/supabase/autenticacion';

describe('reenviarVerificacion', () => {
  beforeEach(() => {
    mockResend.mockReset();
    mockSignUp.mockReset();
    mockSupabaseActual = { auth: { resend: mockResend, signUp: mockSignUp } };
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

describe('registrarUsuario', () => {
  beforeEach(() => {
    mockSignUp.mockReset();
    mockSupabaseActual = { auth: { resend: mockResend, signUp: mockSignUp } };
  });

  it('envía el enlace de confirmación a la pantalla de verificación de producción', async () => {
    mockSignUp.mockResolvedValue({ error: null });

    const resultado = await registrarUsuario('Ana López', 'ana@example.com', 'UnaClaveDePrueba123!');

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'UnaClaveDePrueba123!',
      options: {
        data: { nombre: 'Ana López' },
        emailRedirectTo:
          'https://www.mipresupuestoapp.com/autenticacion/verificar-correo?correo=ana%40example.com',
      },
    });
    expect(resultado).toEqual({ error: null });
  });
});
