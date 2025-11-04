import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: any =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error({
        ...errorResponse,
        error: exception instanceof Error ? exception.message : exception,
        stack: exception instanceof Error ? exception.stack : undefined,
        body: request.body,
        query: request.query,
      });

      response.status(status).json({
        statusCode: status,
        message: 'Internal server error',
        timestamp: errorResponse.timestamp,
      });
    } else {
      this.logger.warn({
        ...errorResponse,
        message,
        body: request.body,
      });

      response.status(status).json(
        typeof message === 'object' ? message : {
          statusCode: status,
          message,
          timestamp: errorResponse.timestamp,
        }
      );
    }
  }
}
