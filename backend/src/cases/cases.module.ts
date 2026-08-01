import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Case } from './entities/case.entity';
import { StepData } from './entities/step-data.entity';
import { FileEntry } from './entities/file-entry.entity';
import { CasesRepository } from './repositories/cases.repository';
import { StepDataRepository } from './repositories/step-data.repository';
import { FileEntryRepository } from './repositories/file-entry.repository';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Case, StepData, FileEntry]),
    WorkflowModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  ],
  providers: [CasesRepository, StepDataRepository, FileEntryRepository, CasesService],
  controllers: [CasesController],
  exports: [CasesService],
})
export class CasesModule {}
