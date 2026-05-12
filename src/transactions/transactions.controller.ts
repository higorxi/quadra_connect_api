import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AllowedProfiles } from '../auth/decorators/allowed-profiles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileAccessGuard } from '../auth/guards/profile-access.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ProfileType } from '../common/enums/profile-type.enum';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionsService } from './transactions.service';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard, ProfileAccessGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @AllowedProfiles(ProfileType.CUSTOMER)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(user, createTransactionDto);
  }

  @Get('mine')
  @AllowedProfiles(ProfileType.CUSTOMER)
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.transactionsService.findMine(user);
  }

  @Get('company')
  @AllowedProfiles(ProfileType.COMPANY)
  async findForCompany(@CurrentUser() user: AuthenticatedUser) {
    return this.transactionsService.findForCompany(user);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.transactionsService.findOne(user, id);
  }

  @Patch(':id/status')
  @AllowedProfiles(ProfileType.COMPANY)
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateTransactionStatusDto: UpdateTransactionStatusDto,
  ) {
    return this.transactionsService.updateStatus(
      user,
      id,
      updateTransactionStatusDto,
    );
  }
}
