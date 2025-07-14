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
 */
export class ClassValidatorPipe implements IPipe {
	private readonly validatorOptions: ValidatorOptions
	private readonly transformOptions: ClassTransformOptions

	/**
	 * Creates a new ClassValidatorPipe instance.
	 *
	 * @param validatorOptions - Options for class-validator validation behavior
	 * @param transformOptions - Options for class-transformer transformation behavior
	 *
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
	 */
	async transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> {
		let resolvedValue = value
		if (value instanceof Promise) {
			try {
				resolvedValue = await value
			} catch (error) {
				throw new BadRequestException('Invalid request data')
			}
		}

		if (!metadata.metatype || !this.toValidate(metadata.metatype)) {
			return resolvedValue
		}

		if (resolvedValue === null || resolvedValue === undefined) {
			return resolvedValue
		}

		try {
			const object = plainToInstance(metadata.metatype, resolvedValue, this.transformOptions)

			const errors = await validate(object as object, this.validatorOptions)

			if (errors.length > 0) {
				const errorMessage = this.buildErrorMessages(errors).join('; ')
				throw new BadRequestException(errorMessage)
			}

			return object
		} catch (error) {
			if (error instanceof BadRequestException) {
				throw error
			}

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
	 */
	private toValidate(metatype: Function): boolean {
		const types: Function[] = [String, Boolean, Number, Array, Object]
		const result = !types.includes(metatype)
		return result
	}
}
