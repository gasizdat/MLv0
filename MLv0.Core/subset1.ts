/// <reference path="set.ts" />
/// <reference path="../MLv0.Utils/assert.ts" />

module MLv0.Core
{
    import assert = MLv0.Utils.assert;

    export class Subset1<T>
    {
        constructor(set: Set<T>, index: number)
        {
            assert(index >= 0);

            this._index = index;
            this._set = set;
        }

        public get value(): T
        {
            return this._set.get(this._index);
        }

        public set value(value: T)
        {
            this._set.set(this._index, value);
        }

        public get index(): number
        {
            return this._index;
        }

        public get sourceSet(): Set<T>
        {
            return this._set;
        }

        private readonly _index: number;
        private readonly _set: Set<T>;
    }
}