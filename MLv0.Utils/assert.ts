
module MLv0.Utils
{
    class AssertionError extends Error
    {
    }

    export function assert(condition: any, msg?: string): asserts condition
    {
        if (!condition)
        {
            let alert_message = msg ?? "Logic error. If you see this, then something gone wrong way ):";
            const stack = (new Error).stack;
            if (stack)
            {
                alert_message += `\n${stack}`;
            }
            console.log(alert_message);
            window.alert(alert_message);
            throw new AssertionError(alert_message);
        }
    }
}