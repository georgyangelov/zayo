export declare class ContinuationLocal<T> {
    private store;
    set<R>(value: T, callback: () => R): R;
    get(): T | undefined;
}
