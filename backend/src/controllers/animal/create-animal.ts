import { Request, Response } from 'express'
import { BaseController } from '../base-controller'
import {
  CreateAnimalService,
  createAnimalServiceInstance,
} from '../../services/animal/create-animal'

class CreateAnimalController extends BaseController {
  constructor(private readonly createAnimal: CreateAnimalService) {
    super()
  }

  async handle(request: Request, response: Response): Promise<Response> {
    const { name, type, gender, race, description } = request.body
    const { user } = request
    const pictures = request.files as Express.Multer.File[]
    const pictureBuffers = pictures.map((file) => file.buffer)

    return this.execute(
      () =>
        this.createAnimal.execute({
          name,
          type,
          gender,
          race,
          description,
          userId: user?.id || '',
          pictures: pictureBuffers,
        }),
      response
    )
  }
}

export const createAnimalControllerInstance = new CreateAnimalController(
  createAnimalServiceInstance
)