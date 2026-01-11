import { matchedData } from 'express-validator'
import UserModel from '../models/User.model.js'

class UserController {
  async getAllUsers(req, res) {
    const { parentId, campId, role, hasPaid } = req.query
    const filter = {}

    if (parentId) filter.parent = parentId
    if (campId) filter.camps = { $in: [campId] }
    if (role) filter.role = role
    if (hasPaid !== undefined) filter['participationInfo.hasPaid'] = hasPaid === 'true'

    const users = await UserModel.find(filter)

    res.status(200).json(users)
  }

  async getOneUser(req, res) {
    const user = await UserModel.findById(req.params.id)

    if (!user) {
      const error = new Error('User not found')
      error.status = 404
      throw error
    }

    res.status(200).json(user)
  }

  async createUser(req, res) {
    const data = matchedData(req)
    const newUser = await UserModel.create(data)
    res.status(201).json(newUser)
  }

  async updateUser(req, res) {
    const data = matchedData(req)
    const updatedUser = await UserModel.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true
    })

    if (!updatedUser) {
      const error = new Error('User not found')
      error.status = 404
      throw error
    }

    res.status(200).json(updatedUser)
  }

  async deleteUser(req, res) {
    const deletedUser = await UserModel.findByIdAndDelete(req.params.id)

    if (!deletedUser) {
      const error = new Error('User not found')
      error.status = 404
      throw error
    }

    res.status(200).json({ message: 'User successfully deleted', user: deletedUser })
  }
}

export default new UserController()
