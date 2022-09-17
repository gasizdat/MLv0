/// <reference path="MLv0.Net/connectom.ts" />
/// <reference path="MLv0.Utils/ensure.ts" />

class Model implements MLv0.Core.IEvaluatable
{
    constructor(canvas: HTMLCanvasElement)
    {
        this._canvas = canvas;
        this._connectom.biases.setAll(0);

        for (var i = 0; i < this._connectom.weights.length; i++)
        {
            this._connectom.weights.set(i, -10 + Math.random() * 20);
        }
    }

    public async evaluate(): Promise<void>
    {
        const t1 = Date.now();
        const canvas = this._canvas;
        const context = MLv0.Utils.ensure(canvas.getContext("2d"));

        var cg: CanvasGradient = context.createLinearGradient(0,0,64,64);
        cg.addColorStop(0.10, "blue");
        cg.addColorStop(0.20, "green");
        cg.addColorStop(0.40, "yellow");
        context.lineWidth = 3;
        context.strokeStyle = cg; "rgba(11,27,47,1)";
        context.strokeRect(5, 5, 54, 54);

        const async_img = new Image();
        async_img.src = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        const img = await new Promise<HTMLImageElement>((resolve, reject) =>
        {
            async_img.onload = () => resolve(async_img);
            async_img.onerror = () => reject()
        });

        context.save();
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0, this._width, this._height);

        const img_data = context.getImageData(0, 0, this._width, this._height).data;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        context.restore();

        const inputs = this._connectom.layers.get(0).inputs;
        for (var i = 0, j = 0; i < img_data.length; i += 4, j++)
        {
            const pix = img_data[i] || img_data[i + 1] || img_data[i + 2] || img_data[i + 3];
            inputs.set(j, pix ? 1.0 : 0.0);
        }

        //console.log(bitmap.height);
        this._connectom.evaluate();
        const duration = Date.now() - t1;

        const outputs = this._connectom.layers.get(this._connectom.layers.length - 1).outputs;
        outputs.forEachIndex((output, index) => console.log((index) + ": " + (output * 100).toFixed(2) + ", "));
        console.log(`Duration ${duration}`);
    }

    private readonly _height = 12;
    private readonly _width = 12;
    private readonly _canvas: HTMLCanvasElement;
    private readonly _connectom = new MLv0.Net.Connectom(this._height * this._width, 51, 31, 10);
}

var model: Model;

window.onload = () =>
{
    const canvas = document.getElementById('playArea') as HTMLCanvasElement;
    model = new Model(canvas);
};