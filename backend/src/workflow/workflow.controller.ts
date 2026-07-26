import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { UpdateStepDto } from './dto/update-step.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('workflow/steps')
export class WorkflowController {
  constructor(private workflowService: WorkflowService) {}

  @Get()
  findAll() {
    return this.workflowService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workflowService.findById(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStepDto) {
    return this.workflowService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Post('reorder')
  reorder(@Body() body: { ids: string[] }) {
    return this.workflowService.reorder(body.ids);
  }
}
