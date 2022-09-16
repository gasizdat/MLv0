/// <reference path="perceptron.ts" />
/// <reference path="layer.ts" />
/// <reference path="types.ts" />
/// <reference path="../MLv0.Core/ievaluatable.ts" />
/// <reference path="../MLv0.Core/set.ts" />
/// <reference path="../MLv0.Utils/assert.ts" />

module MLv0.Net
{
    import assert = MLv0.Utils.assert;

    export class Connectom implements MLv0.Core.IEvaluatable
    {
        constructor(...population: number[])
        {
            assert(population.length > 0);
            //population.reduce(
        }

        public evaluate(): void
        {
        }
    }
}