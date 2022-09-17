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
            const perceptron_count = population.reduce((p, c) => p + c);
            var weight_count = population[0];
            for (var l = 1; l < population.length; l++)
            {
                weight_count += population[l - 1] * population[l];
            }
            const signal_count = perceptron_count + population[0];
            const perceptrons = new Array<MLv0.Net.Perceptron>();
            const layers = new Array<MLv0.Net.Layer>();
            this._signals = new MLv0.Core.Set<MLv0.Net.SignalType>(new Array<MLv0.Net.SignalType>(signal_count));
            this._biases = new MLv0.Core.Set<MLv0.Net.BiasType>(new Array<MLv0.Net.BiasType>(perceptron_count));
            this._weights = new MLv0.Core.Set<MLv0.Net.WeightType>(new Array<MLv0.Net.BiasType>(weight_count));

            var l = 0, j = 0, s = 0;
            {
                const layer_0 = population[l];
                for (var k = 0, s = layer_0; k < layer_0; k++, j++, s++)
                {
                    perceptrons.push(
                        new MLv0.Net.Perceptron(
                            this._signals.getSubset([j]),
                            this._signals.getSubset1(s),
                            this._weights.getSubset([j]),
                            this._biases.getSubset1(perceptrons.length)
                        )
                    );
                }
                l++;
            }

            for (; l < population.length; l++)
            {
                const layer_n_minus_1 = population[l - 1];
                const layer_n = population[l];
                const inputs = this._signals.getSubset(Connectom.range(s - layer_n_minus_1, layer_n_minus_1));

                for (var k = 0; k < layer_n; k++, j += layer_n_minus_1, s++)
                {
                    perceptrons.push(
                        new MLv0.Net.Perceptron(
                            inputs,
                            this._signals.getSubset1(s),
                            this._weights.getSubset(Connectom.range(j, layer_n_minus_1)),
                            this._biases.getSubset1(perceptrons.length)
                        )
                    );
                }
            }

            this._perceptrons = new MLv0.Core.Set<MLv0.Net.Perceptron>(perceptrons);

            var start = 0;
            for (var count of population)
            {
                layers.push(new MLv0.Net.Layer(this._perceptrons.getSubset(Connectom.range(start, count))));
                start += count;
            }
            this._layers = new MLv0.Core.Set<MLv0.Net.Layer>(layers);
        }

        public evaluate(): void
        {
            for (var i = 0; i < this._layers.length; i++)
            {
                this._layers.get(i).evaluate();
            }
        }

        static range(start: number, count: number): number[]
        {
            return Array.from({ length: count }, (_, i) => i + start);
        }

        private readonly _signals: MLv0.Core.Set<MLv0.Net.SignalType>;
        private readonly _biases: MLv0.Core.Set<MLv0.Net.BiasType>;
        private readonly _weights: MLv0.Core.Set<MLv0.Net.WeightType>;
        private readonly _perceptrons: MLv0.Core.Set<MLv0.Net.Perceptron>;
        private readonly _layers: MLv0.Core.Set<MLv0.Net.Layer>;
    }
}