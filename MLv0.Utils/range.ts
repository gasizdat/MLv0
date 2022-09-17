
module MLv0.Utils
{
    export function range(start: number, count: number): number[]
    {
        return Array.from({ length: count }, (_, i) => i + start);
    }
}