import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from '../companies/companies.service';
import { PrismaService } from '../prisma/prisma.service';
import { StatisticsService } from './statistics.service';

describe('StatisticsService', () => {
  let service: StatisticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        {
          provide: PrismaService,
          useValue: {
            unit: {
              count: jest.fn(),
              findMany: jest.fn(),
            },
            reservation: {
              count: jest.fn(),
              groupBy: jest.fn(),
              aggregate: jest.fn(),
            },
            review: {
              aggregate: jest.fn(),
            },
          },
        },
        {
          provide: CompaniesService,
          useValue: {
            findCompanyByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
