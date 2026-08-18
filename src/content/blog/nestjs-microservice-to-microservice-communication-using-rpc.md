---
title: "NestJS — Microservice to Microservice Communication Using RPC"
date: "2025-10-17"
preview: "So you split your giant monolith into microservices. Now how do they talk to each other? Here's how to use RPC in NestJS."
description: "Wiring NestJS services together with RPC instead of HTTP: choosing a transport, defining message patterns, and calling one service from another."
tags: ["nestjs", "microservices", "rpc"]
mediumUrl: "https://blog.stackademic.com/nestjs-microservice-to-microservice-communication-using-rpc-f77bb71a3acb"
---
So you split your giant monolith into microservices. Congratulations — you now have **ten smaller problems instead of one big one.**

Now comes the real fun: making those little services _actually_ talk to each other without HTTP overhead.

Let’s fix that using **RPC in NestJS**, the cleanest way to make your microservices feel like best friends instead of awkward strangers at a networking event.

## 🧠 TL;DR

- **NestJS microservices** support **RPC** (Remote Procedure Call) out of the box.
- You can use **TCP**, **Redis**, **NATS**, or **gRPC** as the transport layer.
- It’s perfect for _synchronous_, low-latency service-to-service calls.
- And it looks way cooler than writing yet another `axios.post()`.

## 🧩 The Setup

We’ll build two microservices:

- **Auth Service** → validates tokens
- **User Service** → asks Auth if the token’s legit before fetching user data

Because nothing screams “secure system” like your services asking each other, “Hey bro, is this user real?”

## 🏗 Step 1: Create Two NestJS Projects

```bash
npx @nestjs/cli new auth-service
npx @nestjs/cli new user-service
```

Inside each project, install microservices support:

```bash
npm install @nestjs/microservices
```

## ⚙️ Step 2: Setup the Auth Service (RPC Server)

The Auth service will **listen** for RPC messages and respond.

In `main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: { port: 4001 },
  });
  await app.listen();
}
bootstrap();
```

Now define a handler in your `AuthController`:

```typescript
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AuthController {
  @MessagePattern({ cmd: 'validate-token' })
  validateToken(token: string) {
    return token === 'valid_token'
      ? { status: 'success', userId: 42 }
      : { status: 'error', message: 'Invalid token' };
  }
}
```

That’s your first RPC endpoint.
 Think of it as a function on another planet you can call directly.

## ⚡️ Step 3: Setup the User Service (RPC Client)

Now the User service needs to **call** the Auth service over TCP.

In `main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

In your `AppModule`, connect to the Auth microservice:

```typescript
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserController } from './user.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: { port: 4001 },
      },
    ]),
  ],
  controllers: [UserController],
})
export class AppModule {}
```

And in `user.controller.ts`:

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ClientProxy, Client, Transport } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Controller()
export class UserController {
  @Client({ transport: Transport.TCP, options: { port: 4001 } })
  client: ClientProxy;
  @Get('user')
  async getUser(@Query('token') token: string) {
    const result = await lastValueFrom(this.client.send({ cmd: 'validate-token' }, token));
    if (result.status === 'success') {
      return { userId: result.userId, name: 'John Doe' };
    }
    return { error: result.message };
  }
}
```

Boom 💥 — your microservices are talking like old friends.

## 🧪 Test It Out

Run both services:

```bash
npm run start:dev
```

Then hit:

```bash
GET http://localhost:3000/user?token=valid_token
```

Response:

```json
{
  "userId": 42,
  "name": "John Doe"
}
```

Try with `invalid_token` — you’ll get:

```json
{ "error": "Invalid token" }
```

No HTTP calls, no REST routing, no drama.

## 🚀 Why RPC Wins (Sometimes)

RPC is like a **private hotline** between microservices — low latency, built for performance, and fits when:

- You have **tightly coupled services** that sync data in real time.
- You want **direct request/response semantics**.
- You don’t need the overhead of a message queue.

But remember:

> **_RPC ≠ scalability silver bullet._**

If your service mesh grows beyond a few nodes, look at **event-driven messaging** with Kafka, NATS, or RabbitMQ.

## 🧘 Wrap-up

Microservices are fun — until you need them to cooperate.
 NestJS’s built-in **RPC transport** makes that frictionless. No complex configs, no broker setup — just direct function calls over the network.

If your services could talk, they’d probably say:

> _“Hey, that was surprisingly easy.”_

**Next up:**
 Want to level up? Try:

- 🔁 Using **Redis transport** for faster distributed RPC
- ⚙️ Adding **retry & timeout strategies**
- 🧠 Exploring **NATS** for hybrid request/event patterns

**💡 Pro Tip:** Once you’ve nailed this, you can turn this same pattern into a gRPC setup with proto definitions — cleaner types, better validation, and inter-language support.
