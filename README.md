# Diário de Obras - FC Pisos

Sistema de diário de obras digital, mobile-first, com funcionalidade offline-first para uso em canteiros de obra.

## Tecnologias

- React 18 + TypeScript
- Vite 6
- Tailwind CSS 4
- IndexedDB (persistência local)
- PWA (Progressive Web App)
- Service Worker (offline-first)
- Material UI (componentes selecionados)
- Radix UI (componentes base)

## Funcionalidades

### Perfis de Usuário

**Administrador**
- Criar e gerenciar obras
- Criar e gerenciar usuários (Encarregados e Prepostos)
- Visualizar respostas de formulários
- Baixar PDFs dos diários preenchidos
- Atribuir encarregados e prepostos às obras

**Encarregado**
- Visualizar obras atribuídas
- Preencher formulário completo do diário de obras
- Enviar formulário para conferência do preposto
- Auto-save automático

**Preposto**
- Visualizar formulários enviados pelos encarregados
- Conferir informações em modo leitura
- Confirmar conferência via checkbox obrigatório
- Enviar formulário aprovado para o administrador

### Formulário do Diário

O formulário contém as seguintes seções:

1. **Condições Ambientais**
   - Clima por período (Manhã, Tarde, Noite) com ícones
   - Temperatura mínima e máxima
   - Umidade relativa do ar

2. **Serviços Executados**
   - Até 3 serviços simultâneos (tabs)
   - Horário e local de execução
   - 36 etapas de execução (checkboxes)
   - Botão "Copiar dados do Serviço 1" nos serviços 2 e 3

3. **Dados da Obra**
   - Tipo de Ucrete (bottom sheet selector)
   - Horário de início e término
   - Área (m²) e Espessura (mm)
   - Rodapé (bottom sheet selector)
   - Estado do substrato com campo de observação

4. **Registros Importantes / Estado do Substrato**
   - 20 itens condicionais com toggle Sim/Não
   - Campo de texto para cada item ativo
   - Opção de anexar 1 foto por item
   - Preview e remoção de fotos

5. **Observações Gerais**
   - Campo de texto longo multilinha

6. **Confirmação do Preposto**
   - Checkbox obrigatório para conferência (apenas para Preposto)

### Características Técnicas

- **Offline-first**: Funciona completamente offline usando IndexedDB
- **Auto-save**: Salvamento automático a cada 3 segundos
- **PWA**: Instalável em dispositivos móveis
- **Tema claro/escuro**: Toggle entre temas
- **Material Design 3**: Interface inspirada no Material You
- **Responsivo**: Mobile-first, otimizado para tablets e desktop

### Cores

- Fundo: `#FFFFFF` (claro) / `#0A0A0A` (escuro)
- Texto principal: `#1E2D3B` (claro) / `#FFFFFF` (escuro)
- Destaque/Primária: `#FD5521` (laranja FC Pisos)

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build
```

## Estrutura de Dados

Os dados são armazenados localmente no IndexedDB:

- **users**: Usuários do sistema
- **obras**: Obras cadastradas
- **forms**: Formulários preenchidos
- **config**: Configurações (tema, usuário logado)

## Próximos Passos

- Integração com Supabase para sincronização em nuvem
- Geração de PDF dos formulários
- Assinaturas digitais
- Sincronização automática quando online
- Notificações push

## Licença

Propriedade de FC Pisos - Todos os direitos reservados