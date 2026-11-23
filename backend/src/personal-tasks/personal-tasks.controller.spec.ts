import { Test, TestingModule } from '@nestjs/testing';
import { PersonalTasksController } from './personal-tasks.controller';
import { PersonalTasksService } from './personal-tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('PersonalTasksController', () => {
  let controller: PersonalTasksController;

  const mockPersonalTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    removeCompleted: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonalTasksController],
      providers: [
        {
          provide: PersonalTasksService,
          useValue: mockPersonalTasksService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    controller = module.get<PersonalTasksController>(PersonalTasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
