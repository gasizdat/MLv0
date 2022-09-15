/// <reference path="datasubset.ts" />
/// <reference path="../MLv0.Utils/assert.ts" />

module MLv0.Core
{
    export class DataSet<T>
    {
        constructor(size: number)
        {
            this._data = new Array<T>(size);
        }

        public getSubset(indices: number[]): DataSubset<T>
        {
            var $this = this;
            indices.forEach(index => $this.checkIndex(index));

            return new DataSubset<T>(this, indices);
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
            MLv0.Utils.assert(index >= 0);
            MLv0.Utils.assert(index < this._data.length);
        }

        private _data: T[];
    }
}