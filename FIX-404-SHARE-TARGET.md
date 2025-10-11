# Fix: Erro 404 ao Compartilhar no PWA Instalado

## Problema Relatado

Ao tentar compartilhar uma foto via o recurso nativo de compartilhamento do celular para o PWA instalado em `https://eh-tudo-planilha-pwa.aiyfgd.easypanel.host/pwa/`, o usuário recebia o erro:

```
Não foi possível encontrar a página
HTTP ERROR 404
```

## Análise do Problema

### Root Cause

O Share Target API estava configurado para usar método `POST`:

```javascript
share_target: {
  action: './',
  method: 'POST',
  enctype: 'multipart/form-data',
  params: {
    title: 'title',
    text: 'text',
    url: 'url',
    files: [...]
  }
}
```

Quando o usuário compartilha conteúdo, o navegador faz uma requisição POST para a URL do `action` (que resolve para `/pwa/`).

**O problema**: Este é um SPA (Single Page Application) que só responde a requisições GET. Não há endpoint POST configurado, então o servidor retorna 404.

### Por Que POST?

O método POST é necessário quando o Share Target recebe arquivos (imagens, PDFs, etc.), pois:
- GET não suporta upload de arquivos
- multipart/form-data requer POST
- É o padrão da especificação Web Share Target Level 2

## Solução Implementada

### 1. Service Worker Customizado

Criado arquivo `src/sw.js` que intercepta requisições POST do Share Target:

```javascript
// Service worker intercepta POST para share target
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  if (event.request.method === 'POST' && url.pathname === '/pwa/') {
    event.respondWith(
      (async () => {
        // 1. Extrai form data
        const formData = await event.request.formData()
        const file = formData.get('file')
        const title = formData.get('title')
        const text = formData.get('text')
        const url = formData.get('url')

        // 2. Armazena no Cache API
        const cache = await caches.open('share-target-cache')
        await cache.put(
          new Request('/pwa/shared-data'),
          new Response(JSON.stringify({...}))
        )
        
        if (file) {
          await cache.put(
            new Request(`/pwa/shared-file-${timestamp}`),
            new Response(file)
          )
        }

        // 3. Redireciona para a aplicação
        return Response.redirect('/pwa/?share=true', 303)
      })()
    )
  }
})
```

**Como funciona:**
1. Intercepta POST request do Share Target
2. Extrai o FormData (arquivo + metadados)
3. Armazena tudo no Cache API do navegador
4. Redireciona (HTTP 303) para `/pwa/?share=true`
5. A aplicação abre com o parâmetro `share=true`

### 2. Configuração do VitePWA

Alterado `vite.config.js` para usar service worker customizado:

```javascript
VitePWA({
  registerType: 'autoUpdate',
  strategies: 'injectManifest',  // ← Permite SW customizado
  srcDir: 'src',
  filename: 'sw.js',
  devOptions: {
    enabled: true,
    type: 'module',
  },
  manifest: {
    // ... configuração do manifest permanece igual
  }
})
```

**Mudança chave**: De `generateSW` (padrão) para `injectManifest`, que permite incluir lógica customizada no service worker.

### 3. Atualização do HomePage.vue

Adicionado código para recuperar dados compartilhados do cache:

```typescript
onMounted(async () => {
  // ... código existente ...
  
  // Detecta compartilhamento
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('share') === 'true') {
    try {
      // 1. Recupera dados do cache
      const cache = await caches.open('share-target-cache')
      const response = await cache.match('/pwa/shared-data')
      const shareData = await response.json()
      
      // 2. Define estados
      sharedTitle.value = shareData.title
      sharedText.value = shareData.text
      sharedUrl.value = shareData.url
      
      // 3. Recupera arquivo
      if (shareData.file) {
        const fileResponse = await cache.match(`/pwa/shared-file-${shareData.timestamp}`)
        const blob = await fileResponse.blob()
        const file = new File([blob], fileName, { type: blob.type })
        sharedFiles.value = [file]
        
        // 4. Processa automaticamente
        await uploadSharedFile(file)
      }
      
      // 5. Limpa cache
      await cache.delete('/pwa/shared-data')
      await cache.delete(`/pwa/shared-file-${shareData.timestamp}`)
    } catch (error) {
      console.error('Error retrieving shared data:', error)
    }
    
    // 6. Limpa URL
    window.history.replaceState({}, '', '/pwa/')
  }
})
```

## Fluxo Completo da Solução

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuário compartilha foto do celular                      │
│    Seleciona "Planilha Eh Tudo" como destino                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Navegador envia POST para /pwa/ (Share Target)           │
│    Content-Type: multipart/form-data                        │
│    Body: file, title, text, url                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Service Worker intercepta POST                           │
│    - Extrai FormData                                         │
│    - Armazena no Cache API                                   │
│    - Retorna Response.redirect('/pwa/?share=true', 303)     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Navegador segue redirect GET /pwa/?share=true            │
│    SPA carrega normalmente (GET funciona!)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. HomePage.vue monta e detecta ?share=true                 │
│    - Recupera dados do Cache API                            │
│    - Reconstrói o File object                               │
│    - Chama uploadSharedFile()                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Processamento normal continua                            │
│    - Upload para PocketBase                                 │
│    - Análise via webhook                                    │
│    - Exibição de cartões                                    │
│    - Limpeza de arquivos temporários                        │
└─────────────────────────────────────────────────────────────┘
```

## Por Que Esta Solução Funciona

1. **Não requer endpoint POST no servidor**: O service worker intercepta no lado do cliente
2. **Compatível com SPA**: Converte POST → armazenamento → GET redirect
3. **Preserva dados do arquivo**: Cache API armazena o arquivo completo
4. **Padrão da Web**: Segue especificação Web Share Target Level 2
5. **Funciona offline**: Cache API disponível mesmo sem rede

## Alternativas Consideradas (e por que não foram usadas)

### ❌ Alternativa 1: Criar endpoint POST no servidor
**Problema**: Requer backend dinâmico, não funciona com hospedagem estática

### ❌ Alternativa 2: Usar método GET no Share Target
**Problema**: GET não suporta upload de arquivos (files param)

### ❌ Alternativa 3: Configurar server-side redirect
**Problema**: Ainda requer backend dinâmico, perda de dados do arquivo

### ✅ Solução escolhida: Service Worker + Cache API
**Vantagens**: 
- Funciona com hospedagem estática
- Suporta arquivos
- Totalmente client-side
- Padrão da plataforma web

## Testes

### Pré-requisitos
- PWA instalado no dispositivo móvel
- URL: `https://eh-tudo-planilha-pwa.aiyfgd.easypanel.host/pwa/`

### Passo a passo
1. Abrir galeria de fotos no celular
2. Selecionar uma imagem
3. Tocar em "Compartilhar"
4. Selecionar "Planilha Eh Tudo" / "Planiha"
5. ✅ PWA abre (não mais 404!)
6. ✅ Imagem é processada automaticamente
7. ✅ Cartões são exibidos

## Debugging

Se ainda ocorrer erro 404, verificar:

1. **Service Worker registrado?**
   ```javascript
   // No DevTools Console
   navigator.serviceWorker.getRegistrations()
   ```

2. **Cache contém dados?**
   ```javascript
   // No DevTools Console
   caches.open('share-target-cache').then(cache => cache.keys())
   ```

3. **POST sendo interceptado?**
   - Abrir DevTools → Application → Service Workers
   - Ver se "fetch" event está sendo disparado

4. **Build correto?**
   ```bash
   # Verificar se src/sw.js foi incluído
   grep -c "share-target-cache" pwa/sw.js
   # Deve retornar > 0
   ```

## Referências

- [Web Share Target API - MDN](https://developer.mozilla.org/en-US/docs/Web/Manifest/share_target)
- [Web Share Target Level 2](https://w3c.github.io/web-share-target/)
- [Workbox - injectManifest](https://developer.chrome.com/docs/workbox/modules/workbox-build/#type-injectManifest)
- [Cache API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Cache)

## Commits Relacionados

- `799c518` - Corrigir erro 404 ao compartilhar conteúdo - implementar interceptação POST no service worker
- `0b6e239` - Implementar processamento de fotos compartilhadas com análise e exibição de cartões
