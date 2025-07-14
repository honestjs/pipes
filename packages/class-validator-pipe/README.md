# HonestJS - Class Validator Pipe

A validation pipe for the HonestJS framework that automatically validates and transforms DTOs using class-validator and
class-transformer.

> ⚠️ **Documentation is not yet complete** ⚠️
>
> If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## Installation

```bash
bun add @honestjs/class-validator-pipe
```

## Basic Usage

### 1. Create a DTO class

```typescript
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator'

export class CreateUserDto {
	@IsString()
	@MinLength(2)
	name: string

	@IsEmail()
	email: string

	@IsString()
	@IsOptional()
	bio?: string
}
```

### 2. Use the pipe in your application

```typescript
import { Application } from 'honestjs'
import { ClassValidatorPipe } from '@honestjs/class-validator-pipe'

const { hono } = await Application.create(AppModule, {
	components: {
		pipes: [new ClassValidatorPipe()]
	}
})
```

## License

MIT © [Orkhan Karimov](https://github.com/kerimovok)
