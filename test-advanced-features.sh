#!/bin/bash

# ============================================================================
# SCRIPT DE DEMOSTRACIÓN - Advanced Text Humanizer
# ============================================================================

echo "🚀 DEMOSTRACIÓN DE FUNCIONALIDADES AVANZADAS"
echo "=============================================="
echo ""

BASE_URL="http://localhost:3001"

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# TEST 1: POS TAGGING
# ============================================================================
echo -e "${BLUE}📝 TEST 1: POS Tagging (Part-of-Speech Analysis)${NC}"
echo "Analizando: 'The quick brown fox jumps over the lazy dog'"
echo ""

curl -s -X POST "$BASE_URL/api/pos-tags" \
  -H "Content-Type: application/json" \
  -d '{"text":"The quick brown fox jumps over the lazy dog"}' | \
  jq '.summary, .uniquePOS'

echo ""
echo -e "${GREEN}✓ POS Tagging completado${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================================
# TEST 2: CONVERSIÓN A VOZ PASIVA
# ============================================================================
echo -e "${BLUE}🔄 TEST 2: Conversión a Voz Pasiva${NC}"
echo "Texto original: 'The teacher explains the lesson'"
echo ""

curl -s -X POST "$BASE_URL/api/passive-voice" \
  -H "Content-Type: application/json" \
  -d '{"text":"The teacher explains the lesson"}' | \
  jq '.passive'

echo ""
echo -e "${GREEN}✓ Conversión a voz pasiva completada${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================================
# TEST 3: REEMPLAZO DE SINÓNIMOS SIN EMBEDDINGS
# ============================================================================
echo -e "${BLUE}💡 TEST 3: Reemplazo de Sinónimos (SIN Embeddings)${NC}"
echo "Texto original: 'I need to use a good method to help my work'"
echo ""

curl -s -X POST "$BASE_URL/api/synonyms-embeddings" \
  -H "Content-Type: application/json" \
  -d '{"text":"I need to use a good method to help my work","useEmbeddings":false}' | \
  jq '.result'

echo ""
echo -e "${GREEN}✓ Reemplazo de sinónimos (aleatorio) completado${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================================
# TEST 4: HUMANIZACIÓN COMPLETA AVANZADA
# ============================================================================
echo -e "${BLUE}🎯 TEST 4: Humanización Completa Avanzada${NC}"
echo "Texto original: 'This is a very nice and good test that I need to use'"
echo ""

curl -s -X POST "$BASE_URL/api/humanize-advanced" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a very nice and good test that I need to use",
    "options": {
      "useEmbeddings": false,
      "usePOSTagging": true,
      "usePassiveVoice": false
    }
  }' | \
  jq '{result, stats: .stats.wordCount, aiDetection: .aiDetection.confidence}'

echo ""
echo -e "${GREEN}✓ Humanización avanzada completada${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================================
# TEST 5: COMPARATIVA CON/SIN POS TAGGING
# ============================================================================
echo -e "${YELLOW}📊 TEST 5: Comparativa - POS Tagging vs Simple${NC}"
echo "Texto: 'I need good help to make this work'"
echo ""

echo "CON POS Tagging (inteligente):"
curl -s -X POST "$BASE_URL/api/humanize-advanced" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I need good help to make this work",
    "options": {"useEmbeddings": false, "usePOSTagging": true}
  }' | \
  jq -r '.result'

echo ""
echo "SIN POS Tagging (básico):"
curl -s -X POST "$BASE_URL/api/humanize-advanced" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I need good help to make this work",
    "options": {"useEmbeddings": false, "usePOSTagging": false}
  }' | \
  jq -r '.result'

echo ""
echo -e "${GREEN}✓ Comparativa completada${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================================
# TEST 6: DETECCIÓN DE IA
# ============================================================================
echo -e "${BLUE}🤖 TEST 6: Detección de IA${NC}"
echo "Analizando texto para detectar si fue generado por IA..."
echo ""

curl -s -X POST "$BASE_URL/api/detect-ai" \
  -H "Content-Type: application/json" \
  -d '{"text":"Moreover, this exceptionally sophisticated implementation demonstrates the utilization of advanced methodologies"}' | \
  jq '{isAI, confidence, checks}'

echo ""
echo -e "${GREEN}✓ Detección de IA completada${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================================
# RESUMEN FINAL
# ============================================================================
echo -e "${YELLOW}✨ RESUMEN DE PRUEBAS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ POS Tagging${NC} - Identificación de categorías gramaticales"
echo -e "${GREEN}✓ Voz Pasiva${NC} - Transformación activa → pasiva"
echo -e "${GREEN}✓ Sinónimos Inteligentes${NC} - Reemplazo contextual"
echo -e "${GREEN}✓ Humanización Avanzada${NC} - Pipeline completo"
echo -e "${GREEN}✓ Detección de IA${NC} - Análisis heurístico"
echo ""
echo -e "${BLUE}🎓 Próximos pasos sugeridos:${NC}"
echo "  1. Probar con embeddings (useEmbeddings: true) para sinónimos más precisos"
echo "  2. Experimentar con voz pasiva (usePassiveVoice: true)"
echo "  3. Integrar estos endpoints en el frontend React"
echo ""
echo "🔗 Documentación completa: ADVANCED_FEATURES.md"
echo ""
