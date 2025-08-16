import { UserMessage } from '@prisma/client'
import {
  UserMessageRepository,
  userMessageRepositoryInstance,
} from '../../repositories/user-message.js'
import { Either, Failure, Success } from '../../utils/either.js'
import {
  ChatManagementService,
  chatManagementServiceInstance,
} from './chat-management.service'

export namespace CreateUserChatMessageDTO {
  export type Params = {
    senderId: string
    receiverId: string
    content: string
  }

  export type Failure = { message: string }
  export type Success = UserMessage
  export type Result = Either<Failure, Success>
}

export class CreateUserChatMessageService {
  constructor(
    private readonly chatService: ChatManagementService,
    private readonly userMessageRepository: UserMessageRepository,
  ) {}

  async execute(
    params: CreateUserChatMessageDTO.Params,
  ): Promise<CreateUserChatMessageDTO.Result> {
    const { senderId, receiverId, content } = params

    if (senderId === receiverId) {
      return Failure.create({ message: 'Sender id is equal to receiver id' })
    }

    const chatResult = await this.chatService.findOrCreateChat(senderId, receiverId)

    if (chatResult.isFailure()) {
      return Failure.create(chatResult.value)
    }

    try {
      const message = await this.userMessageRepository.create({
        chatId: chatResult.value.id,
        senderId,
        content,
      })

      return Success.create(message)
    } catch (error) {
      return Failure.create({
        message: 'Failed to create message',
      })
    }
  }
}

export const createUserChatMessageServiceInstance =
  new CreateUserChatMessageService(
    chatManagementServiceInstance,
    userMessageRepositoryInstance,
  )