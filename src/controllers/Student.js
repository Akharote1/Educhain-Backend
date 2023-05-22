import Student from "./../models/Student.js"

export const list = async (req, res) => {
  const limit = req.query.limit ?? 100;
  const page = req.query.page ?? 1;
  const query = {};

  if (req.query.query && req.query.query != '') {
    query['$or'] = [
      {name: {$regex: req.query.query, $options: 'i'}},
      {uid: {$regex: req.query.query, $options: 'i'}},
      {email: {$regex: req.query.query, $options: 'i'}},
      {phone_number: {$regex: req.query.query, $options: 'i'}},
    ]
  } 

  if (req.query.branch != "all") {
    query.branch = req.query.branch;
  }

  if (req.query.batch != "all") {
    query.batch = req.query.batch;
  }

  const students = await Student.find(query).sort({uid: 1}).skip((page - 1) * limit).limit(limit);
  const count = await Student.count(query);

  res.status(200).json({
    pagination: {
      current_page: page,
      total_pages: Math.ceil(count / limit),
      total_count: count,
      limit,
      start: (page - 1) * limit + 1,
      end: Math.min(page * limit, count)
    },
    students
  })
}

export const getShort = async (req, res) => {
  const student = await Student.findOne({uid: req.params.uid}, "name email phone uid branch batch");

  if (!student) {
    return res.status(400).json({
      success: false,
      message: "Invalid UID"
    })
  }

  res.status(200).json({
    success: true,
    student
  })
}

export const get = async (req, res) => {
  try {
    
  } catch (error) {
    
  }
}

export const add = async (req, res) => {
  try {
    if (await Student.findOne({uid: req.body.uid})) {
      return res.status(400).send({
        success: false,
        message: "A Student with that UID already exists"
      })
    }

    const student = await Student.create({
      name: req.body.name,
      email: req.body.email,
      uid: req.body.uid,
      phone_number: req.body.phone_number,
      branch: req.body.branch,
      batch: req.body.batch,
    })

    return res.status(200).send({
      success: true,
      student
    })
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.toString()
    })
  }
}

export const bulkAdd = async (req, res) => {
  try {
    const students = req.body.students;
    const alreadyExistingStudent = await Student.findOne({uid: {$in: students.map(x => x.uid)}});

    if (alreadyExistingStudent) {
      return res.status(400).send({
        success: false,
        message: `A Student with UID ${alreadyExistingStudent.uid} already exists`
      })
    }

    const student = await Student.insertMany(students.map(x => (
      {
        name: x.name,
        email: x.email,
        uid: x.uid,
        phone_number: x.phone_number,
        branch: x.branch,
        batch: x.batch,
      }
    )))

    return res.status(200).send({
      success: true,
      student
    })
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.toString()
    })
  }
}

export const update = async (req, res) => {
  const student = await Student.findOne({uid: req.params.uid});

  if (!student) {
    return res.status(404).json({
      success: false,
      message: "Invalid UID"
    })
  }

  student.name = req.body.name ?? student.name;
  student.email = req.body.email ?? student.email;
  student.phone_number = req.body.phone_number ?? student.phone_number;
  student.branch = req.body.branch ?? student.branch;
  student.batch = req.body.batch ?? student.batch;
  await student.save();

  res.status(200).json({
    success: true,
    student
  })
}