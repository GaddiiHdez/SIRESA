import winston from 'winston';
import path from 'path';

// Directorio de logs
const LOGS_DIR = 'logs';

// Formato personalizado para consola (con colores y formato legible)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// Formato personalizado para archivos (JSON para estructuración y trazabilidad)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  transports: [
    // Escribir todos los errores en error.log
    new winston.transports.File({ 
      filename: path.join(LOGS_DIR, 'error.log'), 
      level: 'error' 
    }),
    // Escribir todos los logs (info, warn, error) en combined.log
    new winston.transports.File({ 
      filename: path.join(LOGS_DIR, 'combined.log') 
    })
  ]
});

// En desarrollo, también loguear a la consola con colores
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

export default logger;
