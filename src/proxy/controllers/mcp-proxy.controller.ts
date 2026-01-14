import {
  Controller,
  All,
  Req,
  Res,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProxyService } from '../services';
import { Public } from '../../auth/decorators';

/**
 * MCP Chatbot Proxy Controller
 * 
 * Proxies requests to the MCP Chatbot microservice (Pilar 3).
 * Handles both text-only and multimodal (text + image) chat requests.
 * 
 * Routes:
 * - POST /mcp/chat - Text-only chat
 * - POST /mcp/chat/multimodal - Multimodal chat with image support
 * - GET /mcp/tools - List available MCP tools
 * - GET /mcp/health - Health check
 * - GET /mcp/providers - List available LLM providers
 */
@Controller('mcp')
export class McpProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Proxy text-only chat requests
   */
  @Public() // Make public or add authentication as needed
  @All('chat')
  async proxyChat(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: any,
  ) {
    const targetUrl = `${process.env.MCP_SERVICE_URL || 'http://localhost:8002'}/mcp/chat`;
    
    await this.proxyService.proxyRequest(req, res, targetUrl);
  }

  /**
   * Proxy multimodal chat requests (with image upload)
   */
  @Public()
  @All('chat/multimodal')
  @UseInterceptors(FileInterceptor('image'))
  async proxyChatMultimodal(
    @Req() req: Request,
    @Res() res: Response,
    @UploadedFile() file: any,
  ) {
    const targetUrl = `${process.env.MCP_SERVICE_URL || 'http://localhost:8002'}/mcp/chat/multimodal`;
    
    // Forward the multipart form data
    await this.proxyService.proxyMultipartRequest(req, res, targetUrl, file);
  }

  /**
   * Proxy tools list request
   */
  @Public()
  @All('tools')
  async proxyTools(@Req() req: Request, @Res() res: Response) {
    const targetUrl = `${process.env.MCP_SERVICE_URL || 'http://localhost:8002'}/mcp/tools`;
    
    await this.proxyService.proxyRequest(req, res, targetUrl);
  }

  /**
   * Proxy health check
   */
  @Public()
  @All('health')
  async proxyHealth(@Req() req: Request, @Res() res: Response) {
    const targetUrl = `${process.env.MCP_SERVICE_URL || 'http://localhost:8002'}/mcp/health`;
    
    await this.proxyService.proxyRequest(req, res, targetUrl);
  }

  /**
   * Proxy providers list
   */
  @Public()
  @All('providers')
  async proxyProviders(@Req() req: Request, @Res() res: Response) {
    const targetUrl = `${process.env.MCP_SERVICE_URL || 'http://localhost:8002'}/mcp/providers`;
    
    await this.proxyService.proxyRequest(req, res, targetUrl);
  }
}
