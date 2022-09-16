/// <reference path="types.ts" />
/// <reference path="../MLv0.Core/ievaluatable.ts" />
/// <reference path="../MLv0.Utils/assert.ts" />

module MLv0.Net
{
    import assert = MLv0.Utils.assert;

    export type Inputs = MLv0.Core.Subset<SignalType>;
    export type Output = MLv0.Core.Subset1<SignalType>;
    export type Weights = MLv0.Core.Subset<WeightType>;
    export type Bias = MLv0.Core.Subset1<BiasType>;

    export class Perceptron implements MLv0.Core.IEvaluatable
    {
        constructor(inputs: Inputs, output: Output, weights: Weights, bias: Bias)
        {
            assert(inputs.length == weights.length);

            this._inputs = inputs;
            this._output = output;
            this._weights = weights;
            this._bias = bias;
        }

        public evaluate(): void
        {
            var sum: number = this._bias.value;
            const weights = this._weights;
            this._inputs.forEachIndex((item, index) => sum += item * weights.get(index));

            this._output.value = (sum >= 0) ? 1.0 : 0.0;
        }

        public get output(): Output
        {
            return this._output;
        }

        private readonly _inputs: Inputs;
        private readonly _output: Output;
        private readonly _weights: Weights;
        private readonly _bias: Bias;
    }
}