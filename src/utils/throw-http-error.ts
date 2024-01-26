import { HttpException } from '@nestjs/common';

export function throwHTTPError(message: string, statusCode: number): never {
  throw new HttpException(message, statusCode);
}
