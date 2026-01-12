#!/bin/bash
# FASE 1 - LIMPEZA DE COMPONENTES UI NÃO USADOS
# Execute este script no terminal para deletar os 36 componentes

echo "🧹 INICIANDO LIMPEZA FASE 1..."
echo ""

# COMPONENTES UI NÃO USADOS (36 arquivos)
# NOTA: card.tsx NÃO será deletado pois é usado em FormSection e PWAInstallPrompt
echo "📦 Deletando componentes UI não utilizados..."

rm -f src/app/components/ui/accordion.tsx
rm -f src/app/components/ui/alert-dialog.tsx
rm -f src/app/components/ui/alert.tsx
rm -f src/app/components/ui/aspect-ratio.tsx
rm -f src/app/components/ui/avatar.tsx
rm -f src/app/components/ui/badge.tsx
rm -f src/app/components/ui/breadcrumb.tsx
rm -f src/app/components/ui/calendar.tsx
rm -f src/app/components/ui/carousel.tsx
rm -f src/app/components/ui/chart.tsx
rm -f src/app/components/ui/checkbox.tsx
rm -f src/app/components/ui/collapsible.tsx
rm -f src/app/components/ui/command.tsx
rm -f src/app/components/ui/context-menu.tsx
rm -f src/app/components/ui/dialog.tsx
rm -f src/app/components/ui/drawer.tsx
rm -f src/app/components/ui/dropdown-menu.tsx
rm -f src/app/components/ui/form.tsx
rm -f src/app/components/ui/hover-card.tsx
rm -f src/app/components/ui/input-otp.tsx
rm -f src/app/components/ui/menubar.tsx
rm -f src/app/components/ui/navigation-menu.tsx
rm -f src/app/components/ui/pagination.tsx
rm -f src/app/components/ui/popover.tsx
rm -f src/app/components/ui/progress.tsx
rm -f src/app/components/ui/radio-group.tsx
rm -f src/app/components/ui/resizable.tsx
rm -f src/app/components/ui/scroll-area.tsx
rm -f src/app/components/ui/select.tsx
rm -f src/app/components/ui/separator.tsx
rm -f src/app/components/ui/sheet.tsx
rm -f src/app/components/ui/sidebar.tsx
rm -f src/app/components/ui/skeleton.tsx
rm -f src/app/components/ui/slider.tsx
rm -f src/app/components/ui/sonner.tsx
rm -f src/app/components/ui/table.tsx
rm -f src/app/components/ui/tabs.tsx
rm -f src/app/components/ui/toggle-group.tsx
rm -f src/app/components/ui/toggle.tsx
rm -f src/app/components/ui/tooltip.tsx
rm -f src/app/components/ui/use-mobile.ts

echo ""
echo "✅ FASE 1 CONCLUÍDA!"
echo ""
echo "📊 RESUMO:"
echo "  - 36 componentes UI deletados"
echo "  - 3 funções removidas de performance.ts (já feito automaticamente)"
echo "  - ~3580 linhas de código removidas"
echo ""
echo "✅ COMPONENTES MANTIDOS (usados no código):"
echo "  - button.tsx"
echo "  - card.tsx ✓"
echo "  - input.tsx"
echo "  - label.tsx"
echo "  - switch.tsx"
echo "  - textarea.tsx"
echo "  - utils.ts"
echo ""
echo "🧪 PRÓXIMO PASSO: Testar o build"
echo "  npm run build"
echo ""
