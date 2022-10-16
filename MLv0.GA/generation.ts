/// <reference path="gen.ts" />

module MLv0.GA
{
    export type Genome<TData> = Gen<TData>[];
    export class Generation<TData>
    {
        constructor(genomes: Genome<TData>[])
        {
            this._genomes = genomes;
            this._ranks = new Array<number>(this._genomes.length);
        }
        public get genomes(): Genome<TData>[]
        {
            return this._genomes;
        }
        public setRank(gen: Genome<TData>, rank: number): void
        {
            const index = this._genomes.indexOf(gen);
            Utils.assert(index >= 0);
            this._ranks[index] = rank;
        }
        public newGeneration(cross_function: (a: Gen<TData>, b: Gen<TData>) => Gen<TData>, mutagen: (data: TData) => TData): Generation<TData>
        {
            const ranks = new Array<number>(...this._ranks);
            const genomes = new Array<Genome<TData>>(...this.genomes);
            genomes.sort((a: Genome<TData>, b: Genome<TData>) =>
            {
                const ia = genomes.indexOf(a);
                const ib = genomes.indexOf(b);
                const ra = ranks[ia] ?? 0;
                const rb = ranks[ib] ?? 0;
                return ra - rb;
            });
            const remove_count = genomes.length / 2;
            genomes.splice(0, remove_count);
            Utils.assert(genomes.length >= 2);

            for (let i = 0; genomes.length < this.genomes.length; i++)
            {
                const g1 = genomes[i];
                const g2 = genomes[i + 1];
                Utils.assert(g1.length == g2.length)
                const new_genome: Gen<TData>[] = [];
                for (let j = 0; j < g1.length; j++)
                {
                    new_genome.push(cross_function(g1[j], g2[j]).mutate(mutagen));
                }
                genomes.push(new_genome);
            }

            const new_generation = new Generation<TData>(genomes);
            return new_generation;
        }

        private readonly _genomes: Genome<TData>[];
        private readonly _ranks: number[];
    }
}