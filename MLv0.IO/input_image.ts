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

        public static async draw(canvas: HTMLCanvasElement, bitmap: number[], width: number, height: number): Promise<void>
        {
            Utils.assert(bitmap.length == width * height);

            const context = MLv0.Utils.ensure(canvas.getContext("2d"));
            var i = 0;

            context.beginPath();
            context.clearRect(0, 0, canvas.width, canvas.height);

            for (var pixel of bitmap)
            {
                const x = Utils.toInt(i % width);
                const y = Utils.toInt(i / width);
                const color = Math.floor(0xff * pixel).toString(16);

                context.fillStyle = `#${color}${color}${color}`;
                context.fillRect(x, y, 1, 1);
                i++;
            }

            context.closePath();
        }

        public static scale(bitmap: number[], width: number, height: number, scale: number): { bitmap: number[], width: number, height: number }
        {
            Utils.assert(bitmap.length == width * height);
            const scaled_width = InputImage.getScaled(width, scale);
            const scaled_height = InputImage.getScaled(height, scale);

            if (scale == 1.0)
            {
                return {
                    bitmap: bitmap,
                    width: width,
                    height: height
                };
            }

            const scale_factor = 1 / scale;
            const ret = new Array<number>(Utils.toInt(scaled_width * scaled_height));

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
                for (var y = 0; InputImage.less(y, height, scale_factor); y += scale_factor)
                {
                    const offset = Utils.toInt(y) * width;
                    for (var x = 0; InputImage.less(x, width, scale_factor); x += scale_factor)
                    {
                        const pixel = 1 - bitmap[offset + Utils.toInt(x)];
                        ret[p++] = pixel;
                    }
                }
            }
            return {
                bitmap: ret,
                width: scaled_width,
                height: scaled_height
            };
        }

        private static getScaled(x: number, scale: number): number
        {
            return Utils.toInt(x * scale);
        }

        private static less(a: number, b: number, scale: number): boolean
        {
            return (b - a) >= scale;
        }
    }
}