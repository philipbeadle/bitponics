var mongoose = require('mongoose'),
ObjectID = require('mongodb').ObjectID,
Models = require('../../models'),
GrowPlanInstance = require('../../models/growPlanInstance').model,
GrowPlan = require('../../models/growPlan').growPlan.model,
Device = require('../../models/device').model,
should = require('should'),
sampleGrowPlanInstances = require('../../utils/db_init/seed_data/growPlanInstances'),
async = require('async');


/*
 * Mocha Test
 *
 * Tests are organized by having a "describe" and "it" method. Describe
 * basically creates a "section" that you are testing and the "it" method
 * is what runs your test code.
 *
 * For asynchronous tests you need to have a done method that you call after
 * your code should be done executing so Mocha runs to test properly.
 */
 describe('GrowPlanInstance', function(){
 	
  /*
   * beforeEach Method
   *
	 * Run before each test.
	 */
	 beforeEach(function(done){
	 	done();
	 });


   /*
    * afterEach method
    *
    * Run after each test.
    * Remove the test user.
    */
    afterEach(function(done){
    	done();
    });


    describe('.create', function(){
      
      it('returns an error if options.growPlan is not specified', function(done){
        GrowPlanInstance.create({
          owner : '506de30a8eebf7524342cb6c',
          active : true
        },
        function(err, gpi){
          should.exist(err);
          return done();
        });
      });


      it('returns an error if options.owner is not specified', function(done){
        GrowPlanInstance.create({
          growPlan : '506de2ff8eebf7524342cb3a',
          active : true
        },
        function(err, gpi){
          should.exist(err);
          return done();
        });
      });


      it('returns an error if an invalid options.growPlan is specified', function(done){
        GrowPlanInstance.create({
          growPlan : 'not a valid objectId',
          owner : '506de30a8eebf7524342cb6c',
          active : true
        },
        function(err, gpi){
          should.exist(err);
          return done();
        });
      });


      it('returns a GrowPlanInstance if valid options are specified', function(done){
        GrowPlanInstance.create({
          growPlan : '506de2ff8eebf7524342cb3a',
          owner : '506de30a8eebf7524342cb6c',
          active : false
        },
        function(err, gpi){
          should.not.exist(err);
          should.exist(gpi);
          gpi.should.be.an.instanceof(GrowPlanInstance);
          should.not.exist(gpi.active);
          
          // Since active was false, all phases should be inactive
          gpi.phases.forEach(function(phase){
            should.not.exist(phase.active); // TODO: check falsiness instead
            should.not.exist(phase.startDate);
            should.not.exist(phase.endDate);
          });

          return done();
        });
      });


      it('returns a GrowPlanInstance if valid options are specified, and activates as specified', function(done){
        GrowPlanInstance.create({
          growPlan : '506de2ff8eebf7524342cb3a',
          owner : '506de30a8eebf7524342cb6c',
          active : true
        },
        function(err, gpi){
          should.not.exist(err);
          should.exist(gpi);
          gpi.should.be.an.instanceof(GrowPlanInstance);
          should.exist(gpi.active);
          // Since phaseId and activePhaseDay weren't specified, they 
          // should be set to the first day of the first phase
          var todayDateString = (new Date()).toDateString();
          gpi.phases.forEach(function(phase, index){
            if (index === 0){
              phase.active.should.be.true;
              phase.startDate.toDateString().should.equal(todayDateString);
              should.exist(phase.expectedEndDate);
            } else {
              phase.active.should.be.false; // TODO: check falsiness instead
              should.not.exist(phase.startDate);
              should.not.exist(phase.endDate);  
            }
          });

          return done();
        });
      });

      
      it('activates specified phase if options.activePhaseId is defined', function(done){
        GrowPlanInstance.create({
          growPlan : '506de2ff8eebf7524342cb3a', // Tomato Grow Plan
          owner : '506de30a8eebf7524342cb6c',
          active : true,
          activePhaseId : '506de3048eebf7524342cb4f' // Vegetative phase
        },
        function(err, gpi){
          should.not.exist(err);
          should.exist(gpi);
          gpi.should.be.an.instanceof(GrowPlanInstance);
          should.exist(gpi.active);
          // Since phaseId and activePhaseDay weren't specified, they 
          // should be set to the first day of the first phase
          var todayDateString = (new Date()).toDateString();
          var foundActivePhase = false;
          gpi.phases.forEach(function(phase, index){
            if (phase.phase.toString() == '506de3048eebf7524342cb4f'){
              
              phase.active.should.be.true;
              phase.startDate.toDateString().should.equal(todayDateString);
              should.exist(phase.expectedEndDate);
              foundActivePhase = true;
            } else {
              phase.active.should.be.false; // TODO: check falsiness instead
              should.not.exist(phase.startDate);
              should.not.exist(phase.endDate);  
            }
          });
          foundActivePhase.should.be.true;
          return done();
        });
      });


      it('activates specified phase and day if options.activePhaseId options.activePhaseDay are defined', function(done){
        GrowPlanInstance.create({
          growPlan : '506de2ff8eebf7524342cb3a', // Tomato Grow Plan
          owner : '506de30a8eebf7524342cb6c',
          active : true,
          activePhaseId : '506de3048eebf7524342cb4f', // Vegetative phase
          activePhaseDay : 3
        },
        function(err, gpi){
          should.not.exist(err);
          should.exist(gpi);
          gpi.should.be.an.instanceof(GrowPlanInstance);
          should.exist(gpi.active);
          // Since phaseId and activePhaseDay weren't specified, they 
          // should be set to the first day of the first phase
          var today = new Date(),
              todayDateString = today.toDateString(),
              foundActivePhase = false;
          gpi.phases.forEach(function(phase, index){
            if (phase.phase.toString() == '506de3048eebf7524342cb4f'){
              phase.active.should.be.true;
              phase.startDate.toDateString().should.equal(todayDateString);
              // for Tomato Grow Plan, Vegetative phase is expected to last 28 days
              should.exist(phase.expectedEndDate);
              var daysRemaining = Math.round( (phase.expectedEndDate -  today) / 1000 / 60 / 60 / 24);
              // Started on day 3 of the phase, should should have (28-3) days remaining
              daysRemaining.should.equal(25); 
              foundActivePhase = true;
            } else {
              phase.active.should.be.false; // TODO: check falsiness instead
              should.not.exist(phase.startDate);
              should.not.exist(phase.endDate);  
            }
          });
          foundActivePhase.should.be.true;
          return done();
        });
      });


      it('activates specified device if options.device is defined', function(done){
        GrowPlanInstance.create({
          growPlan : '506de2ff8eebf7524342cb3a',
          owner : '506de30a8eebf7524342cb6c',
          device : '506de2fe8eebf7524342cb35',
          active : true
        },
        function(err, gpi){
          should.not.exist(err);
          should.exist(gpi, 'gpi should be returned from create');
          gpi.should.be.an.instanceof(GrowPlanInstance);
          should.exist(gpi.active);
          should.exist(gpi.device);

          Device.findById(gpi.device, function(err, device){
            should.not.exist(err);
            should.exist(device);
            device.activeGrowPlanInstance.equals(gpi._id).should.be.true;
            return done();
          });
        });
      });


      it('returns an error if GPI owner does not own the specified device', function(done){
        GrowPlanInstance.create({
          growPlan : '506de2ff8eebf7524342cb3a',
          owner : '506de30a8eebf7524342cb6c',
          device : '506de2fe8eebf7524342cb36',
          active : true
        },
        function(err, gpi){
          should.exist(err);
          return done();
        });
      });      
    });


    describe('#activate', function(){
      
    });
    

    describe('#activatePhase', function(){
      
    });
});