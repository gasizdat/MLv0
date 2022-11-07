
module MLv0.Utils
{
    export class RandomGenerator
    {
        constructor(pool_size: number = RandomGenerator.defaultPoolSize)
        {
            this._randomPool = new BigUint64Array(pool_size);
            self.crypto.getRandomValues(this._randomPool);
        }

        public getValue(from: number, to: number): number
        {
            if (this._currentIndex == this._randomPool.length)
            {
                self.crypto.getRandomValues(this._randomPool);
                this._currentIndex = 0;
            }
            const ret = (Number(this._randomPool[this._currentIndex++]) / RandomGenerator.maxUint64) * (to - from) + from;
            return ret;
        }

        private readonly _randomPool;
        private _currentIndex = 0;

        private static readonly defaultPoolSize = 50;
        private static readonly maxUint64 = Number(18446744073709551615n);
    }
}