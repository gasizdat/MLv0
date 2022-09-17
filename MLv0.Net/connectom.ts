/// <reference path="perceptron.ts" />
/// <reference path="layer.ts" />
/// <reference path="types.ts" />
/// <reference path="../MLv0.Core/ievaluatable.ts" />
/// <reference path="../MLv0.Core/heaviside.ts" />
/// <reference path="../MLv0.Core/set.ts" />
/// <reference path="../MLv0.Core/sigma.ts" />
/// <reference path="../MLv0.Utils/assert.ts" />
/// <reference path="../MLv0.Utils/range.ts" />

module MLv0.Net
{
    import assert = Utils.assert;

    export class Connectom implements Core.IEvaluatable
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
            const perceptrons = new Array<Net.Perceptron>();
            const layers = new Array<Net.Layer>();
            this._signals = new Core.Set<Net.SignalType>(new Array<Net.SignalType>(signal_count));
            this._biases = new Core.Set<Net.BiasType>(new Array<Net.BiasType>(perceptron_count));
            this._weights = new Core.Set<Net.WeightType>(new Array<Net.BiasType>(weight_count));

            var l = 0, w = 0, s: number;
            {
                const layer_0 = population[l];
                for (var k = 0, s = layer_0; k < layer_0; k++, w++, s++)
                {
                    perceptrons.push(
                        new Net.Perceptron(
                            this._signals.getSubset([s - layer_0]),
                            this._signals.getSubset1(s),
                            this._weights.getSubset([w]),
                            this._biases.getSubset1(perceptrons.length),
                            Core.heaviside
                        )
                    );
                }
                l++;
            }

            for (; l < population.length; l++)
            {
                const layer_n_minus_1 = population[l - 1];
                const layer_n = population[l];
                const inputs = this._signals.getSubset(Utils.range(s - layer_n_minus_1, layer_n_minus_1));
                const func = l < (population.length - 1) ? Core.heaviside : Core.sigma;

                for (var k = 0; k < layer_n; k++, w += layer_n_minus_1, s++)
                {
                    perceptrons.push(
                        new Net.Perceptron(
                            inputs,
                            this._signals.getSubset1(s),
                            this._weights.getSubset(Utils.range(w, layer_n_minus_1)),
                            this._biases.getSubset1(perceptrons.length),
                            func
                        )
                    );
                }
            }

            this._perceptrons = new Core.Set<Net.Perceptron>(perceptrons);

            var start = 0;
            for (var count of population)
            {
                layers.push(new Net.Layer(this._perceptrons.getSubset(Utils.range(start, count))));
                start += count;
            }
            this._layers = new Core.Set<Net.Layer>(layers);
        }

        public evaluate(): void
        {
            for (var i = 0; i < this._layers.length; i++)
            {
                this._layers.get(i).evaluate();
            }
        }

        public get signals(): Core.Set<Net.SignalType>
        {
            return this._signals;
        }

        public get weights(): Core.Set<Net.WeightType>
        {
            return this._weights;
        }

        public get perceptrons(): Core.Set<Net.Perceptron>
        {
            return this._perceptrons;
        }

        public get layers(): Core.Set<Net.Layer>
        {
            return this._layers;
        }

        public get biases(): Core.Set<Net.BiasType>
        {
            return this._biases;
        }

        private readonly _signals: Core.Set<Net.SignalType>;

        private readonly _biases: Core.Set<Net.BiasType>;
        private readonly _weights: Core.Set<Net.WeightType>;
        private readonly _perceptrons: Core.Set<Net.Perceptron>;
        private readonly _layers: Core.Set<Net.Layer>;
    }
}