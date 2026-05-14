import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import { Response } from 'express';

function mapPrismaKnownError(
  err: PrismaClientKnownRequestError,
): { status: number; message: string } {
  const target = (err.meta?.target as string[] | undefined)?.join(', ');

  switch (err.code) {
    case 'P2002':
      if (target?.includes('puuid')) {
        return {
          status: HttpStatus.CONFLICT,
          message: 'This Riot account is already linked to another user',
        };
      }
      if (target?.includes('userId')) {
        return {
          status: HttpStatus.CONFLICT,
          message: 'User already has a linked Riot account',
        };
      }
      return {
        status: HttpStatus.CONFLICT,
        message: 'Resource already exists',
      };
    case 'P2003':
      return {
        status: HttpStatus.BAD_REQUEST,
        message:
          'Cannot save linked account: invalid user or missing related data. Try signing out and registering or logging in again.',
      };
    case 'P2025':
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Record not found',
      };
    case 'P1001':
    case 'P1002':
    case 'P1017':
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Database temporarily unavailable',
      };
    default:
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Database error (${err.code})`,
      };
  }
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as Record<string, unknown>).message;

      response.status(status).json({
        statusCode: status,
        message: Array.isArray(message) ? message[0] : message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (exception instanceof PrismaClientKnownRequestError) {
      const { status, message } = mapPrismaKnownError(exception);
      this.logger.warn(
        `Prisma ${exception.code}: ${exception.message} meta=${JSON.stringify(exception.meta)}`,
      );
      response.status(status).json({
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (exception instanceof PrismaClientValidationError) {
      this.logger.warn(exception.message);
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid data for database operation',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception.stack : String(exception),
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}
