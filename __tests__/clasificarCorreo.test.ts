import { clasificarCorreo } from '@/src/utilidades/clasificarCorreo';

describe('clasificarCorreo', () => {
  it('clasifica dominios personales conocidos', () => {
    expect(clasificarCorreo('ana@gmail.com')).toEqual({ tipo: 'personal', dominio: 'gmail.com' });
    expect(clasificarCorreo('ana@icloud.com')?.tipo).toBe('personal');
  });

  it('clasifica dominios institucionales por sufijo .edu.gt', () => {
    expect(clasificarCorreo('sara@universidad.edu.gt')?.tipo).toBe('institucional');
  });

  it('clasifica el dominio institucional conocido miumg.edu.gt', () => {
    expect(clasificarCorreo('carlos@miumg.edu.gt')?.tipo).toBe('institucional');
  });

  it('clasifica dominios desconocidos como organizacionales', () => {
    expect(clasificarCorreo('empleado@miempresa.com')?.tipo).toBe('organizacional');
  });

  it('retorna null cuando el correo no tiene un dominio válido', () => {
    expect(clasificarCorreo('correo-invalido')).toBeNull();
  });
});
