const fs = require('fs');
const path = require('path');

const modules = [
  {
    name: 'customers',
    model: 'customer',
    fields: ['name', 'document', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'loyaltyPoints']
  },
  {
    name: 'suppliers',
    model: 'supplier',
    fields: ['name', 'document', 'email', 'phone', 'address', 'city', 'state', 'zipCode']
  },
  {
    name: 'sales',
    model: 'sale',
    fields: ['number', 'customerId', 'shiftId', 'total', 'discount', 'paymentMethod', 'status', 'nfeKey'],
    hasHistory: true
  },
  {
    name: 'shifts',
    model: 'shift',
    fields: ['number', 'userId', 'openingCash', 'closingCash', 'status', 'openedAt', 'closedAt'],
    hasHistory: true,
    hasCurrent: true
  }
];

function generateModule(moduleConfig) {
  const { name, model, fields } = moduleConfig;
  const srcPath = path.join(__dirname, 'src', name);
  
  // Create directory
  if (!fs.existsSync(srcPath)) {
    fs.mkdirSync(srcPath, { recursive: true });
  }
  
  const dtoPath = path.join(srcPath, 'dto');
  if (!fs.existsSync(dtoPath)) {
    fs.mkdirSync(dtoPath, { recursive: true });
  }

  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
  const capitalizedModel = model.charAt(0).toUpperCase() + model.slice(1);

  // Controller
  const controllerContent = `import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ${capitalizedName}Service } from './${name}.service';
import { Create${capitalizedModel}Dto, Update${capitalizedModel}Dto } from './dto/${model}.dto';

@Controller('${name}')
@UseGuards(JwtAuthGuard)
export class ${capitalizedName}Controller {
  constructor(private readonly ${name}Service: ${capitalizedName}Service) {}

  @Get()
  findAll() {
    return this.${name}Service.findAll();
  }
${moduleConfig.hasHistory ? `
  @Get('history')
  getHistory() {
    return this.${name}Service.getHistory();
  }
` : ''}${moduleConfig.hasCurrent ? `
  @Get('current')
  getCurrent() {
    return this.${name}Service.getCurrent();
  }
` : ''}
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.${name}Service.findOne(id);
  }

  @Post()
  create(@Body() create${capitalizedModel}Dto: Create${capitalizedModel}Dto) {
    return this.${name}Service.create(create${capitalizedModel}Dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() update${capitalizedModel}Dto: Update${capitalizedModel}Dto) {
    return this.${name}Service.update(id, update${capitalizedModel}Dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.${name}Service.remove(id);
  }
}
`;

  // Service
  const serviceContent = `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Create${capitalizedModel}Dto, Update${capitalizedModel}Dto } from './dto/${model}.dto';

@Injectable()
export class ${capitalizedName}Service {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.${model}.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
${moduleConfig.hasHistory ? `
  async getHistory() {
    return this.prisma.${model}.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
` : ''}${moduleConfig.hasCurrent ? `
  async getCurrent() {
    return this.prisma.${model}.findFirst({
      where: { status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    });
  }
` : ''}
  async findOne(id: string) {
    return this.prisma.${model}.findUnique({
      where: { id },
    });
  }

  async create(data: Create${capitalizedModel}Dto) {
    return this.prisma.${model}.create({
      data,
    });
  }

  async update(id: string, data: Update${capitalizedModel}Dto) {
    return this.prisma.${model}.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.${model}.delete({
      where: { id },
    });
  }
}
`;

  // Module
  const moduleContent = `import { Module } from '@nestjs/common';
import { ${capitalizedName}Controller } from './${name}.controller';
import { ${capitalizedName}Service } from './${name}.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [${capitalizedName}Controller],
  providers: [${capitalizedName}Service],
  exports: [${capitalizedName}Service],
})
export class ${capitalizedName}Module {}
`;

  // DTO
  const dtoContent = `import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class Create${capitalizedModel}Dto {
${fields.map(field => {
  if (field.includes('Id')) {
    return `  @IsString()\n  ${field}: string;\n`;
  } else if (field.includes('Points') || field.includes('Cash') || field.includes('total') || field.includes('discount') || field === 'number') {
    return `  @IsOptional()\n  @IsNumber()\n  ${field}?: number;\n`;
  } else if (field.includes('At')) {
    return `  @IsOptional()\n  @IsString()\n  ${field}?: string;\n`;
  } else {
    return `  @IsOptional()\n  @IsString()\n  ${field}?: string;\n`;
  }
}).join('\n')}
}

export class Update${capitalizedModel}Dto {
${fields.map(field => `  @IsOptional()\n  ${field.includes('Points') || field.includes('Cash') || field.includes('total') || field.includes('discount') || field === 'number' ? '@IsNumber()\n  ' : '@IsString()\n  '}${field}?: ${field.includes('Points') || field.includes('Cash') || field.includes('total') || field.includes('discount') || field === 'number' ? 'number' : 'string'};\n`).join('\n')}
}
`;

  // Write files
  fs.writeFileSync(path.join(srcPath, `${name}.controller.ts`), controllerContent);
  fs.writeFileSync(path.join(srcPath, `${name}.service.ts`), serviceContent);
  fs.writeFileSync(path.join(srcPath, `${name}.module.ts`), moduleContent);
  fs.writeFileSync(path.join(dtoPath, `${model}.dto.ts`), dtoContent);
  
  console.log(`✓ Generated ${name} module`);
}

modules.forEach(generateModule);
console.log('\n✓ All modules generated successfully!');
