import mongoose from "mongoose";
import connection from '../services/database.js'

const examResultSchema = new mongoose.Schema({
	students_batch: {
		type: String,
		required: true
	},
	students_branch: {
		type: String,
		required: true
	},
	semester_number: {
		type: Number,
		required: true,
		min: 1,
		max: 8
	},
	year: {
		type: Number,
		required: true
	},
	semester: {
		type: String,
		required: true,
		enum: ['odd', 'even']
	},
	courses: [{
		type: mongoose.SchemaTypes.ObjectId,
		ref: "Course"
	}],
	status: {
		type: String,
		required: true,
		enum: ['draft', 'declared'],
		default: 'draft'
	},
	generated_at: mongoose.SchemaTypes.Date,
	result_data: [{
		uid: {
			type: String,
			required: true
		},
		name: {
			type: String,
			required: true
		},
		sgpa: {
			type: Number,
			required: true,
			default: 0
		},
		cgpa: {
			type: Number,
			required: true,
			default: 0
		},
		failed: {
			type: Boolean,
			required: true,
			default: false
		},
		courses: {
			type: mongoose.SchemaTypes.Map
		}
	}]
})

export default connection.model('ExamResult', examResultSchema)