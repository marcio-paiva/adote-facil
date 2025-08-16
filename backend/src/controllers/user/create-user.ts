import { Request, Response } from 'express'
import { BaseController } from '../base-controller'
import {
  CreateUserService,
  createUserServiceInstance,
} from '../../services/user/create-user'

class CreateUserController extends BaseController {
  constructor(private readonly createUser: CreateUserService) {
    super()
  }

  async handle(request: Request, response: Response): Promise<Response> {
    const { name, email, password } = request.body
    return this.execute(
      () => this.createUser.execute({ name, email, password }),
      response
    )
  }
}

export const createUserControllerInstance = new CreateUserController(
  createUserServiceInstance
)