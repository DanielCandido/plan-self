import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Redirect,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and return tokens' })
  login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(dto, req, res);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using httpOnly cookie' })
  refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refresh(req, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidate session and clear refresh cookie' })
  logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logout(req, res);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return authenticated user from access token' })
  me(@Req() req: Request) {
    return this.authService.me(req);
  }

  @Get('google')
  @Redirect()
  @ApiOperation({ summary: 'Redirect to Google OAuth' })
  googleRedirect() {
    return this.authService.oauthRedirectGoogle();
  }

  @Get('github')
  @Redirect()
  @ApiOperation({ summary: 'Redirect to GitHub OAuth' })
  githubRedirect() {
    return this.authService.oauthRedirectGithub();
  }
}
