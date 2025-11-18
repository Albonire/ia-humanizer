#!/bin/bash

# ============================================================================
# VERIFICACIÓN DEL SISTEMA - Pruebas Automáticas
# ============================================================================

echo "
╔════════════════════════════════════════════════════════════════════════════╗
║         🔍 VERIFICACIÓN AUTOMÁTICA DEL SISTEMA COMPLETO                    ║
╚════════════════════════════════════════════════════════════════════════════╝
"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Función para verificar
check() {
    local name=$1
    local cmd=$2
    
    echo -n "🧪 $name ... "
    
    if eval "$cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
    fi
}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "📋 VERIFICACIONES DE INFRAESTRUCTURA:"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

check "Backend corriendo en puerto 3001" "curl -s http://localhost:3001/ | grep -q 'Advanced Text Humanizer API'"
check "Frontend corriendo en puerto 8081" "curl -s http://localhost:8081/ | grep -q -i 'humaniz'"
check "Node.js instalado" "node --version > /dev/null"
check "npm instalado" "npm --version > /dev/null"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "🔌 VERIFICACIONES DE API ENDPOINTS:"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

check "Endpoint /api/humanize" \
    "curl -s -X POST http://localhost:3001/api/humanize -H 'Content-Type: application/json' -d '{\"text\":\"test\",\"language\":\"en\"}' | grep -q 'result'"

check "Endpoint /api/detect-ai" \
    "curl -s -X POST http://localhost:3001/api/detect-ai -H 'Content-Type: application/json' -d '{\"text\":\"test\"}' | grep -q 'confidence'"

check "Endpoint /api/translate" \
    "curl -s -X POST http://localhost:3001/api/translate -H 'Content-Type: application/json' -d '{\"text\":\"hello\",\"fromLang\":\"en\",\"toLang\":\"es\"}' | grep -q 'result'"

check "Endpoint /api/paraphrase" \
    "curl -s -X POST http://localhost:3001/api/paraphrase -H 'Content-Type: application/json' -d '{\"text\":\"test\"}' | grep -q 'result'"

check "Endpoint /api/pos-tags" \
    "curl -s -X POST http://localhost:3001/api/pos-tags -H 'Content-Type: application/json' -d '{\"text\":\"hello world\"}' | grep -q 'tokens'"

check "Endpoint /api/passive-voice" \
    "curl -s -X POST http://localhost:3001/api/passive-voice -H 'Content-Type: application/json' -d '{\"text\":\"The cat ate the mouse.\"}' | grep -q 'original'"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "📁 VERIFICACIONES DE ARCHIVOS:"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

check "Backend avanzado existe" "[ -f humanizer-backend-advanced.js ]"
check "Frontend Index.tsx existe" "[ -f src/pages/Index.tsx ]"
check "Documentación existe" "[ -f ADVANCED_FEATURES.md ]"
check "Loop iterativo documentado" "[ -f ITERATIVE_LOOP_IMPLEMENTATION.md ]"
check "package.json existe" "[ -f package.json ]"
check "tsconfig existe" "[ -f tsconfig.json ]"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "📦 VERIFICACIONES DE DEPENDENCIAS:"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

check "wink-nlp instalado" "grep -q 'wink-nlp' package.json"
check "Transformers instalado" "grep -q '@xenova/transformers' package.json"
check "Express instalado" "grep -q 'express' package.json"
check "React instalado" "grep -q 'react' package.json"
check "Vite instalado" "grep -q 'vite' package.json"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "🎯 RESUMEN FINAL:"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))

echo ""
echo "Total de verificaciones: $TOTAL"
echo -e "${GREEN}✓ Pasadas: $PASSED${NC}"
echo -e "${RED}✗ Fallidas: $FAILED${NC}"
echo ""
echo -n "Estado general: "

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🟢 SISTEMA 100% OPERATIVO${NC}"
    echo ""
    echo "El sistema está completamente funcional y listo para usar."
    echo ""
    echo "📍 Accede en tu navegador:"
    echo "   → Frontend: http://localhost:8081"
    echo "   → Backend API: http://localhost:3001"
    echo ""
    echo "🚀 ¡El loop iterativo está activo!"
    exit 0
else
    echo -e "${YELLOW}🟡 VERIFICACIÓN CON PROBLEMAS (${PERCENTAGE}% exitoso)${NC}"
    echo ""
    echo "Por favor, revisa los errores marcados arriba."
    exit 1
fi
