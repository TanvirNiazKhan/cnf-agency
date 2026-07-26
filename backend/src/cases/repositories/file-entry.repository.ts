import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntry } from '../entities/file-entry.entity';

@Injectable()
export class FileEntryRepository {
  constructor(@InjectRepository(FileEntry) private readonly repo: Repository<FileEntry>) {}

  findByStepData(stepDataId: string) {
    return this.repo.find({ where: { stepDataId } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  save(f: Partial<FileEntry>) {
    return this.repo.save(f);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}
