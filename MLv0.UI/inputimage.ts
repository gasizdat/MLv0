/// <reference path="../MLv0.Utils/ensure.ts" />

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

        public static async draw(canvas: HTMLCanvasElement, bitmap: number[][], scale: number): Promise<void>
        {
            const context = MLv0.Utils.ensure(canvas.getContext("2d"));
            context.clearRect(0, 0, canvas.width, canvas.height);
            var y = 0;
            for (var row of bitmap)
            {
                var x = 0;
                for (var col of row)
                {
                    const color = Math.floor(0xff * (1 - col)).toString(16);
                    context.fillStyle = `#${color}${color}${color}`;
                    x++;
                    context.fillRect(x, y, scale, scale);
                }
                y++;
            }
        }

    }
}