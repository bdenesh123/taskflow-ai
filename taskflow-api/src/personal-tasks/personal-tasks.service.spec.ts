import { Test, TestingModule } from '@nestjs/testing';
import { PersonalTasksService } from './personal-tasks.service';
import { KNEX_CONNECTION } from '../database/database.constants';

describe('PersonalTasksService', () => {
  let service: PersonalTasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonalTasksService,
        {
          provide: KNEX_CONNECTION,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PersonalTasksService>(PersonalTasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
