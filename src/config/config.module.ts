import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from './env.config';
import { envValidationSchema } from './env.validation';

/**
 * Módulo de configuración centralizada
 * Carga y valida todas las variables de entorno
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false, // Muestra todos los errores de validación
        allowUnknown: true,
      },
      envFilePath: ['.env', '.env.local'],
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}
