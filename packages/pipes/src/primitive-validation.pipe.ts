import type { ArgumentMetadata, IPipe } from 'honestjs'
import { BadRequestException } from 'http-essentials'

/**
 * A validation pipe that handles transformation and validation of primitive types.
 *
 * This pipe provides automatic type conversion for primitive JavaScript types (String, Number, Boolean)
 * with configurable transformation options. It's particularly useful for handling query parameters,
 * path parameters, and other simple data that needs type coercion from strings to their proper types.
 *
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
