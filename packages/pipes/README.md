# @honestjs/pipes

A validation pipe for the HonestJS framework that handles automatic transformation and validation of primitive types
(String, Number, Boolean).

## Features

- 🔢 **Number transformation** with NaN validation
- ✅ **Boolean transformation** with multiple input formats
- 📝 **String transformation** from any type
- 🎛️ **Configurable transformations** - enable/disable per type
- 🚫 **Error handling** with detailed error messages
- 🔧 **TypeScript support** with full type safety
- ⚡ **Lightweight** with minimal dependencies

## Installation

```bash
npm install @honestjs/pipes
```

## Basic Usage

### Path Parameters

```typescript
import { Controller, Get, Param } from 'honestjs'
import { PrimitiveValidationPipe } from '@honestjs/pipes'

@Controller('/users')
export class UserController {
	@Get(':id')
	async getUser(@Param('id', new PrimitiveValidationPipe()) id: number) {
		// id is automatically converted from string to number
		console.log(typeof id) // 'number'
		return this.userService.findById(id)
	}
}
```

### Query Parameters

```typescript
@Get()
async getUsers(
  @Query('limit', new PrimitiveValidationPipe()) limit: number,
  @Query('published', new PrimitiveValidationPipe()) published: boolean
) {
  // limit: "10" -> 10
  // published: "true" -> true
  return this.userService.findAll({ limit, published })
}
```

### Headers

```typescript
@Post()
async createUser(
  @Header('content-length', new PrimitiveValidationPipe()) contentLength: number,
  @Body() userData: any
) {
  // contentLength is automatically converted to number
  return this.userService.create(userData)
}
```

## Advanced Usage

### Custom Configuration

```typescript
import { PrimitiveValidationPipe } from '@honestjs/pipes'

// Only transform numbers, leave strings and booleans as-is
const numberOnlyPipe = new PrimitiveValidationPipe({
  transformNumber: true,
  transformString: false,
  transformBoolean: false
})

@Get(':id')
async getUser(@Param('id', numberOnlyPipe) id: number) {
  return this.userService.findById(id)
}
```

### Strict Mode (No Transformations)

```typescript
const strictPipe = new PrimitiveValidationPipe({
  transformNumber: false,
  transformString: false,
  transformBoolean: false
})

// Values will be returned as-is without transformation
@Get(':id')
async getUser(@Param('id', strictPipe) id: string) {
  // id remains as string
  return this.userService.findById(id)
}
```

### Global Registration

```typescript
import { HonestApplication } from 'honestjs'
import { PrimitiveValidationPipe } from '@honestjs/pipes'

const app = new HonestApplication()

// Register globally for all primitive type transformations
app.useGlobalPipes(
	new PrimitiveValidationPipe({
		transformNumber: true,
		transformString: true,
		transformBoolean: true
	})
)
```

## Type Transformations

### Number Transformation

The pipe converts string values to numbers and validates them:

```typescript
// Valid transformations
"123" -> 123
"12.5" -> 12.5
"-42" -> -42
"0" -> 0

// Invalid transformations (throws BadRequestException)
"abc" -> Error: Cannot convert 'abc' to a number
"123abc" -> Error: Cannot convert '123abc' to a number
"" -> Error: Cannot convert '' to a number
```

### Boolean Transformation

The pipe accepts multiple string formats for boolean values:

```typescript
// Truthy values
"true" -> true
"yes" -> true
"1" -> true
"on" -> true
"TRUE" -> true  // Case insensitive
"Yes" -> true   // Case insensitive

// Falsy values
"false" -> false
"no" -> false
"0" -> false
"off" -> false
"FALSE" -> false  // Case insensitive
"No" -> false     // Case insensitive

// Numbers to boolean
1 -> true
0 -> false
42 -> true
-1 -> true

// Invalid transformations (throws BadRequestException)
"maybe" -> Error: Cannot convert string 'maybe' to a boolean
"2" -> Error: Cannot convert string '2' to a boolean
```

### String Transformation

The pipe converts any value to its string representation:

```typescript
// All types can be converted to string
123 -> "123"
true -> "true"
false -> "false"
null -> "null"
undefined -> "undefined"
```

## Configuration Options

### Constructor Options

```typescript
interface PrimitiveValidationPipeOptions {
	transformBoolean?: boolean // Default: true
	transformNumber?: boolean // Default: true
	transformString?: boolean // Default: true
}
```

| Option             | Type      | Default | Description                   |
| ------------------ | --------- | ------- | ----------------------------- |
| `transformBoolean` | `boolean` | `true`  | Enable boolean transformation |
| `transformNumber`  | `boolean` | `true`  | Enable number transformation  |
| `transformString`  | `boolean` | `true`  | Enable string transformation  |

## Error Handling

The pipe throws `BadRequestException` with detailed error messages when transformation fails:

```typescript
// Number conversion error
// Input: "abc" for number type
// Output: BadRequestException("Cannot convert 'abc' to a number")

// Boolean conversion error
// Input: "maybe" for boolean type
// Output: BadRequestException("Cannot convert string 'maybe' to a boolean")

// Type conversion error
// Input: object for number type
// Output: BadRequestException("Cannot convert object to a number")
```

## API Reference

### `PrimitiveValidationPipe`

```typescript
class PrimitiveValidationPipe implements IPipe {
	constructor(options?: { transformBoolean?: boolean; transformNumber?: boolean; transformString?: boolean })

	async transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown>
}
```

#### Methods

- **`transform(value, metadata)`**: Transforms the input value to the target primitive type
    - `value`: The value to transform (can be a Promise)
    - `metadata`: Metadata containing the target type information
    - Returns: The transformed value matching the expected type
    - Throws: `BadRequestException` on transformation failure

## Common Use Cases

### API Pagination

```typescript
interface PaginationQuery {
  page: number
  limit: number
  sort: string
  desc: boolean
}

@Get()
async getUsers(
  @Query('page', new PrimitiveValidationPipe()) page: number = 1,
  @Query('limit', new PrimitiveValidationPipe()) limit: number = 10,
  @Query('sort', new PrimitiveValidationPipe()) sort: string = 'id',
  @Query('desc', new PrimitiveValidationPipe()) desc: boolean = false
) {
  return this.userService.findAll({ page, limit, sort, desc })
}
```

### Feature Flags

```typescript
@Get('/features')
async getFeatures(
  @Query('experimental', new PrimitiveValidationPipe()) experimental: boolean = false
) {
  return this.featureService.getFeatures({ experimental })
}
```

### Numeric Filters

```typescript
@Get('/products')
async getProducts(
  @Query('minPrice', new PrimitiveValidationPipe()) minPrice: number,
  @Query('maxPrice', new PrimitiveValidationPipe()) maxPrice: number,
  @Query('category', new PrimitiveValidationPipe()) category: string
) {
  return this.productService.findAll({ minPrice, maxPrice, category })
}
```

## License

MIT © [Orkhan Karimov](https://github.com/kerimovok)
