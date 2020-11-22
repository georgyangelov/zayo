"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContinuationLocal = void 0;
const async_hooks_1 = require("async_hooks");
// const symbol = Symbol('continuation-local-storage'); // Private symbol to avoid pollution
// See https://nodejs.org/api/async_hooks.html#async_hooks_async_hooks_executionasyncresource
// createHook({
//   init(_asyncId, _type, _triggerAsyncId, newResource: any) {
//     const parentResource: any = executionAsyncResource();
//
//     if (parentResource) {
//       newResource[symbol] = parentResource[symbol];
//     }
//   }
// }).enable();
// const ContinuationLocals = {
//   with<T>(innerData: object, callback: () => T): T {
//     const resource: any = executionAsyncResource();
//     const outerData = resource[symbol];
//     // const outerData = { ...resource[symbol] };
//     // const innerData = { ...resource[symbol], ...data };
//
//     resource[symbol] = innerData;
//     const result = callback();
//     resource[symbol] = outerData;
//
//     return result;
//   },
//
//   get(): any {
//     const resource: any = executionAsyncResource();
//
//     return resource[symbol];
//   }
// };
//
// export class ContinuationLocal<T> {
//   private readonly symbol = Symbol('continuation-local');
//
//   set<R>(value: T, callback: () => R): R {
//     const data = ContinuationLocals.get();
//
//     return ContinuationLocals.with({ ...data, [this.symbol]: value }, callback);
//   }
//
//   get(): T {
//     const locals = ContinuationLocals.get();
//
//     return locals[this.symbol];
//   }
// }
class ContinuationLocal {
    constructor() {
        this.store = new async_hooks_1.AsyncLocalStorage();
    }
    set(value, callback) {
        return this.store.run(value, callback);
    }
    get() {
        return this.store.getStore();
    }
}
exports.ContinuationLocal = ContinuationLocal;
