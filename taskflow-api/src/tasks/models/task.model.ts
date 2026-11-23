import { Model } from 'objection';
import { User } from '../../users/models/user.model';

export class Task extends Model {
  id!: string;
  project_id!: string;
  creator_id!: string;
  assignee_id!: string | null;
  title!: string;
  description!: string | null;
  status!: 'todo' | 'in_progress' | 'done';
  priority!: 'low' | 'medium' | 'high';
  due_date!: string | null;
  created_at!: Date;
  updated_at!: Date;
  deleted_at!: Date | null;

  static tableName = 'tasks';
  static idColumn = 'id';

  static relationMappings = {
    assignee: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'tasks.assignee_id',
        to: 'users.id',
      },
    },
  };
}
