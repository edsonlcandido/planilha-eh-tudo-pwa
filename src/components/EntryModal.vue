<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { CartaoData } from '../types'

interface Props {
  show: boolean
  cartao: CartaoData | null
  contas: string[]
  categorias: string[]
}

interface Emits {
  (e: 'close'): void
  (e: 'save', cartao: CartaoData): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Form data
const formData = ref<CartaoData>({
  data: '',
  conta: '',
  valor: 0,
  descricao: '',
  categoria: '',
  orcamento: '',
  observacao: ''
})

// Autocomplete states
const showContaAutocomplete = ref(false)
const showCategoriaAutocomplete = ref(false)
const contaInput = ref<HTMLInputElement | null>(null)
const categoriaInput = ref<HTMLInputElement | null>(null)

// Filtered options for autocomplete
const filteredContas = computed(() => {
  if (!formData.value.conta) return props.contas
  return props.contas.filter(conta => 
    conta.toLowerCase().includes(formData.value.conta.toLowerCase())
  )
})

const filteredCategorias = computed(() => {
  if (!formData.value.categoria) return props.categorias
  return props.categorias.filter(categoria => 
    categoria.toLowerCase().includes(formData.value.categoria.toLowerCase())
  )
})

// Watch for prop changes to update form data
watch(() => props.cartao, (newCartao) => {
  if (newCartao) {
    formData.value = { ...newCartao }
  }
}, { immediate: true })

// Handle autocomplete selection
const selectConta = (conta: string) => {
  formData.value.conta = conta
  showContaAutocomplete.value = false
}

const selectCategoria = (categoria: string) => {
  formData.value.categoria = categoria
  showCategoriaAutocomplete.value = false
}

// Handle form submission
const handleSubmit = () => {
  if (!formData.value.descricao || !formData.value.conta) {
    alert('Por favor, preencha os campos obrigatórios: Descrição e Conta')
    return
  }
  emit('save', formData.value)
}

// Handle modal close
const handleClose = () => {
  emit('close')
}

// Handle clicks outside autocomplete to close it
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (showContaAutocomplete.value && !target.closest('.autocomplete-container')) {
    showContaAutocomplete.value = false
  }
  if (showCategoriaAutocomplete.value && !target.closest('.autocomplete-container')) {
    showCategoriaAutocomplete.value = false
  }
}

// Format date input to match expected format
const formatDateForInput = (dateString: string): string => {
  // Espera "23/09/2025 15:02" e converte para "2025-09-23T15:02"
  if (!dateString) return ''
  
  const parts = dateString.split(' ')
  if (parts.length !== 2) return ''
  
  const dateParts = parts[0].split('/')
  if (dateParts.length !== 3) return ''
  
  return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${parts[1]}`
}

const formatDateForOutput = (dateString: string): string => {
  // Converte "2025-09-23T15:02" para "23/09/2025 15:02"
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

const formatOrcamentoForInput = (dateString: string): string => {
  // Espera "23/09/2025" e converte para "2025-09-23"
  if (!dateString) return ''
  
  const parts = dateString.split('/')
  if (parts.length !== 3) return ''
  
  return `${parts[2]}-${parts[1]}-${parts[0]}`
}

const formatOrcamentoForOutput = (dateString: string): string => {
  // Converte "2025-09-23" para "23/09/2025"
  if (!dateString) return ''
  
  const parts = dateString.split('-')
  if (parts.length !== 3) return ''
  
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

// Computed properties for date inputs
const dataInput = computed({
  get: () => formatDateForInput(formData.value.data),
  set: (value: string) => {
    formData.value.data = formatDateForOutput(value)
  }
})

const orcamentoInput = computed({
  get: () => formatOrcamentoForInput(formData.value.orcamento),
  set: (value: string) => {
    formData.value.orcamento = formatOrcamentoForOutput(value)
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click="handleClose" @mousedown="handleClickOutside">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">Editar Lançamento</h2>
          <button class="modal-close" @click="handleClose" aria-label="Fechar">
            ×
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-form">
          <!-- Data -->
          <div class="form-group">
            <label for="data" class="form-label">
              Data e Hora <span class="required">*</span>
            </label>
            <input
              type="datetime-local"
              id="data"
              v-model="dataInput"
              required
              class="form-input"
            />
          </div>

          <!-- Conta com Autocomplete -->
          <div class="form-group autocomplete-container">
            <label for="conta" class="form-label">
              Conta <span class="required">*</span>
            </label>
            <input
              type="text"
              id="conta"
              ref="contaInput"
              v-model="formData.conta"
              @focus="showContaAutocomplete = true"
              @input="showContaAutocomplete = true"
              required
              class="form-input"
              placeholder="Ex: NU PAGAMENTOS - IP"
              autocomplete="off"
            />
            <div v-if="showContaAutocomplete && filteredContas.length > 0" class="autocomplete-dropdown">
              <div
                v-for="conta in filteredContas"
                :key="conta"
                class="autocomplete-item"
                @click="selectConta(conta)"
              >
                {{ conta }}
              </div>
            </div>
          </div>

          <!-- Valor -->
          <div class="form-group">
            <label for="valor" class="form-label">
              Valor <span class="required">*</span>
            </label>
            <input
              type="number"
              id="valor"
              v-model.number="formData.valor"
              step="0.01"
              required
              class="form-input"
              placeholder="0.00"
            />
            <small class="form-hint">Use valores negativos para despesas</small>
          </div>

          <!-- Descrição -->
          <div class="form-group">
            <label for="descricao" class="form-label">
              Descrição <span class="required">*</span>
            </label>
            <input
              type="text"
              id="descricao"
              v-model="formData.descricao"
              required
              class="form-input"
              placeholder="Ex: CLINICA FRANCO PEGHINI LTDA"
            />
          </div>

          <!-- Categoria com Autocomplete -->
          <div class="form-group autocomplete-container">
            <label for="categoria" class="form-label">
              Categoria <span class="required">*</span>
            </label>
            <input
              type="text"
              id="categoria"
              ref="categoriaInput"
              v-model="formData.categoria"
              @focus="showCategoriaAutocomplete = true"
              @input="showCategoriaAutocomplete = true"
              required
              class="form-input"
              placeholder="Ex: Saúde, Alimentação, Outros"
              autocomplete="off"
            />
            <div v-if="showCategoriaAutocomplete && filteredCategorias.length > 0" class="autocomplete-dropdown">
              <div
                v-for="categoria in filteredCategorias"
                :key="categoria"
                class="autocomplete-item"
                @click="selectCategoria(categoria)"
              >
                {{ categoria }}
              </div>
            </div>
          </div>

          <!-- Orçamento -->
          <div class="form-group">
            <label for="orcamento" class="form-label">
              Orçamento <span class="required">*</span>
            </label>
            <input
              type="date"
              id="orcamento"
              v-model="orcamentoInput"
              required
              class="form-input"
            />
          </div>

          <!-- Observação -->
          <div class="form-group">
            <label for="observacao" class="form-label">
              Observação
            </label>
            <textarea
              id="observacao"
              v-model="formData.observacao"
              rows="3"
              class="form-input"
              placeholder="Observações adicionais (opcional)"
            ></textarea>
          </div>

          <!-- Botões de ação -->
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="handleClose">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  overflow-y: auto;
}

.modal-container {
  background-color: var(--color-card-background);
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  background-color: var(--color-card-background);
  z-index: 1;
}

.modal-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-dark);
}

.modal-close {
  background: none;
  border: none;
  font-size: 2rem;
  line-height: 1;
  color: var(--color-text-light);
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.modal-close:hover {
  color: var(--color-text-dark);
}

.modal-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
  position: relative;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--color-text-dark);
  font-size: 0.875rem;
}

.required {
  color: var(--color-accent);
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 1rem;
  color: var(--color-text-dark);
  background-color: var(--color-card-background);
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input::placeholder {
  color: var(--color-text-light);
}

textarea.form-input {
  resize: vertical;
  min-height: 80px;
}

.form-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-text-light);
}

/* Autocomplete styles */
.autocomplete-container {
  position: relative;
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--color-card-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  margin-top: 0.25rem;
}

.autocomplete-item {
  padding: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.autocomplete-item:hover {
  background-color: var(--color-background-light);
}

.autocomplete-item:not(:last-child) {
  border-bottom: 1px solid var(--color-border);
}

/* Modal actions */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-hover-blue);
}

.btn-secondary {
  background-color: var(--color-background-light);
  color: var(--color-text-dark);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background-color: var(--color-border);
}

/* Responsive */
@media (max-width: 640px) {
  .modal-overlay {
    padding: 0;
  }

  .modal-container {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-form {
    padding: 1rem;
  }

  .modal-title {
    font-size: 1.25rem;
  }

  .modal-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
