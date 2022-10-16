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
        this._connectom.biases.setAll(0);

        for (var i = 0; i < this._connectom.weights.length; i++)
        {
            this._connectom.weights.set(i, -10 + Math.random() * 20);
        }

        const $this = this;
        fileInput.addEventListener('change', async (_) =>
        {
            $this._contentIndex = 0;
            $this._pictureIndex = 0;
            const contents = await MLv0.UI.InputFile.getContents(fileInput);
            $this._contents = contents.map(content => new MLv0.UI.InputFile(content, this._dataSetWidth, this._dataSetHeight));

            console.log($this._contents.length);
            window.requestAnimationFrame(this.evaluate.bind(this));
        });
    }

    public async evaluate(): Promise<void>
    {
        if (this._contents && this._contents.length > this._contentIndex)
        {
            const content = this._contents[this._contentIndex];
            if (content.length > this._pictureIndex)
            {
                const t1 = Date.now();
                const draw_scale = this._dataScale.value;
                const source = content.getSample(this._pictureIndex);
                const scaled_image = MLv0.UI.InputImage.scale(
                    source.bitmap,
                    content.width,
                    content.height,
                    draw_scale
                );

                await MLv0.UI.InputImage.draw(
                    this._canvas,
                    scaled_image.bitmap,
                    scaled_image.width,
                    scaled_image.height
                );

                const sensor_scale = this._sensorWidth / content.width;
                MLv0.Utils.assert(sensor_scale == this._sensorHeight / content.height)
                const input_image = MLv0.UI.InputImage.scale(
                    source.bitmap,
                    content.width,
                    content.height,
                    sensor_scale
                );

                this._connectom.layers.get(0).inputs.setAll(input_image.bitmap);

                this._connectom.evaluate();
                const duration = Date.now() - t1;

                const outputs = this._connectom.layers.get(this._connectom.layers.length - 1).outputs;
                outputs.forEachIndex((output, index) => console.log((index) + ": " + (output * 100).toFixed(2) + ", "));
                console.log(`Duration ${duration}, actual: ${source.value}`);
                this._pictureIndex++;
            }
            else
            {
                this._pictureIndex = 0;
                this._contentIndex++;
            }
            this._dataScale.evaluate();
        }

        const duration = 0;
        const $this = this;
        setTimeout(() => window.requestAnimationFrame($this.evaluate.bind($this)), duration);
    }

    private readonly _sensorHeight = 12;
    private readonly _sensorWidth = 12;
    private readonly _dataSetHeight = 28;
    private readonly _dataSetWidth = 28;
    private readonly _dataScale = new MotionZoom(2, 1.013);
    private readonly _canvas: HTMLCanvasElement;
    private readonly _connectom: MLv0.Net.Connectom;
    private _contents?: MLv0.UI.InputFile[];
    private _contentIndex = 0;
    private _pictureIndex = 0;
}

var model: Model;

function generationTest()
{
    const generation = new MLv0.GA.Generation<string>([
        [
            new MLv0.GA.Gen("A"),
            new MLv0.GA.Gen("B"),
            new MLv0.GA.Gen("C"),
            new MLv0.GA.Gen("D")
        ],
        [
            new MLv0.GA.Gen("E"),
            new MLv0.GA.Gen("F"),
            new MLv0.GA.Gen("G"),
            new MLv0.GA.Gen("H")
        ],
        [
            new MLv0.GA.Gen("I"),
            new MLv0.GA.Gen("K"),
            new MLv0.GA.Gen("L"),
            new MLv0.GA.Gen("M")
        ],
        [
            new MLv0.GA.Gen("X"),
            new MLv0.GA.Gen("Y"),
            new MLv0.GA.Gen("Z"),
            new MLv0.GA.Gen("W")
        ]
    ]);

    generation.setRank(generation.genomes[3], 3);
    generation.setRank(generation.genomes[2], 4);
    generation.setRank(generation.genomes[1], 5);
    generation.setRank(generation.genomes[0], 2);

    const new_generation = generation.newGeneration((a, b) =>
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
            return value += "m";
        }
        else
        {
            return value;
        }
    });
    console.log(new_generation);
}

window.onload = () =>
{
    generationTest();

    const canvas = document.getElementById('playArea') as HTMLCanvasElement;
    const file = document.getElementById('localFile') as HTMLInputElement;
    model = new Model(canvas, file);
};