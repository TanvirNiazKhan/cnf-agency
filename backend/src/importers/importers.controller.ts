import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ImportersService } from './importers.service';
import { CreateImporterDto } from './dto/create-importer.dto';
import { UpdateImporterDto } from './dto/update-importer.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('importers')
export class ImportersController {
  constructor(private importersService: ImportersService) {}

  @Get()
  findAll() {
    return this.importersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.importersService.findById(id);
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateImporterDto) {
    return this.importersService.create(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateImporterDto) {
    return this.importersService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.importersService.remove(id);
  }
}
