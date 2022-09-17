
module MLv0.Core
{
    export interface ISet<T>
    {
        get(index: number): T;
        set(index: number, value: T): void;
        setAll(value: T): void;
    }
}