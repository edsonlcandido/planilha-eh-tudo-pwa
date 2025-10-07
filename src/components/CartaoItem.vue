<script setup lang="ts">
import type { CartaoData } from '../types'

interface Props {
  cartao: CartaoData
}

defineProps<Props>()

// Função para formatar valor monetário
const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}
</script>

<template>
  <div class="cartao-item">
    <div class="cartao-header">
      <div class="cartao-valor" :class="{ 'negativo': cartao.valor < 0 }">
        {{ formatarValor(cartao.valor) }}
      </div>
      <div class="cartao-data">{{ cartao.data }}</div>
    </div>
    
    <div class="cartao-content">
      <div class="cartao-descricao">{{ cartao.descricao }}</div>
      <div class="cartao-conta">{{ cartao.conta }}</div>
      
      <div class="cartao-details">
        <div class="detail-item">
          <span class="label">Categoria:</span>
          <span class="value">{{ cartao.categoria }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Orçamento:</span>
          <span class="value">{{ cartao.orcamento }}</span>
        </div>
      </div>
      
      <div v-if="cartao.observacao" class="cartao-observacao">
        {{ cartao.observacao }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.cartao-item {
  background-color: var(--color-card-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.cartao-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.cartao-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.cartao-valor {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-secondary);
}

.cartao-valor.negativo {
  color: var(--color-accent);
}

.cartao-data {
  font-size: 0.875rem;
  color: var(--color-text-light);
  text-align: right;
}

.cartao-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cartao-descricao {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-dark);
}

.cartao-conta {
  font-size: 0.875rem;
  color: var(--color-text-light);
  font-weight: 500;
}

.cartao-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item .label {
  font-size: 0.75rem;
  color: var(--color-text-light);
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin-bottom: 0.25rem;
}

.detail-item .value {
  font-size: 0.875rem;
  color: var(--color-text-dark);
  font-weight: 500;
}

.cartao-observacao {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: var(--color-background-light);
  border-radius: 4px;
  font-size: 0.875rem;
  color: var(--color-text-light);
  line-height: 1.4;
}

/* Responsivo para telas menores */
@media (max-width: 640px) {
  .cartao-header {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .cartao-data {
    text-align: left;
  }
  
  .cartao-details {
    grid-template-columns: 1fr;
  }
}
</style>