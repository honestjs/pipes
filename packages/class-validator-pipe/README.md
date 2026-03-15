# HonestJS - Class Validator Pipe

A validation pipe for the HonestJS framework that automatically validates and transforms DTOs using class-validator and
class-transformer.

## Installation

```bash
bun add @honestjs/class-validator-pipe class-validator class-transformer
# or
pnpm add @honestjs/class-validator-pipe class-validator class-transformer
# or
npm install @honestjs/class-validator-pipe class-validator class-transformer
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

## Options

```typescript
new ClassValidatorPipe({
	validator: { whitelist: true, forbidNonWhitelisted: false },
	transform: { enableImplicitConversion: true }
})
```

### Validator options (defaults)

| Option                 | Default | Description                               |
| ---------------------- | ------- | ----------------------------------------- |
| `whitelist`            | `true`  | Strip properties not decorated in the DTO |
| `forbidNonWhitelisted` | `false` | Throw when extra properties are sent      |

### Transform options (defaults)

| Option                     | Default | Description                            |
| -------------------------- | ------- | -------------------------------------- |
| `enableImplicitConversion` | `true`  | Coerce string numbers to numbers, etc. |

### Example: strict mode

```typescript
new ClassValidatorPipe({ validator: { forbidNonWhitelisted: true } })
```

## Recipes

### Reject unknown properties

```typescript
new ClassValidatorPipe({ validator: { forbidNonWhitelisted: true } })
```

### Disable implicit conversion

```typescript
new ClassValidatorPipe({ transform: { enableImplicitConversion: false } })
```

### Nested DTOs

Use `@ValidateNested()` and `@Type()` from class-validator and class-transformer:

```typescript
import { ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

class AddressDto {
	@IsString()
	street: string
}

class CreateUserDto {
	@ValidateNested()
	@Type(() => AddressDto)
	address: AddressDto
}
```

## Troubleshooting

| Issue                                | Cause                                                  | Solution                                                                                                              |
| ------------------------------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `Validation failed` (generic)        | Internal error from class-validator/class-transformer  | Check DTO decorators; ensure `reflect-metadata` is imported before HonestJS                                           |
| Body not validated                   | DTO not used as parameter type                         | Use `@Body() body: CreateUserDto` so metatype is available                                                            |
| `plainToInstance` / decorator errors | Missing `reflect-metadata` or `experimentalDecorators` | Add `import 'reflect-metadata'` at app entry; enable `experimentalDecorators` and `emitDecoratorMetadata` in tsconfig |
| Empty error message                  | All validation errors lack `constraints`               | Rare; ensure DTOs use standard class-validator decorators                                                             |

## License

MIT © [Orkhan Karimov](https://github.com/kerimovok)
