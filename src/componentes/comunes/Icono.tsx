// En Android y Web se usa MaterialIcons; en iOS, Icono.ios.tsx usa SF Symbols nativos.
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { OpaqueColorValue, StyleProp, TextStyle } from 'react-native';

export type NombreIcono = ComponentProps<typeof MaterialIcons>['name'];

interface PropiedadesIcono {
  nombre: NombreIcono;
  tamano?: number;
  color: string | OpaqueColorValue;
  estilo?: StyleProp<TextStyle>;
}

export function Icono({ nombre, tamano = 24, color, estilo }: PropiedadesIcono) {
  return <MaterialIcons name={nombre} size={tamano} color={color} style={estilo} />;
}
