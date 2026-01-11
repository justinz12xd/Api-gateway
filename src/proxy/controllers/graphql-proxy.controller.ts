import {
  Controller,
  All,
  Req,
  Res,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from '../services';
import { JwtAuthGuard } from '../../auth/guards';
import { Public } from '../../auth/decorators';

/**
 * Controlador Proxy para GraphQL API (Python/Strawberry)
 * 
 * Ruta: /graphql → GraphQL Microservice (:8000)
 * 
 * GraphQL maneja:
 * - Consultas complejas (queries)
 * - Mutaciones
 * - Reportes PDF
 * - Introspection
 */
@ApiTags('GraphQL Proxy')
@Controller('graphql')
@UseGuards(JwtAuthGuard)
export class GraphQLProxyController {
  private readonly logger = new Logger(GraphQLProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Proxy para GraphQL endpoint
   * 
   * La autenticación en GraphQL se maneja a nivel de resolvers,
   * pero el Gateway valida el JWT primero si se proporciona.
   * 
   * Algunas queries son públicas, otras requieren auth.
   * El resolver de GraphQL tiene la lógica específica.
   */
  @Public() // GraphQL maneja su propia auth a nivel de resolver
  @All()
  @ApiOperation({ summary: 'GraphQL endpoint' })
  async graphqlEndpoint(@Req() req: Request, @Res() res: Response) {
    this.logger.debug(`GraphQL request: ${req.method}`);
    
    const result = await this.proxyService.forward('graphql', '/graphql', req);
    return res.status(result.status).json(result.data);
  }

  /**
   * GraphQL Playground/GraphiQL (solo desarrollo)
   */
  @Public()
  @All('playground')
  @ApiOperation({ summary: 'GraphQL Playground (development only)' })
  async graphqlPlayground(@Req() req: Request, @Res() res: Response) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'GraphQL Playground is disabled in production',
        },
      });
    }

    const result = await this.proxyService.forward('graphql', '/graphql', req);
    return res.status(result.status).json(result.data);
  }
}
