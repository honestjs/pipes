# HonestJS - Pipes

A validation pipe for the HonestJS framework that handles automatic transformation and validation of primitive types
(String, Number, Boolean). Use it for path and query parameters so `@Param('id') id: number` and
`@Query('page') page: number` receive correctly typed values.

## Installation

```bash
bun add @honestjs/pipes
# or
pnpm add @honestjs/pipes
# or
npm install @honestjs/pipes
```

## Basic Usage

```typescript
import { Application } from 'honestjs'
import { PrimitiveValidationPipe } from '@honestjs/pipes'

const { hono } = await Application.create(AppModule, {
	components: {
		pipes: [new PrimitiveValidationPipe()]
	}
})
```

```typescript
@Controller('/users')
export class UsersController {
	@Get('/:id')
	async findOne(@Param('id') id: number) {
		// `id` is a number (e.g. from /users/42)
		return this.usersService.findById(id)
	}

	@Get()
	async list(@Query('page') page: number, @Query('limit') limit: number) {
		// `page` and `limit` are numbers (e.g. ?page=1&limit=10)
		return this.usersService.findAll(page, limit)
	}
}
```

## Options

| Option             | Type    | Default | Description                                            |
| ------------------ | ------- | ------- | ------------------------------------------------------ |
| `transformString`  | boolean | `true`  | Transform values to `String` when metatype is String   |
| `transformNumber`  | boolean | `true`  | Transform values to `Number` when metatype is Number   |
| `transformBoolean` | boolean | `true`  | Transform values to `Boolean` when metatype is Boolean |

```typescript
new PrimitiveValidationPipe({
	transformString: true,
	transformNumber: true,
	transformBoolean: false
})
```

## Recipes

### Disable number coercion for IDs

If you want path params to stay as strings:

```typescript
new PrimitiveValidationPipe({ transformNumber: false })
```

### Boolean string values

Accepted truthy: `true`, `yes`, `1`, `on` (case-insensitive, trimmed).  
Accepted falsy: `false`, `no`, `0`, `off`.

## Troubleshooting

| Issue                                    | Cause                                           | Solution                                                                   |
| ---------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------- |
| `id` is still a string                   | Pipe not registered or `transformNumber: false` | Add `PrimitiveValidationPipe` to `components.pipes`                        |
| `Cannot convert 'x' to a number`         | Invalid numeric input (e.g. `?page=abc`)        | Client must send valid numbers; consider a custom pipe for custom messages |
| `Cannot convert string 'x' to a boolean` | Unrecognized boolean string                     | Use `true`/`false`, `yes`/`no`, `1`/`0`, or `on`/`off`                     |
| Empty string `''` for Number             | `Number('')` is `0`                             | This is intentional; use validation decorators if you need to reject empty |

## License

MIT © [Orkhan Karimov](https://github.com/kerimovok)
