
module MLv0.Net
{
    export type SignalType = number;
    export type WeightType = number;
    export type BiasType = number;
    export type TransferFunction = (value: number) => number;
    export type Population = { size: number, transferFunction: TransferFunction };
}