/// <reference path="genome.ts" />

module MLv0.GA
{
    export class Generation<TData>
    {
        constructor(genomes: Genome<TData>[])
        {
            Utils.assert(genomes.length >= 4);
            Utils.assert(genomes.length % 2 == 0);

            this._genomes = genomes;
        }
        public get genomes(): Genome<TData>[]
        {
            return this._genomes;
        }
        public get generation()
        {
            return this._generation;
        }
        public evaluate(cross_function: (a: TData, b: TData) => TData, mutagen: (data: TData) => TData): void
        {
            this.genomes.sort((a, b) => b.rank - a.rank);
            const startIndex = this.genomes.length / 2;
            for (var i = startIndex; i < this.genomes.length; i++)
            {
                const firstParent = i - startIndex;
                const secondParent = Math.min(Math.trunc(Math.random() * this.genomes.length), this.genomes.length - 1);
                const g1 = this.genomes[firstParent];
                const g2 = this.genomes[secondParent];
                Utils.assert(g1.length == g2.length)
                for (let j = 0; j < g1.length; j++)
                {
                    this.genomes[i].data[j] = mutagen(cross_function(g1.data[j], g2.data[j]));
                }
                this.genomes[i].rank = NaN;
            }
            this._generation++;
        }

        private readonly _genomes: Genome<TData>[];
        private _generation = 0;
    }
}