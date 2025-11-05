import os
import re

# Mapeamento de imports antigos para novos no backend
MODULE_NAMES = [
    'auth', 'users', 'gemini', 'products', 'customers', 
    'suppliers', 'sales', 'shifts', 'inventory', 
    'financials', 'purchasing', 'analytics'
]

def update_backend_imports(file_path):
    """Atualiza imports em arquivos do backend"""
    try:
        # Validate path to prevent traversal
        abs_path = os.path.abspath(file_path)
        if not abs_path.startswith(os.path.abspath(os.path.dirname(__file__))):
            print(f"[ERRO] Path inválido: {file_path}")
            return False
        
        with open(abs_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Atualizar imports relativos para módulos
        for module in MODULE_NAMES:
            # Padrões a serem substituídos
            patterns = [
                (rf"from ['\"]\.\./{module}/", f"from '../modules/{module}/"),
                (rf"from ['\"]\.\.\/\.\./{module}/", f"from '../../modules/{module}/"),
                (rf"from ['\"]\.\/{module}/", f"from './modules/{module}/"),
            ]
            
            for old_pattern, new_import in patterns:
                content = re.sub(old_pattern, new_import, content)
        
        # Se houve mudanças, salvar o arquivo
        if content != original_content:
            with open(abs_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"[OK] Atualizado: {file_path}")
            return True
        return False
    except Exception as e:
        print(f"[ERRO] em {file_path}: {str(e)}")
        return False

def process_directory(directory):
    """Processa todos os arquivos .ts no backend"""
    updated_count = 0
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.ts') and not file.endswith('.d.ts'):
                file_path = os.path.join(root, file)
                if update_backend_imports(file_path):
                    updated_count += 1
    
    return updated_count

if __name__ == "__main__":
    backend_src = r"D:\Nova pasta (2)\erp-+-pdv-fiscal\backend\src"
    
    print("Atualizando imports no backend...")
    print("=" * 60)
    
    updated = process_directory(backend_src)
    
    print("=" * 60)
    print(f"Concluido! {updated} arquivos atualizados.")
