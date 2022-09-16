/// <reference path="perceptron.ts" />
/// <reference path="types.ts" />
/// <reference path="../MLv0.Core/ievaluatable.ts" />
/// <reference path="../MLv0.Core/set.ts" />
/// <reference path="../MLv0.Utils/assert.ts" />

module MLv0.Net
{
    import assert = MLv0.Utils.assert;

    type Perceptrons = MLv0.Core.Subset<Perceptron>;
    type Outputs = MLv0.Core.Subset<SignalType>;

    export class Layer implements MLv0.Core.IEvaluatable
    {
        constructor(perceptrons: Perceptrons)
        {
            assert(perceptrons.length > 0);

            this._perceptrons = perceptrons;
        }

        public evaluate(): void
        {
            this._perceptrons.forEach(perceptron => perceptron.evaluate());
        }

        public get outputs(): Outputs
        {
            const outputs = new Array<MLv0.Core.Subset1<SignalType>>();
            this._perceptrons.forEach(perceptron => outputs.push(perceptron.output));
            return MLv0.Core.Subset.join<SignalType>(outputs);
        }

        private readonly _perceptrons: Perceptrons;
    }
}