import Faculty from "../models/Faculty.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export const list = async (req, res) => {

}

export const register = async (req, res) => {
  const user = await Faculty.findOne({email: req.body.email})

  if (user) {
    return res.status(400).json({
      success: false,
      message: "A faculty with that email already exists"
    })
  }

  const salt = await bcrypt.genSalt(10)
  const passwordHash = await bcrypt.hash(req.body.password, salt);

  const faculty = await Faculty.create({
    name: req.body.name,
    email: req.body.email,
    password_hash: passwordHash,
    phone_number: req.body.phone_number,
    publicAddress: req.body.publicAddress,
    nonce: Math.floor(Math.random() * 1000000),
    password: passwordHash
  })

  await faculty.save();

  res.status(200).json({
    success: true,
    faculty
  })
}

export const login = async (req, res) => {
  try {
    const user = await Faculty.findOne({email: req.body.email.toLowerCase()})

    if(!user) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect email'
      })
    }

    const result = await bcrypt.compare(req.body.password, user.password_hash)

    if (result == false) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password'
      })
    }

    const token = jwt.sign({
      email: user.email,
      id: user._id,
      admin: user.admin,
      login_time: Date.now()
    }, process.env.JWT_KEY)

    return res.status(200).json({
      success: true,
      token: token,
      user: user
    })

  } catch (err) {
    console.log(err)

    return res.status(500).json({
      success: false,
      message: 'An error occurred.'
    })
  }
}

export const getNonce = async (req, res) => {
  try {
    const user = await Faculty.findOne({publicAddress: req.body.publicAddress.toLowerCase()})

    if(!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid publicAddress'
      })
    }

    return res.status(200).json({
      success: true,
      nonce: user.nonce,
      publicAddress: user.publicAddress
    })

  } catch (err) {
    console.log(err)

    return res.status(500).json({
      success: false,
      message: 'An error occurred.'
    })
  }

}

export const blockchainLogin = async (req, res) => {
  try {
    const user = await Faculty.findOne({publicAddress: req.body.publicAddress.toLowerCase()})

    if(!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid publicAddress'
      })
    }

    const signature = req.body.signature;

    

    return res.status(200).json({
      success: true,
      token: token,
      user: user
    })

  } catch (err) {
    console.log(err)

    return res.status(500).json({
      success: false,
      message: 'An error occurred.'
    })
  }

}

export const verify = async (req, res) => {

}

export const getShort = async (req, res) => {
  const faculty = await Faculty.findOne({email: req.params.email}, "name email phone_number");

  if (!faculty) {
    return res.status(400).json({
      success: false,
      message: "Invalid email"
    })
  }

  res.status(200).json({
    success: true,
    faculty
  })
}