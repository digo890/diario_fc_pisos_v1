// Tipos do sistema Diário de Obras - FC Pisos

export type UserRole = 'Administrador' | 'Encarregado';

export type FormStatus = 'novo' | 'em_preenchimento' | 'enviado_preposto' | 'aprovado_preposto' | 'reprovado_preposto' | 'enviado_admin' | 'concluido';

export interface User {
  id: string;
  nome: string;
  tipo: UserRole;
  email?: string;
  telefone?: string;
  senha?: string;
  createdAt: number;
}

export interface Obra {
  id: string;
  cliente: string;
  obra: string;
  cidade: string;
  data: string;
  encarregadoId: string;
  // Preposto agora é apenas dados de contato, não um usuário
  prepostoNome?: string;
  prepostoEmail?: string;
  prepostoWhatsapp?: string;
  status: FormStatus;
  progress: number;
  createdAt: number;
  createdBy: string;
  // Token único para acesso do preposto
  validationToken?: string;
  // Data de expiração do token (30 dias após criação)
  validationTokenExpiry?: number;
  // Timestamp do último acesso ao link de validação (auditoria)
  validationTokenLastAccess?: number;
}

export type ClimaType = 'sol' | 'nublado' | 'chuva' | 'lua';

export interface ClimaData {
  manha?: ClimaType;
  tarde?: ClimaType;
  noite?: ClimaType;
}

export interface ServicoData {
  horarioInicioManha: string;
  horarioFimManha: string;
  horarioInicioTarde: string;
  horarioFimTarde: string;
  local: string;
  etapas: { [key: string]: any };
  fotos?: string[];
  // Registros Importantes (20 itens condicionais) - cada serviço tem seus próprios registros
  registros?: {
    [key: string]: CondicionalItem;
  };
}

export interface CondicionalItem {
  ativo: boolean;
  texto: string;
  foto?: string;
  resposta?: boolean;
  comentario?: string;
}

export interface FormData {
  obraId: string;
  
  // Condições Ambientais
  clima: ClimaData;
  temperaturaMin: string;
  temperaturaMax: string;
  umidade: string;
  
  // Serviços Executados (até 3)
  servicos: {
    servico1?: ServicoData;
    servico2?: ServicoData;
    servico3?: ServicoData;
  };
  
  // Dados da Obra
  ucrete: string;
  horarioInicio: string;
  horarioTermino: string;
  area: string;
  espessura: string;
  rodape: string;
  estadoSubstrato: string;
  estadoSubstratoObs: string;
  
  // Registros Importantes (20 itens condicionais)
  registros: {
    [key: string]: CondicionalItem;
  };
  
  // Observações Gerais
  observacoes: string;
  
  // Assinaturas
  assinaturaEncarregado?: string;
  assinaturaPreposto?: string;
  
  // Confirmação Preposto
  prepostoConfirmado?: boolean;
  prepostoMotivoReprovacao?: string; // Motivo quando reprovar
  
  // Metadata
  status: FormStatus;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  enviadoPrepostoAt?: number; // Data/hora de envio para o Preposto
  prepostoReviewedAt?: number;
  prepostoReviewedBy?: string;
  completedAt?: number;
  emailsEnviados?: boolean; // 🔒 Flag para prevenir duplicação de emails
}

export interface AppTheme {
  mode: 'light' | 'dark';
}