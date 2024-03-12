import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity()
export class App {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  userName: string;

  @Column()
  normalMessageCount: number;

  @Column()
  questionMessageCount: number;
}