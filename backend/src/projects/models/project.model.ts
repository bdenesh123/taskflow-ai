import { Model } from 'objection';

export class Project extends Model {
  id!: string;
  owner_id!: string;
  name!: string;
  description!: string | null;
  status!: 'active' | 'on_hold' | 'completed';
  due_date!: string | null;
  created_at!: Date;
  updated_at!: Date;
  deleted_at!: Date | null;

  static tableName = 'projects';

  static idColumn = 'id';
}
