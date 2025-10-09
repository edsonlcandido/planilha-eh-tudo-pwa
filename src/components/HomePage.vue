<script setup lang="ts">
import HelloWorld from './HelloWorld.vue'
import { useRouter } from 'vue-router'
import pb from '../pocketbase' // Import PocketBase instance
import { ref, onMounted, onUnmounted } from 'vue'
import UploadArea from './UploadArea.vue'

const router = useRouter()

// PWA Install related states
const deferredPrompt = ref<any>(null)
const showInstallButton = ref(false)

// Share Target related states
const sharedTitle = ref('')
const sharedText = ref('')
const sharedUrl = ref('')
const sharedFiles = ref<File[]>([])
const uploadResponse = ref<any>(null)
const uploadError = ref<string | null>(null)
const uploading = ref(false)
const isLoading = ref(true)

const logout = () => {
  pb.authStore.clear()
  sessionStorage.removeItem('testLogin')
  router.push('/login')
}

// Verificação da validade do token
const verificarToken = async () => {
  isLoading.value = true
  
  try {
    // Primeiro verifica se há um login de teste no sessionStorage
    const testLogin = sessionStorage.getItem('testLogin')
    if (testLogin === 'true') {
      console.log('Login de teste válido')
      isLoading.value = false
      return
    }
    
    // Verifica se há um token na auth store
    if (!pb.authStore.token) {
      // Se não há token, redireciona para login
      throw new Error('Token não encontrado')
    }
    
    // Verifica se o token é válido fazendo uma requisição ao PocketBase
    // Podemos usar a função de obter o usuário atual, que falha se o token for inválido
    await pb.collection('users').authRefresh()
    
    // Se chegou aqui, o token é válido
    console.log('Token válido, usuário autenticado')
    isLoading.value = false
  } catch (error) {
    console.error('Erro na verificação do token:', error)
    // Token inválido ou erro na verificação - limpa o token e redireciona para login
    pb.authStore.clear()
    sessionStorage.removeItem('testLogin')
    router.push('/login')
  }
}

// PWA Install functions
const handleBeforeInstallPrompt = (e: Event) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault()
  // Stash the event so it can be triggered later
  deferredPrompt.value = e
  // Show the install button
  showInstallButton.value = true
}

const installPWA = async () => {
  if (!deferredPrompt.value) {
    return
  }

  // Show the install prompt
  deferredPrompt.value.prompt()

  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.value.userChoice

  console.log(`User response to the install prompt: ${outcome}`)

  // Clear the deferredPrompt so it can only be used once
  deferredPrompt.value = null
  showInstallButton.value = false
}

// --- Share Target Handling Logic ---

const uploadSharedFile = async (file: File) => {
  uploading.value = true
  uploadResponse.value = null
  uploadError.value = null

  const authToken = pb.authStore.token // Get token from PocketBase auth store
  if (!authToken) {
    uploadError.value = 'Authentication token not found. Please log in.'
    router.push('/login')
    uploading.value = false
    return
  }

  const formData = new FormData()
  formData.append('file', file) // Use 'file' as the field name for consistency

  try {
    // Simulate backend request to /api/upload-file
    // In a real scenario, this would be your actual PocketBase collection upload
    const response = await fetch('/api/upload-file', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        // 'Content-Type': 'multipart/form-data' - fetch sets this automatically with FormData
      },
      body: formData,
    })

    if (!response.ok) {
      let errorText = await response.text()
      try {
        const errorJson = JSON.parse(errorText)
        errorText = errorJson.message || errorText
      } catch (e) {
        // Not JSON, use plain text
      }
      throw new Error(`HTTP error! Status: ${response.status}. ${errorText}`)
    }

    const result = await response.json()
    uploadResponse.value = result
  } catch (error: any) {
    uploadError.value = `Failed to upload ${file.name}: ${error.message}`
    console.error('Upload error:', error)
  } finally {
    uploading.value = false
  }
}

const handleLaunchParams = async (launchParams: { files?: FileSystemFileHandle[], text?: string, url?: string, title?: string }) => {
  if (launchParams.files && launchParams.files.length > 0) {
    for (const fileHandle of launchParams.files) {
      const file = await fileHandle.getFile()
      sharedFiles.value.push(file)
    }
    // Auto-upload the first shared file for demonstration
    if (sharedFiles.value.length > 0) {
      await uploadSharedFile(sharedFiles.value[0])
    }
  }
  sharedText.value = launchParams.text || '';
  sharedUrl.value = launchParams.url || '';
  sharedTitle.value = launchParams.title || '';
};

onMounted(async () => {
  // Verificar token antes de continuar
  await verificarToken()
  
  // Handle PWA install prompt
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

  // Handle Web Share Target API data on component mount
  if ('launchQueue' in window && 'setConsumer' in (window as any).launchQueue) {
    (window as any).launchQueue.setConsumer(handleLaunchParams);
  } else {
    // Fallback for browsers not supporting Launch Queue API (e.g., direct URL share without files)
    const urlParams = new URLSearchParams(window.location.search);
    const launchParams: { [key: string]: any } = {};
    urlParams.forEach((value, key) => {
      launchParams[key] = value;
    });
    handleLaunchParams(launchParams as { text?: string, url?: string, title?: string });
  }
});

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})

const isSharedContentPresent = () => {
  return sharedTitle.value || sharedText.value || sharedUrl.value || sharedFiles.value.length > 0;
}

const getFilePreviewUrl = (file: File) => {
  if (file.type.startsWith('image/')) {
    return URL.createObjectURL(file);
  }
  return null;
};
</script>

<template>
  <div class="home-page">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Verificando autenticação...</p>
    </div>
    
    <template v-else>
      <h1 class="page-title">Bem vindo ao nosso app!</h1>
      <p class="page-description">Essa é nossa extensão para celular para poder enviar comprovantes e processar usando agentes de IA.</p>

      <!-- PWA Install Button -->
      <div v-if="showInstallButton" class="install-section">
        <button @click="installPWA" class="install-button">
          📱 Instalar App
        </button>
        <p class="install-description">Instale este aplicativo em seu dispositivo para uma melhor experiência!</p>
      </div>

      <UploadArea/>

      <!-- PWA Information Section -->
      <div class="pwa-info-section">
        <h3 class="pwa-info-title">💡 PWA Instalação</h3>
        <div class="pwa-info-content">
          <p>Este aplicativo é um Progressive Web App (PWA) e pode ser instalado em seu dispositivo!</p>
          <details class="install-instructions">
            <summary>Como instalar manualmente:</summary>
            <div class="instructions-content">
              <h4>🔹 Chrome/Edge (Desktop):</h4>
              <p>Procure o ícone de instalação (📱) na barra de endereços ou clique no menu de três pontos → "Instalar app"</p>

              <h4>🔹 Chrome/Edge (Mobile):</h4>
              <p>Toque no menu de três pontos → "Adicionar à tela inicial" ou "Instalar app"</p>

              <h4>🔹 Safari (iOS):</h4>
              <p>Toque no botão de compartilhamento (📤) → "Adicionar à Tela de Início"</p>

              <h4>🔹 Firefox:</h4>
              <p>Procure o prompt de instalação ou use "Adicionar à tela inicial" no menu</p>
            </div>
          </details>
        </div>
      </div>

      <div v-if="isSharedContentPresent()" class="shared-content-card">
        <h3 class="shared-content-title">Conteúdo Compartilhado Recebido!</h3>

        <p v-if="sharedTitle"><strong>Título:</strong> {{ sharedTitle }}</p>
        <p v-if="sharedText"><strong>Texto:</strong> {{ sharedText }}</p>
        <p v-if="sharedUrl"><strong>URL:</strong> <a :href="sharedUrl" target="_blank" class="shared-link">{{ sharedUrl
            }}</a></p>

        <div v-if="sharedFiles.length > 0" class="shared-files-section">
          <h4 class="shared-files-heading">Arquivos Compartilhados:</h4>
          <ul class="file-list">
            <li v-for="file in sharedFiles" :key="file.name" class="file-item">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-type">({{ file.type }})</span>
              <img v-if="getFilePreviewUrl(file)" :src="getFilePreviewUrl(file)!" alt="File preview"
                class="file-preview-image" />
              <span v-else-if="file.type === 'application/pdf'" class="file-icon">📄 PDF</span>
              <span v-else class="file-icon">📁 File</span>
            </li>
          </ul>

          <div v-if="uploading" class="upload-status-message upload-progress">
            Enviando arquivo...
          </div>
          <div v-else-if="uploadResponse" class="upload-status-message upload-success">
            Upload realizado com sucesso! <br /> {{ uploadResponse }}
          </div>
          <div v-else-if="uploadError" class="upload-status-message upload-error">
            Erro no upload: <br /> {{ uploadError }}
          </div>
        </div>

        <p class="shared-feedback">Este conteúdo foi compartilhado com seu PWA!</p>
      </div>

      <hr class="separator" />
    </template>
  </div>
</template>

<style scoped>
.home-page {
  padding: 1.5rem 1rem;
  max-width: 800px;
  /* Constrain content width */
  margin: 0 auto;
  position: relative;
  min-height: 200px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  margin-bottom: 16px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid var(--color-primary);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.page-title {
  font-size: 1.75rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: var(--color-text-dark);
}

.page-description {
  margin-bottom: 1.5rem;
  color: var(--color-text-light);
}

.install-section {
  background-color: var(--color-card-background);
  border: 2px solid var(--color-primary);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.install-button {
  background-color: var(--color-primary);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.install-button:hover {
  background-color: var(--color-hover-blue);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
}

.install-button:active {
  transform: translateY(0);
}

.install-description {
  margin-top: 0.75rem;
  color: var(--color-text-light);
  font-size: 0.95rem;
}

.pwa-info-section {
  background-color: var(--color-background-light);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.pwa-info-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-dark);
  margin-bottom: 1rem;
}

.pwa-info-content>p {
  color: var(--color-text-light);
  margin-bottom: 1rem;
}

.install-instructions {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 1rem;
  background-color: var(--color-card-background);
}

.install-instructions summary {
  font-weight: 600;
  color: var(--color-primary);
  cursor: pointer;
  padding: 0.5rem;
  user-select: none;
}

.install-instructions summary:hover {
  color: var(--color-hover-blue);
}

.instructions-content {
  margin-top: 1rem;
  padding: 0 0.5rem;
}

.instructions-content h4 {
  color: var(--color-text-dark);
  font-size: 1rem;
  margin: 1rem 0 0.5rem 0;
}

.instructions-content h4:first-child {
  margin-top: 0;
}

.instructions-content p {
  color: var(--color-text-light);
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.shared-content-card {
  background-color: var(--color-card-background);
  border: 1px solid var(--color-border);
  border-left: 5px solid var(--color-primary);
  /* Highlight with primary color */
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.shared-content-title {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.shared-link {
  color: var(--color-primary);
  text-decoration: underline;
}

.shared-files-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--color-border);
}

.shared-files-heading {
  font-size: 1rem;
  font-weight: bold;
  color: var(--color-text-dark);
  margin-bottom: 0.75rem;
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-background-light);
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  border: 1px solid var(--color-border);
}

.file-name {
  font-weight: 500;
  color: var(--color-text-dark);
}

.file-type {
  font-size: 0.875rem;
  color: var(--color-text-light);
}

.file-icon {
  font-size: 1rem;
}

.file-preview-image {
  max-width: 80px;
  max-height: 80px;
  border-radius: 4px;
  object-fit: cover;
  margin-left: auto;
  border: 1px solid var(--color-border);
}

.upload-status-message {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 4px;
  font-weight: 500;
}

.upload-progress {
  background-color: #e0f2fe;
  /* Light blue */
  color: #1e40af;
  /* Dark blue */
}

.upload-success {
  background-color: #d1fae5;
  /* Light green */
  color: #065f46;
  /* Dark green */
}

.upload-error {
  background-color: #fee2e2;
  /* Light red */
  color: #991b1b;
  /* Dark red */
}

.shared-feedback {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: var(--color-text-light);
}

.separator {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 2rem 0;
}

/* Responsive adjustments */
@media (min-width: 768px) {
  .home-page {
    padding: 2rem;
  }

  .page-title {
    font-size: 2.25rem;
  }
}
</style>
