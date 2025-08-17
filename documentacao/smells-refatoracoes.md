Ferramentas como *SonarLint* e *ESlint* foram usadas. Dentre os codesmells apontados, foram escolhidos três.

1. Código de Debug Deixado em Produção: Trechos de código usados para testes ou logs que não foram removidos, poluindo o código em produção.
2. Código Duplicado: Repetição desnecessária de código, dificultando a manutenção e aumentando a chance de erros.
3. Violação do Princípio de Responsabilidade Única (SRP): Uma classe ou método que realiza múltiplas tarefas, tornando-o complexo e difícil de modificar.

## Code Smell 1: Código de Debug Deixado em Produção

### Localização
**Arquivo**: 
- `frontend\src\app\area_logada\animais_disponiveis\AvailableAnimalsPage.tsx`

### Smell Identificado
Presença de instruções de debug (console.log) que foram usadas durante o desenvolvimento mas permaneceram no código de produção.
Pode vazar informações sensíveis (ex. dados internos), polui os logs em ambientes de produção...

### Trecho do Código Original
```typescript
  useEffect(() => {
    const fetchAvailableAnimals = async () => {
      setLoading(true)
      const token = getCookie('token')

      const response = await getAvailableAnimals(filter, token || '')

      console.log(response)

      if (response.status === 200) {
        setAvailableAnimals(response.data.animals)
      }
      setLoading(false)
    }

    fetchAvailableAnimals()
  }, [setAvailableAnimals, filter])
```

### Refatoração Aplicada
Linha excluída

```typescript
  useEffect(() => {
    const fetchAvailableAnimals = async () => {
      setLoading(true)
      const token = getCookie('token')

      const response = await getAvailableAnimals(filter, token || '')

      if (response.status === 200) {
        setAvailableAnimals(response.data.animals)
      }
      setLoading(false)
    }

    fetchAvailableAnimals()
  }, [setAvailableAnimals, filter])
```

## Code Smell 2: Código Duplicado

### Localização
**Arquivos**: 
- `backend/src/controllers/user/create-user.ts`
- `backend/src/controllers/animal/create-animal.ts`

### Smell Identificado
Nos dois controllers, há um padrão repetido no tratamento de erros e lógica de status.

### Trecho do Código Original
```typescript
// create-user.ts
async handle(request: Request, response: Response): Promise<Response> {
  const { name, email, password } = request.body

  try {
    const result = await this.createUser.execute({ name, email, password })

    const statusCode = result.isFailure() ? 400 : 201

    return response.status(statusCode).json(result.value)
  } catch (err) {
    const error = err as Error
    console.log({ error })
    return response.status(500).json({ error: error.message })
  }
}

// create-animal.ts
async handle(request: Request, response: Response): Promise<Response> {
  const { name, type, gender, race, description } = request.body
  const { user } = request
  const pictures = request.files as Express.Multer.File[]

  try {
    const pictureBuffers = pictures.map((file) => file.buffer)

    const result = await this.createAnimal.execute({
      name,
      type,
      gender,
      race,
      description,
      userId: user?.id || '',
      pictures: pictureBuffers,
    })

    const statusCode = result.isFailure() ? 400 : 201

    return response.status(statusCode).json(result.value)
  } catch (err) {
    const error = err as Error
    console.error('Error creating animal:', error)
    return response.status(500).json({ error: error.message })
  }
}
```

### Refatoração Aplicada
Criado uma classe base BaseController que encapsule a lógica comum:

```typescript
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
```

### Controllers Refatorados
```typescript
// controllers/user/create-user.ts
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

// controllers/animal/create-animal.ts
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
```

## Code Smell 3: Violação do Princípio de Responsabilidade Única (SRP)

### Localização
**Arquivo**: 
- `backend\src\services\chat\create-user-chat-message.ts`

### Smell Identificado
A classe tem duas responsabilidades:
- Gerenciar a criação de mensagens
- Gerenciar a criação/find de chats

### Trecho do Código Original
```typescript
  private async findOrCreateChat(senderId: string, receiverId: string) {
    const chat = await this.chatRepository.findOneByUsersId(
      senderId,
      receiverId,
    )

    if (chat) return chat

    return this.chatRepository.create({
      user1Id: senderId,
      user2Id: receiverId,
    })
  }
```

### Refatoração Aplicada
Lógica de chat movida para um serviço separado (ChatManagementService).

```typescript
// ChatManagementService criado
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

//modificação em create-user-chat-message.ts
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
```
