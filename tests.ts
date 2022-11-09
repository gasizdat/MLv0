/// <reference path="MLv0.GA/generation.ts" />
/// <reference path="MLv0.GA/genome.ts" />

class Tests
{
    public static runAll()
    {
        Tests.newGeneration();
    }

    static newGeneration(): void
    {
        const data = [
            new MLv0.GA.Genome(["A", "B", "C", "D"]),
            new MLv0.GA.Genome(["E", "F", "G", "H"]),
            new MLv0.GA.Genome(["I", "K", "L", "M"]),
            new MLv0.GA.Genome(["X", "Y", "Z", "W"])
        ];

        const generation = new MLv0.GA.Generation<string>(data);

        generation.genomes[3].rank = 3;
        generation.genomes[2].rank = 4;
        generation.genomes[1].rank = 5;
        generation.genomes[0].rank = 2;

        const new_generation = generation.evaluate((a, b) =>
        {
            if ((Math.random() * 3) > 1.5)
            {
                return a;
            }
            else
            {
                return b;
            }
        }, (value) =>
        {
            if ((Math.random() * 17) > 15.7)
            {
                return value += "m";
            }
            else
            {
                return value;
            }
        });
        console.log(new_generation);
    }
}