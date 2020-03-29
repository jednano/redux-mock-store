export function isFunction(value: any): value is (...args: any[]) => any {
	return 'function' === typeof value
}

export function isPlainObject(value: any): boolean {
	return (
		Object.prototype.toString.call(value) === '[object Object]' &&
		Object.getPrototypeOf(value) === Object.prototype
	)
}
