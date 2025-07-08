import { type ClassTransformOptions, plainToInstance } from 'class-transformer'
import { ValidationError, type ValidatorOptions, validate } from 'class-validator'
import type { ArgumentMetadata, IPipe } from 'honestjs'
import { BadRequestException } from 'http-essentials'

/**
 * A validation pipe that uses class-validator and class-transformer to validate DTOs.
 *
 * This pipe automatically validates incoming request data against class-validator decorators
 * and transforms plain objects into class instances. It provides comprehensive validation
 * for complex object structures with support for nested validation, custom rules, and
 * automatic type transformation.
 *
 * @example
 * ```typescript
 * import { ClassValidationPipe } from '@honestjs/class-validator-pipe'
 * import { IsEmail, IsString, MinLength } from 'class-validator'
 *
 * class CreateUserDto {
 *   @IsString()
 *   @MinLength(2)
 *   name: string
 *
 *   @IsEmail()
 *   email: string
 * }
 *
 * // Use in a controller method
 * @Post('/users')
 * async createUser(@Body(new ClassValidationPipe()) userData: CreateUserDto) {
 *   // userData is now validated and transformed to CreateUserDto instance
 *   return this.userService.create(userData)
 * }
 * ```
 *
 * @example
 * Custom validation options:
 * ```typescript
 * const pipe = new ClassValidationPipe(
 *   {
 *     whitelist: true,
 *     forbidNonWhitelisted: true,
 *     transform: true
 *   },
 *   {
 *     enableImplicitConversion: true,
 *     excludeExtraneousValues: true
 *   }
 * )
 * ```
 */
export class ClassValidationPipe implements IPipe {
	private readonly validatorOptions: ValidatorOptions
	private readonly transformOptions: ClassTransformOptions

	/**
	 * Creates a new ClassValidationPipe instance.
	 *
	 * @param validatorOptions - Options for class-validator validation behavior
	 * @param transformOptions - Options for class-transformer transformation behavior
	 *
	 * @example
	 * ```typescript
	 * // Basic usage with default options
	 * const pipe = new ClassValidationPipe()
	 *
	 * // Custom validation options
	 * const strictPipe = new ClassValidationPipe({
	 *   whitelist: true,           // Remove non-decorated properties
	 *   forbidNonWhitelisted: true, // Throw error for extra properties
	 *   transform: true            // Enable automatic transformation
	 * })
	 *
	 * // Custom transformation options
	 * const transformPipe = new ClassValidationPipe(
	 *   {},
	 *   {
	 *     enableImplicitConversion: true,    // Auto-convert types
	 *     excludeExtraneousValues: true     // Remove extra properties
	 *   }
	 * )
	 * ```
	 */
	constructor(validatorOptions: ValidatorOptions = {}, transformOptions: ClassTransformOptions = {}) {
		this.validatorOptions = {
			whitelist: true,
			forbidNonWhitelisted: false,
			...validatorOptions
		}
		this.transformOptions = {
			enableImplicitConversion: true,
			...transformOptions
		}
	}

	/**
	 * Transforms and validates the input value using class-validator and class-transformer.
	 *
	 * This method performs the following steps:
	 * 1. Resolves Promise values if needed
	 * 2. Skips validation for primitive types or when no metatype is provided
	 * 3. Transforms plain objects to class instances using class-transformer
	 * 4. Validates the transformed object using class-validator decorators
	 * 5. Returns the validated and transformed instance
	 *
	 * @param value - The value to validate and transform (can be a Promise)
	 * @param metadata - Metadata containing the target class type and other information
	 * @returns The validated and transformed class instance
	 * @throws BadRequestException when validation fails or invalid data is provided
	 *
	 * @example
	 * ```typescript
	 * // This happens automatically when used as a pipe
	 * const result = await pipe.transform(
	 *   { name: 'John', email: 'john@example.com' },
	 *   { metatype: CreateUserDto, type: 'body', data: undefined }
	 * )
	 * // result is now a CreateUserDto instance with validated data
	 * ```
	 */
	async transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> {
		// Resolve the value if it's a Promise
		let resolvedValue = value
		if (value instanceof Promise) {
			try {
				resolvedValue = await value
			} catch (error) {
				throw new BadRequestException('Invalid request data')
			}
		}

		// Skip validation if no metatype or if it's a primitive type
		if (!metadata.metatype || !this.toValidate(metadata.metatype)) {
			return resolvedValue
		}

		// Handle null/undefined values
		if (resolvedValue === null || resolvedValue === undefined) {
			return resolvedValue
		}

		try {
			// Transform the value to an instance of the DTO class
			const object = plainToInstance(metadata.metatype, resolvedValue, this.transformOptions)

			// Validate the transformed object
			const errors = await validate(object as object, this.validatorOptions)

			// If there are validation errors, throw a BadRequestException
			if (errors.length > 0) {
				const errorMessage = this.buildErrorMessages(errors).join('; ')
				throw new BadRequestException(errorMessage)
			}

			return object
		} catch (error) {
			// If it's already a BadRequestException, rethrow it
			if (error instanceof BadRequestException) {
				throw error
			}

			// Otherwise, log the error and throw a generic BadRequestException
			throw new BadRequestException('Validation failed')
		}
	}

	private buildErrorMessages(errors: ValidationError[], parentProperty?: string): string[] {
		let messages: string[] = []
		errors.forEach((error) => {
			const propertyPath = parentProperty ? `${parentProperty}.${error.property}` : error.property
			if (error.constraints) {
				const constraintMessages = Object.values(error.constraints).join(', ')
				messages.push(`${propertyPath}: ${constraintMessages}`)
			}
			if (error.children && error.children.length > 0) {
				messages = messages.concat(this.buildErrorMessages(error.children, propertyPath))
			}
		})
		return messages
	}

	/**
	 * Determines whether a given metatype should be validated.
	 *
	 * This method excludes primitive types (String, Boolean, Number, Array, Object)
	 * from validation as they don't contain class-validator decorators.
	 *
	 * @param metatype - The constructor function to check
	 * @returns True if the type should be validated, false for primitive types
	 *
	 * @example
	 * ```typescript
	 * pipe.toValidate(String)     // false - primitive type
	 * pipe.toValidate(Number)     // false - primitive type
	 * pipe.toValidate(CreateUserDto) // true - class with decorators
	 * ```
	 */
	private toValidate(metatype: Function): boolean {
		const types: Function[] = [String, Boolean, Number, Array, Object]
		const result = !types.includes(metatype)
		return result
	}
}
