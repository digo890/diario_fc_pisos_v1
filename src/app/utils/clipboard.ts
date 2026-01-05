/**
 * Função helper para copiar texto para a área de transferência
 * com fallback para navegadores que não suportam a Clipboard API
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  // Fallback: método clássico usando textarea (mais confiável em PWAs)
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    
    // Estilizar para ser invisível mas ainda funcional
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    textarea.setAttribute('readonly', '');
    
    document.body.appendChild(textarea);
    
    // Focar no textarea
    textarea.focus();
    
    // Selecionar todo o texto
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    
    // Executar o comando de cópia
    let successful = false;
    try {
      successful = document.execCommand('copy');
    } catch (err) {
      successful = false;
    }
    
    // Remover o textarea
    document.body.removeChild(textarea);
    
    // Se o fallback funcionou, retornar sucesso
    if (successful) {
      return true;
    }
  } catch (err) {
    // Fallback falhou, tentar Clipboard API como último recurso
  }

  // Tentar Clipboard API como último recurso (pode estar bloqueada)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Silenciosamente falhar
      return false;
    }
  }

  return false;
};