import { Action, Store } from 'redux'
import thunk, { ThunkAction, ThunkDispatch } from 'redux-thunk'

import { configureMockStore } from '../src'

const FOO_REQUEST = 'FOO_REQUEST'
type FooRequest = Action<typeof FOO_REQUEST>
function fooRequest(): FooRequest {
	return { type: FOO_REQUEST }
}

const FOO_SUCCESS = 'FOO_SUCCESS'
interface FooSuccess extends Action<typeof FOO_SUCCESS> {
	bar: number
}
function fooSuccess(bar: number): FooSuccess {
	return { type: FOO_SUCCESS, bar }
}

const FOO_FAILURE = 'FOO_FAILURE'
interface FooFailure extends Action<typeof FOO_FAILURE> {
	error: Error
}
function fooFailure(error: Error): FooFailure {
	return { type: FOO_FAILURE, error }
}

interface RootState {
	value: number
	unused: string
}
type RootActions = FooRequest | FooSuccess | FooFailure
const mockStore = configureMockStore<RootState, RootActions>()

describe('@jedmao/redux-mock-store', () => {
	it('exports a function named "configureMockStore"', () => {
		expect(typeof configureMockStore).toBe('function')
		expect(configureMockStore.name).toBe('configureMockStore')
	})

	describe('getState', () => {
		describe('function scenario', () => {
			it('returns the result of getState()', () => {
				const state = { value: 42 }
				const mockGetState = () => state

				const store = mockStore(mockGetState)

				expect(store.getState()).toBe(state)
			})

			it('is called with actions', () => {
				const action = fooRequest()
				const getState = jest.fn()
				const store = mockStore(getState)

				store.dispatch(action)
				store.getState()

				expect(getState).toHaveBeenCalledWith([action])
				expect(getState).toHaveBeenCalledWith(store.getActions())
			})
		})

		describe('non-function scenario', () => {
			it('returns the initial state', () => {
				const initialState = {}

				const store = mockStore(initialState)

				expect(store.getState()).toBe(initialState)
			})
		})
	})

	describe('dispatch', () => {
		const _mockStore = configureMockStore()

		it('throws when action is undefined', () => {
			const store = _mockStore()

			expect(() => {
				store.dispatch(undefined)
			}).toThrow(
				'Actions must be plain objects. ' +
					'Use custom middleware for async actions.',
			)
		})

		it('throws when action is a function', () => {
			const store = _mockStore()

			expect(() => {
				store.dispatch((() => {}) as any)
			}).toThrow(
				'Actions must be plain objects. ' +
					'Use custom middleware for async actions.',
			)
		})

		it('throws when action.type is undefined', () => {
			const action = { types: 'UNSUPPORTED' }
			const store = _mockStore()

			expect(() => {
				store.dispatch(action as any)
			}).toThrow(
				'Actions may not have an undefined "type" property. ' +
					'Have you misspelled a constant? ' +
					'Action: ' +
					'{"types":"UNSUPPORTED"}',
			)
		})

		it('returns dispatched action if no errors thrown', () => {
			const store = _mockStore()
			const action = fooRequest()

			store.dispatch(action)

			expect(store.getActions()[0]).toBe(action)
		})

		it('stores 2 dispatched actions', () => {
			const store = _mockStore()
			const actions = [fooRequest(), fooSuccess(42)]

			store.dispatch(actions[0])
			store.dispatch(actions[1])

			expect(store.getActions()).toEqual(actions)
		})
	})

	describe('clearActions', () => {
		it('clears actions', () => {
			const action = fooRequest()
			const store = mockStore()

			store.dispatch(action)
			expect(store.getActions()).toEqual([action])

			store.clearActions()
			expect(store.getActions()).toEqual([])
		})
	})

	describe('subscribe', () => {
		it('subscribes to dispatched actions', done => {
			const store = mockStore()
			const action = fooRequest()

			store.subscribe(a => {
				expect(store.getActions()[0]).toEqual(action)
				expect(action).toBe(a)
				done()
			})
			store.dispatch(action)
		})

		it('returns an unsubscribe function that unsubscribes all subscribers', done => {
			const store = mockStore()
			const action = fooRequest()
			const timeoutId = setTimeout(done, 10000)
			const unsubscribe = store.subscribe(() => {
				throw new Error('should never be called')
			})

			try {
				unsubscribe()
				store.dispatch(action)
				done()
			} catch (err) {
				done.fail(err)
			} finally {
				clearTimeout(timeoutId)
			}
		})

		it('does not throw subsequent unsubscribe calls', () => {
			const store = mockStore()
			const unsubscribe = store.subscribe(() => {})

			unsubscribe()

			expect(unsubscribe).not.toThrow()
		})

		it('throws if non-function passed as a listener', () => {
			const store = mockStore()

			expect(() => store.subscribe(42 as any)).toThrow(
				'Listener must be a function.',
			)
		})
	})

	describe('replaceReducer', () => {
		it('throws', () => {
			const store = mockStore()

			expect(() => store.replaceReducer(state => state)).toThrow(
				'Mock stores do not support reducers. ' +
					'Try supplying a function to getStore instead.',
			)
		})
	})

	it('calls a provided middleware', () => {
		const mockMiddleware = (spy: jest.Mock) => (_store: Store) => (
			next: (action: Action) => void,
		) => (action: Action) => {
			spy()
			return next(action)
		}

		const spy = jest.fn()
		const store = configureMockStore([mockMiddleware(spy)])()

		store.dispatch(fooRequest())

		expect(spy).toHaveBeenCalled()
	})

	describe('TypeScript', () => {
		it('supports no defined generic types', () => {
			const state = { foo: 'bar' }
			const mockStore = configureMockStore()

			const store = mockStore(state)

			expect(store.getState()).toBe(state)
		})

		it('supports state type <S>', () => {
			const state = { foo: 'bar' }
			const mockStore = configureMockStore<typeof state>()

			const store = mockStore(state)

			expect(store.getState()).toBe(state)
		})

		it('supports an action type via <any, A>', () => {
			const action: Action<'TEST'> = { type: 'TEST' }
			const mockStore = configureMockStore<any, typeof action>()
			const store = mockStore()

			store.dispatch(action)

			expect(store.getActions()[0]).toBe(action)
		})

		describe('using a redux-thunk middleware with <S, A, D> generics', () => {
			const extraThunkArgument = { app: jest.fn() }
			type MyThunkAction<R = void> = ThunkAction<
				Promise<R>,
				RootState,
				typeof extraThunkArgument,
				RootActions
			>
			const middlewares = [thunk.withExtraArgument(extraThunkArgument)]
			const mockStore = configureMockStore<
				RootState,
				RootActions,
				ThunkDispatch<RootState, typeof extraThunkArgument, RootActions>
			>(middlewares)

			it('handles a successful async action', async () => {
				const store = mockStore()
				const successValue = 42

				await store.dispatch(simulatePass(successValue))

				expect(store.getActions()).toEqual([
					fooRequest(),
					fooSuccess(successValue),
				])

				function simulatePass(resolveValue: any): MyThunkAction {
					return async dispatch => {
						dispatch(fooRequest())
						dispatch(fooSuccess(resolveValue))
					}
				}
			})

			it('handles a failed async action', async () => {
				const store = mockStore()
				const error = new Error()

				await store.dispatch(simulateFail(error))

				expect(store.getActions()).toEqual([
					fooRequest(),
					fooFailure(error),
				])

				function simulateFail(error: Error): MyThunkAction {
					return async dispatch => {
						dispatch(fooRequest())
						dispatch(fooFailure(error))
					}
				}
			})
		})
	})
})
