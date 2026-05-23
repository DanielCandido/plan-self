import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;

if (!jwtAccessSecret) {
  throw new Error('JWT_ACCESS_SECRET is required');
}

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: jwtAccessSecret,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  exports: [JwtModule],
})
export class AuthModule {}
