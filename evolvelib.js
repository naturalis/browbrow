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

    // precompute fitness
    for ( var i = 0; i < leaves.length; i++ ) {
        leaves[i].updateFitness(this.ui);
    }

    // sort in descending order so that least fit come first
    leaves.sort(function(a,b){
        if (a.getFitness() > b.getFitness()) {
            return -1;
        }
        if (a.getFitness() < b.getFitness()) {
            return 1;
        }
        return 0;
    });

    // decide whether to reproduce
    if ( Math.random() < this.ui.getParam('speciationRate') ) {
        var fittest = leaves.length - 1;
        var children = leaves[fittest].speciate(this.generation);
        leaves.splice(fittest,1);
        for ( var j = 0; j < children.length; j++ ) {
            children[j].color[0] = this.mutate(children[j],'color_r',0,255,'color');
            children[j].color[1] = this.mutate(children[j],'color_g',0,255,'color');
            children[j].color[2] = this.mutate(children[j],'color_b',0,255,'color');
            leaves.push(children[j]);
            console.log("birth");
        }
    }

    // decide whether to die
    if ( Math.random() < this.ui.getParam('extinctionRate') ) {
        if ( leaves.length > 1 ) {

            // extinguish the least fit
            if ( leaves[0].extinguish() ) {
                leaves.splice(0,1);
                console.log("death");
            }
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
    this.ui.drawTree(this.tree.root,this.generation);
    this.generation++;
};