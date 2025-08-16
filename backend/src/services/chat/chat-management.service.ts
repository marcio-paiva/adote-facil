import { ChatRepository } from '../../repositories/chat.js'
import { Either, Failure, Success } from '../../utils/either.js'

export class ChatManagementService {
  constructor(private readonly chatRepository: ChatRepository) {}

  async findOrCreateChat(
    senderId: string,
    receiverId: string
  ): Promise<Either<{ message: string }, { id: string }>> {
    try {
      const chat = await this.chatRepository.findOneByUsersId(senderId, receiverId)

      if (chat) {
        return Success.create({ id: chat.id })
      }

      const newChat = await this.chatRepository.create({
        user1Id: senderId,
        user2Id: receiverId,
      })

      return Success.create({ id: newChat.id })
    } catch (error) {
      return Failure.create({
        message: 'Failed to find or create chat',
      })
    }
  }
}

export const chatManagementServiceInstance = new ChatManagementService(
  chatRepositoryInstance
)