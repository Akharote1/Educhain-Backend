import mongoose from "mongoose";
import connection from '../services/database.js'


const studentSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true
	},
	uid: {
		type: String,
		minlength: 10,
		maxlength: 10
	},
	image: {
		type: String
	},
	phone_number: {
		type: String,
		required: false
	},
	branch: {
		type: String,
	},
	batch: {
		type: Number,
	},
	cgpa: {
		type: Number,
	}
})

export default connection.model('Student', studentSchema)