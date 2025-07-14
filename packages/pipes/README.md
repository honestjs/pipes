# HonestJS - Pipes

A validation pipe for the HonestJS framework that handles automatic transformation and validation of primitive types
(String, Number, Boolean).

> ⚠️ **Documentation is not yet complete** ⚠️
>
> If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## Installation

```bash
bun add @honestjs/pipes
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

## License

MIT © [Orkhan Karimov](https://github.com/kerimovok)
