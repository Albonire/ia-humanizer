#!/bin/bash

# ============================================================================
# SCRIPT DE DEMOSTRACIÓN - Loop Iterativo
# ============================================================================

echo "🚀 DEMOSTRACIÓN: Loop Iterativo de Detección de IA"
echo "=================================================="
echo ""

BASE_URL="http://localhost:3001"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Función para hacer petición y extraer confianza
check_ai_confidence() {
  local text="$1"
  local response=$(curl -s -X POST "$BASE_URL/api/detect-ai" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"$text\"}")
  
  echo "$response" | jq -r '.confidence'
}

# Texto de entrada (típicamente generado por IA)
echo -e "${BLUE}📝 TEXTO INICIAL (AI-Generated):${NC}"
text="Moreover, the implementation of advanced methodologies has demonstrated significant efficacy in the contemporary technological landscape. Furthermore, the utilization of sophisticated algorithms facilitates the achievement of optimal outcomes. Additionally, the systematic approach contributes to the enhancement of overall performance metrics."
echo "$text"
echo ""

# Simular iteraciones
echo -e "${YELLOW}🔄 SIMULANDO LOOP ITERATIVO:${NC}"
echo "═══════════════════════════════════"
echo ""

current_text="$text"
iteration=1
max_iterations=3
threshold=10

while [ $iteration -le $max_iterations ]; do
  echo -e "${BLUE}🔄 ITERACIÓN $iteration de $max_iterations${NC}"
  echo "────────────────────────────────────"
  
  # Humanizar
  echo "1️⃣  Aplicando humanización..."
  response=$(curl -s -X POST "$BASE_URL/api/humanize" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"$current_text\"}")
  
  current_text=$(echo "$response" | jq -r '.result')
  echo "   ✓ Texto humanizado"
  
  # Mejorar escritura
  echo "2️⃣  Mejorando escritura..."
  response=$(curl -s -X POST "$BASE_URL/api/improve-writing" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"$current_text\"}")
  
  current_text=$(echo "$response" | jq -r '.result')
  echo "   ✓ Escritura mejorada"
  
  # Parafrasear
  echo "3️⃣  Parafraseando..."
  response=$(curl -s -X POST "$BASE_URL/api/paraphrase" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"$current_text\"}")
  
  current_text=$(echo "$response" | jq -r '.result')
  echo "   ✓ Texto parafraseado"
  
  # Detectar IA
  echo "4️⃣  Detectando IA..."
  response=$(curl -s -X POST "$BASE_URL/api/detect-ai" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"$current_text\"}")
  
  confidence=$(echo "$response" | jq -r '.confidence')
  isAI=$(echo "$response" | jq -r '.isAI')
  
  echo "   ✓ Confianza IA: ${confidence}%"
  echo ""
  
  # Decidir si continuar
  if (( $(echo "$confidence > $threshold" | bc -l) )); then
    echo -e "${RED}⚠️  IA detectada al ${confidence}% (> ${threshold}%)${NC}"
    echo -e "${YELLOW}🔄 Reiterando el proceso...${NC}"
    echo ""
    iteration=$((iteration + 1))
  else
    echo -e "${GREEN}✅ IA detectada al ${confidence}% (≤ ${threshold}%)${NC}"
    echo -e "${GREEN}✅ PROCESO FINALIZADO - HUMANIZACIÓN EXITOSA${NC}"
    break
  fi
done

echo ""
echo "════════════════════════════════════"
echo -e "${GREEN}📊 RESULTADO FINAL:${NC}"
echo "════════════════════════════════════"
echo ""
echo -e "${YELLOW}Iteraciones completadas:${NC} $iteration"
echo -e "${YELLOW}Confianza IA final:${NC} ${confidence}%"
echo -e "${YELLOW}Estado:${NC} $([ $(echo "$confidence <= $threshold" | bc -l) -eq 1 ] && echo "✅ HUMANIZADO EXITOSAMENTE" || echo "⚠️ POR DEBAJO DEL UMBRAL")"
echo ""
echo -e "${BLUE}📄 TEXTO FINAL:${NC}"
echo "$current_text"
echo ""
