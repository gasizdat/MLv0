/// <reference path="MLv0.Net/connectom.ts" />

function main()
{
    console.log("Hello world");
    const connectom = new MLv0.Net.Connectom(64*64, 100, 31, 10);
    connectom.evaluate();
}

main();