import { isFunction, isPlainObject } from '../src/utils'

describe('utils', () => {
	describe('isFunction', () => {
		it('should return "true" for function', () => {
			const value = function (): boolean {
				return false
			}

			expect(isFunction(value)).toBeTruthy()
		})

		it('should return "true" for async function', () => {
			const value = async function (): Promise<boolean> {
				await Promise.resolve()
				return false
			}

			expect(isFunction(value)).toBeTruthy()
		})

		it('should return "true" for generator function', () => {
			const value = function* () {
				yield false
			}

			expect(isFunction(value)).toBeTruthy()
		})

		it('should return "false" for non-functions', () => {
			expect(isFunction([1, 2, 3])).toBeFalsy()
			expect(isFunction(true)).toBeFalsy()
			expect(isFunction(new Date())).toBeFalsy()
			expect(isFunction(new Error())).toBeFalsy()
			expect(isFunction({ a: 1 })).toBeFalsy()
			expect(isFunction(1)).toBeFalsy()
			expect(isFunction(/x/)).toBeFalsy()
			expect(isFunction('a')).toBeFalsy()
			expect(isFunction(Symbol())).toBeFalsy()
		})
	})

	describe('isPlainObject', () => {
		it('should return "true" for plain objects', () => {
			function value() {
				return false
			}

			expect(isPlainObject({})).toBeTruthy()
			expect(isPlainObject({ a: 1 })).toBeTruthy()
			expect(isPlainObject({ constructor: value })).toBeTruthy()
		})

		it('should return "false" for non plain objects', () => {
			const objA = { counter: 400, additionalCountet: 300 }
			const objB = Object.create(objA)
			objB.additionalCounter = 100

			expect(isPlainObject([1, 2, 3])).toBeFalsy()
			expect(isPlainObject(objB)).toBeFalsy()
		})
	})
})
