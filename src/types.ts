// Interfaces para os dados dos cartões retornados pelo backend
export interface CartaoData {
  data: string; // data no formato "23/09/2025 15:02"
  conta: string; // nome da conta (ex: "NU PAGAMENTOS - IP")
  valor: number; // valor do lançamento (ex: 250)
  descricao: string; // descrição (ex: "CLINICA FRANCO PEGHINI LTDA")
  categoria: string; // categoria (ex: "Outros")
  orcamento: string; // orçamento (ex: "23/09/2025")
  observacao: string; // observações adicionais
}

// Interface para a resposta do backend após processamento da imagem
export interface ProcessImageResponse {
  cartoes: CartaoData[];
  message?: string;
  success: boolean;
}