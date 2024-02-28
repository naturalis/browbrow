/*
This class models an evolutionary process. The process involves a set of lineages (represented as a Tree object from
nodelib.js) that are moving through their generations, birthing and dying in the process, in proportion to their
fitness in relation to the environment. The environment is patchy, such that some lineages are better adapted than
others, depending on their trait values (color, position) and the properties of the underlying substrate, i.e. how
well camouflaged are they in that location. This class therefore also manages references to the environment by way
of the UI.
*/

var Evolver = function (tree,ui) {
    this.generation = 1;
    this.tree = tree;
    this.ui = ui;
    console.log("Instantiated evolver");
};

/*
Draws from an approximately normal distribution with mean 0. To alter the stdev, multiply the output, then add the
target mean. The normal distribution is approximated by adding 3 draws from uniform distributions, thereby approaching
behavior according to the Central Limit Theorem.
*/
Evolver.prototype.rand = function () {
    var value = (Math.random()*2-1) + (Math.random()*2-1) + (Math.random()*2-1);
    return value;
};

/*
Given a focal individual (Node from nodelib.js) and a focal trait, mutates the trait. The trait can have an uppper and
lower bound (e.g. so that RGB always stays between 1 and 128). The magnitude of the mutation is controlled by a rate
parameter.
*/
Evolver.prototype.mutate = function ( individual, trait, min, max, id, rate ) {
    var value = individual.getTraitValue(trait);
    //var rate  = this.ui.getParam(id + 'Heritability');
    var stdev = ( max - min ) * ( rate );
    var newValue = this.rand() * stdev + value;

    // bounce back from upper
    if ( newValue > max ) {
        newValue = max - ( newValue - max );
    }

    // bounce back from lower
    if ( newValue < min ) {
        newValue = min + ( min - newValue );
    }

    return Math.round(newValue);
};

/*
Advances the simulation by one generation. This involves the following steps:
- for all lineages, compute the raw fitness
- rank the lineages by decreasing fitness
- rescale the raw fitness values to inverse rank order
- kill lineages probabilistically inversely proportional to fitness
- reproduce the survivors, proportional to fitness, and mutate the offspring
- draw the result
*/
Evolver.prototype.evolve = function () {
    var leaves = this.tree.root.getLeaves();

    // pre-compute raw fitness
    var i, fit, killProb, birthProb, children;
    var birthProbScaler = this.ui.getParam('speciationRate');
    var killProbScaler = this.ui.getParam('extinctionRate');
    var drawTree = this.ui.getBoolean('drawTree');
    for ( i = 0; i < leaves.length; i++ ) {
        leaves[i].setFitness(leaves[i].computeRawFitness(this.ui));
    }

    // sort by fitness, i.e. descending raw values
    leaves.sort(function(a,b){
        if (a.getFitness() > b.getFitness()) {
            return -1;
        }
        if (a.getFitness() < b.getFitness()) {
            return 1;
        }
        return 0;
    });

    // Transform fitness to be a value of 1/rank, so that the fittest Node has fitness 1 and the unfittest one
    // is 1/nleaves. This means that fitness also goes down as population size goes up and so there is more
    // death in larger populations.
    for ( i = 0; i < leaves.length; i++ ) {
        if ( i==0 ) {
            if ( leaves.length == 1 ) {
                fit = 1;
            }
            else {
                fit = 0;
            }
        }
        else {
            fit = i / (leaves.length - 1);
        }
        leaves[i].setFitness(fit);
    }

    // iterate over leaves to kill
    for ( i = 0; i < leaves.length; i++ ) {

        // can't kill them all
        if ( leaves.length <= 1 )
            break;

        // kill focal leaf
        killProb = this.rand() * 1/6 + 0.5;
        fit = leaves[i].getFitness();
        if ( killProb > fit && killProb < killProbScaler && leaves[i].die(this.tree) ) {
            leaves.splice(i,1);
            //console.log("Death befalls the weaker of the population, fitness=" + fit);
        }
    }

    // iterate over leaves to reproduce
    var colorRate  = this.ui.getParam('colorHeritability');
    for ( i = 0; i < leaves.length; i++ ) {
        birthProb = this.rand() * 1/6 + 0.5;
        fit = leaves[i].getFitness();
        if ( birthProb < fit && birthProb < birthProbScaler ) {
            //console.log("The stronger of the population is blessed with a child=" + fit);
            children = leaves[i].reproduce(this.generation);
            leaves.splice(i,1);
            leaves.push(children[0]);
            leaves.push(children[1]);

            // mutate the phenotype of the child
            rgb = [ 'color_r', 'color_g', 'color_b' ];
            for ( j = 0; j <= children.length; j++ ) {
                for ( k = 0; k <= rgb.length; k++ ) {
                    children[j].color[k] = this.mutate( children[1], rgb[k], 0, 255, 'color', colorRate );
                }
            }
        }
    }

    // fade the previous generation
    this.ui.fade();

    // iterate over lineages, mutate the position
    var posRate = this.ui.getParam('positionHeritability');
    for ( var i = 0; i < leaves.length; i++ ) {
        var l = leaves[i];
        l.gen = this.generation; // update

        // mutate position
        l.pos[0] = this.mutate(l,'pos_x',0,window.innerWidth,'position', posRate);
        l.pos[1] = this.mutate(l,'pos_y',0,window.innerHeight,'position', posRate);

        // draw the lineage
        this.ui.drawLineage(l);
    }
    if (drawTree)
        this.ui.drawTree(this.tree.root,this.generation);
    this.generation++;
};