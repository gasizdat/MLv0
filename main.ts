/// <reference path="MLv0.Net/connectom.ts" />

function main()
{
    console.log("Hello world");
    const connectom = new MLv0.Net.Connectom(4,4,2);
    connectom.evaluate();
}

main();