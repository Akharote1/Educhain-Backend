import mongoose from "mongoose";
import connection from '../services/database.js'

const facultySchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true
	},
	password_hash: {
		type: String,
		required: true
	},
	image: {
		type: String
	},
	admin: {
		type: Boolean,
		required: true,
		default: false
	},
	phone_number: {
		type: String,
		required: false
	},
	courses: [{
		type: mongoose.SchemaTypes.ObjectId,
		ref: "Course"
	}],
	nonce: {
		type: Number,
		required: false
	},
	publicAddress: {
		type: String,
		required: false
	}
})

export default connection.model('Faculty', facultySchema)