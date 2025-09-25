<script setup lang="ts">
import { ref, computed } from 'vue';
import pb from '../pocketbase';

interface LancamentoResponse {
  data: number;     // data em formato float (ex: 45125.45)
  conta: string;    // nome da conta (ex: "NUBANK")
  valor: number;    // valor do lançamento (ex: 15.00)
  descricao: string; // descrição do lançamento (ex: "compra no mercado")
  categoria: string; // categoria do lançamento (ex: "Supermercado")
  orcamento: number; // código do orçamento (ex: 4125)
  obs: string;      // observações adicionais
}

const files = ref<File[]>([]);
const uploadStatus = ref<'idle' | 'uploading' | 'analyzing' | 'success' | 'error'>('idle');
const uploadMessage = ref('');
const lancamento = ref<LancamentoResponse | null>(null);

const uploadCollection = 'uploads';
const fileFieldName = 'file';
const defaultStatus = 'uploaded';
const webhookUrl = 'https://ehtudo-n8n.pfdgdz.easypanel.host/webhook-test/v1/planilha-eh-tudo-analise-upload';

const currentUserId = computed(() => pb.authStore.model?.id || '');



const acceptedFileTypes = '.jpg,.jpeg,.pdf';

// Limpa todos os arquivos e estado
const clearFiles = () => {
  clearObjectURLs();
  files.value = [];
  uploadStatus.value = 'idle';
  uploadMessage.value = '';
  lancamento.value = null;
};

// Limpa as URLs de objeto criadas para evitar vazamento de memória
const clearObjectURLs = () => {
  files.value.forEach(file => {
    if (isImage(file)) {
      URL.revokeObjectURL(getFilePreviewUrl(file) || '');
    }
  });
};

// Verifica se o arquivo é uma imagem
const isImage = (file: File): boolean => {
  return file.type.startsWith('image/');
};

// Gera uma URL para preview do arquivo
const getFilePreviewUrl = (file: File): string | null => {
  if (isImage(file)) {
    return URL.createObjectURL(file);
  }
  return null;
};

// Formata a data para exibição
const formatarData = (timestamp: number | undefined): string => {
  if (!timestamp) return 'Data inválida';
  
  const data = new Date(timestamp);
  return data.toLocaleDateString('pt-BR');
};

// Computa o tamanho do arquivo em formato legível
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Remove o arquivo da lista
const removeFile = () => {
  clearObjectURLs();
  files.value = [];
  lancamento.value = null;
};

const notifyWebhook = async (uploadUri: string) => {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 'upload-uri': uploadUri }),
  });

  if (!response.ok) {
    throw new Error('Falha ao notificar o webhook.');
  }
};

const uploadFile = async () => {
  if (!files.value.length) {
    uploadStatus.value = 'error';
    uploadMessage.value = 'Selecione um arquivo antes de enviar.';
    return;
  }

  if (!currentUserId.value) {
    uploadStatus.value = 'error';
    uploadMessage.value = 'Faça login para enviar arquivos.';
    return;
  }

  uploadStatus.value = 'uploading';
  uploadMessage.value = 'Enviando arquivo para o PocketBase...';

  const formData = new FormData();
  formData.append('user_id', currentUserId.value);
  formData.append('status', defaultStatus);
  formData.append(fileFieldName, files.value[0]);

  try {
    const record = await pb.collection(uploadCollection).create(formData);
    const fileName = (record as Record<string, any>)[fileFieldName] as string | undefined;

    if (!fileName) {
      throw new Error('PocketBase não retornou o arquivo.');
    }

    const uploadUri = pb.files.getUrl(record, fileName);
    await notifyWebhook(uploadUri);

    uploadStatus.value = 'success';
    uploadMessage.value = 'Upload concluído e webhook notificado.';
  } catch (error: any) {
    uploadStatus.value = 'error';
    uploadMessage.value = error?.message || 'Falha ao enviar o arquivo.';
  }
};

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    clearFiles();
    files.value.push(input.files[0]);
    uploadMessage.value = '';
    uploadStatus.value = 'idle';
  }
};

</script>
<template>
    <div class="upload-area">
        <h2 class="upload-title">Análise de Documento</h2>
        <p class="upload-description">Envie extratos, comprovantes ou notas fiscais para análise automática</p>
    </div>

        <!-- Área de seleção de arquivos simplificada -->
    <div class="file-selection-container">
      <div v-if="files.length === 0" class="file-selection">
        <div class="upload-icon">📄</div>
        <p>Selecione um documento para análise</p>
        <label class="file-select-button">
          Escolher arquivo
          <input class="file-input" type="file" accept=".jpg,.jpeg,.pdf" @change="handleFileSelect">
        </label>
        <p class="file-types-hint">Formatos aceitos: JPG, PDF</p>
      </div>

      <!-- Arquivo selecionado -->
      <div v-else class="file-list">
        <div class="file-item">
          <div class="file-preview">
            <img v-if="getFilePreviewUrl(files[0])" :src="getFilePreviewUrl(files[0])" class="file-thumbnail" alt="preview" />
            <span v-else class="file-icon">📄</span>
          </div>
          <div class="file-info">
            <p class="file-name">{{ files[0].name }}</p>
            <div class="file-meta">
              <span>{{ files[0].type || 'Formato desconhecido' }}</span>
              <span>{{ formatFileSize(files[0].size) }}</span>
            </div>
          </div>
          <button class="remove-file-button" type="button" @click="removeFile">✕</button>
        </div>

        <button class="submit-button" type="button" :disabled="uploadStatus === 'uploading'" @click="uploadFile">
          {{ uploadStatus === 'uploading' ? 'Enviando...' : 'Enviar para PocketBase' }}
        </button>
      </div>
    </div>

    <div v-if="uploadMessage" class="status-message"
         :class="{
           'upload-progress': uploadStatus === 'uploading',
           'upload-success': uploadStatus === 'success',
           'upload-error': uploadStatus === 'error'
         }">
      {{ uploadMessage }}
    </div>
</template>
<style scoped>
.upload-area {
  background-color: var(--color-card-background);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.upload-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-dark);
  margin-bottom: 0.5rem;
}

.upload-description {
  color: var(--color-text-light);
  margin-bottom: 1.5rem;
}

.file-selection-container {
  margin-bottom: 1.5rem;
  background-color: var(--color-background-light);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.file-selection {
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.upload-icon {
  font-size: 3rem;
  color: var(--color-text-light);
  margin-bottom: 0.5rem;
}

.file-select-button {
  background-color: var(--color-primary);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.file-select-button:hover {
  background-color: var(--color-hover-blue);
}

.file-types-hint {
  font-size: 0.875rem;
  color: var(--color-text-light);
  margin-top: 0.5rem;
}

.file-input {
  display: none;
}

.file-list {
  width: 100%;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 1rem;
}

.file-preview {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  background-color: white;
  border-radius: 4px;
  overflow: hidden;
}

.file-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon {
  font-size: 1.5rem;
}

.file-info {
  flex-grow: 1;
  overflow: hidden;
  text-align: left;
}

.file-name {
  font-weight: 500;
  color: var(--color-text-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.25rem;
}

.file-meta {
  display: flex;
  font-size: 0.875rem;
  color: var(--color-text-light);
  gap: 0.5rem;
}

.remove-file-button {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: var(--color-background-light);
  color: var(--color-text-light);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.remove-file-button:hover {
  background-color: var(--color-accent);
  color: white;
}

.analyze-button, 
.submit-button {
  width: 100%;
  padding: 1rem;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  border: none;
  margin-bottom: 1rem;
}

.analyze-button {
  background-color: var(--color-secondary);
  color: white;
}

.analyze-button:hover:not(:disabled) {
  background-color: var(--color-hover-blue);
}

.submit-button {
  background-color: var(--color-primary);
  color: white;
}

.submit-button:hover:not(:disabled) {
  background-color: var(--color-hover-blue);
}

.analyze-button:disabled,
.submit-button:disabled {
  background-color: var(--color-border);
  cursor: not-allowed;
}

.status-message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
  font-weight: 500;
}

.upload-analyzing {
  background-color: #e0f2fe;
  color: #1e40af;
}

.upload-progress {
  background-color: #e0f2fe;
  color: #1e40af;
}

.upload-success {
  background-color: #d1fae5;
  color: #065f46;
}

.upload-error {
  background-color: #fee2e2;
  color: #991b1b;
}

.analysis-result {
  background-color: var(--color-background-light);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.analysis-result h3 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: var(--color-text-dark);
}

.result-fields {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.result-field {
  display: flex;
  flex-direction: column;
}

.result-field.full-width {
  grid-column: span 2;
}

.result-field label {
  font-size: 0.875rem;
  color: var(--color-text-light);
  margin-bottom: 0.25rem;
}

.result-field p {
  font-size: 1rem;
  color: var(--color-text-dark);
  font-weight: 500;
  padding: 0.5rem;
  background-color: white;
  border-radius: 4px;
  border: 1px solid var(--color-border);
}

.result-field p.value {
  color: var(--color-primary);
  font-weight: 600;
}

@media (max-width: 640px) {
  .result-fields {
    grid-template-columns: 1fr;
  }
  
  .result-field.full-width {
    grid-column: span 1;
  }
}
</style>