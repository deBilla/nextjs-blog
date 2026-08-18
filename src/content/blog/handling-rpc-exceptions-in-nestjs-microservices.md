---
title: "Handling RPC Exceptions in NestJS Microservices"
date: "2025-10-22"
preview: "How to properly handle RPC exceptions when communicating between NestJS microservices."
description: "Exceptions don't cross RPC boundaries cleanly in NestJS. How to translate service errors into RpcException and map them back to HTTP at the gateway."
tags: ["nestjs", "microservices", "rpc"]
mediumUrl: "https://blog.stackademic.com/handling-rpc-exceptions-in-nestjs-microservices-ef133862f546"
---
Hi guys, welcome back to another episode of NestJS learning.

You’ve split your giant monolith into multiple microservices. Congratulations — you now have ten smaller problems instead of one. 😅

Let’s talk about one of those problems today — handling exceptions across RPC boundaries.

## How NestJS Exception Handling Works

In a traditional REST setup, exceptions bubble up to an HTTP exception filter, which formats a JSON response.

With RPC, the flow is different:

- A **Microservice** throws an error.
- A **Microservice-side filter** must _catch_ this error (whether it’s a generic `Error`, a custom `ServiceException`, etc.) and _translate_ it into a serializable `RpcException`.
- The `RpcException` travels over the transport layer (e.g., TCP, Redis).
- An **API Gateway-side filter** must _catch_ the incoming `RpcException` and _translate_ it into a standard HTTP JSON response for the client.

This two-filter strategy is robust and keeps your concerns separated. Let’s look at the code for this production-ready approach.

## Part 1: The API Gateway Filter (Global Catcher)

This filter runs in your **API Gateway**. Its job is to be the single source of truth for all error responses sent to the client. It’s smart enough to handle two types of errors:

- `**HttpException**`: Errors that originate _within_ the gateway itself (e.g., rate-limiting, bad request validation).
- `**RpcException**`: Structured errors that arrive from a microservice.

Here is the filter that catches everything (`@Catch()`).

`**global-exception.filter.ts (In API Gateway)**`

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { isRpcErrorObject, RpcErrorPayload } from './rpc-exception.helper';

// This is a type-safe interface for the structured error
// we expect from our microservices.
interface StructuredErrorResponse {
  statusCode: number;
  errorCode: string;
  message: string;
  timestamp: string;
}
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected internal server error occurred.';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    this.logger.error(
      `Caught exception: ${exception?.constructor?.name}`,
      exception,
    );
    if (isRpcErrorObject(exception)) {
      // This is a structured RpcException from a microservice
      const rpcError = exception.error as RpcErrorPayload;
      statusCode = rpcError.status_code ?? rpcError.statusCode;
      errorCode = rpcError.error_code ?? rpcError.errorCode;
      message = rpcError.message;
      this.logger.warn(
        `Received RPC Error: [${errorCode}] ${message}`,
        exception.error,
      );
    } else if (exception instanceof HttpException) {
      // This is an error from the gateway itself
      statusCode = exception.getStatus();
      const errorResponse = exception.getResponse();
      if (typeof errorResponse === 'object' && errorResponse !== null) {
        const structuredResponse = errorResponse as {
          message: string;
          error: string;
        };
        message = structuredResponse.message || exception.message;
        errorCode = structuredResponse.error || 'HTTP_EXCEPTION';
      } else {
        message = errorResponse as string;
      }
    } else if (exception instanceof Error) {
      // This is an unknown generic error
      message = exception.message;
    }
    const errorResponse: StructuredErrorResponse = {
      statusCode,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
    };
    response.status(statusCode).json(errorResponse);
  }
}
```

To make this filter work, it needs a small helper to safely identify if an incoming exception is our structured RPC error.

`**rpc-exception.helper.ts (In API Gateway)**`

```typescript
import { RpcException } from '@nestjs/microservices';

// This is the shape of the 'error' object our microservice
// filter will create.
export interface RpcErrorPayload {
  status_code?: number;
  statusCode?: number;
  message?: string;
  error_code?: string;
  errorCode?: string;
  data?: unknown;
}
// This is a type guard to check if an 'unknown' exception
// is an RpcException carrying our specific payload.
export function isRpcErrorObject(
  exception: unknown,
): exception is RpcException & { error: RpcErrorPayload } {
  if (typeof exception !== 'object' || exception === null) {
    return false;
  }
  
  // Check if it's an RpcException
  if (exception instanceof RpcException) {
    const error = exception.getError();
    if (typeof error !== 'object' || error === null) {
      return false;
    }
    
    // Check for our custom fields
    return 'status_code' in error || 'error_code' in error;
  }
  
  // Fallback for other potential wrapped errors
  const err = exception as { error?: unknown };
  if (typeof err.error !== 'object' || err.error === null) {
    return false;
  }
  const errorPayload = err.error as RpcErrorPayload;
  return 'status_code' in errorPayload || 'error_code' in errorPayload;
}
```

Finally, register this filter globally in your gateway’s `main.ts`.

`**main.ts (API Gateway)**`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Apply the filter globally
  app.useGlobalFilters(new GlobalExceptionFilter());
  
  await app.listen(3000);
}
bootstrap();
```

## Part 2: The Microservice-Side Filter (Translator)

Now for the **User Microservice**. Its job is to run business logic and throw _domain-specific_ errors. We will create a `CustomRpcExceptionFilter` that catches _all_ errors inside this microservice and translates them into the structured `RpcException` payload that our `GlobalExceptionFilter` (from Part 1) expects.

First, let’s define our custom domain exceptions. These are protocol-agnostic.

`**service.exception.ts (In Microservice)**`

```typescript
// A generic exception for our service layer
export class ServiceException extends Error {
  constructor(
    public readonly error_code: string,
    public readonly data: unknown = {},
  ) {
    super(`Service Error: ${error_code}`);
    this.name = 'ServiceException';
  }
}
```

`**auth.exception.ts (In Microservice)**`

```typescript
// A specific exception for auth errors
export class AuthException extends Error {
  constructor(
    public readonly error_code: string,
    public readonly data: unknown = {},
  ) {
    super(`Auth Error: ${error_code}`);
    this.name = 'AuthException';
  }
}
```

Our service logic will throw these exceptions. This keeps the service layer clean and unaware of HTTP or RPC.

`**user.service.ts (In Microservice)**`

```typescript
import { Injectable } from '@nestjs/common';
import { ServiceException } from './exceptions/service.exception';

@Injectable()
export class UserService {
  private readonly users = [{ email: 'john@example.com', name: 'John' }];
  async createUser(data: { email: string; name: string }) {
    const existingUser = this.users.find(u => u.email === data.email);
    
    if (existingUser) {
      // Throw our custom, transport-agnostic exception
      throw new ServiceException('USER_ALREADY_EXISTS');
    }
    
    this.users.push(data);
    return { message: 'User created successfully' };
  }
}
```

To map string error codes like `USER_ALREADY_EXISTS` to real status codes and messages, we'll use a handler (you can implement this with a simple map or database).

`**global-message-handler.ts (In Microservice)**`

```typescript
// A stubbed message handler for demonstration.
// In a real app, this might read from a config file or DB.
export const ErrorDefinitions = {
  USER_ALREADY_EXISTS: {
    status_code: 409,
    error_code: 'USER_ALREADY_EXISTS',
    message: 'User with this email already exists',
  },
  INTERNAL_SERVER_ERROR: {
    status_code: 500,
    error_code: 'INTERNAL_SERVER_ERROR',
    message: 'An internal server error occurred',
  },
  // Add other errors like 'INVALID_CREDENTIALS' for AuthException
};

export class GlobalMessageHandler {
  static getErrorDefinition(errorCode: string) {
    return (
      ErrorDefinitions[errorCode] || ErrorDefinitions.INTERNAL_SERVER_ERROR
    );
  }
}
```

Now, here is the powerful microservice filter that brings it all together. It catches `ServiceException`, `AuthException`, `RpcException` (if one is passed through), and _any_ other `Error`, logs it, and transforms it into our standard `RpcException` payload.

`**custom-rpc-exception.filter.ts (In Microservice)**`

```typescript
import { ArgumentsHost, Catch, RpcExceptionFilter, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { AuthException } from './exceptions/auth.exception';
import { ServiceException } from './exceptions/service.exception';
import { GlobalMessageHandler } from './global-message-handler';

// This payload matches the RpcErrorPayload in the gateway
interface RpcErrorPayload {
  status_code?: number;
  statusCode?: number;
  message?: string;
  error_code?: string;
  errorCode?: string;
  data?: unknown;
}
@Catch()
export class CustomRpcExceptionFilter implements RpcExceptionFilter {
  // Using Nest's built-in logger here, but pino-logger is a great choice
  private readonly logger = new Logger(CustomRpcExceptionFilter.name);
  public catch(exception: Error, _host: ArgumentsHost): Observable<never> {
    this.logger.error(
      `[CustomRpcExceptionFilter] Caught exception: ${exception.constructor.name}`,
      exception.stack,
      {
        error_name: exception?.name,
        error_message: exception.message,
      },
    );
    let data: Record<string, unknown> = {};
    let statusCode: number;
    let message: string;
    let errorCode: string;
    if (exception instanceof ServiceException || exception instanceof AuthException) {
      // Our custom domain exceptions
      const errorDefinition = GlobalMessageHandler.getErrorDefinition(exception.error_code);
      data = exception.data as Record<string, unknown>;
      statusCode = errorDefinition.status_code;
      message = errorDefinition.message;
      errorCode = errorDefinition.error_code;
    } else if (exception instanceof RpcException) {
      // An RpcException that was already formatted
      const error = exception.getError();
      if (typeof error === 'object' && error !== null) {
        const payload = error as RpcErrorPayload;
        statusCode = payload.status_code ?? payload.statusCode ?? 500;
        message = payload.message ?? exception.message;
        errorCode = payload.error_code ?? payload.errorCode ?? 'RPC_ERROR';
        if (payload.data && typeof payload.data === 'object') {
          data = payload.data as Record<string, unknown>;
        }
      } else {
        statusCode = 500;
        message = typeof error === 'string' ? error : exception.message;
        errorCode = 'RPC_ERROR';
      }
    } else {
      // Any other unhandled error
      const errorDefinition = GlobalMessageHandler.getErrorDefinition(
        'INTERNAL_SERVER_ERROR',
      );
      statusCode = errorDefinition.status_code;
      message = errorDefinition.message;
      errorCode = errorDefinition.error_code;
    }
    // This is the structured error object our gateway filter expects
    const responseError = {
      error_code: errorCode,
      status_code: statusCode,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    this.logger.warn(
      `[CustomRpcExceptionFilter] Propagating structured error: [${errorCode}] ${message}`,
    );
    // Wrap it in a *new* RpcException to send it over the wire
    return throwError(() => new RpcException(responseError));
  }
}
```

Finally, register this filter in your microservice’s `main.ts`.

`**main.ts (User Microservice)**`

```typescript
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { UserModule } from './user.module';
import { CustomRpcExceptionFilter } from './custom-rpc-exception.filter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(UserModule, {
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 3001,
    },
  });
  // Apply the filter globally *within this microservice*
  app.useGlobalFilters(new CustomRpcExceptionFilter());
  await app.listen();
}
bootstrap();
```

## The Full Flow (Putting It All Together)

Now, with _both_ filters in place, look at the robust flow we’ve created:

- **Client:** Sends `POST /users` to the API Gateway.
- **API Gateway:** `UserGatewayService` forwards the request via RPC to the `USER_SERVICE`.
- **User Microservice:** `UserService.createUser` logic runs.
- **User Microservice:** It finds a duplicate and throws a `new ServiceException('USER_ALREADY_EXISTS')`.
- **User Microservice:** The `CustomRpcExceptionFilter` catches this `ServiceException`. It uses `GlobalMessageHandler` to get the error details (409, message, etc.) and formats them into a `responseError` object.
- **User Microservice:** The filter wraps this object in a `new RpcException(responseError)` and `throwError`'s it.
- **(Transport Layer):** The `RpcException` (with its `error` payload) is serialized and sent back to the gateway.
- **API Gateway:** The `GlobalExceptionFilter` catches the incoming exception.
- **API Gateway:** The `isRpcErrorObject` helper identifies it as a structured RPC error.
- **API Gateway:** The filter translates the `error` payload into a clean JSON HTTP response (409) and sends it to the client.

**Client Receives:**

```json
{
  "statusCode": 409,
  "errorCode": "USER_ALREADY_EXISTS",
  "message": "User with this email already exists",
  "timestamp": "2025-10-22T12:30:00.000Z"
}
```

## Summary

- Use a **Gateway-Side **`**GlobalExceptionFilter**` to catch _all_ exceptions and act as the single source of truth for formatting client-facing HTTP error responses.
- Use a **Microservice-Side **`**CustomRpcExceptionFilter**` to catch _all_ internal errors (custom `ServiceException`, `RpcException`, generic `Error`) and translate them into a _single, consistent_ `RpcException` payload.
- This two-filter strategy fully decouples your domain logic (`ServiceException`) from your transport layers (RPC and HTTP).
