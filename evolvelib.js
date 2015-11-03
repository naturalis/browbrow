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
Evolver.prototype.mutate = function ( individual, trait, min, max, id, competitors ) {
    var value = individual.getTraitValue(trait);
    var rate  = this.ui.getParam(id + 'Heritability');
    var comp  = this.ui.getParam(id + 'Competition');
    var stdev = ( max - min ) * ( rate );
    var newValue = this.rand() * stdev + value;
    var invComp = comp == 0 ? Infinity : 1/comp;

    // bounce back from upper
    if ( newValue > max ) {
        newValue = max - ( newValue - max );
    }

    // bounce back from lower
    if ( newValue < min ) {
        newValue = min + ( min - newValue );
    }

    // check if we are approaching someone else's trait value. if we are, then the
    // approach will be a value above 1, else below 1. Let's say the new value gets
    // us ten times as close to a competitor than the old value, then the approach
    // is 10. We will only accept this if that value is still smaller than the inverse
    // of the competition. So if the competition is ~0.0 then the inverse will be
    // infinity, hence all approaches will be accepted because they'll always we
    // smaller than infinity. If competition is ~1.0 then no approach will be accepted
    var approach = this.competitionGradient(individual,trait,newValue,competitors);
    if ( ( approach < invComp ) || ( comp < Math.random() ) ) {
        return Math.round(newValue);
    }
    else {
        return this.mutate(individual, trait, min, max, id, competitors);
    }
};

Evolver.prototype.competitionGradient = function(individual,trait,newValue,competitors) {
    var value = individual.getTraitValue(trait);

    // compute all distances to the old value and to the new value
    var oldDistances = [];
    var newDistances = [];
    for ( var i = 0; i < competitors.length; i++ ) {

        // don't compare with self
        if ( individual.id != competitors[i].id ) {
            oldDistances.push(Math.abs(value - competitors[i].getTraitValue(trait)));
            newDistances.push(Math.abs(newValue - competitors[i].getTraitValue(trait)));
        }
    }

    // we have more than 1 individual
    if ( oldDistances.length > 0 ) {

        // sort numerically in increasing order
        var numerically = function(a,b) {
            return a - b;
        };
        oldDistances.sort(numerically);
        newDistances.sort(numerically);

        // return ratio of distances. An approach would result in a ratio > 1.
        return oldDistances[0] / newDistances[0];
    }
    return 0;
};

// evolve one generation
Evolver.prototype.evolve = function () {
    var leaves = this.tree.root.getLeaves();

    // decide whether to speciate
    if ( Math.random() < this.ui.getParam('speciationRate') ) {
        var i = Math.floor( Math.random() * leaves.length );
        var children = leaves[i].speciate(this.generation);
        leaves.splice(i,1);
        leaves.push(children[0]);
        leaves.push(children[1]);
    }

    // decide whether to extinguish
    if ( Math.random() < this.ui.getParam('extinctionRate') ) {
        if ( leaves.length > 1 ) {
            var i = Math.floor( Math.random() * leaves.length );
            if ( leaves[i].extinguish() ) {
                leaves.splice(i,1);
            }
        }
    }

    // fade the previous generation
    this.ui.fade();

    // iterate over lineages, mutate
    for ( var i = 0; i < leaves.length; i++ ) {
        var l = leaves[i];
        l.gen = this.generation; // update

        // mutate colors
        l.color[0] = this.mutate(l,'color_r',0,255,'color',leaves);
        l.color[1] = this.mutate(l,'color_g',0,255,'color',leaves);
        l.color[2] = this.mutate(l,'color_b',0,255,'color',leaves);

        // mutate radius
        l.radius = this.mutate(l,'radius',5,40,'radius',leaves);

        // mutate position
        l.pos[0] = this.mutate(l,'pos_x',0,window.innerWidth,'position',leaves);
        l.pos[1] = this.mutate(l,'pos_y',0,window.innerHeight,'position',leaves);
        this.ui.getFitness(l.pos[0], l.pos[1]);

        // draw the lineage
        this.ui.drawLineage(l);
    }
    this.ui.drawTree(this.tree.root,this.generation);
    this.generation++;
};
