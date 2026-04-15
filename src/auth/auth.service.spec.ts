import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CompaniesService } from '../companies/companies.service';
import { CustomersService } from '../customers/customers.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret' })],
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findFirst: jest.fn(),
            createUser: jest.fn(),
            findById: jest.fn(),
            findByEmailWithPassword: jest.fn(),
          },
        },
        {
          provide: CompaniesService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: CustomersService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
