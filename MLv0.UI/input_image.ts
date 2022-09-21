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
                const black = img_data[i] != 255 || img_data[i + 1] != 255 || img_data[i + 2] != 255;// || img_data[i + 3] != 255;
                ret[j] = black ? 1.0 : 0.0;
            }
            return ret;
        }

        public static async draw(canvas: HTMLCanvasElement, bitmap: number[], width: number, height: number, scale: number): Promise<void>
        {
            Utils.assert(bitmap.length == width * height);

            const context = MLv0.Utils.ensure(canvas.getContext("2d"));
            const scaled_width = Math.ceil(width * scale);
            var i = 0;

            context.beginPath();
            context.clearRect(0, 0, canvas.width, canvas.height);

            for (var pixel of InputImage.scale(bitmap, width, height, scale))
            {
                const x = Utils.toInt(i % scaled_width);
                const y = Utils.toInt(i / scaled_width);
                const color = Math.floor(0xff * pixel).toString(16);

                context.fillStyle = `#${color}${color}${color}`;
                context.fillRect(x, y, 1, 1);
                i++;
            }

            context.closePath();
        }

        public static scale(bitmap: number[], width: number, height: number, scale: number): number[]
        {
            Utils.assert(bitmap.length == width * height);

            const scale_factor = 1 / scale;
            const ret = new Array<number>(Utils.toInt(width * height * scale * scale));

            //if (scale_factor > 1)
            //{
            //    const last_pixels = new Array<number>(Utils.toInt(1 / scale));
            //    var lp = 0;
            //    for (var y = 0; y < height; y++)
            //    {
            //        const original_offset = y * width;
            //        for (var x = 0; x < width; x++)
            //        {
            //            const original_index = original_offset + x;
            //            const pixel = 1 - bitmap[original_index];
            //            last_pixels[lp++] = pixel;

            //        }
            //    }
            //}
            //else
            {
                var p = 0;
                for (var y = 0; y < height; y += scale_factor)
                {
                    const offset = Utils.toInt(y) * width;
                    for (var x = 0; x < width; x += scale_factor)
                    {
                        const pixel = 1 - bitmap[offset + Utils.toInt(x)];
                        ret[p++] = pixel;
                    }
                }
            }
            return ret;
        }
    }
}