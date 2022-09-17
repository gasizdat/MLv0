/// <reference path="subset.ts" />
/// <reference path="subset1.ts" />
/// <reference path="../MLv0.Utils/assert.ts" />

module MLv0.Core
{
    export function heaviside(value: number): number
    {
        return (value > 0) ? 1.0 : 0.0;
    }
}