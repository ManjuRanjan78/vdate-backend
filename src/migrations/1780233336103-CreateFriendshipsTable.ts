import { MigrationInterface, QueryRunner, Table, TableUnique } from "typeorm";

export class CreateFriendshipsTable1780233336103 implements MigrationInterface {
    name = 'CreateFriendshipsTable1780233336103'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "friendships",
                columns: [
                    {
                        name: "id",
                        type: "SERIAL",
                        isPrimary: true,
                    },
                    {
                        name: "user1Id",
                        type: "integer",
                        isNullable: false,
                    },
                    {
                        name: "user2Id",
                        type: "integer",
                        isNullable: false,
                    },
                    {
                        name: "createdAt",
                        type: "TIMESTAMP",
                        default: "now()",
                        isNullable: false,
                    },
                ],
                uniques: [
                    new TableUnique({
                        columnNames: ["user1Id", "user2Id"],
                    }),
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("friendships", true);
    }
}
