import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';
import { Case } from './entities/case.entity';
import { StepData } from './entities/step-data.entity';
import { FileEntry } from './entities/file-entry.entity';
import { CasesRepository } from './repositories/cases.repository';
import { StepDataRepository } from './repositories/step-data.repository';
import { FileEntryRepository } from './repositories/file-entry.repository';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { WorkflowModule } from '../workflow/workflow.module';

const UPLOADS_DIR = join(__dirname, '..', '..', 'uploads');

@Module({
  imports: [
    TypeOrmModule.forFeature([Case, StepData, FileEntry]),
    WorkflowModule,
    MulterModule.register({
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
        filename: (_req, file, cb) => {
          const uniqueName = `${uuid()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  ],
  providers: [CasesRepository, StepDataRepository, FileEntryRepository, CasesService],
  controllers: [CasesController],
  exports: [CasesService],
})
export class CasesModule {}
