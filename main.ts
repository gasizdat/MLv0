/// <reference path="MLv0.Core/heaviside.ts" />
/// <reference path="MLv0.Core/sigma.ts" />
/// <reference path="MLv0.Net/connectom.ts" />
/// <reference path="MLv0.Utils/ensure.ts" />
/// <reference path="MLv0.UI/input_file.ts" />
/// <reference path="MLv0.UI/input_image.ts" />

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

        /*const context = MLv0.Utils.ensure(canvas.getContext("2d"));

        var cg: CanvasGradient = context.createLinearGradient(0, 0, 64, 64);
        cg.addColorStop(0.10, "blue");
        cg.addColorStop(0.20, "green");
        cg.addColorStop(0.40, "yellow");
        context.lineWidth = 3;
        context.strokeStyle = cg; "rgba(11,27,47,1)";
        context.strokeRect(5, 5, 54, 54);*/

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

                await MLv0.UI.InputImage.draw(
                    this._canvas,
                    content.getSample(this._pictureIndex).bitmap,
                    content.width,
                    content.height,
                    this._dataScale
                );
                const image_data = await MLv0.UI.InputImage.getImageDataFromCanvas(this._canvas, this._sensorWidth, this._sensorHeight);

                this._connectom.layers.get(0).inputs.setAll(image_data);

                this._connectom.evaluate();
                const duration = Date.now() - t1;

                const outputs = this._connectom.layers.get(this._connectom.layers.length - 1).outputs;
                outputs.forEachIndex((output, index) => console.log((index) + ": " + (output * 100).toFixed(2) + ", "));
                console.log(`Duration ${duration}`);
                this._pictureIndex++;
            }
            else
            {
                this._pictureIndex = 0;
                this._contentIndex++;
            }
        }

        const duration = 0;
        const $this = this;
        setTimeout(() => window.requestAnimationFrame($this.evaluate.bind($this)), duration);
    }

    private readonly _sensorHeight = 12;
    private readonly _sensorWidth = 12;
    private readonly _dataSetHeight = 28;
    private readonly _dataSetWidth = 28;
    private readonly _dataScale = 2.3;
    private readonly _canvas: HTMLCanvasElement;
    private readonly _connectom: MLv0.Net.Connectom;
    private _contents?: MLv0.UI.InputFile[];
    private _contentIndex = 0;
    private _pictureIndex = 0;
}

var model: Model;

window.onload = () =>
{
    const canvas = document.getElementById('playArea') as HTMLCanvasElement;
    const file = document.getElementById('localFile') as HTMLInputElement;
    model = new Model(canvas, file);
};