import { Request, Response } from 'express'

export abstract class BaseController {
  protected async execute(
    serviceCall: () => Promise<any>,
    response: Response
  ): Promise<Response> {
    try {
      const result = await serviceCall()
      const statusCode = result.isFailure() ? 400 : 201
      return response.status(statusCode).json(result.value)
    } catch (err) {
      const error = err as Error
      console.error('Controller error:', error)
      return response.status(500).json({ error: error.message })
    }
  }
}