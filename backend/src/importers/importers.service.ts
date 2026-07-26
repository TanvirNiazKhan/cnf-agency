import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ImportersRepository } from './repositories/importers.repository';
import { CreateImporterDto } from './dto/create-importer.dto';
import { UpdateImporterDto } from './dto/update-importer.dto';

@Injectable()
export class ImportersService {
  constructor(private importersRepository: ImportersRepository) {}

  findAll() {
    return this.importersRepository.findAll();
  }

  async findById(id: string) {
    const imp = await this.importersRepository.findById(id);
    if (!imp) throw new NotFoundException('Importer not found');
    return imp;
  }

  async create(dto: CreateImporterDto) {
    const existing = await this.importersRepository.findByName(dto.name);
    if (existing) throw new ConflictException('Importer name already exists');
    return this.importersRepository.save({ name: dto.name });
  }

  async update(id: string, dto: UpdateImporterDto) {
    const imp = await this.findById(id);
    if (dto.name) imp.name = dto.name;
    return this.importersRepository.save(imp);
  }

  async remove(id: string) {
    await this.findById(id);
    await this.importersRepository.softDelete(id);
    return { message: 'Importer deleted' };
  }
}
