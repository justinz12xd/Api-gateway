import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { firstValueFrom, catchError, timeout } from 'rxjs';
import { AxiosError, AxiosRequestConfig, Method } from 'axios';
import { GATEWAY_HEADERS, PROPAGATED_HEADERS } from '../../common/constants';

/**
 * Interface para respuesta del proxy
 */
export interface ProxyResponse {
  data: any;
  status: number;
  headers: Record<string, string>;
}

/**
 * Servicio de Proxy
 * 
 * Implementa el patrón Adapter para comunicación con microservicios
 * Maneja forwarding de requests, headers y manejo de errores
 */
@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly timeoutMs = 30000; // 30 segundos

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Obtiene la URL de un servicio por nombre
   */
  getServiceUrl(serviceName: string): string {
    const urlMap: Record<string, string> = {
      rest: this.configService.get<string>('REST_API_URL', 'http://localhost:8080'),
      graphql: this.configService.get<string>('GRAPHQL_API_URL', 'http://localhost:8000'),
      payments: this.configService.get<string>('PAYMENTS_API_URL', 'http://localhost:8001'),
      websocket: this.configService.get<string>('WEBSOCKET_API_URL', 'http://localhost:4000'),
      auth: this.configService.get<string>('AUTH_SERVICE_URL', 'http://localhost:8090'),
      mcp: this.configService.get<string>('MCP_SERVICE_URL', 'http://localhost:8002'),
    };

    return urlMap[serviceName.toLowerCase()] || '';
  }

  /**
   * Extrae headers relevantes del request original
   */
  private extractHeaders(req: Request): Record<string, string> {
    const headers: Record<string, string> = {};

    // Propagar headers permitidos
    for (const header of PROPAGATED_HEADERS) {
      const value = req.headers[header];
      if (value) {
        headers[header] = Array.isArray(value) ? value[0] : value;
      }
    }

    // Añadir headers del gateway
    Object.assign(headers, GATEWAY_HEADERS);

    // Añadir X-Request-ID si no existe
    if (!headers['x-request-id']) {
      headers['x-request-id'] = `gw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Añadir información del usuario si está autenticado
    if ((req as any).user) {
      const user = (req as any).user;
      headers['x-user-id'] = user.userId;
      headers['x-user-role'] = user.role;
      if (user.email) headers['x-user-email'] = user.email;
      if (user.idRefugio) headers['x-user-refugio'] = user.idRefugio;
    }

    return headers;
  }

  /**
   * Proxea un request a un servicio backend
   * 
   * @param serviceName - Nombre del servicio (rest, payments, graphql, etc.)
   * @param path - Path relativo al servicio
   * @param req - Request original de Express
   * @returns Respuesta del servicio backend
   */
  async forward(
    serviceName: string,
    path: string,
    req: Request,
  ): Promise<ProxyResponse> {
    const baseUrl = this.getServiceUrl(serviceName);
    
    if (!baseUrl) {
      throw new HttpException(
        `Servicio '${serviceName}' no configurado`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    // Construir URL completa
    const url = `${baseUrl}${path}`;
    const method = req.method as Method;
    const headers = this.extractHeaders(req);
    const requestId = headers['x-request-id'];

    this.logger.debug(
      `[${requestId}] Forwarding ${method} ${url} to ${serviceName}`,
    );

    // Configurar request
    const config: AxiosRequestConfig = {
      url,
      method,
      headers,
      data: req.body,
      params: req.query,
      timeout: this.timeoutMs,
      validateStatus: () => true, // Aceptar cualquier status para retornarlo
    };

    try {
      const response = await firstValueFrom(
        this.httpService.request(config).pipe(
          timeout(this.timeoutMs),
          catchError((error: AxiosError) => {
            this.logger.error(
              `[${requestId}] Error forwarding to ${serviceName}: ${error.message}`,
            );
            throw this.handleAxiosError(error, serviceName);
          }),
        ),
      );

      this.logger.debug(
        `[${requestId}] Response from ${serviceName}: ${response.status}`,
      );

      return {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(
        `[${requestId}] Unexpected error: ${error.message}`,
      );
      throw new HttpException(
        'Error interno del gateway',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Maneja errores de Axios y los convierte en HttpException
   */
  private handleAxiosError(error: AxiosError, serviceName: string): HttpException {
    // Error de conexión
    if (error.code === 'ECONNREFUSED') {
      return new HttpException(
        `Servicio '${serviceName}' no disponible`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // Timeout
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return new HttpException(
        `Timeout conectando a '${serviceName}'`,
        HttpStatus.GATEWAY_TIMEOUT,
      );
    }

    // Error del servicio backend
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      const message = data?.message || data?.detail || error.message;

      return new HttpException(
        { 
          message, 
          service: serviceName,
          originalStatus: status,
        },
        status,
      );
    }

    // Error genérico
    return new HttpException(
      `Error comunicando con '${serviceName}': ${error.message}`,
      HttpStatus.BAD_GATEWAY,
    );
  }

  /**
   * Proxea un request directamente a una URL (versión simple para MCP)
   * 
   * @param req - Request original de Express
   * @param res - Response de Express
   * @param targetUrl - URL completa del servicio destino
   */
  async proxyRequest(
    req: Request,
    res: any,
    targetUrl: string,
  ): Promise<void> {
    const method = req.method as Method;
    const headers = this.extractHeaders(req);
    const requestId = headers['x-request-id'];

    this.logger.debug(
      `[${requestId}] Proxying ${method} ${targetUrl}`,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          url: targetUrl,
          method,
          headers,
          data: req.body,
          params: req.query,
          timeout: this.timeoutMs,
          validateStatus: () => true,
        }).pipe(
          timeout(this.timeoutMs),
          catchError((error: AxiosError) => {
            this.logger.error(
              `[${requestId}] Error proxying to ${targetUrl}: ${error.message}`,
            );
            throw this.handleAxiosError(error, 'proxy');
          }),
        ),
      );

      // Enviar respuesta
      res.status(response.status);
      res.set(response.headers);
      res.json(response.data);

    } catch (error) {
      this.logger.error(
        `Proxy error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Proxea un request multipart (con archivos) a un servicio backend
   * 
   * @param req - Request original de Express
   * @param res - Response de Express
   * @param targetUrl - URL completa del servicio destino
   * @param file - Archivo subido (opcional)
   */
  async proxyMultipartRequest(
    req: Request,
    res: any,
    targetUrl: string,
    file?: any,
  ): Promise<void> {
    try {
      const FormData = require('form-data');
      const formData = new FormData();

      // Añadir campos del body
      for (const [key, value] of Object.entries(req.body)) {
        formData.append(key, value);
      }

      // Añadir archivo si existe
      if (file) {
        formData.append('image', file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
      }

      // Extraer headers
      const headers = this.extractHeaders(req);

      // Realizar request
      const response = await firstValueFrom(
        this.httpService.post(targetUrl, formData, {
          headers: {
            ...headers,
            ...formData.getHeaders(),
          },
          timeout: this.timeoutMs,
        }).pipe(
          timeout(this.timeoutMs),
          catchError((error: AxiosError) => {
            throw this.handleAxiosError(error, 'multipart-proxy');
          }),
        ),
      );

      // Enviar respuesta
      res.status(response.status);
      res.set(response.headers);
      res.json(response.data);

    } catch (error) {
      this.logger.error(
        `Multipart proxy error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
