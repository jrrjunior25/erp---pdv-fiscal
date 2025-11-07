const fs = require('fs');
const path = require('path');

// Lista de controladores que precisam ser corrigidos
const controllers = [
  'backend/src/modules/suppliers/suppliers.controller.ts',
  'backend/src/modules/users/users.controller.ts',
  'backend/src/modules/sales/sales.controller.ts',
  'backend/src/modules/inventory/inventory.controller.ts',
  'backend/src/modules/financials/financials.controller.ts'
];

// Função para corrigir os headers de download
function fixExcelHeaders(content) {
  // Padrão para encontrar métodos de export/template
  const exportPattern = /(@Get\('export\/(excel|template)'\)\s*(?:@UseGuards\(JwtAuthGuard\)\s*)?async\s+\w+\([^)]*@Res\(\)\s+res:\s+Response[^)]*\)\s*{[^}]*?)(res\.setHeader\('Content-Type'[^;]*;[^}]*?res\.end\(buffer\);)/gs;
  
  return content.replace(exportPattern, (match, methodStart, headers) => {
    // Extrair o nome do arquivo do Content-Disposition
    const filenameMatch = headers.match(/filename[=:][\s]*["]?([^";\s]+)["]?/);
    const filename = filenameMatch ? filenameMatch[1] : 'export.xlsx';
    
    // Novo código com headers corretos
    const newHeaders = `try {
      const buffer = await this.excelService.export${methodStart.includes('template') ? 'Template' : 'ToExcel'}();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', \`attachment; filename=\${filename}\`);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao exportar arquivo', error: error.message });
    }`;
    
    return methodStart + newHeaders;
  });
}

// Processar cada controlador
controllers.forEach(controllerPath => {
  const fullPath = path.join(__dirname, controllerPath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`Corrigindo ${controllerPath}...`);
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const fixedContent = fixExcelHeaders(content);
    
    if (content !== fixedContent) {
      fs.writeFileSync(fullPath, fixedContent, 'utf8');
      console.log(`✅ ${controllerPath} corrigido`);
    } else {
      console.log(`⚠️  ${controllerPath} não precisava de correção`);
    }
  } else {
    console.log(`❌ ${controllerPath} não encontrado`);
  }
});

console.log('\n🎉 Correção concluída!');