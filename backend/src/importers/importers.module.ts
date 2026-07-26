import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Importer } from './entities/importer.entity';
import { ImportersRepository } from './repositories/importers.repository';
import { ImportersService } from './importers.service';
import { ImportersController } from './importers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Importer])],
  providers: [ImportersRepository, ImportersService],
  controllers: [ImportersController],
  exports: [ImportersRepository, ImportersService],
})
export class ImportersModule {}
