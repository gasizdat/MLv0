
module MLv0.Utils
{
    export function deduplicate<T>(array: T[]): T[]
    {
        return Array.from(new Set<T>(array));
    }
}