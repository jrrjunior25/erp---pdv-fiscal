import os
import re

def fix_backend_imports(file_path):
    """Corrige imports do backend para prisma e auth guards"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Corrigir imports do prisma que estão incorretos
        # De: '../prisma/' ou '../modules/prisma/' para '../../prisma/'
        content = re.sub(
            r"from ['\"]\.\.\/prisma\/",
            "from '../../prisma/",
            content
        )
        
        content = re.sub(
            r"from ['\"]\.\.\/modules\/prisma\/",
            "from '../../prisma/",
            content
        )
        
        # Corrigir imports de auth guards incorretos
        # De: '../modules/auth/guards/' para '../auth/guards/'
        content = re.sub(
            r"from ['\"]\.\.\/modules\/auth\/guards\/",
            "from '../auth/guards/",
            content
        )
        
        # Se houve mudanças, salvar
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"[OK] Corrigido: {file_path}")
            return True
        return False
    except Exception as e:
        print(f"[ERRO] {file_path}: {str(e)}")
        return False

def process_directory(directory):
    """Processa todos os arquivos .ts no backend"""
    updated_count = 0
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.ts') and not file.endswith('.d.ts'):
                file_path = os.path.join(root, file)
                if fix_backend_imports(file_path):
                    updated_count += 1
    
    return updated_count

if __name__ == "__main__":
    backend_modules = r"D:\Nova pasta (2)\erp-+-pdv-fiscal\backend\src\modules"
    
    print("Corrigindo imports do backend...")
    print("=" * 60)
    
    updated = process_directory(backend_modules)
    
    print("=" * 60)
    print(f"Concluido! {updated} arquivos corrigidos.")
