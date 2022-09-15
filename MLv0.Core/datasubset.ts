/// <reference path="dataset.ts" />
/// <reference path="../MLv0.Utils/assert.ts" />

module MLv0.Core
{
    export class DataSubset<T>
    {
        constructor(set: DataSet<T>, indices: number[])
        {
            this._indices = indices;
            this._set = set;
        }

        public get(index: number): T
        {
            return this._set.get(this.getGlobalIndex(index));
        }

        public set(index: number, value: T): void
        {
            this._set.set(this.getGlobalIndex(index), value);
        }

        public setAll(value: T): void
        {
            const set = this._set;
            this._indices.forEach((_, index) => set.set(index, value));
        }

        public forEach(fn: (item: T) => void): void
        {
            const set = this._set;
            this._indices.forEach(item => fn(set.get(item)));
        }

        public forEachIndex(fn: (item: T, index: number) => void): void
        {
            const set = this._set;
            this._indices.forEach((item, index) => fn(set.get(item), index));
        }

        public get length(): number
        {
            return this._indices.length;
        }

        protected getGlobalIndex(index: number): number
        {
            MLv0.Utils.assert(index >= 0);
            MLv0.Utils.assert(index < this._indices.length);

            return this._indices[index];
        }

        private _indices: number[];
        private _set: DataSet<T>;
    }
}