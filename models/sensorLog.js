var mongoose = require('mongoose'),
	mongooseTypes = require('mongoose-types'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

/**
 * SensorLog
 */
var SensorLogSchema = new Schema({
	gpi : { type : ObjectId, ref: 'GrowPlanInstance'},
	timestamp: { type: Date, required: true, default: Date.now },
	logs : [{
		/**
		 * sCode references to Sensor.code
		 */
		sCode: { type: String, ref: 'Sensor', required: true },
		value: { type: Number }
	}]
});

SensorLogSchema.index({ 'gpi timestamp': -1 });
SensorLogSchema.index({ 'logs.sCode': 1 });


exports.schema = SensorLogSchema;
exports.model = mongoose.model('SensorLog', SensorLogSchema);