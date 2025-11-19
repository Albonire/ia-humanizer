#!/usr/bin/env node

/**
 * Test Script - Complete Pipeline with IA + Validation + NLP
 * 
 * Tests all new functionality:
 * - OutputValidator class (5 validators)
 * - OpenRouter IA integration
 * - Complete pipeline orchestration
 * - All endpoints
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = "http://localhost:3001";

// ============================================================================
// COLOR CODES FOR CONSOLE OUTPUT
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(70)}\n${msg}\n${'='.repeat(70)}${colors.reset}\n`),
  test: (msg) => console.log(`${colors.blue}📝 ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  result: (msg) => console.log(`${colors.magenta}📊 ${msg}${colors.reset}`)
};

// ============================================================================
// TEST DATA
// ============================================================================

const testTexts = {
  short: "AI is used in many applications. It helps companies improve efficiency. The technology is important.",
  medium: "Machine learning has revolutionized the way companies approach data analysis. By leveraging advanced algorithms, organizations can now process enormous datasets to extract meaningful insights. This technological advancement has opened new possibilities for business intelligence and predictive analytics.",
  academic: "The implementation of machine learning models has demonstrated significant potential in optimizing operational efficiency. Our findings suggest that strategic deployment of neural networks can reduce computational overhead by approximately forty percent. Furthermore, the integration of distributed systems with traditional architectures yields promising results in scalability metrics.",
  spanish: "La inteligencia artificial es utilizada en muchas aplicaciones. Ayuda a las empresas a mejorar la eficiencia. La tecnología es importante."
};

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

async function testHealthCheck() {
  log.test("Health Check - GET /");
  try {
    const response = await axios.get(API_URL);
    log.success(`Server is healthy. Version: ${response.data.version}`);
    log.info(`Available endpoints: ${response.data.endpoints.length}`);
    return true;
  } catch (error) {
    log.error(`Server health check failed: ${error.message}`);
    return false;
  }
}

async function testCompleteHumanization() {
  log.test("Complete Humanization Pipeline - POST /api/humanize");
  try {
    const response = await axios.post(`${API_URL}/api/humanize`, {
      text: testTexts.medium,
      useEmbeddings: false,
      usePassiveVoice: true,
      addTransitions: true
    }, { timeout: 60000 });

    log.success("Complete pipeline executed successfully");
    
    const data = response.data;
    log.result(`Validation Score: ${data.stats.validationScore}%`);
    log.result(`IA Applied: ${data.stats.iaHumanizationApplied}`);
    log.result(`Execution Time: ${data.stats.executionTime}ms`);
    log.result(`Input Length: ${data.stats.inputLength} chars → Output: ${data.stats.outputLength} chars`);
    
    if (data.validation) {
      log.info(`Validators Passed: ${data.validation.passedValidations}/${data.validation.totalValidations}`);
    }
    
    return data;
  } catch (error) {
    log.error(`Complete humanization failed: ${error.message}`);
    if (error.response?.data) {
      log.error(`Details: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

async function testAIHumanization() {
  log.test("AI-Only Humanization - POST /api/humanize-ai");
  try {
    const response = await axios.post(`${API_URL}/api/humanize-ai`, {
      text: testTexts.short
    }, { timeout: 30000 });

    const data = response.data;
    
    if (data.success) {
      log.success("IA humanization completed");
      log.result(`Model: ${data.model}`);
      log.result(`Input: ${data.inputLength} chars → Output: ${data.outputLength} chars`);
      return data;
    } else {
      log.warning(`IA humanization not available: ${data.error}`);
      return data;
    }
  } catch (error) {
    log.warning(`IA endpoint error (expected if API key not configured): ${error.message}`);
    return null;
  }
}

async function testValidation() {
  log.test("Validation Endpoint - POST /api/validate-humanization");
  try {
    const original = testTexts.academic;
    const humanized = "The deployment of machine learning models has shown considerable promise in enhancing operational efficiency. Our research indicates that thoughtfully implementing neural networks can decrease computational demands by roughly forty percent. Additionally, combining distributed architectures with conventional systems demonstrates encouraging outcomes regarding scalability performance.";

    const response = await axios.post(`${API_URL}/api/validate-humanization`, {
      original,
      humanized
    });

    const validation = response.data.validation;
    log.success("Validation completed");
    log.result(`Overall Score: ${validation.score}%`);
    log.result(`Passed: ${validation.passedValidations}/${validation.totalValidations}`);
    
    // Check each validator
    Object.entries(validation.details).forEach(([validator, passed]) => {
      const status = passed ? log.success : log.warning;
      status(`  • ${validator}: ${passed ? 'PASS' : 'FAIL'}`);
    });
    
    return validation;
  } catch (error) {
    log.error(`Validation test failed: ${error.message}`);
    return null;
  }
}

async function testPOSTagging() {
  log.test("POS Tagging - POST /api/pos-tags");
  try {
    const response = await axios.post(`${API_URL}/api/pos-tags`, {
      text: testTexts.short
    });

    log.success("POS tagging completed");
    log.result(`Total tokens: ${response.data.count}`);
    log.result(`Unique POS tags: ${response.data.uniquePOS.join(', ')}`);
    log.info(`Summary: ${JSON.stringify(response.data.summary)}`);
    
    return response.data;
  } catch (error) {
    log.error(`POS tagging failed: ${error.message}`);
    return null;
  }
}

async function testPassiveVoice() {
  log.test("Passive Voice Conversion - POST /api/passive-voice");
  try {
    const response = await axios.post(`${API_URL}/api/passive-voice`, {
      text: testTexts.short
    });

    log.success("Passive voice conversion completed");
    log.result(`Changed: ${response.data.changed}`);
    
    return response.data;
  } catch (error) {
    log.error(`Passive voice test failed: ${error.message}`);
    return null;
  }
}

async function testSynonymsEmbeddings() {
  log.test("Synonyms with Embeddings - POST /api/synonyms-embeddings");
  try {
    const response = await axios.post(`${API_URL}/api/synonyms-embeddings`, {
      text: testTexts.short,
      useEmbeddings: false
    }, { timeout: 30000 });

    log.success("Synonyms replacement completed");
    log.result(`Changed: ${response.data.changed}`);
    
    return response.data;
  } catch (error) {
    log.warning(`Synonyms test note: ${error.message}`);
    return null;
  }
}

async function testErrorHandling() {
  log.test("Error Handling Tests");
  
  try {
    // Test 1: Empty text
    try {
      await axios.post(`${API_URL}/api/humanize`, { text: "" });
      log.error("Empty text should have been rejected");
    } catch (error) {
      if (error.response?.status === 400) {
        log.success("Empty text correctly rejected");
      }
    }

    // Test 2: Missing text field
    try {
      await axios.post(`${API_URL}/api/humanize`, {});
      log.error("Missing text field should have been rejected");
    } catch (error) {
      if (error.response?.status === 400) {
        log.success("Missing text field correctly rejected");
      }
    }

    // Test 3: Very long text (should handle gracefully)
    const longText = testTexts.medium.repeat(50);
    try {
      const response = await axios.post(`${API_URL}/api/humanize`, {
        text: longText
      }, { timeout: 60000 });
      
      if (response.status === 200) {
        log.success("Long text handled gracefully");
      }
    } catch (error) {
      log.warning(`Long text handling: ${error.message}`);
    }

    return true;
  } catch (error) {
    log.error(`Error handling tests failed: ${error.message}`);
    return false;
  }
}

async function testFrontendCompatibility() {
  log.test("Frontend Compatibility Check");
  try {
    const response = await axios.post(`${API_URL}/api/humanize`, {
      text: testTexts.short
    }, { timeout: 30000 });

    const requiredFields = ['result', 'stats', 'validation'];
    const hasAllFields = requiredFields.every(field => field in response.data);

    if (hasAllFields) {
      log.success("Frontend response format is compatible");
      log.info(`Response contains: result, stats, validation`);
      return true;
    } else {
      log.error("Missing required response fields");
      return false;
    }
  } catch (error) {
    log.error(`Frontend compatibility check failed: ${error.message}`);
    return false;
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  log.header("🚀 COMPLETE PIPELINE TEST SUITE");
  
  console.log(`Testing server at: ${colors.bright}${API_URL}${colors.reset}`);
  console.log(`Test timestamp: ${new Date().toISOString()}\n`);

  const results = {
    healthCheck: false,
    completePipeline: false,
    aiHumanization: false,
    validation: false,
    posTagging: false,
    passiveVoice: false,
    synonymsEmbeddings: false,
    errorHandling: false,
    frontendCompatibility: false
  };

  // Run tests
  results.healthCheck = await testHealthCheck();
  
  if (!results.healthCheck) {
    log.error("Server is not running. Please start the server first.");
    process.exit(1);
  }

  results.completePipeline = !!(await testCompleteHumanization());
  results.aiHumanization = !!(await testAIHumanization());
  results.validation = !!(await testValidation());
  results.posTagging = !!(await testPOSTagging());
  results.passiveVoice = !!(await testPassiveVoice());
  results.synonymsEmbeddings = !!(await testSynonymsEmbeddings());
  results.errorHandling = await testErrorHandling();
  results.frontendCompatibility = await testFrontendCompatibility();

  // Summary
  log.header("📋 TEST SUMMARY");
  
  const passed = Object.values(results).filter(v => v).length;
  const total = Object.keys(results).length;
  const percentage = Math.round((passed / total) * 100);

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? log.success : log.warning;
    status(`${test}: ${passed ? 'PASS' : 'FAIL'}`);
  });

  console.log(`\n${colors.bright}Overall: ${passed}/${total} tests passed (${percentage}%)${colors.reset}\n`);

  if (passed === total) {
    log.success("All tests passed! 🎉");
    process.exit(0);
  } else {
    log.warning("Some tests failed. Review the output above.");
    process.exit(1);
  }
}

// ============================================================================
// RUN TESTS
// ============================================================================

runAllTests().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
