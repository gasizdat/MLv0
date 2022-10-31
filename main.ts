/// <reference path="MLv0.Core/heaviside.ts" />
/// <reference path="MLv0.Core/sigma.ts" />
/// <reference path="MLv0.GA/generation.ts" />
/// <reference path="MLv0.Net/connectom.ts" />
/// <reference path="MLv0.Utils/ensure.ts" />
/// <reference path="MLv0.UI/input_file.ts" />
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
    constructor(canvas: HTMLCanvasElement, fileInput: HTMLInputElement)
    {
        this._connectom = new MLv0.Net.Connectom(
            { size: this._sensorHeight * this._sensorWidth, transferFunction: MLv0.Core.heaviside },
            { size: 51, transferFunction: MLv0.Core.heaviside },
            { size: 31, transferFunction: MLv0.Core.heaviside },
            { size: 10, transferFunction: MLv0.Core.sigma }
        );
        this._canvas = canvas;

        const genomLength = 20;
        const weightsGeneration = new Array<MLv0.GA.Genome<MLv0.Net.WeightType>>(genomLength);
        const biasesGeneration = new Array<MLv0.GA.Genome<MLv0.Net.BiasType>>(genomLength);
        for (var i = 0; i < genomLength; i++)
        {
            const weights = new Array<MLv0.Net.WeightType>(this._connectom.weights.length);
            const biases = new Array<MLv0.Net.BiasType>(this._connectom.biases.length);

            for (var j = 0; j < weights.length; j++)
            {
                weights[j] = -10 + Math.random() * 20;
            }
            for (var j = 0; j < biases.length; j++)
            {
                biases[j] = Math.random();
            }

            weightsGeneration[i] = new MLv0.GA.Genome<MLv0.Net.WeightType>(weights);
            biasesGeneration[i] = new MLv0.GA.Genome<MLv0.Net.BiasType>(biases);
        }
        this._weightsGeneration = new MLv0.GA.Generation<MLv0.Net.WeightType>(weightsGeneration);
        this._biasesGeneration = new MLv0.GA.Generation<MLv0.Net.BiasType>(biasesGeneration);

        const $this = this;
        fileInput.addEventListener('change', async (_) =>
        {
            const contents = await MLv0.UI.InputFile.getContents(fileInput);
            $this._contents = contents.map(content => new MLv0.UI.InputFile(content, this._dataSetWidth, this._dataSetHeight));

            console.log($this._contents.length);
            await this.evaluate();
        });
    }

    public async evaluate(): Promise<void>
    {
        MLv0.Utils.assert(this._weightsGeneration.genomes.length == this._biasesGeneration.genomes.length);
        for (var iteration = 0; iteration < 100; iteration++)
        {
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

                const connectom = new MLv0.Net.Connectom(
                    { size: this._sensorHeight * this._sensorWidth, transferFunction: MLv0.Core.heaviside },
                    { size: 51, transferFunction: MLv0.Core.heaviside },
                    { size: 31, transferFunction: MLv0.Core.heaviside },
                    { size: 10, transferFunction: MLv0.Core.sigma });

                connectom.weights.setAll(weightsGenome.data);
                connectom.biases.setAll(biasesGenome.data);
                const assessment = await this.trainClassifier(connectom);
                console.log(`Assessment: ${assessment}`);
                weightsGenome.rank = assessment;
                biasesGenome.rank = assessment;
            }
            this._weightsGeneration.evaluate((a, b) =>
            {
                if ((Math.random() * 3) > 1.5)
                {
                    return a;
                }
                else
                {
                    return b;
                }
            }, (value) =>
            {
                if ((Math.random() * 17) > 15.7)
                {
                    return value * (0.9 + 1.2 * Math.random());
                }
                else
                {
                    return value;
                }
            });
            this._biasesGeneration.evaluate((a, b) =>
            {
                if ((Math.random() * 3) > 1.5)
                {
                    return a;
                }
                else
                {
                    return b;
                }
            }, (value) =>
            {
                if ((Math.random() * 17) > 15.7)
                {
                    return value * (0.9 + 1.2 * Math.random());
                }
                else
                {
                    return value;
                }
            });
            const p = document.getElementById('info') as HTMLParagraphElement;
            if (p)
            {
                p.textContent = `Best rank: ${this._weightsGeneration.genomes[0].rank}. ` +
                    `Generation: ${this._weightsGeneration.generation}`;
            }
        }
    }

    public async trainClassifier(connectom: MLv0.Net.Connectom): Promise<number>
    {
        MLv0.Utils.assert(this._contents);
        var currentAssessment = 0;
        var sampleCount = 0;
        for (const content of this._contents)
        {
            for (var sampleNo = 0; sampleNo < content.length; sampleNo++)
            {
                //const t1 = Date.now();
                const draw_scale = this._dataScale.value;
                const sample = content.getSample(sampleNo);
                const scaled_image = MLv0.UI.InputImage.scale(
                    sample.bitmap,
                    content.width,
                    content.height,
                    draw_scale
                );

                const sensor_scale = this._sensorWidth / content.width;
                MLv0.Utils.assert(sensor_scale == this._sensorHeight / content.height)
                const input_image = MLv0.UI.InputImage.scale(
                    sample.bitmap,
                    content.width,
                    content.height,
                    sensor_scale
                );

                Model.getInputs(connectom).setAll(input_image.bitmap);
                connectom.evaluate();
                currentAssessment += Model.fitnessFunction(Model.getOutputs(connectom), sample.value);
                MLv0.Utils.assert(isFinite(currentAssessment));
                MLv0.Utils.assert(!isNaN(currentAssessment));

                if (((sampleCount++) % 300) == 0)
                {
                    await this.drawOnCanvas(scaled_image);
                }
                this._dataScale.evaluate();
            }
        }

        console.log(`Samples processed: ${sampleCount}, Current assessment: ${currentAssessment}`);
        return currentAssessment;
    }

    public get inputs()
    {
        return Model.getInputs(this._connectom);
    }
    public get outputs()
    {
        return Model.getOutputs(this._connectom);
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
        var result = 0;
        outputs.forEachIndex((output, index) =>
        {
            const rate = (output == 1) ? 1e-3 : (1 - output);
            result += 1 / ((index == value) ? rate : (-rate));
        });
        return result;
    }

    private readonly _sensorHeight = 12;
    private readonly _sensorWidth = 12;
    private readonly _dataSetHeight = 28;
    private readonly _dataSetWidth = 28;
    private readonly _dataScale = new MotionZoom(2, 1.013);
    private readonly _canvas: HTMLCanvasElement;
    private readonly _connectom: MLv0.Net.Connectom;
    private readonly _weightsGeneration: MLv0.GA.Generation<MLv0.Net.WeightType>;
    private readonly _biasesGeneration: MLv0.GA.Generation<MLv0.Net.BiasType>;
    private _contents?: MLv0.UI.InputFile[];
}

var model: Model;

window.onload = async () =>
{
    const canvas = document.getElementById('playArea') as HTMLCanvasElement;
    const file = document.getElementById('localFile') as HTMLInputElement;
    model = new Model(canvas, file);
};