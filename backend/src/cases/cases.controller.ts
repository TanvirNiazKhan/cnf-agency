import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { ListCasesDto } from './dto/list-cases.dto';
import { CompleteStepDto } from './dto/complete-step.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { FileType } from './entities/file-entry.entity';

@Controller('cases')
export class CasesController {
  constructor(private casesService: CasesService) {}

  @Get('stats')
  getStats() {
    return this.casesService.getStats();
  }

  @Get()
  findAll(@Query() dto: ListCasesDto) {
    return this.casesService.findAll(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.casesService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateCaseDto, @CurrentUser() user: User) {
    return this.casesService.create(dto, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCaseDto) {
    return this.casesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.casesService.remove(id);
  }

  @Post(':id/steps/:stepId/complete')
  completeStep(
    @Param('id') id: string,
    @Param('stepId') stepId: string,
    @Body() dto: CompleteStepDto,
    @CurrentUser() user: User,
  ) {
    return this.casesService.completeStep(id, stepId, dto, user);
  }

  @Post(':id/steps/:stepId/reopen')
  reopenStep(@Param('id') id: string, @Param('stepId') stepId: string) {
    return this.casesService.reopenStep(id, stepId);
  }

  @Patch(':id/steps/:stepId')
  updateStepData(
    @Param('id') id: string,
    @Param('stepId') stepId: string,
    @Body() dto: CompleteStepDto,
  ) {
    return this.casesService.updateStepData(id, stepId, dto);
  }

  @Post(':id/steps/:stepId/files')
  @UseInterceptors(FileInterceptor('file'))
  addFile(
    @Param('id') id: string,
    @Param('stepId') stepId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { category: string; fileDate?: string },
    @CurrentUser() user: User,
  ) {
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    const type = ext === 'pdf' ? FileType.PDF : FileType.IMG;
    return this.casesService.addFile(id, stepId, {
      name: file.originalname,
      type,
      category: body.category,
      fileDate: body.fileDate,
      fileSize: String(file.size),
      storageKey: file.filename,
    }, user);
  }

  @Get(':id/steps/:stepId/files/:fileId/download')
  async downloadFile(
    @Param('id') id: string,
    @Param('stepId') stepId: string,
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ) {
    const { filePath, fileName } = await this.casesService.getFilePath(fileId);
    res.download(filePath, fileName);
  }

  @Delete(':id/steps/:stepId/files/:fileId')
  removeFile(
    @Param('id') id: string,
    @Param('stepId') stepId: string,
    @Param('fileId') fileId: string,
  ) {
    return this.casesService.removeFile(id, stepId, fileId);
  }

  @Post(':id/custom-steps')
  addCustomStep(
    @Param('id') id: string,
    @Body() body: { title: string; insertAfter: string },
  ) {
    return this.casesService.addCustomStep(id, body.title, body.insertAfter);
  }

  @Patch(':id/custom-steps/:csId')
  updateCustomStep(
    @Param('id') id: string,
    @Param('csId') csId: string,
    @Body() body: { title?: string; notes?: string; done?: boolean },
  ) {
    return this.casesService.updateCustomStep(id, csId, body);
  }

  @Delete(':id/custom-steps/:csId')
  removeCustomStep(
    @Param('id') id: string,
    @Param('csId') csId: string,
  ) {
    return this.casesService.removeCustomStep(id, csId);
  }
}
