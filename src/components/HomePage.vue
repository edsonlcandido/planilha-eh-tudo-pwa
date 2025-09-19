<script setup lang="ts">
import HelloWorld from './HelloWorld.vue'
import { useRouter } from 'vue-router'
import pb from '../pocketbase' // Import PocketBase instance
import { ref, onMounted } from 'vue'

const router = useRouter()

// Share Target related states
const sharedTitle = ref('')
const sharedText = ref('')
const sharedUrl = ref('')
const sharedFiles = ref<File[]>([])
const uploadResponse = ref<any>(null)
const uploadError = ref<string | null>(null)
const uploading = ref(false)

const logout = () => {
  pb.authStore.clear()
  router.push('/login')
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

onMounted(() => {
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
    <h1 class="page-title">Welcome Home!</h1>
    <p class="page-description">You are logged in.</p>
    
    <div v-if="isSharedContentPresent()" class="shared-content-card">
      <h3 class="shared-content-title">Shared Content Received!</h3>
      
      <p v-if="sharedTitle"><strong>Title:</strong> {{ sharedTitle }}</p>
      <p v-if="sharedText"><strong>Text:</strong> {{ sharedText }}</p>
      <p v-if="sharedUrl"><strong>URL:</strong> <a :href="sharedUrl" target="_blank" class="shared-link">{{ sharedUrl }}</a></p>
      
      <div v-if="sharedFiles.length > 0" class="shared-files-section">
        <h4 class="shared-files-heading">Files Shared:</h4>
        <ul class="file-list">
          <li v-for="file in sharedFiles" :key="file.name" class="file-item">
            <span class="file-name">{{ file.name }}</span> 
            <span class="file-type">({{ file.type }})</span>
            <img v-if="getFilePreviewUrl(file)" :src="getFilePreviewUrl(file)!" alt="File preview" class="file-preview-image" />
            <span v-else-if="file.type === 'application/pdf'" class="file-icon">📄 PDF</span>
            <span v-else class="file-icon">📁 File</span>
          </li>
        </ul>
        
        <div v-if="uploading" class="upload-status-message upload-progress">
          Uploading file...
        </div>
        <div v-else-if="uploadResponse" class="upload-status-message upload-success">
          Upload Successful! <br/> {{ uploadResponse }}
        </div>
        <div v-else-if="uploadError" class="upload-status-message upload-error">
          Upload Error: <br/> {{ uploadError }}
        </div>
      </div>
      
      <p class="shared-feedback">This content was shared with your PWA!</p>
    </div>
    
    <hr class="separator" />
    
    <HelloWorld msg="Vite + Vue" />
  </div>
</template>

<style scoped>
.home-page {
  padding: 1.5rem 1rem;
  max-width: 800px; /* Constrain content width */
  margin: 0 auto;
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

.shared-content-card {
  background-color: var(--color-card-background);
  border: 1px solid var(--color-border);
  border-left: 5px solid var(--color-primary); /* Highlight with primary color */
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
  background-color: #e0f2fe; /* Light blue */
  color: #1e40af; /* Dark blue */
}

.upload-success {
  background-color: #d1fae5; /* Light green */
  color: #065f46; /* Dark green */
}

.upload-error {
  background-color: #fee2e2; /* Light red */
  color: #991b1b; /* Dark red */
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
