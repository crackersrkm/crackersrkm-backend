import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto): Promise<Partial<User>> {
    const { email, firstName, lastName, mobileNumber, password, userType } = signupDto;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = `${firstName} ${lastName}`.trim();

    const user = this.userRepository.create({
      email,
      firstName,
      lastName,
      name: fullName,
      phone: mobileNumber,
      password: hashedPassword,
      userType: userType || 'guest',
    });

    const savedUser = await this.userRepository.save(user);
    const { password: _, ...result } = savedUser;
    return result;
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; user: Partial<User> }> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.userType };
    const accessToken = await this.jwtService.signAsync(payload);

    const { password: _, ...userWithoutPassword } = user;
    return {
      accessToken,
      user: userWithoutPassword,
    };
  }
}
