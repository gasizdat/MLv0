/// <reference path="set.ts" />
/// <reference path="../MLv0.Utils/assert.ts" />

module MLv0.Core
{
    import assert = MLv0.Utils.assert;

    type AnySubset<T> = Subset<T> | Subset1<T>;

    export class Subset<T>
    {
        constructor(set: Set<T>, indices: number[])
        {
            assert(indices.length > 0);

            this._indices = indices;
            this._set = set;
        }

        public get length(): number
        {
            return this._indices.length;
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

        public getSubset(indices: number[]): Subset<T>
        {
            const $this = this;
            const global = new Array<number>();

            indices.forEach(index => global.push($this.getGlobalIndex(index)));

            return new Subset<T>(this._set, global);
        }

        public getSubset1(index: number): Subset1<T>
        {
            assert(0 <= index && this.length < index);

            return new Subset1<T>(this._set, this.getGlobalIndex(index));
        }

        public static join<T>(subsets: AnySubset<T>[]): Subset<T>
        {
            assert(subsets.length > 0);

            const set = (subsets[0] instanceof Subset) ? subsets[0]._set : subsets[0].sourceSet;
            const indices = new Array<number>();
            subsets.forEach(subset =>
            {
                if (subset instanceof Subset) 
                {
                    assert(subset._set == set);
                    indices.push(...subset._indices);
                }
                else
                {
                    assert(subset.sourceSet == set);
                    indices.push(subset.index);
                }
            });

            return new Subset<T>(set, indices);
        }

        protected getGlobalIndex(index: number): number
        {
            assert(index >= 0);
            assert(index < this._indices.length);

            return this._indices[index];
        }

        private readonly _indices: number[];
        private readonly _set: Set<T>;
    }
}