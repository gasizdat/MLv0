/// <reference path="MLv0.Core/heaviside.ts" />
/// <reference path="MLv0.Core/sigma.ts" />
/// <reference path="MLv0.GA/generation.ts" />
/// <reference path="MLv0.Net/connectom.ts" />
/// <reference path="MLv0.Utils/ensure.ts" />
/// <reference path="MLv0.UI/dataset.ts" />
/// <reference path="MLv0.UI/input_image.ts" />

class MotionZoom
{
    constructor(zoom_factor: number, zoom_step: number)
    {
        this._zoomFactor = zoom_factor * zoom_step;
        this._zoomStep = zoom_step;
        this._currentValue = 1;
        this._currentMultiplier = zoom_step;
    }

    public get value(): number
    {
        return this._currentValue;
    }

    public evaluate(): void
    {
        this._currentValue *= this._currentMultiplier
        if (this._currentValue >= this._zoomFactor)
        {
            this._currentMultiplier = 1 / this._zoomStep;
        }
        else if (this._currentValue <= 1 / this._zoomFactor)
        {
            this._currentMultiplier = this._zoomStep;
        }
    }

    private readonly _zoomFactor: number;
    private readonly _zoomStep: number;
    private _currentMultiplier: number;
    private _currentValue: number;
}

class Model implements MLv0.Core.IEvaluatable
{
    constructor(canvas: HTMLCanvasElement, dataSetFiles: HTMLInputElement)
    {
        this._connectom = new MLv0.Net.Connectom(...this.population);
        this._canvas = canvas;

        const genomLength = 20;
        var weightsGeneration = new Array<MLv0.GA.Genome<MLv0.Net.WeightType>>(genomLength);
        var biasesGeneration = new Array<MLv0.GA.Genome<MLv0.Net.BiasType>>(genomLength);

        const storedWeights = localStorage.getItem(this._weightsKey);
        const storedBiases = localStorage.getItem(this._biasesKey);
        if (storedWeights && storedBiases)
        {
            const weightGenomes = JSON.parse(storedWeights) as number[][];
            const biaseGenomes = JSON.parse(storedBiases) as number[][];
            if (weightGenomes.length == genomLength &&
                biaseGenomes.length == genomLength &&
                weightGenomes[0].length == this._connectom.weights.length &&
                biaseGenomes[0].length == this._connectom.biases.length)
            {
                weightsGeneration = weightGenomes.map(genome => new MLv0.GA.Genome<MLv0.Net.WeightType>(genome));
                biasesGeneration = biaseGenomes.map(genome => new MLv0.GA.Genome<MLv0.Net.BiasType>(genome));
            }
        }
        else
        {
            const random = new  MLv0.Utils.RandomGenerator(1000);
            for (var i = 0; i < genomLength; i++)
            {
                const weights = new Array<MLv0.Net.WeightType>(this._connectom.weights.length);
                const biases = new Array<MLv0.Net.BiasType>(this._connectom.biases.length);

                for (var j = 0; j < weights.length; j++)
                {
                    weights[j] = random.getValue(-10, 10);
                }
                for (var j = 0; j < biases.length; j++)
                {
                    biases[j] = random.getValue(0, 1);
                }

                weightsGeneration[i] = new MLv0.GA.Genome<MLv0.Net.WeightType>(weights);
                biasesGeneration[i] = new MLv0.GA.Genome<MLv0.Net.BiasType>(biases);
            }
        }

        this._weightsGeneration = new MLv0.GA.Generation<MLv0.Net.WeightType>(weightsGeneration);
        this._biasesGeneration = new MLv0.GA.Generation<MLv0.Net.BiasType>(biasesGeneration);

        const $this = this;
        dataSetFiles.addEventListener('change', async (_) =>
        {
            const contentList = await MLv0.UI.DataSet.readFiles(dataSetFiles);
            $this._dataSets = contentList.map(content => new MLv0.UI.DataSet(content, this._dataSetWidth, this._dataSetHeight));

            console.log($this._dataSets.length);
            await this.evaluate();
        });
    }

    public async evaluate(): Promise<void>
    {

        MLv0.Utils.assert(this._weightsGeneration.genomes.length == this._biasesGeneration.genomes.length);
        const assessmentIndex = new Map<number, { rank: number, bad: number }>();
        for (var iteration = 0; iteration < 100; iteration++)
        {
            if (!this._wakeSentinel)
            {
                const $this = this;
                this._wakeSentinel = await navigator.wakeLock.request('screen');
                this._wakeSentinel.addEventListener('release', async () =>
                {
                    console.info('Wake Lock was released');
                    $this._wakeSentinel = undefined;
                });
            }
            console.log(`Generation: ${this._weightsGeneration.generation}`);
            for (var i = 0; i < this._weightsGeneration.genomes.length; i++)
            {
                const weightsGenome = this._weightsGeneration.genomes[i];
                const biasesGenome = this._biasesGeneration.genomes[i];
                if (weightsGenome.hasRank)
                {
                    MLv0.Utils.assert(biasesGenome.hasRank);
                    continue;
                }

                const connectom = new MLv0.Net.Connectom(...this.population);
                connectom.weights.setAll(weightsGenome.data);
                connectom.biases.setAll(biasesGenome.data);

                const assessment = await this.trainClassifier(connectom);
                weightsGenome.rank = assessment.good;
                biasesGenome.rank = assessment.good;
                assessmentIndex.set(assessment.good, { rank: assessment.rank, bad: assessment.bad });
            }

            const random = new MLv0.Utils.RandomGenerator(1113);
            this._weightsGeneration.evaluate((a, b) =>
            {
                if (random.getValue(0, 100) > 70)
                {
                    return a;
                }
                else
                {
                    return b;
                }
            }, (value) =>
            {
                if (random.getValue(0, 17) > 15.7)
                {
                    return value * random.getValue(0.9, 1.1);
                }
                else
                {
                    return value;
                }
            });
            this._biasesGeneration.evaluate((a, b) =>
            {
                if (random.getValue(0, 100) > 70)
                {
                    return a;
                }
                else
                {
                    return b;
                }
            }, (value) =>
            {
                if (random.getValue(0, 17) > 15.7)
                {
                    return value * random.getValue(0.9, 1.1);
                }
                else
                {
                    return value;
                }
            });
            const p = document.getElementById('info') as HTMLParagraphElement;
            if (p)
            {
                var ranks = `Generation: ${this._weightsGeneration.generation}. Ranks: <br>`;
                for (var genome of this._weightsGeneration.genomes)
                {
                    if (genome.hasRank)
                    {
                        const assessment = assessmentIndex.get(genome.rank)!;
                        const good = genome.rank;
                        const bad = assessment.bad
                        const rank = assessment.rank;
                        ranks += `success rate: ${good / (good + bad)} (${good}/${bad}), ${rank}<br>`;
                    }
                }
                p.innerHTML = ranks;
            }
        }
        const bestWeights = this._weightsGeneration.genomes.map(genome => genome.data);
        const bestBiases = this._biasesGeneration.genomes.map(genome => genome.data);
        this._connectom.weights.setAll(bestWeights[0]);
        this._connectom.biases.setAll(bestBiases[0]);
        localStorage.setItem(this._weightsKey, JSON.stringify(bestWeights));
        localStorage.setItem(this._biasesKey, JSON.stringify(bestBiases));
    }

    public async trainClassifier(connectom: MLv0.Net.Connectom): Promise<{ rank: number, good: number, bad: number }>
    {
        MLv0.Utils.assert(this._dataSets);
        var rank = 0;
        var sampleCount = 0;
        var good = 0;
        for (const content of this._dataSets)
        {
            for (var sampleNo = 0; sampleNo < content.length; sampleNo++)
            {
                const sample = content.getSample(sampleNo);
                const sensor_scale = this._sensorWidth / content.width;
                MLv0.Utils.assert(sensor_scale == this._sensorHeight / content.height)
                const input_image = MLv0.UI.InputImage.scale(
                    sample.bitmap,
                    content.width,
                    content.height,
                    sensor_scale
                );

                Model.getInputs(connectom).setAll(input_image.bitmap);
                const outputs = Model.getOutputs(connectom);
                connectom.evaluate();
                var assessment = Model.fitnessFunction(outputs, sample.value);
                rank += assessment;
                MLv0.Utils.assert(isFinite(rank));
                MLv0.Utils.assert(!isNaN(rank));
                if (assessment > 0)
                {
                    good++;
                }

                if (((sampleCount++) % 500) == 0)
                {
                    const draw_scale = 1.6;//this._dataScale.value;
                    const scaled_image = MLv0.UI.InputImage.scale(
                        sample.bitmap,
                        content.width,
                        content.height,
                        draw_scale
                    );
                    const p = document.getElementById('predictedNumber') as HTMLParagraphElement;
                    if (p)
                    {
                        p.textContent = `${sample.value} ${assessment > 0 ? "+" : ""}`;
                    }
                    await this.drawOnCanvas(scaled_image);
                }
                //this._dataScale.evaluate();
            }
        }

        console.log(`Samples processed: ${sampleCount}, Current assessment: ${rank}`);
        return {
            rank: rank, good: good, bad: sampleCount - good
        };
    }

    public get inputs()
    {
        return Model.getInputs(this._connectom);
    }
    public get outputs()
    {
        return Model.getOutputs(this._connectom);
    }

    protected get population(): MLv0.Net.Population[]
    {
        return [{ size: this._sensorHeight * this._sensorWidth, transferFunction: MLv0.Core.heaviside },
        { size: 51, transferFunction: MLv0.Core.heaviside },
        { size: 31, transferFunction: MLv0.Core.heaviside },
        { size: 10, transferFunction: MLv0.Core.sigma }];
    }
    protected static getInputs(connectom: MLv0.Net.Connectom)
    {
        return connectom.layers.get(0).inputs;
    }
    protected static getOutputs(connectom: MLv0.Net.Connectom)
    {
        return connectom.layers.get(connectom.layers.length - 1).outputs;
    }
    protected async drawOnCanvas(scaled_image: { bitmap: number[], width: number, height: number }): Promise<void>
    {
        const canvas = this._canvas;
        window.requestAnimationFrame(() =>
        {
            MLv0.UI.InputImage.draw(
                canvas,
                scaled_image.bitmap,
                scaled_image.width,
                scaled_image.height
            );
        });

        //reschedule other async function invocations
        return new Promise(f => setTimeout(f, 0));
    }

    protected static fitnessFunction(outputs: MLv0.Core.Subset<MLv0.Net.SignalType>, value: number): number
    {
        const penalty = -100000;
        const encouraging = 15000;
        const base = outputs.get(value);
        var good = 0;
        var bad = 0;
        outputs.forEachIndex((output, index) =>
        {
            const delta = output - base;
            if (delta < 0)
            {
                good += -delta * encouraging;
            }
            else if (delta > 0)
            {
                bad += delta * penalty;
            }
            else if (index != value)
            {
                bad += outputs.length * penalty;
            }
        });
        if (bad)
        {
            return bad;
        }
        else
        {
            return good;
        }
    }

    private readonly _weightsKey = "{5E058927-94DF-4F82-A818-CA463E74258C}";
    private readonly _biasesKey = "{4FBCA51B-C357-4BFC-BC38-791FFA7DEDCB}";
    private readonly _sensorHeight = 12;
    private readonly _sensorWidth = 12;
    private readonly _dataSetHeight = 28;
    private readonly _dataSetWidth = 28;
    //private readonly _dataScale = new MotionZoom(2, 1.013);
    private readonly _canvas: HTMLCanvasElement;
    private readonly _connectom: MLv0.Net.Connectom;
    private readonly _weightsGeneration: MLv0.GA.Generation<MLv0.Net.WeightType>;
    private readonly _biasesGeneration: MLv0.GA.Generation<MLv0.Net.BiasType>;
    private _dataSets?: MLv0.UI.DataSet[];
    private _wakeSentinel?: WakeLockSentinel;
}

var model: Model;

window.onload = async () =>
{
    const canvas = MLv0.Utils.ensure(document.getElementById('playArea')) as HTMLCanvasElement;
    const dataSetFiles = MLv0.Utils.ensure(document.getElementById('dataSetFiles')) as HTMLInputElement;
    model = new Model(canvas, dataSetFiles);
};