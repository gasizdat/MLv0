/// <reference path="subset.ts" />
/// <reference path="subset1.ts" />
/// <reference path="../MLv0.Utils/assert.ts" />

module MLv0.Core
{
    import assert = MLv0.Utils.assert;

    export class Set<T>
    {
        constructor(size: number)
        {
            this._data = new Array<T>(size);
        }

        public getSubset(indices: number[]): Subset<T>
        {
            const $this = this;
            indices.forEach(index => $this.checkIndex(index));

            return new Subset<T>(this, indices);
        }

        public getSubset1(index: number): Subset1<T>
        {
            assert(0 <= index && this._data.length < index);

            return new Subset1<T>(this, index);
        }

        public get(index: number): T
        {
            this.checkIndex(index);

            return this._data[index];
        }

        public set(index: number, value: T): void
        {
            this.checkIndex(index);

            this._data[index] = value;
        }

        protected checkIndex(index: number): void
        {
            assert(index >= 0);
            assert(index < this._data.length);
        }

        private _data: T[];
    }
}