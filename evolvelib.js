var Evolver = function (tree,ui) {
    this.generation = 1;
    this.tree = tree;
    this.ui = ui;
    console.log("Instantiated evolver");
};

// draws from an approximately normal distribution with mean 0. to alter
// the stdev, multiply the output. then add the target mean. the normal
// distribution is approximated by adding 3 draws from uniform distributions,
// thereby approaching the Central Limit Theorem.
Evolver.prototype.rand = function () {
    var value = (Math.random()*2-1) + (Math.random()*2-1) + (Math.random()*2-1);
    return value;
};

// mutates a parameter
Evolver.prototype.mutate = function ( individual, trait, min, max, id ) {
    var value = individual.getTraitValue(trait);
    var rate  = this.ui.getParam(id + 'Heritability');
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

// evolve one generation
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

    // transform fitness to be relative to rank
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
        if ( killProb > fit && killProb < killProbScaler && leaves[i].die() ) {
            leaves.splice(i,1);
            console.log("Death befalls the weaker of the population, fitness=" + fit);
        }
    }

    // iterate over leaves to reproduce
    for ( i = 0; i < leaves.length; i++ ) {
        birthProb = this.rand() * 1/6 + 0.5;
        fit = leaves[i].getFitness();
        if ( birthProb < fit && birthProb < birthProbScaler ) {
            console.log("The stronger of the population is blessed with a child=" + fit);
            children = leaves[i].reproduce(this.generation);
            leaves.splice(i,1);
            leaves.push(children[0]);
            leaves.push(children[1]);

            // mutate the phenotype of the child
            children[1].color[0] = this.mutate(children[1],'color_r',0,255,'color');
            children[1].color[1] = this.mutate(children[1],'color_g',0,255,'color');
            children[1].color[2] = this.mutate(children[1],'color_b',0,255,'color');
        }
    }

    // fade the previous generation
    this.ui.fade();

    // iterate over lineages, mutate
    for ( var i = 0; i < leaves.length; i++ ) {
        var l = leaves[i];
        l.gen = this.generation; // update

        // mutate position
        l.pos[0] = this.mutate(l,'pos_x',0,window.innerWidth,'position');
        l.pos[1] = this.mutate(l,'pos_y',0,window.innerHeight,'position');

        // draw the lineage
        this.ui.drawLineage(l);
    }
    if (drawTree)
        this.ui.drawTree(this.tree.root,this.generation);
    this.generation++;
};