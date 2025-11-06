const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listAvailableModels() {
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyA9Sy3eybkP40qXIuq8XihcPbA-KfzF9uM';
    
    if (!apiKey) {
        console.error('GEMINI_API_KEY não encontrada');
        return;
    }

    console.log('🔍 Listando modelos disponíveis na API Gemini...\n');

    try {
        // Fazer requisição direta para listar modelos
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.models && data.models.length > 0) {
            console.log('✅ Modelos disponíveis:');
            data.models.forEach(model => {
                console.log(`- ${model.name}`);
                if (model.supportedGenerationMethods) {
                    console.log(`  Métodos: ${model.supportedGenerationMethods.join(', ')}`);
                }
            });
        } else {
            console.log('❌ Nenhum modelo encontrado');
        }
        
    } catch (error) {
        console.error('❌ Erro ao listar modelos:', error.message);
        
        // Verificar se é problema de autenticação
        if (error.message.includes('403')) {
            console.log('\n💡 Possíveis soluções:');
            console.log('1. Verificar se a API Key é válida');
            console.log('2. Verificar se a API Generative Language está habilitada');
            console.log('3. Verificar cotas e limites da API');
        }
    }
}

listAvailableModels().catch(console.error);