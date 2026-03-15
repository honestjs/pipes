import 'reflect-metadata'
import { describe, expect, it } from 'vitest'
import { IsEmail, IsString, MinLength, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { BadRequestException } from 'http-essentials'
import { ClassValidatorPipe } from './class-validator.pipe'

const metadata = (metatype?: unknown, type = 'body') => ({ metatype, type }) as { metatype?: unknown; type: string }

class CreateUserDto {
	@IsString()
	@MinLength(2)
	name!: string

	@IsEmail()
	email!: string
}

class NestedDto {
	@IsString()
	@MinLength(1)
	value!: string
}

class ParentDto {
	@ValidateNested()
	@Type(() => NestedDto)
	nested!: NestedDto
}

describe('ClassValidatorPipe', () => {
	describe('Promise handling', () => {
		it('resolves Promise and validates', async () => {
			const pipe = new ClassValidatorPipe()
			const result = await pipe.transform(
				Promise.resolve({ name: 'John', email: 'john@example.com' }),
				metadata(CreateUserDto)
			)
			expect(result).toBeInstanceOf(CreateUserDto)
			expect((result as CreateUserDto).name).toBe('John')
			expect((result as CreateUserDto).email).toBe('john@example.com')
		})

		it('throws BadRequestException when Promise rejects', async () => {
			const pipe = new ClassValidatorPipe()
			await expect(
				pipe.transform(Promise.reject(new Error('rejected')), metadata(CreateUserDto))
			).rejects.toThrow(BadRequestException)
			await expect(
				pipe.transform(Promise.reject(new Error('rejected')), metadata(CreateUserDto))
			).rejects.toThrow('Invalid request data')
		})
	})

	describe('pass-through paths', () => {
		it('returns value when metatype is missing', async () => {
			const pipe = new ClassValidatorPipe()
			const val = { foo: 'bar' }
			expect(await pipe.transform(val, metadata(undefined))).toBe(val)
		})

		it('returns value for String metatype', async () => {
			const pipe = new ClassValidatorPipe()
			expect(await pipe.transform('hello', metadata(String))).toBe('hello')
		})

		it('returns value for Number metatype', async () => {
			const pipe = new ClassValidatorPipe()
			expect(await pipe.transform(42, metadata(Number))).toBe(42)
		})

		it('returns value for Boolean metatype', async () => {
			const pipe = new ClassValidatorPipe()
			expect(await pipe.transform(true, metadata(Boolean))).toBe(true)
		})

		it('returns value for Array metatype', async () => {
			const pipe = new ClassValidatorPipe()
			const arr = [1, 2, 3]
			expect(await pipe.transform(arr, metadata(Array))).toBe(arr)
		})

		it('returns value for Object metatype', async () => {
			const pipe = new ClassValidatorPipe()
			const obj = { a: 1 }
			expect(await pipe.transform(obj, metadata(Object))).toBe(obj)
		})
	})

	describe('null/undefined', () => {
		it('returns null as-is when metatype is validated', async () => {
			const pipe = new ClassValidatorPipe()
			expect(await pipe.transform(null, metadata(CreateUserDto))).toBeNull()
		})

		it('returns undefined as-is', async () => {
			const pipe = new ClassValidatorPipe()
			expect(await pipe.transform(undefined, metadata(CreateUserDto))).toBeUndefined()
		})
	})

	describe('valid DTO', () => {
		it('transforms and returns validated instance', async () => {
			const pipe = new ClassValidatorPipe()
			const input = { name: 'Jane', email: 'jane@example.com' }
			const result = await pipe.transform(input, metadata(CreateUserDto))
			expect(result).toBeInstanceOf(CreateUserDto)
			expect((result as CreateUserDto).name).toBe('Jane')
			expect((result as CreateUserDto).email).toBe('jane@example.com')
		})
	})

	describe('invalid DTO - flat errors', () => {
		it('throws BadRequestException with constraint messages', async () => {
			const pipe = new ClassValidatorPipe()
			const input = { name: 'A', email: 'invalid' }
			await expect(pipe.transform(input, metadata(CreateUserDto))).rejects.toThrow(BadRequestException)
			try {
				await pipe.transform(input, metadata(CreateUserDto))
			} catch (e) {
				expect(e).toBeInstanceOf(BadRequestException)
				const msg = (e as BadRequestException).message
				expect(msg).toContain('name')
				expect(msg).toContain('email')
			}
		})
	})

	describe('nested validation errors', () => {
		it('includes nested property paths in error message', async () => {
			const pipe = new ClassValidatorPipe()
			const input = { nested: { value: '' } }
			await expect(pipe.transform(input, metadata(ParentDto))).rejects.toThrow(BadRequestException)
			try {
				await pipe.transform(input, metadata(ParentDto))
			} catch (e) {
				expect(e).toBeInstanceOf(BadRequestException)
				const msg = (e as BadRequestException).message
				expect(msg).toMatch(/nested/i)
			}
		})
	})

	describe('fallback error handling', () => {
		it('preserves Error message when plainToInstance/validate throws', async () => {
			const pipe = new ClassValidatorPipe()
			// Pass a non-constructor as metatype to trigger internal error from plainToInstance
			const badMetadata = { metatype: {} as unknown, type: 'body' } as {
				metatype?: unknown
				type: string
			}
			await expect(pipe.transform({ a: 1 }, badMetadata)).rejects.toThrow(BadRequestException)
			// The catch block should preserve the original error message when it's an Error
			try {
				await pipe.transform({ a: 1 }, badMetadata)
			} catch (e) {
				expect(e).toBeInstanceOf(BadRequestException)
				const msg = (e as BadRequestException).message
				expect(msg.length).toBeGreaterThan(0)
			}
		})
	})

	describe('options', () => {
		it('respects validator options', async () => {
			const pipe = new ClassValidatorPipe({ validator: { forbidNonWhitelisted: true } })
			const input = { name: 'John', email: 'john@example.com', unknownField: 'x' }
			await expect(pipe.transform(input, metadata(CreateUserDto))).rejects.toThrow(BadRequestException)
		})

		it('respects transform options', async () => {
			const pipe = new ClassValidatorPipe({
				validator: { whitelist: true },
				transform: { enableImplicitConversion: true }
			})
			const result = await pipe.transform({ name: 'Jane', email: 'jane@example.com' }, metadata(CreateUserDto))
			expect(result).toBeInstanceOf(CreateUserDto)
		})

		it('accepts empty options', async () => {
			const pipe = new ClassValidatorPipe({})
			const result = await pipe.transform({ name: 'Jane', email: 'jane@example.com' }, metadata(CreateUserDto))
			expect(result).toBeInstanceOf(CreateUserDto)
		})
	})
})
