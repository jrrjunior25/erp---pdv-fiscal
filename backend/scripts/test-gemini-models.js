const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiModels() {
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyA9Sy3eybkP40qXIuq8XihcPbA-KfzF9uM';
    
    if (!apiKey) {
        console.error('GEMINI_API_KEY não encontrada');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Modelos para testar em ordem de prioridade
    const modelsToTest = [
        'gemini-1.5-pro-latest',
        'gemini-1.5-pro',
        'gemini-1.5-flash-latest', 
        'gemini-1.5-flash',
        'gemini-pro',
        'gemini-pro-vision',
        'text-bison-001'
    ];

    console.log('🔍 Testando modelos Gemini disponíveis...\n');

    for (const modelName of modelsToTest) {
        try {
            console.log(`Testando: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            
            // Teste simples
            const result = await model.generateContent('Diga apenas "OK"');
            const response = await result.response;
            const text = response.text();
            
            console.log(`✅ ${modelName}: FUNCIONANDO - Resposta: ${text.trim()}`);
            break; // Para no primeiro que funcionar
            
        } catch (error) {
            console.log(`❌ ${modelName}: ${error.message}`);
        }
    }
}

// Executar teste
testGeminiModels().catch(console.error);