# @honestjs/class-validator-pipe

A validation pipe for the HonestJS framework that automatically validates and transforms DTOs using class-validator and
class-transformer.

## Features

- 🔍 **Automatic validation** using class-validator decorators
- 🔄 **Type transformation** from plain objects to class instances
- 🎯 **Whitelist support** to remove non-decorated properties
- 📋 **Nested validation** for complex object structures
- 🚫 **Forbid non-whitelisted** properties option
- 🔧 **Customizable** validation and transformation options
- 📦 **TypeScript support** with full type safety

## Installation

```bash
npm install @honestjs/class-validator-pipe
```

### Peer Dependencies

This package requires the following peer dependencies:

```bash
npm install honestjs class-validator class-transformer
```

For advanced use cases like `PartialType` (see "Update Operations" below), you may also need `@nestjs/mapped-types`:

```bash
npm install @nestjs/mapped-types
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

### 2. Use the pipe in your controller

```typescript
import { Controller, Post, Body } from 'honestjs'
import { ClassValidationPipe } from '@honestjs/class-validator-pipe'
import { CreateUserDto } from './dtos/create-user.dto'

@Controller('/users')
export class UserController {
	@Post()
	async createUser(@Body(new ClassValidationPipe()) userData: CreateUserDto) {
		// userData is now validated and transformed to CreateUserDto instance
		console.log(userData instanceof CreateUserDto) // true
		return this.userService.create(userData)
	}
}
```

## Advanced Usage

### Custom Validation Options

```typescript
import { ClassValidationPipe } from '@honestjs/class-validator-pipe'

const strictPipe = new ClassValidationPipe(
  {
    // Validation options
    whitelist: true,           // Remove non-decorated properties
    forbidNonWhitelisted: true, // Throw error for extra properties
    transform: true,           // Enable transformation
    skipMissingProperties: false, // Validate all properties
    skipNullProperties: false,    // Validate null properties
    skipUndefinedProperties: false, // Validate undefined properties
    stopAtFirstError: false,   // Collect all errors
    groups: ['create']         // Validation groups
  },
  {
    // Transformation options
    enableImplicitConversion: true,    // Auto-convert types
    excludeExtraneousValues: true,     // Remove extra properties
    enableCircularCheck: true,         // Prevent circular references
    exposeDefaultValues: true,         // Include default values
    exposeUnsetFields: false          // Don't expose unset fields
  }
)

@Post()
async createUser(@Body(strictPipe) userData: CreateUserDto) {
  return this.userService.create(userData)
}
```

### Nested Validation

```typescript
import { IsString, ValidateNested, Type } from 'class-validator'

export class AddressDto {
	@IsString()
	street: string

	@IsString()
	city: string

	@IsString()
	country: string
}

export class CreateUserDto {
	@IsString()
	name: string

	@ValidateNested()
	@Type(() => AddressDto)
	address: AddressDto
}
```

### Array Validation

```typescript
import { IsArray, ValidateNested, Type } from 'class-validator'

export class CreateUserDto {
	@IsString()
	name: string

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => AddressDto)
	addresses: AddressDto[]
}
```

### Global Pipe Registration

```typescript
import { HonestApplication } from 'honestjs'
import { ClassValidationPipe } from '@honestjs/class-validator-pipe'

const app = new HonestApplication()

// Register globally
app.useGlobalPipes(
	new ClassValidationPipe({
		whitelist: true,
		forbidNonWhitelisted: true,
		transform: true
	})
)
```

## Configuration Options

### Validation Options

| Option                    | Type       | Default     | Description                                  |
| ------------------------- | ---------- | ----------- | -------------------------------------------- |
| `whitelist`               | `boolean`  | `true`      | Remove properties that don't have decorators |
| `forbidNonWhitelisted`    | `boolean`  | `false`     | Throw error for extra properties             |
| `transform`               | `boolean`  | `false`     | Enable automatic transformation              |
| `skipMissingProperties`   | `boolean`  | `false`     | Skip validation for missing properties       |
| `skipNullProperties`      | `boolean`  | `false`     | Skip validation for null properties          |
| `skipUndefinedProperties` | `boolean`  | `false`     | Skip validation for undefined properties     |
| `stopAtFirstError`        | `boolean`  | `false`     | Stop after first validation error            |
| `groups`                  | `string[]` | `undefined` | Validation groups to use                     |

### Transformation Options

| Option                     | Type      | Default | Description                          |
| -------------------------- | --------- | ------- | ------------------------------------ |
| `enableImplicitConversion` | `boolean` | `true`  | Auto-convert primitive types         |
| `excludeExtraneousValues`  | `boolean` | `false` | Remove properties without decorators |
| `enableCircularCheck`      | `boolean` | `false` | Prevent circular reference errors    |
| `exposeDefaultValues`      | `boolean` | `false` | Include default values in output     |
| `exposeUnsetFields`        | `boolean` | `true`  | Include unset fields in output       |

## Error Handling

The pipe throws `BadRequestException` with detailed error messages when validation fails:

```typescript
// Input: { name: 'A', email: 'invalid-email' }
// Output: BadRequestException with message:
// "name: name must be longer than or equal to 2 characters; email: email must be an email"
```

## API Reference

### `ClassValidationPipe`

```typescript
class ClassValidationPipe implements IPipe {
	constructor(validatorOptions?: ValidatorOptions, transformOptions?: ClassTransformOptions)

	async transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown>
}
```

#### Methods

- **`transform(value, metadata)`**: Validates and transforms the input value
    - `value`: The value to validate (can be a Promise)
    - `metadata`: Metadata containing the target class type
    - Returns: The validated and transformed class instance
    - Throws: `BadRequestException` on validation failure

## Best Practices

1. **Use specific validation decorators** for better error messages
2. **Enable whitelist** to remove unwanted properties
3. **Use transformation** for automatic type conversion
4. **Handle nested objects** with `@ValidateNested()` and `@Type()`
5. **Group validations** for different scenarios (create, update, etc.)
6. **Custom error messages** for better user experience

## Common Use Cases

### Update Operations

```typescript
import { PartialType } from '@nestjs/mapped-types'

export class UpdateUserDto extends PartialType(CreateUserDto) {}

@Put(':id')
async updateUser(
  @Param('id') id: string,
  @Body(new ClassValidationPipe()) updateData: UpdateUserDto
) {
  return this.userService.update(id, updateData)
}
```

### Query Parameters

```typescript
import { Transform } from 'class-transformer'
import { IsNumber, IsOptional, Min, Max } from 'class-validator'

export class GetUsersQuery {
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  limit?: number = 10

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  offset?: number = 0
}

@Get()
async getUsers(@Query(new ClassValidationPipe()) query: GetUsersQuery) {
  return this.userService.findAll(query)
}
```

## TypeScript Support

This package includes full TypeScript support with proper type definitions. The pipe preserves type information during
transformation.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
