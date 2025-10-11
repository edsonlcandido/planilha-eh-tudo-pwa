# Guia de Teste - Compartilhamento de Fotos com Análise

## Pré-requisitos

1. Node.js instalado (versão 18 ou superior)
2. NPM instalado
3. Navegador com suporte a PWA (Chrome, Edge, ou Safari)
4. Para testes em produção: dispositivo móvel com o PWA instalado

## Instalação

```bash
npm install
```

## Teste em Modo Desenvolvimento

### 1. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

O servidor estará disponível em: `http://localhost:5173/pwa/`

### 2. Fazer login

- Email: `test@test.com`
- Senha: `test123`

### 3. Simular compartilhamento

Em modo de desenvolvimento, o compartilhamento de arquivos usa dados mockados. Para testar:

1. A interface mostrará a seção "Análise de Documento"
2. Clique em "Escolher arquivo" e selecione uma imagem
3. Clique em "Analisar Documento"
4. Após 2 segundos, você verá cartões mockados sendo exibidos

### Comportamento Esperado em Dev Mode

- ✅ Mensagem "Analisando documento..." aparece
- ✅ Aguarda 2 segundos (simulação)
- ✅ Exibe 2 cartões de exemplo:
  - Cartão 1: NU PAGAMENTOS - R$ 250,00
  - Cartão 2: BANCO DO BRASIL - R$ -45,50
- ✅ Mensagem de sucesso: "2 cartão(ões) criado(s) com sucesso!"

## Teste em Modo Produção

### 1. Build para produção

```bash
npm run build
```

### 2. Preview do build

```bash
npm run preview
```

### 3. Instalar o PWA

No navegador móvel:
1. Acesse o URL do preview
2. Procure pelo botão "Instalar App" ou o prompt de instalação
3. Instale o PWA no dispositivo

### 4. Testar compartilhamento

1. Abra a galeria de fotos do seu celular
2. Selecione uma foto de um extrato bancário ou comprovante
3. Toque no botão "Compartilhar"
4. Selecione "Planilha Eh Tudo" (ou "Planiha") na lista de apps
5. O PWA abrirá automaticamente
6. O arquivo será processado automaticamente

### Comportamento Esperado em Produção

- ✅ PWA abre na tela inicial
- ✅ Seção "Conteúdo Compartilhado Recebido!" aparece
- ✅ Preview da imagem compartilhada é exibido
- ✅ Mensagem "Enviando arquivo para processamento..." aparece
- ✅ Upload para PocketBase é realizado
- ✅ Mensagem "Analisando documento..." aparece
- ✅ Webhook processa a imagem
- ✅ Cartões extraídos são exibidos
- ✅ Arquivo é removido do PocketBase
- ✅ Mensagem de sucesso com número de cartões criados

## Variáveis de Ambiente

Para produção, configure:

```env
VITE_WEBHOOK_URL=https://seu-webhook-url.com/endpoint
```

## Troubleshooting

### Problema: "Faça login para enviar arquivos"
**Solução**: Certifique-se de estar logado com as credenciais de teste ou credenciais válidas do PocketBase.

### Problema: "Falha ao processar a imagem no servidor"
**Solução**: Verifique se a variável `VITE_WEBHOOK_URL` está configurada corretamente e o webhook está acessível.

### Problema: Cartões não aparecem
**Solução**: 
1. Verifique o console do navegador para erros
2. Confirme que a resposta do webhook está no formato esperado (array de CartaoData ou objeto com propriedade `cartoes`)

### Problema: PWA não aparece na lista de compartilhamento
**Solução**:
1. Certifique-se de que o PWA está instalado corretamente
2. Verifique se o arquivo de manifesto está configurado com `share_target`
3. Apenas alguns tipos de arquivo são aceitos (JPG, PNG, PDF)

## Formato de Resposta Esperado do Webhook

```json
{
  "cartoes": [
    {
      "data": "23/09/2025 15:02",
      "conta": "NU PAGAMENTOS - IP",
      "valor": 250,
      "descricao": "CLINICA FRANCO PEGHINI LTDA",
      "categoria": "Outros",
      "orcamento": "23/09/2025",
      "observacao": "Transferência via Pix"
    }
  ]
}
```

Ou simplesmente um array:

```json
[
  {
    "data": "23/09/2025 15:02",
    "conta": "NU PAGAMENTOS - IP",
    "valor": 250,
    "descricao": "CLINICA FRANCO PEGHINI LTDA",
    "categoria": "Outros",
    "orcamento": "23/09/2025",
    "observacao": "Transferência via Pix"
  }
]
```

## Checklist de Testes

### Modo Desenvolvimento
- [ ] Login funciona
- [ ] Seleção de arquivo funciona
- [ ] Análise mostra dados mockados
- [ ] Cartões são exibidos corretamente
- [ ] Mensagem de sucesso aparece

### Modo Produção
- [ ] PWA instala corretamente
- [ ] PWA aparece na lista de compartilhamento
- [ ] Compartilhamento abre o PWA
- [ ] Arquivo é exibido na seção de compartilhamento
- [ ] Upload para PocketBase funciona
- [ ] Webhook processa corretamente
- [ ] Cartões são extraídos e exibidos
- [ ] Arquivo é removido do PocketBase
- [ ] Mensagens de status são claras e corretas

## Logs e Debugging

Para ver logs detalhados, abra o console do navegador (F12) e procure por:

- `Login de teste válido` - Login bem-sucedido
- `Imagem apagada com sucesso do PocketBase` - Limpeza realizada
- `Erro no upload:` - Problemas no processamento

## Contato e Suporte

Se encontrar problemas não cobertos por este guia, verifique:
1. Console do navegador para erros JavaScript
2. Network tab para problemas de rede
3. Status do PocketBase e webhook
