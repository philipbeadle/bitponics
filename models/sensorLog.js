/**
 * @module models/SensorLog
 */

var mongoose = require('mongoose'),
    mongoosePlugins = require('../lib/mongoose-plugins'),
    Schema = mongoose.Schema,
    ObjectIdSchema = Schema.ObjectId,
    SensorLogModel,
    requirejs = require('../lib/requirejs-wrapper'),
    feBeUtils = requirejs('fe-be-utils'),
    mongooseConnection = require('../config/mongoose-connection').defaultConnection;


/**
 * SensorReading
 */
var SensorReadingSchema = new Schema({
	/**
	 * s references to Sensor.code
	 */
	s: { type: String, ref: 'Sensor', required: true },
	/**
	 * Value of the sensor reading
	 */
	v: { type: Number }
},
/**
 * Prevent the _id property since these will only ever be subdocs in SensorLog, don't need 
 * ObjectIds created on them
 */
{ _id : false, id : false } );

SensorReadingSchema.virtual('sCode')
	.get(function () {
	  return this.s;
	})
	.set(function (sensorCode){
		this.s = sensorCode;
	});

SensorReadingSchema.virtual('val')
	.get(function () {
	  return this.v;
	})
	.set(function(val){
		this.v = val;
	});


/**
 * SensorLog
 */
var SensorLogSchema = new Schema({
    /**
     * The GrowPlanInstance
     */
    gpi : { type : ObjectIdSchema, ref: 'GrowPlanInstance'},
    
  
  	/**
  	 * Device ID. Since it's not an ObjectId we don't get the free "populate" behavior of Mongoose, 
  	 * so we need to explicitly pass it ID for storage
  	 */
    d : { type : String, ref : 'Device'},


    /**
     * timestamp
     */
	  ts: { type: Date, required: true, default: Date.now },


    /**
     * logs
     */
    l : [ SensorReadingSchema ]
},
{ id : false });

SensorLogSchema.plugin(mongoosePlugins.recoverableRemove);

SensorLogSchema.virtual('logs')
	.get(function () {
	  return this.l;
	})
	.set(function(logs){
		this.l = logs;
	});

SensorLogSchema.virtual('deviceId')
  .get(function () {
    return this.d;
  })
  .set(function(deviceId){
    this.d = deviceId;
  });

SensorLogSchema.virtual('timestamp')
  .get(function () {
    return this.ts;
  })
  .set(function(timestamp){
    this.ts = timestamp;
  });


/*************** SERIALIZATION *************************/

/**
 * Remove the db-only-optimized property names and expose only the friendly names
 *
 * "Transforms are applied to the document and each of its sub-documents"
 * http://mongoosejs.com/docs/api.html#document_Document-toObject
 */
SensorLogSchema.set('toObject', {
  getters : true,
  transform : function(doc, ret, options){
    if (doc.schema === SensorReadingSchema){
      delete ret.s;
      delete ret.v;
    } else {
      // else we're operating on the parent doc (the SensorLog doc)
      delete ret.l;
      delete ret.ts;
      delete ret.d;
      delete ret.t;
    }
  }
});
SensorLogSchema.set('toJSON', {
  getters : true,
  transform : SensorLogSchema.options.toObject.transform
});
/*************** END SERIALIZATION *************************/


SensorLogSchema.index({ 'gpi' : 1,  'ts': -1 });

/**
 * @type {Schema}
 */
exports.schema = SensorLogSchema;

/**
 * @constructor
 * @alias module:models/SensorLog.SensorLogModel
 * @type {Model}
 */
exports.model = mongooseConnection.model('SensorLog', SensorLogSchema);