
module MLv0.Utils
{
    export function ensure<T>(entity?: T): NonNullable<T>
    {
        assert(entity);
        return entity!;
    }
}