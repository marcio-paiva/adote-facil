# Princípios e Padrões de Projeto

## Princípios SOLID aplicados no projeto(ou não utilizados)
Single Responsibility Principle:
    No projeto foi muito bem utilizado o Princípio da responsabilidade única, as classes criadas possuem apenas uma única função, sendo ela a mesma proposta pelo seu próprio título. Um exemplo de uso da Single Responsibility Principle é a classe de serviço create-animal, que possui apenas a finalidade de criar os animais. Outras classes tambem seguiam esse princípio, como create-user, get-available, entre outras.

    ex do código da classe create-animal: 

import { Animal } from '@prisma/client'
import { Either, Failure, Success } from '../../utils/either.js'
import {
  AnimalRepository,
  animalRepositoryInstance,
} from '../../repositories/animal.js'
import {
  AnimalImageRepository,
  animalImageRepositoryInstance,
} from '../../repositories/animal-image.js'

export namespace CreateAnimalDTO {
  export type Params = {
    name: string
    type: string
    gender: 'Macho' | 'Fêmea'
    race?: string
    description?: string
    userId: string
    pictures: Buffer[] // Array de buffers contendo os dados das imagens
  }

  export type Failure = { message: string }

  export type Success = { animal: Animal }

  export type Result = Either<Failure, Success>
}

export class CreateAnimalService {
  constructor(
    private readonly animalRepository: AnimalRepository,
    private readonly animalImageRepository: AnimalImageRepository,
  ) {}

  async execute(
    params: CreateAnimalDTO.Params,
  ): Promise<CreateAnimalDTO.Result> {
    const { name, type, gender, race, description, userId, pictures } = params

    const animal = await this.animalRepository.create({
      name,
      type,
      gender,
      race,
      description,
      userId,
    })

    if (!animal) {
      return Failure.create({ message: 'Erro ao criar o animal.' })
    }

    await Promise.all(
      pictures.map((picture) =>
        this.animalImageRepository.create({
          animalId: animal.id,
          imageData: picture,
        }),
      ),
    )

    return Success.create({ animal })
  }
}

export const createAnimalServiceInstance = new CreateAnimalService(
  animalRepositoryInstance,
  animalImageRepositoryInstance,
)


###
 Open/Closed Principle (Princípio Aberto/Fechado):
 O código não aparenta violar o princípio Aberto/Fechado, se for necessário modificações ou adicionar novas funcionalidades não é preciso modificar diretamente o código de uma classe existente, como na classe create-user, onde há utilização de abstrações.

 Exemplo do código: 
 export class CreateUserService {
  constructor(
    private readonly encrypter: Encrypter,
    private readonly userRepository: UserRepository,
  ) {}

###
Interface Segregation Principle
O sistema viola esse princípio. Quando o service create-animal depende do repositories animals e esse repositories possui métodos que o serviço não precisará usar ocorre a violação, como a dependecia do método de updateStatus.

Exemplo:
service/create-animal
import {
  AnimalRepository,
  animalRepositoryInstance,
} from '../../repositories/animal.js'
import {
  AnimalImageRepository,
  animalImageRepositoryInstance,
} from '../../repositories/animal-image.js'

repositores/animal
async updateStatus({
    id,
    status,
    userId,
  }: UpdateAnimalStatusRepositoryDTO.Params) {
    return this.repository.animal.update({
      where: { id, userId },
      data: { status },
    })
  }

###
Dependency Inversion Principle (Inversão de Dependência):
O código viola essa depedência quando é injetado diretamente uma classe concreta em vez de uma interface. Como pode-se observar no código abaixo, AnimalRepository é injetado diretamente, não há o uso de interface.

Exemplo do código: 
export class UpdateAnimalStatusService {
  constructor(private readonly animalRepository: AnimalRepository) {}

  async execute(
    params: UpdateAnimalStatusDTO.Params,
  ): Promise<UpdateAnimalStatusDTO.Result> {
    const { id, status, userId } = params

    const animal = await this.animalRepository.updateStatus({
      id,
      status,
      userId,
    })

    if (!animal) {
      return Failure.create({
        message: 'Erro ao atualizar o status do animal.',
      })
    }

    return Success.create({ animal })
  }
}


## Padrões de Projetos usados

Camada de Serviço:
A lógica de negócio está em uma camada a parte, chamada service, nela possui classes como create-animal, create-user, get-user entre outras.
Ex: CreateUserService, UpdateAnimalStatusService

Repository:
Possui encapsulamento da lógica do Banco de Dados e esconde detalhes da persistencia dos dados.
Ex: serRepository, animalRepository











