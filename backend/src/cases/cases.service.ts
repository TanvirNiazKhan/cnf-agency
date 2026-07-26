import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { join } from 'path';
import { unlink } from 'fs/promises';
import { CasesRepository } from './repositories/cases.repository';
import { StepDataRepository } from './repositories/step-data.repository';
import { FileEntryRepository } from './repositories/file-entry.repository';
import { WorkflowStepsRepository } from '../workflow/repositories/workflow-steps.repository';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { ListCasesDto } from './dto/list-cases.dto';
import { CompleteStepDto } from './dto/complete-step.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { User } from '../users/entities/user.entity';
import { CaseChannel } from './entities/case.entity';

const UPLOADS_DIR = join(__dirname, '..', '..', 'uploads');

@Injectable()
export class CasesService {
  constructor(
    private casesRepository: CasesRepository,
    private stepDataRepository: StepDataRepository,
    private fileEntryRepository: FileEntryRepository,
    private workflowStepsRepository: WorkflowStepsRepository,
  ) {}

  async findAll(dto: ListCasesDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search,
      channel,
      importerId,
      step,
    } = dto;
    const qb = this.casesRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.importer', 'importer')
      .leftJoinAndSelect('c.createdBy', 'createdBy')
      .where('c.deleted_at IS NULL');

    if (search) {
      qb.andWhere(
        '(c.bl ILIKE :q OR c.serial ILIKE :q OR c.c_number ILIKE :q OR importer.name ILIKE :q)',
        { q: `%${search}%` },
      );
    }
    if (channel) qb.andWhere('c.channel = :channel', { channel });
    if (importerId) qb.andWhere('c.importer_id = :importerId', { importerId });
    if (step) qb.andWhere('c.current_step = :step', { step: parseInt(step) });

    const allowed = ['createdAt', 'bl', 'seq', 'currentStep', 'updatedAt'];
    const col = allowed.includes(sortBy) ? sortBy : 'createdAt';
    qb.orderBy(`c.${col}`, sortOrder as 'ASC' | 'DESC');

    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const c = await this.casesRepository.findById(id);
    if (!c) throw new NotFoundException('Case not found');
    return c;
  }

  async create(dto: CreateCaseDto, user: User) {
    const existing = await this.casesRepository.findByBl(dto.bl);
    if (existing) throw new ConflictException('BL number already exists');

    const { cDate, received, arrival, ...rest } = dto;
    return this.casesRepository.save({
      ...rest,
      cDate: cDate ? new Date(cDate) : null,
      received: received ? new Date(received) : null,
      arrival: arrival ? new Date(arrival) : null,
      createdById: user.id,
      currentStep: 0,
    });
  }

  async update(id: string, dto: UpdateCaseDto) {
    const c = await this.findById(id);
    const { cDate, received, arrival, ...rest } = dto;
    Object.assign(c, rest);
    if (cDate !== undefined) c.cDate = cDate ? new Date(cDate) : null;
    if (received !== undefined) c.received = received ? new Date(received) : null;
    if (arrival !== undefined) c.arrival = arrival ? new Date(arrival) : null;
    return this.casesRepository.save(c);
  }

  async remove(id: string) {
    await this.findById(id);
    await this.casesRepository.softDelete(id);
    return { message: 'Case deleted' };
  }

  async completeStep(caseId: string, stepId: string, dto: CompleteStepDto, user: User) {
    const c = await this.findById(caseId);
    const step = await this.workflowStepsRepository.findById(stepId);
    if (!step) throw new NotFoundException('Step not found');

    // Check step is applicable to channel
    if (step.channels && c.channel && !step.channels.includes(c.channel)) {
      throw new BadRequestException('Step not applicable for this case channel');
    }

    let sd = await this.stepDataRepository.findByCaseAndStep(caseId, stepId);
    if (!sd) {
      sd = await this.stepDataRepository.save({
        caseId,
        stepId,
        notes: dto.notes || null,
        completedDate: dto.completedDate ? new Date(dto.completedDate) : new Date(),
        checks: dto.checks || {},
        fields: dto.fields || {},
        completedById: user.id,
      });
    } else {
      sd.notes = dto.notes ?? sd.notes;
      sd.completedDate = dto.completedDate
        ? new Date(dto.completedDate)
        : sd.completedDate || new Date();
      sd.checks = dto.checks ?? sd.checks;
      sd.fields = dto.fields ?? sd.fields;
      sd.completedById = user.id;
      sd = await this.stepDataRepository.save(sd);
    }

    // Advance currentStep using 0-based index
    const allSteps = await this.workflowStepsRepository.findAll();
    const sortedSteps = [...allSteps].sort((a, b) => a.sortOrder - b.sortOrder);
    const stepIndex = sortedSteps.findIndex(s => s.id === stepId);
    if (stepIndex !== -1) {
      const nextIdx = this.findNextApplicable(sortedSteps, c.channel, stepIndex);
      if (nextIdx > (c.currentStep || 0)) {
        c.currentStep = nextIdx;
        await this.casesRepository.save(c);
      }
    }

    return sd;
  }

  async reopenStep(caseId: string, stepId: string) {
    const c = await this.findById(caseId);
    const step = await this.workflowStepsRepository.findById(stepId);
    if (!step) throw new NotFoundException('Step not found');

    // Revert currentStep to this step's 0-based index
    const allSteps = await this.workflowStepsRepository.findAll();
    const sortedSteps = [...allSteps].sort((a, b) => a.sortOrder - b.sortOrder);
    const stepIndex = sortedSteps.findIndex(s => s.id === stepId);
    if (stepIndex !== -1 && c.currentStep > stepIndex) {
      c.currentStep = stepIndex;
      await this.casesRepository.save(c);
    }

    // Clear completion data on step_data
    const sd = await this.stepDataRepository.findByCaseAndStep(caseId, stepId);
    if (sd) {
      sd.completedDate = null;
      sd.completedById = null;
      await this.stepDataRepository.save(sd);
    }

    return { message: 'Step reopened' };
  }

  async updateStepData(caseId: string, stepId: string, dto: CompleteStepDto) {
    let sd = await this.stepDataRepository.findByCaseAndStep(caseId, stepId);
    if (!sd) {
      sd = await this.stepDataRepository.save({
        caseId,
        stepId,
        notes: dto.notes || null,
        checks: dto.checks || {},
        fields: dto.fields || {},
      });
    } else {
      if (dto.notes !== undefined) sd.notes = dto.notes;
      if (dto.checks !== undefined) sd.checks = dto.checks;
      if (dto.fields !== undefined) sd.fields = dto.fields;
      sd = await this.stepDataRepository.save(sd);
    }
    return sd;
  }

  async addFile(caseId: string, stepId: string, dto: UploadFileDto, user: User) {
    let sd = await this.stepDataRepository.findByCaseAndStep(caseId, stepId);
    if (!sd) {
      sd = await this.stepDataRepository.save({ caseId, stepId, checks: {}, fields: {} });
    }

    return this.fileEntryRepository.save({
      stepDataId: sd.id,
      name: dto.name,
      type: dto.type,
      category: dto.category,
      fileDate: dto.fileDate ? new Date(dto.fileDate) : new Date(),
      fileSize: dto.fileSize || null,
      storageKey: dto.storageKey || null,
      uploadedById: user.id,
    });
  }

  async getFilePath(fileId: string) {
    const file = await this.fileEntryRepository.findById(fileId);
    if (!file || !file.storageKey) throw new NotFoundException('File not found');
    return {
      filePath: join(UPLOADS_DIR, file.storageKey),
      fileName: file.name,
    };
  }

  async removeFile(caseId: string, stepId: string, fileId: string) {
    const file = await this.fileEntryRepository.findById(fileId);
    if (!file) throw new NotFoundException('File not found');
    if (file.storageKey) {
      const filePath = join(UPLOADS_DIR, file.storageKey);
      await unlink(filePath).catch(() => {});
    }
    await this.fileEntryRepository.delete(fileId);
    return { message: 'File deleted' };
  }

  async addCustomStep(caseId: string, title: string, insertAfter: string) {
    const c = await this.casesRepository.findById(caseId);
    if (!c) throw new NotFoundException('Case not found');
    const customSteps = c.customSteps || [];
    const newStep = {
      id: 'cs_' + Date.now(),
      title,
      insertAfter,
      notes: '',
      done: false,
      createdAt: new Date().toISOString().split('T')[0],
    };
    customSteps.push(newStep);
    await this.casesRepository.save({ ...c, customSteps });
    return newStep;
  }

  async updateCustomStep(caseId: string, csId: string, patch: { title?: string; notes?: string; done?: boolean }) {
    const c = await this.casesRepository.findById(caseId);
    if (!c) throw new NotFoundException('Case not found');
    const customSteps = (c.customSteps || []).map(cs =>
      cs.id === csId ? { ...cs, ...patch } : cs
    );
    await this.casesRepository.save({ ...c, customSteps });
    return customSteps.find(cs => cs.id === csId);
  }

  async removeCustomStep(caseId: string, csId: string) {
    const c = await this.casesRepository.findById(caseId);
    if (!c) throw new NotFoundException('Case not found');
    const customSteps = (c.customSteps || []).filter(cs => cs.id !== csId);
    await this.casesRepository.save({ ...c, customSteps });
    return { message: 'Deleted' };
  }

  getStats() {
    return this.casesRepository.getStats();
  }

  private findNextApplicable(
    steps: { id: string; sortOrder: number; channels: string[] | null }[],
    channel: CaseChannel | null,
    completedIndex: number,
  ): number {
    const sorted = [...steps].sort((a, b) => a.sortOrder - b.sortOrder);
    for (let i = completedIndex + 1; i < sorted.length; i++) {
      const s = sorted[i];
      if (!s.channels || !channel || s.channels.includes(channel)) {
        return i;
      }
    }
    return sorted.length; // all done
  }
}
