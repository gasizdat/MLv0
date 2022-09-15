/// <reference path="../MLv0.Core/ievaluatable.ts" />
/// <reference path="../MLv0.Core/dataset.ts" />
/// <reference path="../MLv0.Utils/assert.ts" />

module MLv0.Net
{
    type Signal = number;
    type Weight = number;
    type Gain = number;

    type Inputs = MLv0.Core.DataSubset<Signal>;
    type Outputs = MLv0.Core.DataSubset<Signal>;
    type Weights = MLv0.Core.DataSubset<Weight>;
    type Gains = MLv0.Core.DataSubset<Gain>;

    export class Perceptron implements MLv0.Core.IEvaluatable
    {
        constructor(inputs: Inputs, outputs: Outputs, weights: Weights, gains: Gains)
        {
            MLv0.Utils.assert(inputs.length == weights.length);

            this._inputs = inputs;
            this._outputs = outputs;
            this._weights = weights;
            this._gains = gains;
        }

        public evaluate(): void
        {
            var sum: number = 0;
            const weights = this._weights;
            this._inputs.forEachIndex((item, index) => sum += item * weights.get(index));

            const output = sum > this._gains.get(0);
            this._outputs.setAll(output ? 1.0 : 0.0);
        }

        private _inputs: Inputs;
        private _outputs: Outputs;
        private _weights: Weights;
        private _gains: Gains;
    }
}