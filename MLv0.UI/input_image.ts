/// <reference path="../MLv0.Utils/ensure.ts" />
/// <reference path="../MLv0.Utils/to_int.ts" />

module MLv0.UI
{
    export class InputImage
    {
        public static async getImageDataFromCanvas(canvas: HTMLCanvasElement, width: number, height: number): Promise<number[]>
        {
            const async_img = new Image();
            async_img.src = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
            const img = await new Promise<HTMLImageElement>((resolve, reject) =>
            {
                async_img.onload = () => resolve(async_img);
                async_img.onerror = () => reject()
            });

            const context = MLv0.Utils.ensure(canvas.getContext("2d"));
            context.save();
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0, width, height);

            const img_data = context.getImageData(0, 0, width, height).data;

            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
            context.restore();

            const ret = new Array<number>(img_data.length / 4);
            for (var i = 0, j = 0; i < img_data.length; i += 4, j++)
            {
                const pix = img_data[i] || img_data[i + 1] || img_data[i + 2] || img_data[i + 3];
                ret[j] = (pix ? 1.0 : 0.0);
            }
            return ret;
        }

        public static async draw(canvas: HTMLCanvasElement, bitmap: number[], width: number, height: number, scale: number): Promise<void>
        {
            Utils.assert(bitmap.length == width * height);
            const context = MLv0.Utils.ensure(canvas.getContext("2d"));
            context.clearRect(0, 0, canvas.width, canvas.height);
            for (var y = 0; y < height * scale; y++)
            {
                const offset = Utils.toInt(y / scale) * width;
                for (var x = 0; x < width * scale; x++)
                {
                    const pixel = 1 - bitmap[offset + Utils.toInt(x / scale)];
                    const color = Math.floor(0xff * pixel).toString(16);
                    context.fillStyle = `#${color}${color}${color}`;
                    context.fillRect(x, y, 1, 1);
                }
            }
        }
    }
}