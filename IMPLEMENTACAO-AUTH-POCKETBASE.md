# Implementação de Autenticação com PocketBase no EntryModal

## ✅ Mudanças Implementadas

O `EntryModal` agora usa o SDK do PocketBase e adiciona o token de autenticação nas requisições para as APIs de entries e categorias.

## 🔐 Autenticação

### Import do PocketBase

```typescript
import pb from '../pocketbase'
```

### Obtenção do Token

```typescript
// Obter token de autenticação do PocketBase
const token = pb.authStore.token
```

### Requisições Autenticadas

#### Busca de Contas (Entries)

```typescript
const fetchContas = async () => {
  const entriesUrl = import.meta.env.VITE_GET_ENTRIES_URL
  if (!entriesUrl) {
    console.warn('VITE_GET_ENTRIES_URL não configurada')
    return
  }

  isLoadingContas.value = true
  try {
    // Obter token de autenticação do PocketBase
    const token = pb.authStore.token
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    // Adicionar token se estiver disponível
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(entriesUrl, {
      method: 'GET',
      headers
    })
    
    if (response.ok) {
      const data: GetEntriesResponse = await response.json()
      if (data.success && data.entries) {
        // Extrair contas únicas
        const contasSet = new Set<string>()
        data.entries.forEach(entry => {
          if (entry.conta && entry.conta.trim() !== '') {
            contasSet.add(entry.conta.trim())
          }
        })
        apiContas.value = Array.from(contasSet).sort()
        console.log(`✅ ${apiContas.value.length} contas únicas carregadas`)
      }
    } else {
      console.warn(`⚠️ Erro ao buscar contas: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.warn('⚠️ Erro ao buscar contas:', error)
  } finally {
    isLoadingContas.value = false
  }
}
```

#### Busca de Categorias

```typescript
const fetchCategorias = async () => {
  const categoriesUrl = import.meta.env.VITE_GET_CATEGORIES_URL
  if (!categoriesUrl) {
    console.warn('VITE_GET_CATEGORIES_URL não configurada')
    return
  }

  isLoadingCategorias.value = true
  try {
    // Obter token de autenticação do PocketBase
    const token = pb.authStore.token
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    // Adicionar token se estiver disponível
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(categoriesUrl, {
      method: 'GET',
      headers
    })
    
    if (response.ok) {
      const data: GetCategoriesResponse = await response.json()
      if (data.success && data.categories) {
        apiCategorias.value = data.categories
        console.log(`✅ ${apiCategorias.value.length} categorias carregadas`)
      }
    } else {
      console.warn(`⚠️ Erro ao buscar categorias: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.warn('⚠️ Erro ao buscar categorias:', error)
  } finally {
    isLoadingCategorias.value = false
  }
}
```

## 🔑 Características da Implementação

### 1. Uso do SDK do PocketBase
- Import do `pb` instância configurada
- Acesso ao `pb.authStore.token` para obter token JWT
- Sincronizado com estado de autenticação da aplicação

### 2. Headers de Autenticação
- `Content-Type: application/json` sempre enviado
- `Authorization: Bearer {token}` adicionado quando token está disponível
- Verificação condicional para casos sem autenticação

### 3. Tratamento de Erros
- Log de status HTTP quando requisição falha
- Warnings no console (não bloqueiam aplicação)
- Fallback para dados das props se APIs falharem

### 4. Compatibilidade
- Funciona com usuário autenticado (token presente)
- Funciona sem autenticação (token ausente, fallback para props)
- Funciona com login de teste (sessionStorage)

## 🔄 Fluxo de Autenticação

```
1. Usuário faz login via PocketBase
   ↓
2. Token JWT é armazenado em pb.authStore
   ↓
3. Usuário abre EntryModal
   ↓
4. Modal detecta abertura (watch)
   ↓
5. fetchContas() e fetchCategorias() são chamados
   ↓
6. Token é obtido de pb.authStore.token
   ↓
7. Token é incluído no header Authorization
   ↓
8. APIs validam token e retornam dados
   ↓
9. Autocomplete funciona com dados reais
```

## 📊 Cenários de Uso

### Cenário 1: Usuário Autenticado ✅
```
Token presente → Headers com Authorization → APIs retornam dados → Autocomplete completo
```

### Cenário 2: Usuário Não Autenticado ⚠️
```
Token ausente → Headers sem Authorization → APIs podem falhar → Fallback para props
```

### Cenário 3: Login de Teste ✅
```
sessionStorage com testLogin → Token pode não existir → Fallback funciona
```

### Cenário 4: Token Expirado ⚠️
```
Token expirado → APIs retornam 401 → Warning no console → Fallback para props
```

## 🧪 Como Testar

### 1. Teste com Autenticação
```bash
# 1. Faça login na aplicação
# 2. Faça upload de uma imagem
# 3. Clique em um cartão
# 4. Abra o console do navegador
# 5. Verifique os logs:
✅ 150 contas únicas carregadas
✅ 73 categorias carregadas
```

### 2. Teste sem Autenticação
```bash
# 1. Limpe o localStorage/sessionStorage
# 2. Recarregue a página
# 3. Faça upload de uma imagem
# 4. Clique em um cartão
# 5. Verifique os logs:
⚠️ Erro ao buscar contas: 401 Unauthorized
⚠️ Erro ao buscar categorias: 401 Unauthorized
# Autocomplete ainda funciona com dados das props
```

### 3. Verificar Token
```javascript
// No console do navegador:
import pb from './src/pocketbase'
console.log('Token:', pb.authStore.token)
console.log('Usuário:', pb.authStore.model)
console.log('Válido:', pb.authStore.isValid)
```

## 📝 Headers Enviados

### Com Autenticação
```http
GET /get-sheet-entries HTTP/1.1
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Sem Autenticação
```http
GET /get-sheet-entries HTTP/1.1
Content-Type: application/json
```

## 🔐 Segurança

### Boas Práticas Implementadas

1. **Token Condicional**: Só adiciona header Authorization se token existir
2. **HTTPS**: Recomendado para produção (protege token em trânsito)
3. **Não Expõe Erros**: Warnings no console, não mensagens ao usuário
4. **Fallback Gracioso**: Aplicação funciona mesmo sem APIs

### Considerações

- ⚠️ Token é enviado em plaintext no header (use HTTPS em produção)
- ⚠️ Token pode expirar (implementar refresh se necessário)
- ⚠️ APIs devem validar token no backend
- ⚠️ CORS deve estar configurado para aceitar header Authorization

## 📁 Arquivos Modificados

```
✅ src/components/EntryModal.vue
   - Import do pb (PocketBase)
   - Obtenção do token de pb.authStore
   - Headers com Authorization Bearer
   - Tratamento melhorado de erros HTTP
```

## 🎉 Resultado

Agora o EntryModal:

✅ **Usa SDK do PocketBase** para gerenciamento de autenticação
✅ **Envia token JWT** nas requisições para APIs
✅ **Funciona autenticado ou não** (graceful degradation)
✅ **Headers padronizados** com Content-Type e Authorization
✅ **Logs informativos** sobre sucesso e falhas
✅ **Compatível** com sistema de autenticação existente

---

**Status:** ✅ Implementado  
**Data:** 09/10/2025  
**Segurança:** Token JWT via Bearer Authentication
