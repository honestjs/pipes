import type { ArgumentMetadata, IPipe } from 'honestjs'
import { BadRequestException } from 'http-essentials'

/**
 * A validation pipe that handles transformation and validation of primitive types.
 *
 * This pipe provides automatic type conversion for primitive JavaScript types (String, Number, Boolean)
 * with configurable transformation options. It's particularly useful for handling query parameters,
 * path parameters, and other simple data that needs type coercion from strings to their proper types.
 *
 * @example
 * ```typescript
 * import { PrimitiveValidationPipe } from '@honestjs/primitive-validator-pipe'
 *
 * // Use in a controller method for automatic type conversion
 * @Get('/users/:id')
 * async getUser(@Param('id', new PrimitiveValidationPipe()) id: number) {
 *   // id is automatically converted from string to number
 *   return this.userService.findById(id)
 * }
 *
 * @Get('/posts')
 * async getPosts(@Query('published', new PrimitiveValidationPipe()) published: boolean) {
 *   // 'true', 'false', '1', '0' etc. are converted to boolean
 *   return this.postService.findAll({ published })
 * }
 * ```
 *
 * @example
 * Custom transformation options:
 * ```typescript
 * // Only transform numbers, leave strings and booleans as-is
 * const numberOnlyPipe = new PrimitiveValidationPipe({
 *   transformNumber: true,
 *   transformString: false,
 *   transformBoolean: false
 * })
 * ```
 */
export class PrimitiveValidationPipe implements IPipe {
	/**
	 * Creates a new PrimitiveValidationPipe instance.
	 *
	 * @param options - Configuration options for type transformations
	 * @param options.transformBoolean - Whether to transform values to boolean (default: true)
	 * @param options.transformNumber - Whether to transform values to number (default: true)
	 * @param options.transformString - Whether to transform values to string (default: true)
	 *
	 * @example
	 * ```typescript
	 * // Default behavior - transform all primitive types
	 * const pipe = new PrimitiveValidationPipe()
	 *
	 * // Custom configuration - only transform numbers
	 * const numberPipe = new PrimitiveValidationPipe({
	 *   transformNumber: true,
	 *   transformString: false,
	 *   transformBoolean: false
	 * })
	 *
	 * // Strict mode - no automatic transformations
	 * const strictPipe = new PrimitiveValidationPipe({
	 *   transformNumber: false,
	 *   transformString: false,
	 *   transformBoolean: false
	 * })
	 * ```
	 */
	constructor(
		private readonly options: {
			transformBoolean?: boolean
			transformNumber?: boolean
			transformString?: boolean
		} = {
			transformBoolean: true,
			transformNumber: true,
			transformString: true
		}
	) {}

	/**
	 * Transforms a value to match the expected primitive type based on metadata.
	 *
	 * This method performs type conversion for primitive types when transformation is enabled.
	 * It handles Promise resolution, null/undefined values, and applies appropriate type
	 * conversions based on the target metatype.
	 *
	 * @param value - The value to transform (can be a Promise)
	 * @param metadata - Metadata containing the target type information
	 * @returns The transformed value matching the expected type
	 * @throws BadRequestException when transformation fails or invalid data is provided
	 *
	 * @example
	 * ```typescript
	 * // String transformation
	 * await pipe.transform(123, { metatype: String, type: 'param' })
	 * // Returns: "123"
	 *
	 * // Number transformation
	 * await pipe.transform("42", { metatype: Number, type: 'param' })
	 * // Returns: 42
	 *
	 * // Boolean transformation
	 * await pipe.transform("true", { metatype: Boolean, type: 'query' })
	 * // Returns: true
	 *
	 * await pipe.transform("false", { metatype: Boolean, type: 'query' })
	 * // Returns: false
	 * ```
	 */
	async transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> {
		// Resolve promise if value is a Promise
		if (value instanceof Promise) {
			try {
				value = await value
			} catch (error) {
				throw new BadRequestException('Invalid request data')
			}
		}

		// Handle null/undefined values
		if (value === null || value === undefined) {
			return value
		}

		// If no metatype is provided, return the value as is
		if (!metadata.metatype) {
			return value
		}

		try {
			// Apply transformations based on metatype
			return this.transformValue(value, metadata.metatype)
		} catch (error) {
			if (error instanceof BadRequestException) {
				throw error
			}
			throw new BadRequestException(`Failed to validate ${metadata.type}: ${(error as Error).message}`)
		}
	}

	/**
	 * Performs the actual type transformation based on the target metatype.
	 *
	 * This method handles the conversion logic for each primitive type:
	 * - String: Converts any value to string representation
	 * - Number: Converts string values to numbers, validates for NaN
	 * - Boolean: Converts various string representations to boolean values
	 *
	 * @param value - The value to transform
	 * @param metatype - The target type constructor (String, Number, or Boolean)
	 * @returns The transformed value
	 * @throws BadRequestException when conversion fails
	 *
	 * @example
	 * ```typescript
	 * // Number conversion examples
	 * transformValue("123", Number)     // Returns: 123
	 * transformValue("12.5", Number)    // Returns: 12.5
	 * transformValue("abc", Number)     // Throws: BadRequestException
	 *
	 * // Boolean conversion examples
	 * transformValue("true", Boolean)   // Returns: true
	 * transformValue("false", Boolean)  // Returns: false
	 * transformValue("1", Boolean)      // Returns: true
	 * transformValue("0", Boolean)      // Returns: false
	 * transformValue("yes", Boolean)    // Returns: true
	 * transformValue("no", Boolean)     // Returns: false
	 *
	 * // String conversion examples
	 * transformValue(123, String)       // Returns: "123"
	 * transformValue(true, String)      // Returns: "true"
	 * ```
	 */
	private transformValue(value: unknown, metatype: Function): unknown {
		// String validation and transformation
		if (metatype === String && this.options.transformString) {
			if (typeof value === 'string') {
				return value
			}
			if (value === null || value === undefined) {
				return value
			}
			const stringValue = String(value)
			return stringValue
		}

		// Number validation and transformation
		if (metatype === Number && this.options.transformNumber) {
			if (typeof value === 'number') {
				return value
			}
			if (typeof value === 'string') {
				const parsedValue = Number(value)
				if (isNaN(parsedValue)) {
					throw new BadRequestException(`Cannot convert '${value}' to a number`)
				}
				return parsedValue
			}
			throw new BadRequestException(`Cannot convert ${typeof value} to a number`)
		}

		// Boolean validation and transformation
		if (metatype === Boolean && this.options.transformBoolean) {
			if (typeof value === 'boolean') {
				return value
			}
			if (typeof value === 'string') {
				const normalizedValue = value.toLowerCase().trim()
				if (['true', 'yes', '1', 'on'].includes(normalizedValue)) {
					return true
				}
				if (['false', 'no', '0', 'off'].includes(normalizedValue)) {
					return false
				}
				throw new BadRequestException(`Cannot convert string '${value}' to a boolean`)
			}
			if (typeof value === 'number') {
				return !!value
			}
			throw new BadRequestException(`Cannot convert ${typeof value} to a boolean`)
		}

		// For types that are not primitives, return as is
		return value
	}
}
