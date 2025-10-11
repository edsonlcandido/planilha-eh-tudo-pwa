# Implementação: Compartilhamento de Fotos com Análise Automática

## Objetivo

Implementar o processamento automático de fotos compartilhadas via o recurso de compartilhamento do celular no PWA instalado, usando o mesmo fluxo de análise e exibição de cartões que ocorre quando o upload é feito pela interface.

## Problema Original

Anteriormente, quando o usuário compartilhava uma foto via o recurso nativo de compartilhamento do celular para o PWA, a foto era apenas simulada como upload para um endpoint fictício (`/api/upload-file`). Não havia processamento real da imagem nem exibição dos cartões extraídos.

## Solução Implementada

A solução integra completamente o fluxo de compartilhamento (Share Target API) com o fluxo de análise de documentos existente no componente `UploadArea.vue`.

### Mudanças no `HomePage.vue`

#### 1. Novos Imports e Estados
```typescript
import CartaoItem from './CartaoItem.vue'
import type { CartaoData } from '../types'

const sharedCartoes = ref<CartaoData[]>([])
const uploadCollection = 'uploads'
const fileFieldName = 'file'
const webhookUrl = import.meta.env.VITE_WEBHOOK_URL
```

#### 2. Computed Property para User ID
```typescript
const currentUserId = computed(() => {
  const testLogin = sessionStorage.getItem('testLogin')
  if (testLogin === 'true') {
    return 'test-user-id'
  }
  return pb.authStore.model?.id || ''
})
```

#### 3. Funções de Processamento Reutilizadas

##### `processWebhookResponse()`
Processa a resposta do webhook e extrai os cartões, suportando múltiplos formatos de resposta:
- Array direto de cartões
- Objeto com propriedade `cartoes`
- Objeto com propriedade `data`

##### `mockBackendResponse()`
Fornece dados mockados para desenvolvimento e teste, retornando cartões de exemplo.

##### `deleteUploadedImage()`
Remove a imagem do PocketBase após o processamento bem-sucedido.

#### 4. Refatoração de `uploadSharedFile()`

A função agora implementa o fluxo completo:

**Modo Desenvolvimento/Teste:**
1. Simula tempo de processamento (2 segundos)
2. Retorna dados mockados
3. Exibe cartões processados

**Modo Produção:**
1. Faz upload do arquivo para PocketBase (collection `uploads`)
2. Obtém URL do arquivo uploadado
3. Envia para webhook de análise com payload:
   ```json
   {
     "upload-uri": "url_do_arquivo",
     "record-id": "id_do_registro"
   }
   ```
4. Processa resposta do webhook
5. Extrai e armazena cartões
6. Remove arquivo do PocketBase
7. Exibe cartões na interface

#### 5. Atualização do Template

Adicionada seção para exibir cartões processados:

```vue
<div v-if="sharedCartoes.length > 0" class="shared-cartoes-section">
  <h4 class="shared-cartoes-heading">Cartões Processados:</h4>
  <div class="cartoes-list">
    <CartaoItem 
      v-for="(cartao, index) in sharedCartoes" 
      :key="index" 
      :cartao="cartao"
    />
  </div>
</div>
```

#### 6. Novos Estilos CSS

```css
.shared-cartoes-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px dashed var(--color-border);
}

.shared-cartoes-heading {
  font-size: 1rem;
  font-weight: bold;
  color: var(--color-text-dark);
  margin-bottom: 1rem;
}

.cartoes-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
```

## Fluxo de Funcionamento

### 1. Usuário Compartilha Foto
- Usuário seleciona uma foto no celular
- Usa o recurso "Compartilhar" do sistema operacional
- Seleciona o PWA "Planilha Eh Tudo" como destino

### 2. PWA Recebe o Arquivo
- Web Share Target API captura o arquivo compartilhado
- `handleLaunchParams()` é chamado com os arquivos
- Arquivo é adicionado ao array `sharedFiles`
- `uploadSharedFile()` é automaticamente chamado

### 3. Processamento
**Em Desenvolvimento:**
- Mostra "Analisando documento..."
- Aguarda 2 segundos
- Retorna dados mockados (2-3 cartões exemplo)

**Em Produção:**
- Upload para PocketBase
- Envio para webhook de análise
- Processamento pela IA
- Extração de dados dos cartões

### 4. Exibição de Resultados
- Cartões são armazenados em `sharedCartoes`
- Componentes `CartaoItem` renderizam cada cartão
- Usuário vê os mesmos detalhes: data, conta, valor, descrição, categoria, etc.
- Mensagem de sucesso: "X cartão(ões) criado(s) com sucesso!"

## Compatibilidade

### Navegadores com Suporte à Share Target API
- Chrome/Edge (Android)
- Safari (iOS) - com limitações
- Firefox (Android) - experimental

### Fallback
Para navegadores que não suportam a Launch Queue API, o código implementa um fallback usando parâmetros de URL.

## Benefícios da Implementação

1. **Experiência Consistente**: Mesmo comportamento entre upload manual e compartilhamento
2. **Reutilização de Código**: Usa as mesmas funções de processamento já testadas
3. **Suporte a Desenvolvimento**: Mock automático em modo dev/teste
4. **Feedback Visual**: Estados claros de upload, análise e sucesso/erro
5. **Limpeza Automática**: Remove arquivos temporários do PocketBase após processamento

## Testes

### Modo Desenvolvimento
```bash
npm run dev
```
- Login com `test@test.com` / `test123`
- Compartilhamento de arquivo retorna dados mockados
- Cartões são exibidos automaticamente

### Modo Produção
```bash
npm run build
npm run preview
```
- Requer PWA instalado em dispositivo móvel
- Requer webhook configurado em `VITE_WEBHOOK_URL`
- Requer PocketBase acessível

## Variáveis de Ambiente Necessárias

```env
VITE_WEBHOOK_URL=https://seu-webhook.com/endpoint
```

## Próximos Passos Sugeridos

1. Adicionar suporte para múltiplos arquivos compartilhados simultaneamente
2. Implementar feedback de progresso mais detalhado durante análise
3. Adicionar opção de reprocessamento de arquivos com erro
4. Implementar cache local de cartões processados
5. Adicionar botão para compartilhar cartões processados
