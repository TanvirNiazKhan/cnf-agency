import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  findAll() {
    return this.repo.find({ withDeleted: false });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  save(user: Partial<User>) {
    return this.repo.save(user);
  }

  softDelete(id: string) {
    return this.repo.softDelete(id);
  }

  createQueryBuilder(alias: string) {
    return this.repo.createQueryBuilder(alias);
  }
}
