
module MLv0.GA
{
    export class Gen<TData>
    {
        constructor(data: TData)
        {
            this._data = data;
        }
        public get data(): TData
        {
            return this._data;
        }
        public mutate(mutagen: (data: TData) => TData): Gen<TData>
        {
            return new Gen<TData>(mutagen(this.data));
        }

        private readonly _data: TData;
    }
}