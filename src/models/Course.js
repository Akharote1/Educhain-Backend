import mongoose from "mongoose";
import connection from '../services/database.js'

const enrolledStudentSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true
  },
  name: {
    type: String
  },
  batch: {
    type: Number
  },
  branch: {
    type: String
  },
  student_id: {
    type: String
  },
  score_theory_ise: {
    type: Number
  },
  score_theory_mse: {
    type: Number
  },
  score_theory_ese: {
    type: Number
  },
  score_lab_ise: {
    type: Number
  },
  score_lab_mse: {
    type: Number
  },
  score_lab_ese: {
    type: Number
  },
  grade: {
    type: String,
    default: 'NP',
    enum: ['AA', 'AB', 'BB', 'BC', 'CC', 'CD', 'DD', 'FF', 'NG', 'NP', 'X'],
    required: true
  },
  flag_not_present: {
    type: Boolean,
    default: false,
    required: true
  },
  flag_defaulter: {
    type: Boolean,
    default: false,
    required: true
  },
})

const courseFacultySchema = new mongoose.Schema({
  name: {
    type: String
  },
  email: {
    type: String
  },
  faculty_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Faculty"
  }
})

const statisticsSchema = new mongoose.Schema({
  student_count: { type: Number, default: 0, required: true },
  mean_theory_ise: { type: Number, default: 0, required: true },
  mean_theory_mse: { type: Number, default: 0, required: true },
  mean_theory_ese: { type: Number, default: 0, required: true },
  mean_lab_ise: { type: Number, default: 0, required: true },
  mean_lab_mse: { type: Number, default: 0, required: true },
  mean_lab_ese: { type: Number, default: 0, required: true },
  mean_total: { type: Number, default: 0, required: true },
  median_total: { type: Number, default: 0, required: true },
})

const courseSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	course_code: {
		type: String,
		required: true
	},
  year: {
    type: Number,
    required: true
  },
  semester: {
    type: String,
    enum: ['odd', 'even'],
    required: true
  },
  credits_theory: {
    type: Number,
    required: true,
    default: 0
  },
  credits_lab: {
    type: Number,
    required: true,
    default: 0
  },
  weightage_theory_ise: {
    type: Number,
    required: true,
    default: 0
  },
  weightage_theory_mse: {
    type: Number,
    required: true,
    default: 0
  },
  weightage_theory_ese: {
    type: Number,
    required: true,
    default: 0
  },
  weightage_lab_ise: {
    type: Number,
    required: true,
    default: 0
  },
  weightage_lab_mse: {
    type: Number,
    required: true,
    default: 0
  },
  weightage_lab_ese: {
    type: Number,
    required: true,
    default: 0
  },
  statistics: {
    type: statisticsSchema,
    required: true,
    default: {
      student_count: 0,
      mean_theory_ise: 0,
      mean_theory_mse: 0,
      mean_theory_ese: 0,
      mean_lab_ise: 0,
      mean_lab_mse: 0,
      mean_lab_ese: 0,
      mean_total: 0,
      median_total: 0,
    }
  },
  enrolled_students: [enrolledStudentSchema],
  faculty: [courseFacultySchema],
  scores_locked: {
    type: Boolean,
    default: false,
    required: true
  },
  scores_locked_by: courseFacultySchema,
  scores_locked_at: mongoose.SchemaTypes.Date,
  sa_score: {
    type: Number,
    default: null
  },
  grades_locked: {
    type: Boolean,
    default: false,
    required: true
  },
  grades_locked_by: courseFacultySchema,
  grades_locked_at: mongoose.SchemaTypes.Date,
  course_type: {
    type: String,
    enum: ['core', 'open-elective', 'program-elective', 'seva-satva', 'project', 'hss'],
    required: true,
    default: 'core'
  }
})

export default connection.model('Course', courseSchema)