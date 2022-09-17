
module MLv0.Core
{
    export function sigma(value: number): number
    {
        return 1 / (1 + Math.pow(Math.E, -value));
    }
}