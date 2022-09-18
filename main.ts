/// <reference path="MLv0.Net/connectom.ts" />
/// <reference path="MLv0.Utils/ensure.ts" />
/// <reference path="MLv0.UI/inputimage.ts" />

class Model implements MLv0.Core.IEvaluatable
{
    constructor(canvas: HTMLCanvasElement, fileInput: HTMLInputElement)
    {
        this._canvas = canvas;
        this._connectom.biases.setAll(0);

        for (var i = 0; i < this._connectom.weights.length; i++)
        {
            this._connectom.weights.set(i, -10 + Math.random() * 20);
        }

        const context = MLv0.Utils.ensure(canvas.getContext("2d"));

        var cg: CanvasGradient = context.createLinearGradient(0, 0, 64, 64);
        cg.addColorStop(0.10, "blue");
        cg.addColorStop(0.20, "green");
        cg.addColorStop(0.40, "yellow");
        context.lineWidth = 3;
        context.strokeStyle = cg; "rgba(11,27,47,1)";
        context.strokeRect(5, 5, 54, 54);


        fileInput.addEventListener('change', async (event) =>
        {
            const fileList = (event.target as HTMLInputElement).files;
            if (fileList)
            {
                for (var i = 0; i < fileList.length; i++)
                {
                    const file = fileList[i];
                    const reader = new FileReader();
                    const blob = new Promise<string>((resolve, reject) =>
                    {
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = () => reject(new Error(`Unable to read file: ${file.name}`));
                        reader.onprogress = (event) =>
                        {
                            if (event.loaded && event.total)
                            {
                                const percent = (event.loaded / event.total) * 100;
                                console.log(`Progress: ${Math.round(percent)}`);
                            }
                        };
                    });

                    reader.readAsText(file);

                    console.log((await blob).length);
                }
            }
        });
    }

    public async evaluate(): Promise<void>
    {
        const t1 = Date.now();
        const image_data = await MLv0.UI.InputImage.getImageDataFromCanvas(this._canvas, this._width, this._height);

        this._connectom.layers.get(0).inputs.setAll(image_data);

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
    const file = document.getElementById('localFile') as HTMLInputElement;
    model = new Model(canvas, file);
};