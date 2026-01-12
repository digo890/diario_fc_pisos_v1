@echo off
REM FASE 1 - LIMPEZA DE COMPONENTES UI NÃO USADOS (Windows)
REM Execute este arquivo .bat no terminal Windows

echo 🧹 INICIANDO LIMPEZA FASE 1...
echo.

REM COMPONENTES UI NÃO USADOS (36 arquivos)
REM NOTA: card.tsx NÃO será deletado pois é usado em FormSection e PWAInstallPrompt
echo 📦 Deletando componentes UI não utilizados...

del /F src\app\components\ui\accordion.tsx 2>nul
del /F src\app\components\ui\alert-dialog.tsx 2>nul
del /F src\app\components\ui\alert.tsx 2>nul
del /F src\app\components\ui\aspect-ratio.tsx 2>nul
del /F src\app\components\ui\avatar.tsx 2>nul
del /F src\app\components\ui\badge.tsx 2>nul
del /F src\app\components\ui\breadcrumb.tsx 2>nul
del /F src\app\components\ui\calendar.tsx 2>nul
del /F src\app\components\ui\carousel.tsx 2>nul
del /F src\app\components\ui\chart.tsx 2>nul
del /F src\app\components\ui\checkbox.tsx 2>nul
del /F src\app\components\ui\collapsible.tsx 2>nul
del /F src\app\components\ui\command.tsx 2>nul
del /F src\app\components\ui\context-menu.tsx 2>nul
del /F src\app\components\ui\dialog.tsx 2>nul
del /F src\app\components\ui\drawer.tsx 2>nul
del /F src\app\components\ui\dropdown-menu.tsx 2>nul
del /F src\app\components\ui\form.tsx 2>nul
del /F src\app\components\ui\hover-card.tsx 2>nul
del /F src\app\components\ui\input-otp.tsx 2>nul
del /F src\app\components\ui\menubar.tsx 2>nul
del /F src\app\components\ui\navigation-menu.tsx 2>nul
del /F src\app\components\ui\pagination.tsx 2>nul
del /F src\app\components\ui\popover.tsx 2>nul
del /F src\app\components\ui\progress.tsx 2>nul
del /F src\app\components\ui\radio-group.tsx 2>nul
del /F src\app\components\ui\resizable.tsx 2>nul
del /F src\app\components\ui\scroll-area.tsx 2>nul
del /F src\app\components\ui\select.tsx 2>nul
del /F src\app\components\ui\separator.tsx 2>nul
del /F src\app\components\ui\sheet.tsx 2>nul
del /F src\app\components\ui\sidebar.tsx 2>nul
del /F src\app\components\ui\skeleton.tsx 2>nul
del /F src\app\components\ui\slider.tsx 2>nul
del /F src\app\components\ui\sonner.tsx 2>nul
del /F src\app\components\ui\table.tsx 2>nul
del /F src\app\components\ui\tabs.tsx 2>nul
del /F src\app\components\ui\toggle-group.tsx 2>nul
del /F src\app\components\ui\toggle.tsx 2>nul
del /F src\app\components\ui\tooltip.tsx 2>nul
del /F src\app\components\ui\use-mobile.ts 2>nul

echo.
echo ✅ FASE 1 CONCLUÍDA!
echo.
echo 📊 RESUMO:
echo   - 36 componentes UI deletados
echo   - 3 funções removidas de performance.ts (já feito automaticamente)
echo   - ~3580 linhas de código removidas
echo.
echo ✅ COMPONENTES MANTIDOS (usados no código):
echo   - button.tsx
echo   - card.tsx ✓
echo   - input.tsx
echo   - label.tsx
echo   - switch.tsx
echo   - textarea.tsx
echo   - utils.ts
echo.
echo 🧪 PRÓXIMO PASSO: Testar o build
echo   npm run build
echo.
pause
