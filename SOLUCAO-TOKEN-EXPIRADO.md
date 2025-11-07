# Solução para Token Expirado

## 🔴 Problema Atual

Token JWT expira após 8h, causando erro 401 em todas as requisições.

## ✅ Solução Imediata

**Faça logout e login novamente** para obter novo token válido.

## 🔧 Solução Permanente (Implementar)

### 1. Interceptor de Token Expirado

```typescript
// frontend/src/services/apiClient.ts
const apiClient = {
  async request<T>(endpoint: string, method: string, body?: any): Promise<T> {
    validateEndpoint(endpoint);
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      // Se 401, tentar refresh ou redirecionar para login
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      
      return response.json();
    } catch (error) {
      throw error;
    }
  }
}
```

### 2. Aumentar Tempo de Expiração

```typescript
// backend/src/modules/auth/auth.module.ts
JwtModule.registerAsync({
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: { expiresIn: '24h' }, // Aumentar de 8h para 24h
  }),
})
```

### 3. Implementar Refresh Token (Recomendado)

#### Backend

```typescript
// backend/src/modules/auth/auth.service.ts
async refreshToken(refreshToken: string) {
  try {
    const payload = this.jwtService.verify(refreshToken);
    const user = await this.usersService.findOne(payload.sub);
    
    if (!user || !user.active) {
      throw new UnauthorizedException();
    }
    
    return {
      accessToken: this.jwtService.sign({ 
        email: user.email, 
        sub: user.id, 
        role: user.role 
      }),
      refreshToken: this.generateRefreshToken(user),
    };
  } catch (error) {
    throw new UnauthorizedException('Refresh token inválido');
  }
}

private generateRefreshToken(user: any): string {
  return this.jwtService.sign(
    { sub: user.id, type: 'refresh' },
    { expiresIn: '7d' }
  );
}
```

#### Frontend

```typescript
// frontend/src/services/tokenService.ts
export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;
    
    const response = await fetch('http://localhost:3001/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (response.ok) {
      const { accessToken, refreshToken: newRefreshToken } = await response.json();
      saveToken(accessToken);
      localStorage.setItem('refresh_token', newRefreshToken);
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
};
```

### 4. Auto-Refresh no Interceptor

```typescript
// frontend/src/services/apiClient.ts
const apiClient = {
  async request<T>(endpoint: string, method: string, body?: any): Promise<T> {
    let response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Se 401, tentar refresh
    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      
      if (refreshed) {
        // Tentar novamente com novo token
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...config,
          headers: {
            ...config.headers,
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      } else {
        // Redirecionar para login
        localStorage.clear();
        window.location.href = '/login';
        throw new Error('Sessão expirada');
      }
    }
    
    return response.json();
  }
}
```

## 📊 Comparação de Soluções

| Solução | Complexidade | Segurança | UX |
|---------|--------------|-----------|-----|
| Logout/Login Manual | Baixa | Média | Ruim |
| Aumentar Expiração | Baixa | Baixa | Boa |
| Refresh Token | Alta | Alta | Excelente |
| Auto-Refresh | Média | Alta | Excelente |

## 🎯 Recomendação

**Implementar Refresh Token + Auto-Refresh** para melhor experiência e segurança.

## 📝 Passos para Implementação

1. ✅ Aumentar expiração para 24h (solução rápida)
2. ⏳ Implementar refresh token no backend
3. ⏳ Implementar auto-refresh no frontend
4. ⏳ Adicionar interceptor de 401
5. ⏳ Testar fluxo completo

## 🔒 Sobre o Erro SEFAZ

O erro ao consultar status SEFAZ é causado por:
- Certificado digital não configurado corretamente
- Certificado em formato inválido
- Senha incorreta
- Certificado expirado

**Solução**: Configure o certificado digital válido nas configurações fiscais.

---

**Status Atual**: Token expira em 8h, requer login manual
**Status Desejado**: Auto-refresh transparente para o usuário
