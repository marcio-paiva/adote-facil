'use client'

import * as Dialog from '@radix-ui/react-dialog'

import { Button } from '@/components/Button'
import { AnimalCard } from '@/components/AnimalCard'
import { EmptyAnimals } from '@/components/EmptyAnimals'
import { DefaultDialog } from '@/components/DefaultDialog'

import * as S from './AvailableAnimalsPage.styles'
import { useContext, useEffect, useState } from 'react'
import { getCookie } from 'cookies-next'
import { getAvailableAnimals } from '@/api/get-available-animals'
import { AnimalsContext } from '@/contexts/animals'
import {
  AnimalFilterForm,
  AnimalFilterFormData,
} from '@/components/AnimalFilterForm'

export function AvailableAnimalsPage() {
  const { availableAnimals, setAvailableAnimals } = useContext(AnimalsContext)
  const [filter, setFilter] = useState<AnimalFilterFormData | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

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

  const handleFilterAvailableAnimals = (data: AnimalFilterFormData) => {
    setFilter(data)
  }

  const handleRemoveFilters = () => {
    setFilter(null)
  }

  return (
    <S.Wrapper>
      <S.TitleWrapper>
        <h1>Animais disponíveis para adoção</h1>
        {(!!availableAnimals.length || filter) && (
          <S.FilterButtonsWrapper>
            {filter && (
              <Button onClick={handleRemoveFilters} buttonStyle="red-filled">
                Limpar filtros
              </Button>
            )}

            <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
              <Dialog.Trigger asChild>
                <Button onClick={() => setDialogOpen(true)}>Filtrar</Button>
              </Dialog.Trigger>
              <DefaultDialog>
                <Dialog.DialogTitle></Dialog.DialogTitle>
                <AnimalFilterForm
                  handleFilterAvailableAnimals={handleFilterAvailableAnimals}
                  closeDialog={() => setDialogOpen(false)}
                />
              </DefaultDialog>
            </Dialog.Root>
          </S.FilterButtonsWrapper>
        )}
      </S.TitleWrapper>
      {loading ? (
        <p>Carregando...</p>
      ) : availableAnimals.length ? (
        <S.AnimalsListWrapper>
          {availableAnimals.map((animal) => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              listType="animals-available-to-adopt"
            />
          ))}
        </S.AnimalsListWrapper>
      ) : (
        <EmptyAnimals page="animals-available-to-adopt" />
      )}
    </S.Wrapper>
  )
}
