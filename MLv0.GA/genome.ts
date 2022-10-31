
module MLv0.GA
{
    export class Genome<TData>
    {
        constructor(data: TData[])
        {
            this._data = data;
        }
        public get data(): TData[]
        {
            return this._data;
        }
        public get rank(): number
        {
            return this._rate;
        }
        public set rank(value: number)
        {
            this._rate = value;
        }
        public get hasRank(): boolean
        {
            return !isNaN(this.rank);
        }
        public get length(): number
        {
            return this.data.length;
        }

        private readonly _data: TData[];
        private _rate: number = NaN;
    }
}