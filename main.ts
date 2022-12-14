/// <reference path="MLv0.Core/heaviside.ts" />
/// <reference path="MLv0.Core/sigma.ts" />
/// <reference path="MLv0.GA/generation.ts" />
/// <reference path="MLv0.IO/dataset.ts" />
/// <reference path="MLv0.IO/input_image.ts" />
/// <reference path="MLv0.Net/connectom.ts" />
/// <reference path="MLv0.Utils/ensure.ts" />


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

type SampleInfo = { bitmap: number[], value: number, originalImage?: { bitmap: number[], width: number, height: number } };

class Model implements MLv0.Core.IEvaluatable
{
    constructor(canvas: HTMLCanvasElement)
    {
        this._canvas = canvas;

        try
        {
            const quickSaveData = localStorage.getItem(this._quickSaveKey);
            if (quickSaveData)
            {
                this.openImpl(quickSaveData);
                return;
            }
        }
        catch (error)
        {
            alert(`Unable to restore qiuck saved data. Default settings are used. ${error}`);
        }

        const genomLength = 20;
        const weightsGeneration = new Array<MLv0.GA.Genome<MLv0.Net.WeightType>>(genomLength);
        const biasesGeneration = new Array<MLv0.GA.Genome<MLv0.Net.BiasType>>(genomLength);

        this._population = [
            { size: this._sensorHeight * this._sensorWidth, transferFunction: MLv0.Core.heaviside },
            { size: 51, transferFunction: MLv0.Core.heaviside },
            { size: 31, transferFunction: MLv0.Core.heaviside },
            { size: 10, transferFunction: MLv0.Core.sigma }
        ];
        this._connectom = new MLv0.Net.Connectom(...this._population);

        const random = new MLv0.Utils.RandomGenerator(1000);
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

        this._weightsGeneration = new MLv0.GA.Generation<MLv0.Net.WeightType>(weightsGeneration);
        this._biasesGeneration = new MLv0.GA.Generation<MLv0.Net.BiasType>(biasesGeneration);
    }

    public async loadAndEvaluate(): Promise<void>
    {
        const openOptions: OpenFilePickerOptions = {
            types: [{
                description: 'Tagged dataset',
                accept: { 'text/plain': ['.txt'] },
            }],
        };
        const dataFiles = window.showOpenFilePicker(openOptions);
        const contentList = await MLv0.UI.DataSet.readFiles(await dataFiles);

        this._samples = contentList.map(content =>
        {
            const data = new MLv0.UI.DataSet(content, this._dataSetWidth, this._dataSetHeight);
            const sensorScale = this._sensorWidth / data.width;
            MLv0.Utils.assert(sensorScale == this._sensorHeight / data.height)
            const bitmaps: SampleInfo[] = [];
            for (var sampleNo = 0; sampleNo < data.length; sampleNo++)
            {
                const sample = data.getSample(sampleNo);
                const inputImage = MLv0.UI.InputImage.scale(
                    sample.bitmap,
                    data.width,
                    data.height,
                    sensorScale
                );
                if (sampleNo % 671 == 0)
                {
                    bitmaps.push({
                        bitmap: inputImage.bitmap,
                        value: sample.value,
                        originalImage: {
                            bitmap: sample.bitmap,
                            width: data.width,
                            height: data.height
                        }
                    });
                }
                else
                {
                    bitmaps.push({ bitmap: inputImage.bitmap, value: sample.value });
                }
            }
            return bitmaps;
        }).flat();

        console.log(this._samples.length);
        return this.evaluate();
    }

    public async evaluate(): Promise<void>
    {
        MLv0.Utils.assert(this._population);
        MLv0.Utils.assert(this._weightsGeneration);
        MLv0.Utils.assert(this._biasesGeneration);
        MLv0.Utils.assert(this._connectom);
        MLv0.Utils.assert(this._weightsGeneration.genomes.length == this._biasesGeneration.genomes.length);
        for (var iteration = 0; iteration < 100; iteration++)
        {
            if (!this._wakeSentinel)
            {
                try
                {
                    const $this = this;
                    this._wakeSentinel = await navigator.wakeLock.request('screen');
                    this._wakeSentinel.addEventListener('release', async () =>
                    {
                        console.info('Wake Lock was released');
                        $this._wakeSentinel = undefined;
                    });
                }
                catch { }
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

                const connectom = new MLv0.Net.Connectom(...this._population);
                connectom.weights.setAll(weightsGenome.data);
                connectom.biases.setAll(biasesGenome.data);

                const assessment = await this.trainClassifier(connectom);
                weightsGenome.rank = assessment.assesment;
                biasesGenome.rank = assessment.assesment;
            }

            const random = new MLv0.Utils.RandomGenerator(1113);
            this._weightsGeneration.evaluate((a, b) => Model.crossFunction(a, b, random), (value) => Model.mutagen(value, random), random);
            this._biasesGeneration.evaluate((a, b) => Model.crossFunction(a, b, random), (value) => Model.mutagen(value, random), random);
            const p = document.getElementById('info') as HTMLParagraphElement;
            if (p)
            {
                p.innerHTML = Model.printBestAssesments(this._weightsGeneration);
            }
        }
        const bestWeights = this.currentWeights;
        const bestBiases = this.currentBiases;
        this._connectom.weights.setAll(bestWeights[0]);
        this._connectom.biases.setAll(bestBiases[0]);
        localStorage.setItem(this._quickSaveKey, this.saveImp());
        this._wakeSentinel = undefined;
    }

    public async trainClassifier(connectom: MLv0.Net.Connectom): Promise<{ assesment: number, samplesCount: number }>
    {
        MLv0.Utils.assert(this._samples);
        var rightPredicted = 0;
        for (const sample of this._samples)
        {
            Model.getInputs(connectom).setAll(sample.bitmap);
            connectom.evaluate();
            const outputs = Model.getOutputs(connectom);

            const predictedValue = Model.predictedValue(outputs);
            if (predictedValue == sample.value)
            {
                rightPredicted++;
            }
            else if (predictedValue === undefined && rightPredicted >= 10)
            {
                rightPredicted -= 10;
            }

            if (sample.originalImage)
            {
                const draw_scale = 1.6;//this._dataScale.value;
                const scaled_image = MLv0.UI.InputImage.scale(
                    sample.originalImage.bitmap,
                    sample.originalImage.width,
                    sample.originalImage.height,
                    draw_scale
                );
                const p = document.getElementById('predictedNumber') as HTMLParagraphElement;
                if (p)
                {
                    p.textContent = `${sample.value} ${predictedValue == sample.value ? "+" : ""}`;
                }
                await this.drawOnCanvas(scaled_image);
            }
            //this._dataScale.evaluate();
        }


        const assesment = (rightPredicted * 100) / this._samples.length;
        console.log(`Samples processed: ${this._samples.length}, Current assessment: ${assesment}%`);
        return {
            assesment: assesment, samplesCount: this._samples.length
        };
    }

    public async save(): Promise<void>
    {
        const saveOptions: SaveFilePickerOptions = {
            types: [{
                description: 'Weights and Biases',
                accept: { 'weights-and-biases/plain': ['.wnb'] },
            }],
        };
        const file = await window.showSaveFilePicker(saveOptions);
        try
        {
            const stream = await file.createWritable();
            await stream.write(this.saveImp());
            return stream.close();
        }
        catch (error)
        {
            alert(error);
        }
    }
    public async open(): Promise<void>
    {
        const openOptions: OpenFilePickerOptions = {
            types: [{
                description: 'Weights and Biases',
                accept: { 'weights-and-biases/plain': ['.wnb'] },
            }],
            multiple: false
        };
        const files = await window.showOpenFilePicker(openOptions);
        try
        {
            if (files.length != 1)
            {
                throw new Error(`Unable to open file`);
            }
            const file = await files[0].getFile();
            this.openImpl(await file.text());
        }
        catch (error)
        {
            alert(error);
        }
    }

    public get inputs()
    {
        MLv0.Utils.assert(this._connectom);
        return Model.getInputs(this._connectom);
    }
    public get outputs()
    {
        MLv0.Utils.assert(this._connectom);
        return Model.getOutputs(this._connectom);
    }

    protected get currentWeights(): number[][]
    {
        MLv0.Utils.assert(this._weightsGeneration);
        return this._weightsGeneration.genomes.map(genome => genome.data);
    }
    protected get currentBiases(): number[][]
    {
        MLv0.Utils.assert(this._biasesGeneration);
        return this._biasesGeneration.genomes.map(genome => genome.data);
    }
    protected saveImp(): string
    {
        const data = { version: 1.0, population: this._population, weights: this.currentWeights, biases: this.currentBiases };

        return JSON.stringify(data, (key: string, value: any) =>
        {
            if (key == "transferFunction")
            {
                switch (value)
                {
                    case MLv0.Core.heaviside:
                        return "HVS";
                    case MLv0.Core.sigma:
                        return "SGM";
                    default:
                        MLv0.Utils.assert(false);
                }
            }
            return value;
        });
    }
    protected openImpl(textData: string): void
    {
        const data = JSON.parse(textData, (key: string, value: any) =>
        {
            if (key == "transferFunction")
            {
                switch (value)
                {
                    case "HVS":
                        return MLv0.Core.heaviside;
                    case "SGM":
                        return MLv0.Core.sigma;
                    default:
                        throw new Error(`Unsupported trunsfer function [${value}]`);
                }
            }
            return value;
        });

        if (data.version != 1)
        {
            throw new Error(`Unsupported data version [${data.version}]`);
        }
        else if (data.population.length < 2)
        {
            throw new Error(`Unsupported length of population [${data.population.length}]`);
        }

        const connectom = new MLv0.Net.Connectom(...data.population);
        const weightsGeneration = (data.weights as number[][]).map(genome => new MLv0.GA.Genome<MLv0.Net.WeightType>(genome));
        const biasesGeneration = (data.biases as number[][]).map(genome => new MLv0.GA.Genome<MLv0.Net.BiasType>(genome));
        if (weightsGeneration.length != biasesGeneration.length)
        {
            throw new Error(`Weights genome doesn't matched to the biases genome`);
        }
        else if (weightsGeneration.length < 10)
        {
            throw new Error(`Weights and biases generations too small: [${weightsGeneration.length}]`);
        }
        else if (connectom.weights.length != weightsGeneration[0].length)
        {
            throw new Error(`Weights genome doesn't matched to the connectome`);
        }
        else if (connectom.biases.length != biasesGeneration[0].length)
        {
            throw new Error(`Biases genome doesn't matched to the connectome`);
        }

        connectom.weights.setAll(weightsGeneration[0].data);
        connectom.biases.setAll(biasesGeneration[0].data);

        this._population = data.population;
        this._connectom = connectom;
        this._weightsGeneration = new MLv0.GA.Generation<MLv0.Net.WeightType>(weightsGeneration);
        this._biasesGeneration = new MLv0.GA.Generation<MLv0.Net.BiasType>(biasesGeneration);
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
    protected static getInputs(connectom: MLv0.Net.Connectom)
    {
        return connectom.layers.get(0).inputs;
    }
    protected static getOutputs(connectom: MLv0.Net.Connectom)
    {
        return connectom.layers.get(connectom.layers.length - 1).outputs;
    }
    protected static crossFunction(a: number, b: number, random: MLv0.Utils.RandomGenerator): number
    {
        if (random.getValue(0, 100) > 15)
        {
            return a;
        }
        else
        {
            return b;
        }
    }
    protected static mutagen(value: number, random: MLv0.Utils.RandomGenerator): number
    {
        const chance = random.getValue(0, 100);
        if (chance > 98.9)
        {
            return value * random.getValue(0.5, 1.5);
        }
        else if (chance >= 95)
        {
            return value * random.getValue(0.9, 1.1);
        }
        else 
        {
            return value;
        }
    }
    protected static predictedValue(outputs: MLv0.Core.Subset<MLv0.Net.SignalType>): number | undefined
    {
        var value;
        var maxOutput = -Infinity;
        outputs.forEachIndex((output, index) =>
        {
            if (maxOutput < output)
            {
                value = index;
                maxOutput = output;
            }
            else if (maxOutput == output)
            {
                value = null;
            }
        });

        return value;
    }
    protected static printBestAssesments(generation: MLv0.GA.Generation<number>): string
    {
        var ranks = `Generation: ${generation.generation}. Ranks: <br>`;
        for (var genome of generation.genomes)
        {
            if (genome.hasRank)
            {
                ranks += `success rate: ${genome.rank} <br>`;
            }
        }
        return ranks;
    }

    private readonly _quickSaveKey = "{13F737A7-B005-4806-BBAA-923DF9689566}";
    private readonly _sensorHeight = 12;
    private readonly _sensorWidth = 12;
    private readonly _dataSetHeight = 28;
    private readonly _dataSetWidth = 28;
    //private readonly _dataScale = new MotionZoom(2, 1.013);
    private readonly _canvas: HTMLCanvasElement;
    private _weightsGeneration?: MLv0.GA.Generation<MLv0.Net.WeightType>;
    private _biasesGeneration?: MLv0.GA.Generation<MLv0.Net.BiasType>;
    private _connectom?: MLv0.Net.Connectom;
    private _population?: MLv0.Net.Population[];
    private _samples?: SampleInfo[];
    //private _dataSets?: MLv0.UI.DataSet[];
    private _wakeSentinel?: WakeLockSentinel;
}

var model: Model;

window.onload = async () =>
{
    const canvas = MLv0.Utils.ensure(document.getElementById('playArea')) as HTMLCanvasElement;
    model = new Model(canvas);
};