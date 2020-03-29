# @jedmao/redux-mock-store

[![GitHub Actions](https://github.com/jedmao/storage/workflows/Node%20CI/badge.svg?event=push)](https://github.com/jedmao/storage/actions)
[![codecov](https://img.shields.io/codecov/c/gh/jedmao/redux-mock-store.svg?style=popout-square&logo=codecov&token=4f79d0b1189f41e5a5ed32e87ca0a204)](https://codecov.io/gh/jedmao/redux-mock-store)
[![npm version](https://img.shields.io/npm/v/@jedmao/redux-mock-store/latest.svg?style=popout-square&logo=npm)](https://www.npmjs.com/package/@jedmao/redux-mock-store)

A mock store for testing Redux async action creators and middleware. The mock
store will create an array of dispatched actions which serve as an action log
for tests.

_This is a TypeScript fork of
[redux-mock-store](https://github.com/dmitry-zaets/redux-mock-store)._

Please note that this library is designed to test the action-related, not
reducer-related logic (i.e., it does not update the Redux store). If you want a
complex test combining actions and reducers together, take a look at other
libraries (e.g.,
[redux-actions-assertions](https://github.com/redux-things/redux-actions-assertions)).
Refer to issue
[redux-mock-store#71](https://github.com/arnaudbenard/redux-mock-store/issues/71)
for more details.

## Installation

```bash
npm install @jedmao/redux-mock-store --save-dev
```

Or

```bash
yarn add @jedmao/redux-mock-store --dev
```

## Usage

You will benefit from configuring a single `mockStore` for all of your tests. A
common example would be to configure your store with a
[`redux-thunk`](https://www.npmjs.com/package/redux-thunk) middleware.

### mockStore.js

```js
import { configureMockStore } from '@jedmao/redux-mock-store'
import thunk from 'redux-thunk'

const middlewares = [thunk]

export default configureMockStore(middlewares)
```

Let's do the same thing in TypeScript and add an extra thunk argument.

### mockStore.ts

```ts
import { configureMockStore } from '@jedmao/redux-mock-store'
import thunk, { ThunkDispatch } from 'redux-thunk'

// internal dependencies
import RootState from 'store/RootState'
import RootActions from 'actions'

const extraThunkArgument = { foo: 'bar' }
const middlewares = [thunk.withExtraArgument(extraThunkArgument)]

export default configureMockStore<
  RootState,
  RootActions,
  ThunkDispatch<RootState, typeof extraThunkArgument, RootActions>
>(middlewares)
```

### Synchronous actions

The mock store saves all the dispatched actions inside the store instance. You
can get all the actions by calling [`store.getActions()`](#getactions).

```ts
import { mockStore } from 'utils/test'

describe('todo actions', () => {
  let store: ReturnType<typeof mockStore>

  beforeEach(() => {
    store = mockStore(/* initial state */)
  })

  it('dispatches ADD_TODO', () => {
    const action = { type: 'ADD_TODO' }

    store.dispatch(action)

    expect(store.getActions()[0]).toBe(action)
  })
})
```

### Asynchronous actions

```ts
it('asynchronously dispatches SUCCESS', async () => {
  const store = mockStore(/* initial state */)
  const success = { type: 'SUCCESS' }

  await store.dispatch(async dispatch => {
    dispatch(success)
  })

  expect(store.getActions()[0]).toBe(success)
})
```

See
[the tests](https://github.com/jedmao/redux-mock-store/blob/master/test/index.test.ts)
for more thorough examples.

## API

### configureMockStore

Configure the mock store by applying middlewares.

```ts
configureMockStore<
  S = any,
  A extends Redux.Action = Redux.AnyAction,
  DispatchExts extends {} | void = void
>(
  middlewares: Redux.Middleware[] = [],
): MockStoreCreator<S, A, DispatchExts>
```

Calling [`configureMockStore`](#configuremockstore) will return a
[`MockStoreCreator`](#mockstorecreator), which returns an instance of the
configured mock store. This [`MockStoreCreator`](#mockstorecreator) is a
function named [`mockStore`](#mockstore).

#### mockStore

Call this function to reset your store after every test.

```ts
function mockStore(
  getState: S | MockGetState<S> = {} as S,
): DispatchExts extends void
  ? MockStore<S, A>
  : MockStoreEnhanced<S, A, DispatchExts>
```

## Mock Store API

### dispatch

Dispatches an action `T` through the mock store. The action will be stored in an
array inside the instance and executed.

```ts
dispatch<T extends A>(action: T): T
```

If `DispatchExts` are provided, [`dispatch`](#dispatch) will support an
additional signature.

```ts
dispatch<R>(
  asyncAction: ThunkAction<R, S, E, A>,
): R
```

### getState

Returns the state `S` of the mock store.

```ts
getState(): S
```

### getActions

Returns the actions `A[]` of the mock store.

```ts
getActions(): A[]
```

### clearActions

Clears the stored actions.

```ts
clearActions(): void
```

### subscribe

Subscribe a `listener` to the store.

```ts
subscribe(
  listener: (action: A) => void,
): Redux.Unsubscribe
```

### replaceReducer

Because a mock store does not have or support reducers, this function will
always throw an error.

```ts
replaceReducer(nextReducer: Reducer<S, A>): never
```

> Mock stores do not support reducers. Try supplying a function to `getStore`
> instead.

## TypeScript

The [`@jedmao`](https://www.npmjs.com/package/@jedmao/redux-mock-store) scoped
version of this library is written in TypeScript and published with generated
type information. No need to `npm install` additional
[`@types`](https://www.npmjs.com/org/types). Additionally, a number of types and
interfaces (below) have been exported for your convenience.

### MockStoreCreator

If you provide `DistpatchExts` then this type will return a
[`MockStoreEnhanced`](#mockstoreenhanced), which supports async actions (e.g.,
thunks). Otherwise, it will just return a plain ol' [`MockStore`](#mockstore)
for sync actions.

```ts
type MockStoreCreator<
  S = {},
  A extends Action = AnyAction,
  DispatchExts extends {} | void = void
> = (
  state?: S | MockGetState<Redux.DeepPartial<S>>,
) => DispatchExts extends void
  ? MockStore<S, A>
  : MockStoreEnhanced<S, A, DispatchExts>
```

### MockGetState

This type is used in the [`MockStoreCreator`](#mockstorecreator) via
`state?: S | MockGetState<S>`, which allows you to either supply a single state
object `S` or a function that would return `S`. Why a function? See
[redux-mock-store#102](https://github.com/dmitry-zaets/redux-mock-store/issues/102).

```ts
type MockGetState<S = {}> = (actions: AnyAction[]) => S
```

### MockStoreEnhanced

Enables async actions (e.g., thunks).

```ts
type MockStoreEnhanced<
  S,
  A extends Action = AnyAction,
  DispatchExts = {}
> = MockStore<Redux.DeepPartial<S>, A> & {
  dispatch: DispatchExts
}
```

### MockStore

```ts
interface MockStore<S = any, A extends Redux.Action = Redux.AnyAction>
  extends Redux.Store<Redux.DeepPartial<S>, A> {
  clearActions(): void
  getActions(): A[]
  subscribe(listener: (action: A) => void): Redux.Unsubscribe
}
```

## License

The MIT License
