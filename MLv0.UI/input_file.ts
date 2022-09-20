/// <reference path="../MLv0.Utils/assert.ts" />
/// <reference path="../MLv0.Utils/ensure.ts" />

module MLv0.UI
{
    import assert = Utils.assert;

    export class InputFile
    {
        public static async getContents(input: HTMLInputElement): Promise<string[]>
        {
            const promises = new Array<Promise<string>>();
            const fileList = input.files;
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

                    promises.push(blob);
                }
            }

            const ret = new Array<string>();
            for (var promise of promises)
            {
                ret.push(await promise);
            }

            return ret;
        }

        constructor(content: string, width: number, height: number)
        {
            this._lines = InputFile.trimLast(content.split("\r\n"));
            this._width = width;
            this._height = height;

            assert(this.length == Math.floor(this.length));
        }

        public get length(): number
        {
            return (this._lines.length - 1) / (this._height + 1);
        }

        public get width(): number
        {
            return this._width;
        }
        public get height(): number
        {
            return this._height;
        }

        public getSample(index: number): { value: number, bitmap: number[] }
        {
            var i = 1 + index * (this._height + 1);
            assert(i < this._lines.length);
            const value = Number.parseInt(this._lines[i++]);
            const ret = { value: value, bitmap: new Array<number>() };
            const stop = i + this._height;
            for (i; i < stop; i++)
            {
                assert(i < this._lines.length);
                const pixels = InputFile.trimLast(this._lines[i].split(" "));
                assert(pixels.length == this._width);
                ret.bitmap.push(...pixels.map<number>(value => Number.parseFloat(value)));
            }

            Utils.assert(ret.bitmap.length == this._width * this._height);
            return ret;
        }

        protected static trimLast(list: string[]): string[]
        {
            for (; ;)
            {
                if (list[list.length - 1].trim() == "")
                {
                    list.splice(list.length - 1, 1);
                }
                else
                {
                    return list;
                }
            }
        }

        private readonly _lines: string[];
        private readonly _width: number;
        private readonly _height: number;
    }
}