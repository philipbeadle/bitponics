var mongoose = require('mongoose'),
  ObjectID = require('mongodb').ObjectID,
  ImmediateAction = require('../../models/immediateAction').model,
  GrowPlanInstance = require('../../models/growPlanInstance').model,
  Device = require('../../models/device'),
  DeviceModel = Device.model,
  DeviceUtils = Device.utils,
  ModelUtils = require('../../models/utils'),
  should = require('should'),
  User = require('../../models/user').model,
  async = require('async'),
  getObjectId = ModelUtils.getObjectId,
  i18nKeys = require('../../i18n/keys'),
  requirejs = require('../../lib/requirejs-wrapper'),
  feBeUtils = requirejs('fe-be-utils');


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

describe('Model Utils', function(){

  describe('.triggerImmediateAction', function(){
    
    beforeEach(function(done){
      var self = this,
          newUserObjectID = new ObjectID();

      self.actionId = '506de2fb8eebf7524342cb28' // turn lights on;

      async.series(
        [
          function(innerCallback){
            User.createUserWithPassword(
              {
                _id : newUserObjectID,
                email : 'unittest@bitponics.com',
                name : {
                  first : "Testfirstname",
                  last : "Testlastname"
                },
                locale: "en_US",
                active : true,
                activationToken : "1234567890",
                sentEmail : true
              },
              '8bitpass',
              function(err, user){
                self.user = user;
                return innerCallback();
              }
            );
          },
          function(innerCallback){
            GrowPlanInstance.create(
              {
                growPlan : '506de2ff8eebf7524342cb3a', // 1st phase has a "Light cycle, with lights on between 6am and 10pm.",
                owner : newUserObjectID,
                active : true
              },
              function(err, gpi){
                self.gpi = gpi;
                return innerCallback();
              }
            );
          }
        ],
        function(err){
          return done();
        }
      );
    });

    afterEach(function(done){
      User.remove({email: 'unittest@bitponics.com'}, done);
    });


    it('handles action without control', function(done){
      // triggering an action without a control is actually 
      // probably never going to happen. but no reason to block it,
      // and the code handles it so i'm unit-testing it

      should.exist(this.user, 'user exists');
      should.exist(this.gpi, 'gpi  exists');
      should.exist(this.actionId, 'actionId exists');

      var immediateActionSettings = {
        growPlanInstance : this.gpi, 
        actionId : "506de2fc8eebf7524342cb2c", // pollinate blossons
        immediateActionMessage : "triggering pollination action blam.", 
        user : this.user
      };

      ModelUtils.triggerImmediateAction(
        immediateActionSettings,
        function(err, results){
          should.not.exist(err);
          
          var now = new Date(),
              immediateAction = results.immediateAction,
              notification = results.notification;

          should.exist(immediateAction);
          should.exist(notification);
          
          // immediateAction
          // timeSent should be undefined (hasn't been sent yet)
          should.not.exist(immediateAction.timeSent);
          // timeRequested should be less than now
          immediateAction.timeRequested.should.be.below(now);
          // action should be settings.action
          getObjectId(immediateAction.action).equals(getObjectId(immediateActionSettings.actionId)).should.be.true;
          // done should not be true
          immediateAction.done.should.be.false;
          // message should be message
          immediateAction.message.should.equal(immediateActionSettings.immediateActionMessage);
          // growPlanInstance should be settings.growPlanInstance
          getObjectId(immediateAction.growPlanInstance).equals(getObjectId(immediateActionSettings.growPlanInstance)).should.be.true;
          

          // notification
          // growPlanInstance should be settings.growPlanInstance
          getObjectId(notification.growPlanInstance).equals(getObjectId(immediateActionSettings.growPlanInstance)).should.be.true;
          // message should be message of action
          notification.message.should.equal(i18nKeys.get('manual action trigger message', immediateActionSettings.immediateActionMessage, "Pollinate any new blossoms. Use a small paintbrush or cotton swab brush to distribute pollen between flowers."));
          // type should be actionneeded
          notification.type.should.equal(feBeUtils.NOTIFICATION_TYPES.ACTION_NEEDED);
          // sentLogs should be empty array
          notification.sentLogs.should.be.empty;
          // timeToSend should be less than now
          notification.timeToSend.should.be.below(now);
          // users should include settings.user
          notification.users.should.include(immediateActionSettings.user._id.toString());
          // repeat shouldn't exist
          notification.repeat.should.not.have.property('repeatType');
          notification.repeat.should.not.have.property('duration');
          notification.repeat.should.not.have.property('timezone');
          notification.repeat.should.not.have.property('rt');
          notification.repeat.should.not.have.property('d');
          notification.repeat.should.not.have.property('tz');
          

          done();
        }
      );
    }); // /handles action without control


    it('handles action with control & growPlanInstance without device', function(done){
      should.exist(this.user, 'user exists');
      should.exist(this.gpi, 'gpi  exists');
      should.exist(this.actionId, 'actionId exists');

      var immediateActionSettings = {
        growPlanInstance : this.gpi, 
        actionId : "506de2fb8eebf7524342cb28", // turn lights on
        immediateActionMessage : "triggering turning lights on", 
        user : this.user
      };

      ModelUtils.triggerImmediateAction(
        immediateActionSettings,
        function(err, results){
          should.not.exist(err);
          
          var now = new Date(),
              immediateAction = results.immediateAction,
              notification = results.notification;

          should.exist(immediateAction);
          should.exist(notification);
          
          // immediateAction
          // timeSent should be undefined (hasn't been sent yet)
          should.not.exist(immediateAction.timeSent);
          // timeRequested should be less than now
          immediateAction.timeRequested.should.be.below(now);
          // action should be settings.action
          getObjectId(immediateAction.action).equals(getObjectId(immediateActionSettings.actionId)).should.be.true;
          // done should not be true
          immediateAction.done.should.be.false;
          // message should be message
          immediateAction.message.should.equal(immediateActionSettings.immediateActionMessage);
          // growPlanInstance should be settings.growPlanInstance
          getObjectId(immediateAction.growPlanInstance).equals(getObjectId(immediateActionSettings.growPlanInstance)).should.be.true;
          // this growPlan has a 24-hour light cycle.
          // so this immediateAction of turning on the light should
          // expire with the next roll-around of the cycle, which 
          // means sometime in the next 24 hours
          immediateAction.expires.valueOf().should.be.below(now.valueOf() + (24 * 60 * 60 * 1000), "Should expire within 24 hours (duration of the growPlan's light cycle");




          // notification
          // growPlanInstance should be settings.growPlanInstance
          getObjectId(notification.growPlanInstance).equals(getObjectId(immediateActionSettings.growPlanInstance)).should.be.true;
          // message should be message of action
          notification.message.should.equal(i18nKeys.get('manual action trigger message', immediateActionSettings.immediateActionMessage, "Turn lights on"));
          // since there's no device to automatically handle things, 
          // type should be actionneeded
          notification.type.should.equal(feBeUtils.NOTIFICATION_TYPES.ACTION_NEEDED);
          // sentLogs should be empty array
          notification.sentLogs.should.be.empty;
          // timeToSend should be less than now
          notification.timeToSend.should.be.below(now);
          // users should include settings.user
          notification.users.should.include(immediateActionSettings.user._id.toString());
          // repeat shouldn't exist
          notification.repeat.should.not.have.property('repeatType');
          notification.repeat.should.not.have.property('duration');
          notification.repeat.should.not.have.property('timezone');
          notification.repeat.should.not.have.property('rt');
          notification.repeat.should.not.have.property('d');
          notification.repeat.should.not.have.property('tz');
          

          done();
        }
      );
    }); // /handles action with control & growPlanInstance without device



    it('handles action control and a growPlanInstance with a device', function(done){
      should.exist(this.user, 'user exists');
      should.exist(this.gpi, 'gpi  exists');
      should.exist(this.actionId, 'actionId exists');

      var self = this;

      async.series(
        [
          // Pair the GPI to a device
          function(innerCallback){
            var device = new DeviceModel({
              macAddress : "123456654321",
              deviceType : "506de2fe8eebf7524342cb37",
              owner : self.user
            });
            device.save(function(err, deviceResult){
              should.not.exist(err);
              
              should.exist(deviceResult, 'newly created device should exist');

              deviceResult.owner.equals(self.user._id).should.equal(true, 'device should be paired to owner')

              self.gpi.pairWithDevice({
                deviceId : deviceResult._id
              },
              innerCallback
              )
            })
          }
        ],
        function(err, results){
          should.not.exist(err);

          var pairResult = results[0];

          // make sure we're using the updated gpi and device
          self.device = pairResult.device;
          self.gpi = pairResult.growPlanInstance;

          var immediateActionSettings = {
            growPlanInstance : self.gpi, 
            actionId : "506de2fb8eebf7524342cb28", // turn lights on
            immediateActionMessage : "You've requested to turn on your lights", 
            user : self.user,
            device : self.device
          };

          console.log('imm ac set', immediateActionSettings)

          ModelUtils.triggerImmediateAction(
            immediateActionSettings,
            function(err, results){
              should.not.exist(err);
              
              var now = new Date(),
                  immediateAction = results.immediateAction,
                  notification = results.notification;

              should.exist(immediateAction);
              should.exist(notification);
              
              // immediateAction
              // timeSent should be undefined (hasn't been sent yet)
              should.not.exist(immediateAction.timeSent);
              // timeRequested should be less than now
              immediateAction.timeRequested.should.be.below(now);
              // action should be settings.action
              getObjectId(immediateAction.action).equals(getObjectId(immediateActionSettings.actionId)).should.be.true;
              // done should not be true
              immediateAction.done.should.be.false;
              // message should be message
              immediateAction.message.should.equal(immediateActionSettings.immediateActionMessage);
              // growPlanInstance should be settings.growPlanInstance
              getObjectId(immediateAction.growPlanInstance).equals(getObjectId(immediateActionSettings.growPlanInstance)).should.be.true;
              // this growPlan has a 24-hour light cycle.
              // so this immediateAction of turning on the light should
              // expire with the next roll-around of the cycle, which 
              // means sometime in the next 24 hours
              immediateAction.expires.valueOf().should.be.below(now.valueOf() + (24 * 60 * 60 * 1000), "Should expire within 24 hours (duration of the growPlan's light cycle");



              // notification
              // growPlanInstance should be settings.growPlanInstance
              getObjectId(notification.growPlanInstance).equals(getObjectId(immediateActionSettings.growPlanInstance)).should.be.true;
              // message should be message of action
              notification.message.should.equal(i18nKeys.get('device action trigger message', immediateActionSettings.immediateActionMessage, "Turn lights on"));
              // since there's no device to automatically handle things, 
              // type should be actionneeded
              notification.type.should.equal(feBeUtils.NOTIFICATION_TYPES.INFO);
              // sentLogs should be empty array
              notification.sentLogs.should.be.empty;
              // timeToSend should be less than now
              notification.timeToSend.should.be.below(now);
              // users should include settings.user
              notification.users.should.include(immediateActionSettings.user._id.toString());
              // repeat shouldn't exist
              notification.repeat.should.not.have.property('repeatType');
              notification.repeat.should.not.have.property('duration');
              notification.repeat.should.not.have.property('timezone');
              notification.repeat.should.not.have.property('rt');
              notification.repeat.should.not.have.property('d');
              notification.repeat.should.not.have.property('tz');
              

              done();
            }
          );
        }
      );
    }); // /handles action control and a growPlanInstance with a device


    it("handles action control and an active growPlanInstance with a device", function(done){
      done();
    });

  });


  describe('.assignDeviceToUser', function(){
    /**
     * beforeEach Method
     *
     * Run before each test.
     * Create an active user.
     */
    beforeEach(function(done){
      var self = this;
      
      async.parallel(
        [
          function(innerCallback){
            User.createUserWithPassword(
              {
                email : 'unittest@bitponics.com',
                name : {
                  first : "Testfirstname",
                  last : "Testlastname"
                },
                locale: "en_US",
                active : true,
                activationToken : "1234567890",
                sentEmail : true
              },
              '8bitpass',
              function(err, user){
                self.user = user;
                innerCallback();
              }
            );
          },
          function(innerCallback){
            var device = new DeviceModel({
              macAddress : '123456123456'
            });
            device.save(function(err, deviceResult){
              self.device = device;
              innerCallback();  
            });
          }
        ],
        function(err, results){
          return done(err);
        }
      );
      
    });


    /*
     * afterEach method
     *
     * Run after each test.
     * Remove the test user.
     */
    afterEach(function(done){
      User.remove({email: 'unittest@bitponics.com'}, done);
    });


    it('assigns a device to a user and a user to the device', function(done){
      var self = this,
          user = self.user,
          device = self.device,
          deviceMacAddress = device.macAddress,
          availableDeviceKey = user.availableDeviceKey,
          publicDeviceKey = availableDeviceKey.public,
          device;

      

      ModelUtils.assignDeviceToUser(
        { 
          deviceMacAddress : deviceMacAddress, 
          user : user,
          publicDeviceKey : publicDeviceKey
        },
        function(err, result){
          should.not.exist(err);
          should.exist(result.user);
          should.exist(result.device);
          
          user.deviceKeys.some(
            function(deviceKey) { 
              return deviceKey.deviceId.equals(result.device._id);
            }
          ).should.equal(true, "user.deviceKeys contains a key assigned to device._id");

          result.device.owner.equals(result.user._id).should.equal(true, "device owner is user");   
          
          var now = new Date();
          
          result.device.userAssignmentLogs.some(
            function(userAssignment) { 
              return ((userAssignment.ts < now) && userAssignment.user.equals(result.user._id) && (userAssignment.assignmentType === DeviceUtils.ROLES.OWNER));
            }
          ).should.equal(true, "device.userAssignmentLogs contains a record of assigning the user as owner");

          done();
        }
      );


    });
  });
  /* /assignDeviceToUser */



});
