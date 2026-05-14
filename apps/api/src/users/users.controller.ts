import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  profile(@Req() req: any) {
    return req.user;
  }
}