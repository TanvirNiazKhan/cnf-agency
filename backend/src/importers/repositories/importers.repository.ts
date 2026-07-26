import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Importer } from '../entities/importer.entity';

@Injectable()
export class ImportersRepository {
  constructor(@InjectRepository(Importer) private readonly repo: Repository<Importer>) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findByName(name: string) {
    return this.repo.findOne({ where: { name } });
  }

  save(importer: Partial<Importer>) {
    return this.repo.save(importer);
  }

  softDelete(id: string) {
    return this.repo.softDelete(id);
  }
}
