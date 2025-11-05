import os
import re

# Mapeamento de imports antigos para novos
IMPORT_MAPPINGS = {
    r"from ['\"]\.\/components\/": "from '@components/",
    r"from ['\"]\.\.\/components\/": "from '@components/",
    r"from ['\"]\.\.\/\.\.\/components\/": "from '@components/",
    r"from ['\"]\.\/services\/": "from '@services/",
    r"from ['\"]\.\.\/services\/": "from '@services/",
    r"from ['\"]\.\.\/\.\.\/services\/": "from '@services/",
    r"from ['\"]\.\/types": "from '@types",
    r"from ['\"]\.\.\/types": "from '@types",
    r"from ['\"]\.\.\/\.\.\/types": "from '@types",
    r"from ['\"]\.\/utils\/": "from '@utils/",
    r"from ['\"]\.\.\/utils\/": "from '@utils/",
    r"from ['\"]\.\.\/\.\.\/utils\/": "from '@utils/",
    r"from ['\"]\.\/constants": "from '@utils/constants",
    r"from ['\"]\.\.\/constants": "from '@utils/constants",
}

def update_imports_in_file(file_path):
    """Atualiza imports em um arquivo"""
    try:
        # Validate path to prevent traversal
        abs_path = os.path.abspath(file_path)
        if not abs_path.startswith(os.path.abspath(os.path.dirname(__file__))):
            print(f"[ERRO] Path inválido: {file_path}")
            return False
        
        with open(abs_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Aplicar todas as substituições
        for old_pattern, new_import in IMPORT_MAPPINGS.items():
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
    """Processa todos os arquivos .tsx e .ts em um diretório"""
    updated_count = 0
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts')) and not file.endswith('.d.ts'):
                file_path = os.path.join(root, file)
                if update_imports_in_file(file_path):
                    updated_count += 1
    
    return updated_count

if __name__ == "__main__":
    frontend_src = r"D:\Nova pasta (2)\erp-+-pdv-fiscal\frontend\src"
    
    print("Atualizando imports no frontend...")
    print("=" * 60)
    
    updated = process_directory(frontend_src)
    
    print("=" * 60)
    print(f"Concluido! {updated} arquivos atualizados.")
