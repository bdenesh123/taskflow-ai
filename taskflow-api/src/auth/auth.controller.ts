import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  CurrentUser,
  type JwtPayload,
} from './decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { DeactivateAccountDto } from './dto/deactivate-account.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: JwtPayload) {
    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('account')
  deactivateAccount(
    @CurrentUser('sub') userId: string,
    @Body() dto: DeactivateAccountDto,
  ) {
    return this.authService.deactivateAccount(userId, dto.password);
  }
}
